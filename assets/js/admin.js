// Redirect local IPs to localhost for Firebase Auth compatibility
if (window.location.protocol === 'file:') {
    alert("보안 정책상 file:/// 에서는 구글 로그인이 불가능합니다. 관리자 코드를 실행한 로컬 서버(예: http://localhost:5500)로 접속해주세요.");
} else if (window.location.hostname !== 'localhost' && /^[0-9\.]+$/.test(window.location.hostname)) {
    console.warn("Redirecting IP " + window.location.hostname + " to localhost for Firebase Auth");
    window.location.hostname = 'localhost';
}

// Firebase DB Initialization
const adminFirebaseConfig = {
    apiKey: 'AIzaSyAY7VmMHV333Bi7zTgnJshIRAFWnBWn6BU',
    authDomain: 'dadok-app.firebaseapp.com',
    projectId: 'dadok-app',
    storageBucket: 'dadok-app.firebasestorage.app',
    messagingSenderId: '702510138781',
    appId: '1:702510138781:web:fbfcfc29a8de5d3da35b74',
};
if (!firebase.apps.length) {
    firebase.initializeApp(adminFirebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

// ─── Authentication ───
auth.onAuthStateChanged((user) => {
    const userInfoEl = document.getElementById('admin-user-info');
    const userEmailEl = document.getElementById('admin-user-email');
    const loginBtn = document.getElementById('admin-login-btn');
    const logoutBtn = document.getElementById('admin-logout-btn');
    const authOverlay = document.getElementById('auth-overlay');
    const mainApp = document.getElementById('main-app');

    if (user) {
        if (authOverlay) authOverlay.classList.add('hidden');
        if (mainApp) mainApp.classList.remove('hidden');
        if (userInfoEl) userInfoEl.classList.remove('hidden');
        if (userEmailEl) userEmailEl.textContent = user.email;
        if (loginBtn) loginBtn.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.remove('hidden');
        startSidebarBadgeReadsListener(user);
    } else {
        if (authOverlay) authOverlay.classList.remove('hidden');
        if (mainApp) mainApp.classList.add('hidden');
        if (userInfoEl) userInfoEl.classList.add('hidden');
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
        stopSidebarBadgeReadsListener();
    }
});

function adminLogin() {
    auth.signInWithPopup(provider)
        .then((result) => {
            console.log('Logged in as:', result.user.email);
        })
        .catch((error) => {
            console.error('Login failed:', error);
            if (error.code === 'auth/unauthorized-domain') {
                alert(
                    "로그인 실패: 현재 접속하신 주소(도메인)가 Firebase에 등록되지 않았습니다.\n\n해결방법: \n1. 브라우저에서 'http://localhost:5500' 또는 'http://127.0.0.1:5500' 으로 접속해주세요.\n2. file:/// 주소나 내부 IP(59.x.x.x 등)에서는 구글 로그인이 차단됩니다.",
                );
            } else if (error.code === 'auth/network-request-failed') {
                alert('로그인 실패: 네트워크 상태를 확인해주세요.');
            } else {
                alert('로그인 실패: ' + error.message + ' (Code: ' + error.code + ')');
            }
        });
}

function adminLogout() {
    auth.signOut()
        .then(() => {
            console.log('Logged out');
        })
        .catch((error) => {
            console.error('Logout failed:', error.message);
        });
}

// ─── Global Variables ───
let currentUserCount = 0;
let currentShopCount = 0;
let categoriesList = [];
let unsubscribeCallClickLogs = null;
const SIDEBAR_BADGE_MAP = {
    users: 'users-badge',
    approvals: 'pending-badge',
    shops: 'shops-badge',
    subscriptions: 'subscriptions-badge',
    messages: 'messages-badge',
    categories: 'categories-badge',
    cs: 'cs-badge',
};

const SIDEBAR_BADGE_KEYS = Object.keys(SIDEBAR_BADGE_MAP);
let sidebarBadgeCounts = {
    users: 0,
    approvals: 0,
    shops: 0,
    subscriptions: 0,
    messages: 0,
    categories: 0,
    cs: 0,
};
let sidebarBadgeUnreadCounts = {
    users: 0,
    approvals: 0,
    shops: 0,
    subscriptions: 0,
    messages: 0,
    categories: 0,
    cs: 0,
};
let sidebarBadgeSeenAtMs = {};
let sidebarBadgeReadsLoaded = false;
let sidebarBadgeReadsUnsubscribe = null;
let sidebarBadgeSaveTimer = null;
let categoryFilterUnreadByKey = {};
let categoryFilterActivityByKey = {};
let categoriesCollectionUnreadCount = 0;
let sidebarSnapshotCache = {
    users: null,
    partners: null,
    categories: null,
    subscriptions: null,
    messages: null,
    cs: null,
};

function normalizeBadgeCountValue(value) {
    return Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
}

function normalizeMsTimestamp(value) {
    if (!value && value !== 0) return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? Math.max(0, value) : 0;
    if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : 0;
    if (typeof value === 'string') {
        const parsed = Date.parse(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    if (typeof value.toMillis === 'function') {
        const ms = value.toMillis();
        return Number.isFinite(ms) ? ms : 0;
    }
    if (typeof value.seconds === 'number') {
        const nano = typeof value.nanoseconds === 'number' ? value.nanoseconds : 0;
        return value.seconds * 1000 + Math.floor(nano / 1000000);
    }
    return 0;
}

function getLatestActivityMs(data, fields = ['updatedAt', 'createdAt']) {
    if (!data || typeof data !== 'object') return 0;
    let latest = 0;
    fields.forEach((field) => {
        const ms = normalizeMsTimestamp(data[field]);
        if (ms > latest) latest = ms;
    });
    return latest;
}

function getSeenAtMsForKey(key) {
    return normalizeMsTimestamp(sidebarBadgeSeenAtMs[key]);
}

function countUnreadDocsByTimestamp(snapshot, key, fields, predicate) {
    if (!snapshot || !sidebarBadgeReadsLoaded) return 0;
    const seenAtMs = getSeenAtMsForKey(key);
    if (!seenAtMs) return 0;
    let unread = 0;
    snapshot.forEach((doc) => {
        const data = typeof doc.data === 'function' ? doc.data() || {} : doc || {};
        if (typeof predicate === 'function' && !predicate(data, doc)) return;
        const latestMs = getLatestActivityMs(data, fields);
        if (latestMs > seenAtMs) unread++;
    });
    return unread;
}

function recomputeSidebarUnreadFromCache() {
    if (!sidebarBadgeReadsLoaded) {
        renderAllSidebarCategoryBadges();
        return;
    }

    if (sidebarSnapshotCache.users) {
        sidebarBadgeUnreadCounts.users = countUnreadDocsByTimestamp(
            sidebarSnapshotCache.users,
            'users',
            ['updatedAt', 'createdAt'],
        );
    }

    if (sidebarSnapshotCache.partners) {
        sidebarBadgeUnreadCounts.shops = countUnreadDocsByTimestamp(
            sidebarSnapshotCache.partners,
            'shops',
            ['updatedAt', 'createdAt'],
        );
        sidebarBadgeUnreadCounts.approvals = countUnreadDocsByTimestamp(
            sidebarSnapshotCache.partners,
            'approvals',
            ['updatedAt', 'createdAt'],
            (data) => data.status === 'pending',
        );
    }

    if (sidebarSnapshotCache.subscriptions) {
        sidebarBadgeUnreadCounts.subscriptions = countUnreadDocsByTimestamp(
            sidebarSnapshotCache.subscriptions,
            'subscriptions',
            ['updatedAt', 'createdAt', 'requestedAt', 'submittedAt'],
            (data) => normalizeSubRequestStatus(data?.status || 'pending') === 'pending',
        );
    }

    if (sidebarSnapshotCache.messages) {
        sidebarBadgeUnreadCounts.messages = countUnreadDocsByTimestamp(
            sidebarSnapshotCache.messages,
            'messages',
            ['updatedAt', 'createdAt', 'scheduledAt'],
            (data) => {
                const status = String(data?.status || '').toLowerCase();
                return status === 'scheduled' || status === 'failed';
            },
        );
    }

    if (sidebarSnapshotCache.cs) {
        sidebarBadgeUnreadCounts.cs = countUnreadDocsByTimestamp(
            sidebarSnapshotCache.cs,
            'cs',
            ['updatedAt', 'createdAt'],
            (data) => (data.status || 'pending') === 'pending',
        );
    }

    if (sidebarSnapshotCache.categories) {
        categoriesCollectionUnreadCount = countUnreadDocsByTimestamp(
            sidebarSnapshotCache.categories,
            'categories',
            ['updatedAt', 'createdAt'],
        );
    }
    const seenAtMs = getSeenAtMsForKey('categories');
    Object.keys(categoryFilterActivityByKey).forEach((key) => {
        const activityMs = normalizeMsTimestamp(categoryFilterActivityByKey[key]);
        categoryFilterUnreadByKey[key] =
            sidebarBadgeReadsLoaded && seenAtMs && activityMs > seenAtMs ? 1 : 0;
    });

    refreshCategorySidebarBadge();
    renderAllSidebarCategoryBadges();
}

function getSidebarBadgeStyleClass(isUnread) {
    if (isUnread) {
        return 'ml-auto bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full';
    }
    return 'ml-auto bg-[#22332B] text-[#A7B2AE] text-[10px] font-bold px-2 py-0.5 rounded-full';
}

function renderSidebarCategoryBadge(key) {
    const badgeId = SIDEBAR_BADGE_MAP[key];
    const badge = document.getElementById(badgeId);
    if (!badge) return;

    const totalCount = normalizeBadgeCountValue(sidebarBadgeCounts[key]);
    const unreadCount = sidebarBadgeReadsLoaded
        ? normalizeBadgeCountValue(sidebarBadgeUnreadCounts[key])
        : 0;
    const showUnread = unreadCount > 0;
    const displayCount = showUnread ? unreadCount : totalCount;

    if (displayCount <= 0) {
        badge.classList.add('hidden');
        return;
    }

    badge.textContent = String(displayCount);
    badge.className = getSidebarBadgeStyleClass(showUnread);
    badge.classList.remove('hidden');
}

function renderAllSidebarCategoryBadges() {
    SIDEBAR_BADGE_KEYS.forEach((key) => renderSidebarCategoryBadge(key));
}

function queuePersistSidebarBadgeReads() {
    if (!auth.currentUser || !sidebarBadgeReadsLoaded) return;
    if (sidebarBadgeSaveTimer) {
        clearTimeout(sidebarBadgeSaveTimer);
    }
    sidebarBadgeSaveTimer = setTimeout(() => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        db.collection('admin_sidebar_badge_reads')
            .doc(uid)
            .set(
                {
                    seenAtMs: sidebarBadgeSeenAtMs,
                    seenCounts: sidebarBadgeCounts,
                    updatedBy: auth.currentUser?.email || uid,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                },
                { merge: true },
            )
            .catch((err) => console.error('사이드바 배지 읽음 상태 저장 실패:', err));
    }, 300);
}

function startSidebarBadgeReadsListener(user) {
    if (!user?.uid) return;
    if (sidebarBadgeReadsUnsubscribe) {
        sidebarBadgeReadsUnsubscribe();
        sidebarBadgeReadsUnsubscribe = null;
    }

    sidebarBadgeReadsUnsubscribe = db
        .collection('admin_sidebar_badge_reads')
        .doc(user.uid)
        .onSnapshot(
            (doc) => {
                const raw = doc.exists ? doc.data() || {} : {};
                const fromDbSeenAt = raw.seenAtMs || {};
                const fromDbLegacySeenCounts = raw.seenCounts || {};
                const sanitized = {};
                const nowMs = Date.now();
                SIDEBAR_BADGE_KEYS.forEach((key) => {
                    if (Object.prototype.hasOwnProperty.call(fromDbSeenAt, key)) {
                        sanitized[key] = normalizeMsTimestamp(fromDbSeenAt[key]);
                    } else if (Object.prototype.hasOwnProperty.call(fromDbLegacySeenCounts, key)) {
                        sanitized[key] = nowMs;
                    }
                });
                sidebarBadgeSeenAtMs = sanitized;
                sidebarBadgeReadsLoaded = true;

                let hasNewKey = false;
                SIDEBAR_BADGE_KEYS.forEach((key) => {
                    if (!Object.prototype.hasOwnProperty.call(sidebarBadgeSeenAtMs, key)) {
                        sidebarBadgeSeenAtMs[key] = nowMs;
                        hasNewKey = true;
                    }
                });

                recomputeSidebarUnreadFromCache();
                if (hasNewKey || !doc.exists) {
                    queuePersistSidebarBadgeReads();
                }
            },
            (err) => {
                console.error('사이드바 배지 읽음 상태 로드 실패:', err);
                sidebarBadgeReadsLoaded = false;
                SIDEBAR_BADGE_KEYS.forEach((key) => {
                    sidebarBadgeUnreadCounts[key] = 0;
                });
                renderAllSidebarCategoryBadges();
            },
        );
}

function stopSidebarBadgeReadsListener() {
    if (sidebarBadgeReadsUnsubscribe) {
        sidebarBadgeReadsUnsubscribe();
        sidebarBadgeReadsUnsubscribe = null;
    }
    if (sidebarBadgeSaveTimer) {
        clearTimeout(sidebarBadgeSaveTimer);
        sidebarBadgeSaveTimer = null;
    }
    sidebarBadgeReadsLoaded = false;
    sidebarBadgeSeenAtMs = {};
    SIDEBAR_BADGE_KEYS.forEach((key) => {
        sidebarBadgeUnreadCounts[key] = 0;
    });
    renderAllSidebarCategoryBadges();
}

function markSidebarCategoryAsSeen(key) {
    if (!sidebarBadgeReadsLoaded) return;
    if (!Object.prototype.hasOwnProperty.call(SIDEBAR_BADGE_MAP, key)) return;
    sidebarBadgeSeenAtMs[key] = Date.now();
    sidebarBadgeUnreadCounts[key] = 0;
    recomputeSidebarUnreadFromCache();
    queuePersistSidebarBadgeReads();
}

function setSidebarCategoryCount(key, count, unreadCount = 0) {
    if (!Object.prototype.hasOwnProperty.call(SIDEBAR_BADGE_MAP, key)) return;
    sidebarBadgeCounts[key] = normalizeBadgeCountValue(count);
    sidebarBadgeUnreadCounts[key] = normalizeBadgeCountValue(unreadCount);
    if (
        sidebarBadgeReadsLoaded &&
        !Object.prototype.hasOwnProperty.call(sidebarBadgeSeenAtMs, key)
    ) {
        sidebarBadgeSeenAtMs[key] = Date.now();
        queuePersistSidebarBadgeReads();
    }
    renderSidebarCategoryBadge(key);
}

function refreshCategorySidebarBadge() {
    if (typeof categoryData === 'undefined' || !categoryData) return;
    const keys = [
        'massage',
        'place',
        'age',
        'categories',
        'customer_report_reason',
        'partner_report_reason',
        'customer_inquiry_type',
        'partner_inquiry_type',
    ];
    const total = keys.reduce((sum, key) => {
        const list = categoryData[key];
        if (!Array.isArray(list)) return sum;
        return sum + list.length;
    }, 0);
    const filterUnread = Object.values(categoryFilterUnreadByKey).reduce(
        (sum, val) => sum + normalizeBadgeCountValue(val),
        0,
    );
    const unread = normalizeBadgeCountValue(categoriesCollectionUnreadCount) + filterUnread;
    setSidebarCategoryCount('categories', total, unread);
}

// 소비자 앱에 하드코딩되어 있던 기본 필터 데이터
const DEFAULT_FILTERS = {
    massage: {
        title: '선호하는 마사지 종류',
        options: ['상관없음(전체)', '스웨디시', '스포츠 마사지', '타이 마사지', '커플마사지'],
    },
    place: {
        title: '휴식 공간 형태',
        options: [
            '상관없음(전체)',
            '방문 (홈케어/출장)',
            '1인샵 (매장 방문)',
            '다인샵 (일반 매장)',
        ],
    },
    age: {
        title: '선호하는 관리사 연령대',
        options: [
            '연령 무관 (전체)',
            '20대 초반',
            '20대 중후반',
            '30대 초반',
            '30대 중후반',
            '40대 초반',
            '40대 중후반',
        ],
    },
    customer_report_reason: {
        title: '고객 신고 사유',
        options: [
            '연락두절 / 노쇼',
            '불친절 및 욕설',
            '서비스 불만족',
            '허위 매물 / 정보 불일치',
            '기타',
        ],
    },
    partner_report_reason: {
        title: '업체 신고 사유',
        options: [
            '연락두절 / 노쇼 고객',
            '비정상적인 환불 요구',
            '욕설 및 폭언',
            '타업체 광고 목적',
            '기타',
        ],
    },
    customer_inquiry_type: {
        title: '고객 문의 유형',
        options: [
            '결제/환불 관련',
            '예약 관련 안내',
            '서비스 이용 불편',
            '계정 및 권한 안내',
            '기타',
        ],
    },
    partner_inquiry_type: {
        title: '업체 문의 유형',
        options: [
            '입점권 결제/연장',
            '패널티 차감 해제 요청',
            '광고 및 프로모션 안내',
            '정산 및 수수료 안내',
            '기타',
        ],
    },
};

const FILTER_STYLES = {
    massage: {
        badge: 'bg-[#11291D] border-[#2A3731] text-[var(--point-color)]',
        deleteBtn: 'text-[#A7B2AE] hover:text-white',
    },
    place: {
        badge: 'bg-[#11291D] border-[#2A3731] text-[var(--point-color)]',
        deleteBtn: 'text-[#A7B2AE] hover:text-white',
    },
    age: {
        badge: 'bg-[#11291D] border-[#2A3731] text-[var(--point-color)]',
        deleteBtn: 'text-[#A7B2AE] hover:text-white',
    },
};

const FILTER_LABELS = {
    massage: '마사지 테마',
    place: '샵 형태',
    age: '관리사 연령',
    categories: '제휴점 공용 태그',
    customer_report_reason: '고객 신고 사유',
    partner_report_reason: '업체 신고 사유',
    customer_inquiry_type: '고객 문의 유형',
    partner_inquiry_type: '업체 문의 유형',
};

// ─── Tab System ───
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach((el) => el.classList.add('hidden'));
    document.querySelectorAll('.tab-link').forEach((el) => el.classList.remove('active'));

    document.getElementById(`tab-${tabId}`).classList.remove('hidden');
    const activeNav = document.querySelector(`.tab-link[onclick="switchTab('${tabId}')"]`);
    if (activeNav) activeNav.classList.add('active');

    if (tabId === 'users') loadUsers();
    else if (tabId === 'shops') loadShops();
    else if (tabId === 'approvals') loadApprovals();
    else if (tabId === 'categories') loadAllFilters();
    else if (tabId === 'subscriptions') {
        loadSubscriptionUsage();
        if (typeof window.loadSubscriptionRequests === 'function') {
            window.loadSubscriptionRequests();
        }
    }
    else if (tabId === 'messages') loadMessageCenter();
    else if (tabId === 'dashboard') {
        updateDashboardStats();
        loadCallClickLogs();
    }
    else if (tabId === 'cs') loadCSTickets();

    if (Object.prototype.hasOwnProperty.call(SIDEBAR_BADGE_MAP, tabId)) {
        markSidebarCategoryAsSeen(tabId);
    }
}

function updateDashboardStats() {
    document.getElementById('stat-users').innerText = currentUserCount;
    document.getElementById('stat-shops').innerText = currentShopCount;
}

function formatAdminDateTime(value) {
    if (!value) return '-';
    let date = null;
    if (typeof value.toDate === 'function') date = value.toDate();
    else if (value instanceof Date) date = value;
    else {
        const parsed = new Date(value);
        if (!Number.isNaN(parsed.getTime())) date = parsed;
    }
    if (!date) return '-';
    return date.toLocaleString('ko-KR');
}

function loadCallClickLogs() {
    const tbody = document.getElementById('call-log-table-body');
    if (!tbody) return;
    if (unsubscribeCallClickLogs) {
        unsubscribeCallClickLogs();
        unsubscribeCallClickLogs = null;
    }
    tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-[#A7B2AE]">불러오는 중...</td></tr>';

    unsubscribeCallClickLogs = db
        .collection('call_click_logs')
        .orderBy('createdAt', 'desc')
        .limit(80)
        .onSnapshot(
            (snap) => {
                if (snap.empty) {
                    tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-[#A7B2AE]">전화 클릭 로그가 없습니다.</td></tr>';
                    return;
                }
                let html = '';
                snap.forEach((doc) => {
                    const d = doc.data() || {};
                    html += `
                        <tr class="hover:bg-white/5 transition-colors">
                            <td class="p-4 text-[#A7B2AE]">${formatAdminDateTime(d.createdAt)}</td>
                            <td class="p-4 text-white">${escapeHtml(d.partnerName || '-')}</td>
                            <td class="p-4 font-mono text-[#A7B2AE]">${escapeHtml(d.phoneDigits || '-')}</td>
                            <td class="p-4 text-white">${escapeHtml(d.callerName || d.callerUserId || '-')}</td>
                            <td class="p-4 text-[#A7B2AE]">${escapeHtml(d.callerRole || '-')}</td>
                            <td class="p-4">
                                ${
                                    d.isBusinessOpen
                                        ? '<span class="px-2 py-1 rounded text-xs bg-green-900/40 text-green-300 border border-green-600/40">영업중</span>'
                                        : '<span class="px-2 py-1 rounded text-xs bg-red-900/40 text-red-300 border border-red-600/40">영업외</span>'
                                }
                            </td>
                        </tr>
                    `;
                });
                tbody.innerHTML = html;
            },
            (err) => {
                console.error('전화 클릭 로그 로드 실패:', err);
                tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-red-400">로드 실패: ${escapeHtml(err.message)}</td></tr>`;
            },
        );
}

// ─── Modal handling ───
function openModal(modalId) {
    // If it's a standalone modal with its own overlay (like modal-cs-penalty), just toggle it directly.
    const standaloneModals = ['modal-cs-penalty'];
    if (standaloneModals.includes(modalId)) {
        const el = document.getElementById(modalId);
        if (el) el.classList.remove('hidden');
        return;
    }

    // For nested modals inside admin-modal-overlay
    const overlay = document.getElementById('admin-modal-overlay');
    if (overlay) overlay.classList.remove('hidden');

    const nestedModals = [
        'modal-manual-sub',
        'modal-shop',
        'modal-category',
        'modal-filter-option',
        'modal-subscription-products'
    ];

    nestedModals.forEach(id => {
        const el = document.getElementById(id);
        if (el && id !== modalId) el.classList.add('hidden');
    });

    const targetModal = document.getElementById(modalId);
    if (targetModal) targetModal.classList.remove('hidden');
}

function closeModal(modalId) {
    const standaloneModals = ['modal-cs-penalty'];
    if (standaloneModals.includes(modalId)) {
        const el = document.getElementById(modalId);
        if (el) el.classList.add('hidden');
        return;
    }

    const overlay = document.getElementById('admin-modal-overlay');
    if (overlay) overlay.classList.add('hidden');

    const targetModal = document.getElementById(modalId);
    if (targetModal) targetModal.classList.add('hidden');
}

// ─── Message Center ───
let messageCenterUsers = [];
let messageCenterPartners = [];
let unsubscribeAdminMessages = null;
let messageSchedulerTimer = null;
let isProcessingScheduledMessages = false;

const MESSAGE_TEMPLATES = {
    user_security_notice: {
        category: 'guide',
        priority: 'important',
        linkType: 'user_security',
        title: '[보안 안내] 계정 보호를 위해 비밀번호를 점검해주세요.',
        body: '안전한 서비스 이용을 위해 비밀번호를 주기적으로 변경해 주세요.\n타 사이트와 동일한 비밀번호 사용은 권장되지 않습니다.'
    },
    user_usage_guide: {
        category: 'guide',
        priority: 'normal',
        linkType: 'user_mypage',
        title: '[이용 안내] 마이페이지 기능 사용 가이드',
        body: '마이페이지에서 채팅 목록, 찜한 업체, 보안 설정을 편하게 이용하실 수 있습니다.\n자세한 기능은 각 메뉴에서 확인해주세요.'
    },
    user_maintenance_notice: {
        category: 'notice',
        priority: 'normal',
        linkType: 'none',
        title: '[점검 공지] 서비스 점검 일정 안내',
        body: '보다 안정적인 서비스 제공을 위해 점검이 진행될 예정입니다.\n점검 시간 동안 일부 기능 사용이 제한될 수 있습니다.'
    },
    approval_done: {
        category: 'result',
        priority: 'important',
        linkType: 'partner_dashboard',
        title: '[승인 완료] 파트너 권한이 활성화되었습니다.',
        body: '관리자 확인이 완료되어 파트너 권한이 활성화되었습니다.\n대시보드에서 배너/정보를 확인해주세요.'
    },
    approval_rejected: {
        category: 'result',
        priority: 'important',
        linkType: 'partner_entry',
        title: '[안내] 신청 건이 반려되었습니다.',
        body: '요청하신 신청 건이 반려 처리되었습니다.\n반려 사유를 확인 후 필요한 서류를 보완해 재신청해주세요.'
    },
    payment_reminder: {
        category: 'guide',
        priority: 'normal',
        linkType: 'partner_entry',
        title: '[입금 확인 요청] 결제 내역을 확인해주세요.',
        body: '입금 확인을 위해 입금자명/시간/금액을 다시 한번 확인해 주세요.\n확인 즉시 처리 상태가 업데이트됩니다.'
    },
    policy_notice: {
        category: 'notice',
        priority: 'normal',
        linkType: 'none',
        title: '[운영 공지] 서비스 정책 안내',
        body: '안정적인 운영을 위해 정책이 일부 업데이트되었습니다.\n자세한 내용은 앱 내 공지사항을 확인해주세요.'
    }
};

const MESSAGE_TEMPLATE_GROUPS = {
    user: [
        { value: 'user_security_notice', label: '계정 보안 안내' },
        { value: 'user_usage_guide', label: '서비스 이용 안내' },
        { value: 'user_maintenance_notice', label: '점검 공지 안내' },
        { value: 'policy_notice', label: '운영 정책 공지' }
    ],
    partner: [
        { value: 'approval_done', label: '승인 완료 안내' },
        { value: 'approval_rejected', label: '반려 안내' },
        { value: 'payment_reminder', label: '입금 확인 요청' },
        { value: 'policy_notice', label: '운영 정책 공지' }
    ]
};

const MESSAGE_LINK_OPTIONS = {
    all: [
        { value: 'none', label: '이동 없음' },
        { value: 'support_center', label: '신고센터/문의' },
        { value: 'login', label: '로그인 화면' }
    ],
    user: [
        { value: 'none', label: '이동 없음' },
        { value: 'user_mypage', label: '회원 마이페이지' },
        { value: 'user_security', label: '회원 계정/보안 설정' },
        { value: 'support_center', label: '신고센터/문의' },
        { value: 'login', label: '로그인 화면' }
    ],
    partner: [
        { value: 'none', label: '이동 없음' },
        { value: 'partner_dashboard', label: '업체 대시보드' },
        { value: 'partner_entry', label: '업체 입점권 안내/구매' },
        { value: 'partner_login', label: '업체 로그인' },
        { value: 'support_center', label: '신고센터/문의' },
        { value: 'login', label: '로그인 화면' }
    ]
};

function getLinkTypeLabel(linkType = 'none') {
    const labels = {
        none: '이동 없음',
        partner_dashboard: '업체 대시보드',
        partner_entry: '업체 입점권 안내/구매',
        partner_login: '업체 로그인',
        user_mypage: '회원 마이페이지',
        user_security: '회원 계정/보안',
        support_center: '신고센터/문의',
        login: '로그인 화면'
    };
    return labels[linkType] || labels.none;
}

function getDeliveryModeLabel(mode = 'notice') {
    if (mode === 'chat') return '문의 채팅';
    return '공지/안내함';
}

function getAudienceKeyByTargetType(targetType = '') {
    if (targetType === 'user_single' || targetType === 'users_all') return 'user';
    if (targetType === 'partner_single' || targetType === 'partners_all') return 'partner';
    return 'all';
}

function getSelectedMessageTargetType() {
    const audience = document.getElementById('msg-audience-type')?.value || 'user';
    const scope = document.getElementById('msg-target-scope')?.value || 'single';
    if (audience === 'partner') return scope === 'all' ? 'partners_all' : 'partner_single';
    return scope === 'all' ? 'users_all' : 'user_single';
}

function refreshMessageTemplateOptions() {
    const audienceEl = document.getElementById('msg-audience-type');
    const tplEl = document.getElementById('msg-template-select');
    if (!tplEl) return;
    const audience = audienceEl?.value === 'partner' ? 'partner' : 'user';
    const options = MESSAGE_TEMPLATE_GROUPS[audience] || [];
    const prev = tplEl.value || '';

    tplEl.innerHTML = `
        <option value="">템플릿 직접 선택</option>
        ${options.map((opt) => `<option value="${opt.value}">${opt.label}</option>`).join('')}
    `;

    const exists = options.some((opt) => opt.value === prev);
    tplEl.value = exists ? prev : '';
}

function refreshMessageLinkOptions() {
    const targetType = getSelectedMessageTargetType();
    const audience = getAudienceKeyByTargetType(targetType);
    const linkEl = document.getElementById('msg-link-type');
    if (!linkEl) return;

    const options = MESSAGE_LINK_OPTIONS[audience] || MESSAGE_LINK_OPTIONS.all;
    const prev = linkEl.value || 'none';
    linkEl.innerHTML = options
        .map((opt) => `<option value="${opt.value}">${opt.label}</option>`)
        .join('');
    const exists = options.some((opt) => opt.value === prev);
    linkEl.value = exists ? prev : 'none';
}

function getMessageTargetLabel(targetType) {
    if (targetType === 'users_all') return '개인회원 전체';
    if (targetType === 'partners_all') return '업체 전체';
    if (targetType === 'user_single') return '개인회원 단건';
    if (targetType === 'partner_single') return '업체 단건';
    return targetType || '-';
}

function escapeHtml(value = '') {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatMessageDate(value) {
    if (!value) return '-';
    let d = null;
    if (typeof value.toDate === 'function') d = value.toDate();
    else if (typeof value.toMillis === 'function') d = new Date(value.toMillis());
    else d = new Date(value);
    if (!d || Number.isNaN(d.getTime())) return '-';
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function parseScheduleDateTimeLocal(value) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date;
}

function formatDateTimeLocal(date) {
    if (!date || Number.isNaN(date.getTime())) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d}T${hh}:${mm}`;
}

window.updateMessageSchedulePreview = function () {
    const input = document.getElementById('msg-schedule-at');
    const preview = document.getElementById('msg-schedule-preview');
    if (!preview) return;
    const parsed = parseScheduleDateTimeLocal(input?.value || '');
    if (!parsed) {
        preview.innerText = '예상 발송: 지금';
        return;
    }
    preview.innerText = `예상 발송: ${formatMessageDate(parsed)} 예약`;
};

window.setMessageSchedulePreset = function (preset) {
    const input = document.getElementById('msg-schedule-at');
    if (!input) return;

    const now = new Date();
    let target = null;
    if (preset === '10m') target = new Date(now.getTime() + 10 * 60 * 1000);
    else if (preset === '30m') target = new Date(now.getTime() + 30 * 60 * 1000);
    else if (preset === '1h') target = new Date(now.getTime() + 60 * 60 * 1000);
    else if (preset === 'tomorrow9') {
        target = new Date(now);
        target.setDate(target.getDate() + 1);
        target.setHours(9, 0, 0, 0);
    } else {
        // now / unknown preset => immediate send
        input.value = '';
        window.updateMessageSchedulePreview();
        return;
    }

    target.setSeconds(0, 0);
    input.value = formatDateTimeLocal(target);
    window.updateMessageSchedulePreview();
};

function buildMessageRecipients(targetType, recipientId = '') {
    if (targetType === 'user_single') {
        return messageCenterUsers.filter((u) => u.id === recipientId).map((u) => ({
            type: 'user',
            docId: u.id,
            userId: u.userId,
            name: u.name
        }));
    }
    if (targetType === 'partner_single') {
        return messageCenterPartners.filter((p) => p.id === recipientId).map((p) => ({
            type: 'partner',
            docId: p.id,
            userId: p.userId,
            name: p.name
        }));
    }
    if (targetType === 'users_all') {
        return messageCenterUsers.map((u) => ({ type: 'user', docId: u.id, userId: u.userId, name: u.name }));
    }
    if (targetType === 'partners_all') {
        return messageCenterPartners.map((p) => ({ type: 'partner', docId: p.id, userId: p.userId, name: p.name }));
    }
    return [];
}

async function fanoutNotificationsFromMessage(messageId, payload, recipients) {
    if (!recipients.length) return 0;
    const chunkSize = 180;
    const deliveryMode = payload.deliveryMode || 'notice';
    for (let i = 0; i < recipients.length; i += chunkSize) {
        const chunk = recipients.slice(i, i + chunkSize);
        const batch = db.batch();
        chunk.forEach((r) => {
            if (deliveryMode === 'notice') {
                const ref = db.collection('user_notifications').doc();
                batch.set(ref, {
                    messageId,
                    recipientType: r.type,
                    recipientDocId: r.docId,
                    recipientUserId: r.userId,
                    recipientName: r.name,
                    category: payload.category,
                    priority: payload.priority,
                    linkType: payload.linkType || 'none',
                    linkLabel: payload.linkLabel || getLinkTypeLabel(payload.linkType || 'none'),
                    title: payload.title,
                    body: payload.body,
                    isRead: false,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            const isPartner = r.type === 'partner';
            const chatThreadId = isPartner ? `admin__p_${r.docId}` : `admin__u_${r.docId}`;
            const threadRef = db.collection('chat_threads').doc(chatThreadId);
            const chatMessageRef = db.collection('chat_messages').doc();
            const unreadField = isPartner ? 'unreadForPartner' : 'unreadForUser';

            if (deliveryMode === 'chat') {
                const threadPayload = isPartner
                    ? {
                        id: chatThreadId,
                        participantPartnerDocId: r.docId,
                        participantPartnerUserId: r.userId || '',
                        partnerName: r.name || '업체',
                        userName: '관리자',
                        userId: 'admin',
                        lastMessage: payload.body,
                        lastSenderRole: 'admin',
                        lastAt: firebase.firestore.FieldValue.serverTimestamp(),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        [unreadField]: firebase.firestore.FieldValue.increment(1)
                    }
                    : {
                        id: chatThreadId,
                        participantUserDocId: r.docId,
                        participantUserId: r.userId || '',
                        userName: r.name || '고객',
                        partnerName: '관리자',
                        partnerUserId: 'admin',
                        lastMessage: payload.body,
                        lastSenderRole: 'admin',
                        lastAt: firebase.firestore.FieldValue.serverTimestamp(),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        [unreadField]: firebase.firestore.FieldValue.increment(1)
                    };

                batch.set(threadRef, threadPayload, { merge: true });
                batch.set(chatMessageRef, {
                    threadId: chatThreadId,
                    senderRole: 'admin',
                    senderDocId: 'admin',
                    senderUserId: auth.currentUser?.email || 'admin',
                    senderName: '관리자',
                    text: payload.body,
                    category: payload.category || 'notice',
                    messageId,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        });
        await batch.commit();
    }
    return recipients.length;
}

async function dispatchAdminMessage(messageRef, payload) {
    const recipients = buildMessageRecipients(payload.targetType, payload.targetRecipientId || '');
    if (!recipients.length) {
        await messageRef.update({
            status: 'failed',
            failReason: '수신자 없음',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return { ok: false, count: 0 };
    }

    const count = await fanoutNotificationsFromMessage(messageRef.id, payload, recipients);
    await messageRef.update({
        status: 'sent',
        recipientCount: count,
        sentAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { ok: true, count };
}

async function processDueScheduledMessages() {
    if (isProcessingScheduledMessages) return;
    isProcessingScheduledMessages = true;
    try {
        const now = Date.now();
        const snap = await db.collection('admin_messages')
            .where('status', '==', 'scheduled')
            .get();

        const dueRows = [];
        snap.forEach((doc) => {
            const data = doc.data() || {};
            const ts = data.scheduledAt && typeof data.scheduledAt.toMillis === 'function'
                ? data.scheduledAt.toMillis()
                : 0;
            if (ts && ts <= now) dueRows.push({ id: doc.id, ref: doc.ref, data });
        });

        for (const row of dueRows) {
            const locked = await db.runTransaction(async (tx) => {
                const cur = await tx.get(row.ref);
                const curData = cur.data() || {};
                if (curData.status !== 'scheduled') return false;
                tx.update(row.ref, {
                    status: 'sending',
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                return true;
            });
            if (!locked) continue;

            try {
                await dispatchAdminMessage(row.ref, row.data);
            } catch (err) {
                console.error('예약 발송 처리 실패:', err);
                await row.ref.update({
                    status: 'failed',
                    failReason: err.message || 'Unknown error',
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        }
    } catch (err) {
        console.error('예약 메시지 스케줄러 오류:', err);
    } finally {
        isProcessingScheduledMessages = false;
    }
}

async function loadMessageCenter() {
    await Promise.all([loadMessageCenterRecipients(), loadAdminMessageHistory()]);
    refreshMessageRecipientOptions();
    refreshMessageTemplateOptions();
    refreshMessageLinkOptions();
    updateMessageSchedulePreview();
    processDueScheduledMessages();
    if (messageSchedulerTimer) clearInterval(messageSchedulerTimer);
    messageSchedulerTimer = setInterval(processDueScheduledMessages, 30000);
}

async function loadMessageCenterRecipients() {
    try {
        const [userSnap, partnerSnap] = await Promise.all([
            db.collection('users').get(),
            db.collection('partners').get()
        ]);

        messageCenterUsers = userSnap.docs.map((doc) => {
            const data = doc.data() || {};
            return {
                id: doc.id,
                userId: data.userId || doc.id,
                name: data.name || data.userName || data.nickname || '이름 없음'
            };
        }).sort((a, b) => String(a.name).localeCompare(String(b.name), 'ko'));

        messageCenterPartners = partnerSnap.docs.map((doc) => {
            const data = doc.data() || {};
            return {
                id: doc.id,
                userId: data.userId || doc.id,
                name: data.name || data.company || '업체명 없음'
            };
        }).sort((a, b) => String(a.name).localeCompare(String(b.name), 'ko'));
    } catch (err) {
        console.error('메시지 수신자 목록 로드 실패:', err);
    }
}

window.refreshMessageRecipientOptions = function () {
    const targetType = getSelectedMessageTargetType();
    const wrap = document.getElementById('msg-recipient-wrap');
    const select = document.getElementById('msg-recipient-select');
    if (!wrap || !select) return;

    const isAll = targetType === 'users_all' || targetType === 'partners_all';
    wrap.classList.toggle('hidden', isAll);
    select.innerHTML = '';
    if (isAll) {
        refreshMessageTemplateOptions();
        refreshMessageLinkOptions();
        return;
    }

    const source = targetType === 'user_single' ? messageCenterUsers : messageCenterPartners;
    if (!source.length) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = '선택 가능한 수신자가 없습니다.';
        select.appendChild(opt);
        return;
    }

    source.forEach((row) => {
        const opt = document.createElement('option');
        opt.value = row.id;
        opt.textContent = `${row.name} (${row.userId})`;
        select.appendChild(opt);
    });

    refreshMessageTemplateOptions();
    refreshMessageLinkOptions();
};

window.applyMessageTemplate = function () {
    const key = document.getElementById('msg-template-select')?.value || '';
    if (!key || !MESSAGE_TEMPLATES[key]) return;
    const t = MESSAGE_TEMPLATES[key];
    const categoryEl = document.getElementById('msg-category');
    const priorityEl = document.getElementById('msg-priority');
    const linkEl = document.getElementById('msg-link-type');
    const titleEl = document.getElementById('msg-title-input');
    const bodyEl = document.getElementById('msg-body-input');
    const targetType = getSelectedMessageTargetType();
    const audience = getAudienceKeyByTargetType(targetType);
    if (categoryEl) categoryEl.value = t.category;
    if (priorityEl) priorityEl.value = t.priority;
    refreshMessageLinkOptions();
    if (linkEl) {
        const allowed = MESSAGE_LINK_OPTIONS[audience] || MESSAGE_LINK_OPTIONS.all;
        const isAllowed = allowed.some((opt) => opt.value === (t.linkType || 'none'));
        linkEl.value = isAllowed ? (t.linkType || 'none') : 'none';
    }
    if (titleEl) titleEl.value = t.title;
    if (bodyEl) bodyEl.value = t.body;
};

window.clearMessageSchedule = function () {
    const el = document.getElementById('msg-schedule-at');
    if (el) el.value = '';
    window.updateMessageSchedulePreview();
};

window.sendAdminMessage = async function () {
    const targetType = getSelectedMessageTargetType();
    const category = document.getElementById('msg-category')?.value || 'notice';
    const recipientId = document.getElementById('msg-recipient-select')?.value || '';
    const title = (document.getElementById('msg-title-input')?.value || '').trim();
    const body = (document.getElementById('msg-body-input')?.value || '').trim();
    const priority = document.getElementById('msg-priority')?.value || 'normal';
    const deliveryMode = document.getElementById('msg-delivery-mode')?.value || 'notice';
    const linkType = document.getElementById('msg-link-type')?.value || 'none';
    const sendBtn = document.getElementById('msg-send-btn');
    const scheduleRaw = document.getElementById('msg-schedule-at')?.value || '';
    const parsedSchedule = parseScheduleDateTimeLocal(scheduleRaw);
    const scheduledDate = parsedSchedule && parsedSchedule.getTime() > Date.now() ? parsedSchedule : null;

    if (!title || !body) {
        alert('제목과 내용을 모두 입력해주세요.');
        return;
    }

    if ((targetType === 'user_single' || targetType === 'partner_single') && !recipientId) {
        alert('수신자를 선택해주세요.');
        return;
    }

    try {
        if (sendBtn) {
            sendBtn.disabled = true;
            sendBtn.innerText = '발송 중...';
        }

        const recipients = buildMessageRecipients(targetType, recipientId);

        if (!recipients.length) {
            alert('발송할 수신자가 없습니다.');
            return;
        }

        const payload = {
            targetType,
            targetLabel: getMessageTargetLabel(targetType),
            targetRecipientId: targetType === 'user_single' || targetType === 'partner_single' ? recipientId : '',
            category,
            priority,
            deliveryMode,
            deliveryLabel: getDeliveryModeLabel(deliveryMode),
            linkType,
            linkLabel: getLinkTypeLabel(linkType),
            title,
            body,
            senderEmail: auth.currentUser?.email || 'admin',
            recipientCount: recipients.length,
            status: scheduledDate ? 'scheduled' : 'draft',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        if (scheduledDate) {
            payload.scheduledAt = firebase.firestore.Timestamp.fromDate(scheduledDate);
        }

        const messageRef = await db.collection('admin_messages').add(payload);
        if (scheduledDate) {
            alert(`예약 발송이 등록되었습니다.\n예정 시각: ${formatMessageDate(scheduledDate)}`);
        } else {
            const result = await dispatchAdminMessage(messageRef, payload);
            if (!result.ok) {
                alert('메시지 발송에 실패했습니다. 수신자 목록을 확인해주세요.');
                return;
            }
            alert(`메시지가 ${result.count}명에게 발송되었습니다.\n발송 시각: ${formatMessageDate(new Date())}`);
        }

        const templateEl = document.getElementById('msg-template-select');
        const linkEl = document.getElementById('msg-link-type');
        const deliveryEl = document.getElementById('msg-delivery-mode');
        document.getElementById('msg-title-input').value = '';
        document.getElementById('msg-body-input').value = '';
        if (templateEl) templateEl.value = '';
        if (linkEl) linkEl.value = 'none';
        if (deliveryEl) deliveryEl.value = 'notice';
        window.clearMessageSchedule();
        loadAdminMessageHistory();
    } catch (err) {
        console.error('메시지 발송 실패:', err);
        alert('메시지 발송 중 오류가 발생했습니다: ' + err.message);
    } finally {
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.innerText = '메시지 발송';
        }
    }
};

async function loadAdminMessageHistory() {
    const container = document.getElementById('msg-history-list');
    if (!container) return;

    if (unsubscribeAdminMessages) unsubscribeAdminMessages();
    container.innerHTML = '<div class="text-[#A7B2AE] text-sm">불러오는 중...</div>';

    unsubscribeAdminMessages = db.collection('admin_messages')
        .orderBy('createdAt', 'desc')
        .limit(40)
        .onSnapshot((snapshot) => {
            if (snapshot.empty) {
                container.innerHTML = '<div class="text-[#A7B2AE] text-sm">발송 이력이 없습니다.</div>';
                return;
            }
            let html = '';
            snapshot.forEach((doc) => {
                const data = doc.data() || {};
                const statusColor = data.status === 'scheduled'
                    ? 'text-blue-300 border-blue-500/40 bg-blue-500/10'
                    : data.status === 'failed'
                        ? 'text-red-300 border-red-500/40 bg-red-500/10'
                        : 'text-green-300 border-green-500/40 bg-green-500/10';
                const statusLabel = data.status === 'scheduled'
                    ? `예약 (${formatMessageDate(data.scheduledAt)})`
                    : data.status === 'failed'
                        ? '실패'
                        : '발송완료';
                html += `
                    <div class="rounded-xl border border-[#2A3731] bg-[#06110D] p-4">
                        <div class="flex items-start justify-between gap-3">
                            <div class="text-white font-bold text-sm">${escapeHtml(data.title || '(제목 없음)')}</div>
                            <span class="text-[11px] text-[#A7B2AE] whitespace-nowrap">${formatMessageDate(data.createdAt)}</span>
                        </div>
                        <div class="text-[12px] text-[#A7B2AE] mt-1">
                            ${escapeHtml(data.targetLabel || getMessageTargetLabel(data.targetType))} · ${escapeHtml(data.deliveryLabel || getDeliveryModeLabel(data.deliveryMode || 'notice'))} · ${escapeHtml(data.category || 'notice')} · ${escapeHtml(data.priority || 'normal')} · ${Number(data.recipientCount || 0)}명
                        </div>
                        <div class="text-[11px] text-[#7F8E88] mt-1">관련 화면: ${escapeHtml(data.linkLabel || getLinkTypeLabel(data.linkType || 'none'))}</div>
                        <div class="mt-2">
                            <span class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColor}">${statusLabel}</span>
                            ${data.failReason ? `<span class="text-[10px] text-red-300 ml-2">${escapeHtml(data.failReason)}</span>` : ''}
                        </div>
                        <p class="text-[13px] text-white/90 mt-2 leading-relaxed whitespace-pre-wrap">${escapeHtml(data.body || '')}</p>
                    </div>
                `;
            });
            container.innerHTML = html;
        }, (err) => {
            console.error('메시지 이력 로드 실패:', err);
            container.innerHTML = `<div class="text-red-400 text-sm">이력 로드 실패: ${escapeHtml(err.message)}</div>`;
        });
}

// ─── Initial Listeners ───
window.addEventListener('DOMContentLoaded', () => {
    loadCallClickLogs();
    db.collection('users').onSnapshot((snap) => {
        sidebarSnapshotCache.users = snap;
        currentUserCount = snap.size;
        const unread = countUnreadDocsByTimestamp(snap, 'users', ['updatedAt', 'createdAt']);
        setSidebarCategoryCount('users', snap.size, unread);
        updateDashboardStats();
    });
    db.collection('partners').onSnapshot((snap) => {
        sidebarSnapshotCache.partners = snap;
        currentShopCount = snap.size;
        const shopUnread = countUnreadDocsByTimestamp(snap, 'shops', ['updatedAt', 'createdAt']);
        setSidebarCategoryCount('shops', snap.size, shopUnread);

        let pendingCount = 0;
        snap.forEach((doc) => {
            if (doc.data().status === 'pending') {
                pendingCount++;
            }
        });
        const pendingUnread = countUnreadDocsByTimestamp(
            snap,
            'approvals',
            ['updatedAt', 'createdAt'],
            (data) => data.status === 'pending',
        );
        setSidebarCategoryCount('approvals', pendingCount, pendingUnread);

        updateDashboardStats();
    });
    db.collection('categories')
        .orderBy('createdAt', 'asc')
        .onSnapshot((snap) => {
            sidebarSnapshotCache.categories = snap;
            const list = snap.docs.map((doc) => ({ id: doc.id, name: doc.data().name }));
            categoriesList = list;
            categoryData.categories = list;
            updateCategoryBadge('categories', list.length);
            categoriesCollectionUnreadCount = countUnreadDocsByTimestamp(
                snap,
                'categories',
                ['updatedAt', 'createdAt'],
            );
            refreshCategorySidebarBadge();
            if (currentCategoryType === 'categories') renderActiveCategoryList();
        });

    // 앱 필터 실시간 감시
    ['massage', 'place', 'age', 'categories', 'customer_report_reason', 'partner_report_reason', 'customer_inquiry_type', 'partner_inquiry_type'].forEach((key) => {
        if (key === 'categories') return;
        db.collection('app_filters')
            .doc(key)
            .onSnapshot((doc) => {
                const rawData = doc.exists ? doc.data().options || [] : [];
                const data = key === 'place' ? normalizePlaceOptions(rawData) : rawData;
                if (
                    key === 'place' &&
                    doc.exists &&
                    JSON.stringify(rawData) !== JSON.stringify(data)
                ) {
                    doc.ref
                        .set(
                            {
                                options: data,
                                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                            },
                            { merge: true },
                        )
                        .catch((err) =>
                            console.error('place 옵션 정규화 저장 실패:', err?.message || err),
                        );
                }
                categoryData[key] = data;
                updateCategoryBadge(key, data.length);
                const activityMs = getLatestActivityMs(doc.exists ? doc.data() || {} : {}, [
                    'updatedAt',
                    'createdAt',
                ]);
                categoryFilterActivityByKey[key] = activityMs;
                const seenAtMs = getSeenAtMsForKey('categories');
                categoryFilterUnreadByKey[key] =
                    sidebarBadgeReadsLoaded && activityMs > seenAtMs ? 1 : 0;
                refreshCategorySidebarBadge();
                if (typeof currentCategoryType !== 'undefined' && currentCategoryType === key) renderActiveCategoryList();
                if (typeof currentCSCategoryType !== 'undefined' && currentCSCategoryType === key) renderCSActiveCategoryList();
            });
    });

    db.collection('subscription_requests').onSnapshot((snapshot) => {
        sidebarSnapshotCache.subscriptions = snapshot;
        let pending = 0;
        snapshot.forEach((doc) => {
            const status = normalizeSubRequestStatus(doc.data()?.status || 'pending');
            if (status === 'pending') pending++;
        });
        const unread = countUnreadDocsByTimestamp(
            snapshot,
            'subscriptions',
            ['updatedAt', 'createdAt', 'requestedAt', 'submittedAt'],
            (data) => normalizeSubRequestStatus(data?.status || 'pending') === 'pending',
        );
        setSidebarCategoryCount('subscriptions', pending, unread);
    });

    db.collection('admin_messages').onSnapshot((snapshot) => {
        sidebarSnapshotCache.messages = snapshot;
        let pendingActions = 0;
        snapshot.forEach((doc) => {
            const status = String(doc.data()?.status || '').toLowerCase();
            if (status === 'scheduled' || status === 'failed') pendingActions++;
        });
        const unread = countUnreadDocsByTimestamp(
            snapshot,
            'messages',
            ['updatedAt', 'createdAt', 'scheduledAt'],
            (data) => {
                const status = String(data?.status || '').toLowerCase();
                return status === 'scheduled' || status === 'failed';
            },
        );
        setSidebarCategoryCount('messages', pendingActions, unread);
    });
});

// ═══════════════════════════════════════
// ▶ APP CATEGORY & FILTER MANAGEMENT (NEW)
// ═══════════════════════════════════════

let currentCategoryType = 'massage';
let currentCSCategoryType = 'customer_report_reason';
function normalizePlaceLabel(label) {
    if (typeof label !== 'string') return '';
    return label
        .replace(/프라이빗\s*/g, '')
        .replace(/스탠다드\s*/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

function normalizePlaceOptions(options) {
    if (!Array.isArray(options)) return [];
    const normalized = options
        .map((item) => normalizePlaceLabel(item))
        .filter((item) => Boolean(item));
    return normalized.filter((item, idx) => normalized.indexOf(item) === idx);
}

const CATEGORY_META = {
    massage: {
        title: '마사지 테마',
        desc: '고객 앱 검색창에 노출되는 마사지 카테고리 기동 설정입니다.',
        isFilter: true,
    },
    place: {
        title: '샵 공간 형태',
        desc: '고객 앱 검색창에 노출되는 공간 분류 기동 설정입니다.',
        isFilter: true,
    },
    age: {
        title: '관리사 연령대',
        desc: '고객 앱 검색창에 노출되는 연령 분류 기동 설정입니다.',
        isFilter: true,
    },
    categories: {
        title: '제휴점 공용 태그',
        desc: '모든 제휴점들이 공통으로 사용할 수 있는 일반 정보 태그 풀을 설정합니다.',
        isFilter: false,
    },
    customer_report_reason: {
        title: '고객 신고 사유',
        desc: '고객이 파트너 업체를 신고할 때 선택할 수 있는 사유 목록입니다.',
        isFilter: true,
    },
    partner_report_reason: {
        title: '업체 신고 사유',
        desc: '파트너 업체가 고객을 신고할 때 선택할 수 있는 사유 목록입니다.',
        isFilter: true,
    },
    customer_inquiry_type: {
        title: '고객 문의 유형',
        desc: '고객이 CS 센터에 문의할 때 선택할 수 있는 유형 목록입니다.',
        isFilter: true,
    },
    partner_inquiry_type: {
        title: '업체 문의 유형',
        desc: '파트너 업체가 CS 센터에 문의할 때 선택할 수 있는 유형 목록입니다.',
        isFilter: true,
    },
};

let categoryData = {
    massage: [],
    place: [],
    age: [],
    categories: [],
    customer_report_reason: [],
    partner_report_reason: [],
    customer_inquiry_type: [],
    partner_inquiry_type: [],
};

// 최초 로딩 시 데이터 전부 불러오고 첫 탭 선택 (DOMContentLoaded 내 listener들에 의해 데이터는 자동 갱신됨)
function loadAllFilters() {
    selectCategoryType('massage');
}

function selectCategoryType(type) {
    currentCategoryType = type;

    // Update active styles on the sidebar
    Object.keys(CATEGORY_META).forEach((key) => {
        const btn = document.getElementById(`menu-cat-${key}`);
        if (!btn) return;
        if (key === type) {
            btn.className =
                'flex justify-between items-center px-4 py-4 rounded-xl text-left bg-[#11291D] border border-[var(--point-color)] text-[var(--point-color)] font-bold transition-all';
        } else {
            // Keep styling for CS section smaller padding
            const isCs = key.includes('report') || key.includes('inquiry');
            const padding = isCs ? 'py-3' : 'py-4';
            btn.className =
                `flex justify-between items-center px-4 ${padding} rounded-xl text-left bg-[#0A1B13] border border-[#2A3731] text-[#A7B2AE] hover:bg-[#11291D] hover:text-white transition-all`;
        }
    });

    // Update Header
    document.getElementById('detail-cat-title').textContent = CATEGORY_META[type].title;
    document.getElementById('detail-cat-desc').textContent = CATEGORY_META[type].desc;

    // Render list
    renderActiveCategoryList();
}

function updateCategoryBadge(type, count) {
    const badge = document.getElementById(`badge-${type}`);
    if (badge) badge.textContent = count;
    const csBadge = document.getElementById(`cs-badge-${type}`);
    if (csBadge) csBadge.textContent = count;
}

function renderActiveCategoryList() {
    const listContainer = document.getElementById('detail-cat-list');
    if (!listContainer) return;

    const items = categoryData[currentCategoryType];
    const meta = CATEGORY_META[currentCategoryType];

    if (!items || items.length === 0) {
        listContainer.innerHTML = `<span class="text-sm text-[#A7B2AE]">등록된 항목이 없습니다. (기본값 동기화를 눌러 초기값을 설정할 수 있습니다.)</span>`;
        return;
    }

    listContainer.innerHTML = items
        .map((item, idx) => {
            const isDefault = meta.isFilter && idx === 0; // 전역 필터의 첫번째 요소는 '전체' 등으로 고정 (삭제 불가)
            const displayName = meta.isFilter ? item : item.name;
            const itemId = meta.isFilter ? item : item.id;

            return `
            <div class="px-4 py-2 bg-[#11291D] border border-[#2A3731] rounded-full text-[var(--point-color)] text-sm flex items-center gap-2 group shadow-sm transition-all hover:brightness-110">
                ${isDefault ? '🔒 ' : ''}${displayName}
                ${!isDefault ? `<button onclick="removeCategoryItem('${currentCategoryType}', '${itemId.replace(/'/g, "\\'")}')" class="text-[#A7B2AE] opacity-0 group-hover:opacity-100 transition-opacity ml-1 hover:text-white" title="삭제">✕</button>` : ''}
            </div>
        `;
        })
        .join('');
}

function handleInlineSubmit(e) {
    e.preventDefault();
    const inputEl = document.getElementById('inline-cat-input');
    const val = inputEl.value.trim();
    if (!val) return;

    const meta = CATEGORY_META[currentCategoryType];

    if (meta.isFilter) {
        const normalizedVal = currentCategoryType === 'place' ? normalizePlaceLabel(val) : val;
        if (!normalizedVal) {
            alert('유효한 항목명을 입력해주세요.');
            return;
        }
        const ref = db.collection('app_filters').doc(currentCategoryType);
        ref.get()
            .then((doc) => {
                if (doc.exists) {
                    const currentRaw = doc.data().options || [];
                    const current =
                        currentCategoryType === 'place'
                            ? normalizePlaceOptions(currentRaw)
                            : currentRaw;
                    if (current.includes(normalizedVal)) {
                        alert('이미 존재하는 항목입니다.');
                        return;
                    }
                    return ref.update({
                        options: firebase.firestore.FieldValue.arrayUnion(normalizedVal),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    });
                } else {
                    const defaultHead =
                        currentCategoryType === 'place' ? '상관없음(전체)' : '전체';
                    return ref.set({
                        title: meta.title,
                        options: [defaultHead, normalizedVal],
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    });
                }
            })
            .then(() => {
                inputEl.value = '';
            })
            .catch((err) => alert('추가 오류: ' + err.message));
    } else {
        db.collection('categories')
            .add({
                name: val,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            })
            .then(() => {
                inputEl.value = '';
            })
            .catch((err) => alert('추가 오류: ' + err.message));
    }
}

function removeCategoryItem(type, idOrName) {
    if (!confirm('정말 삭제하시겠습니까? 사용자 및 업체 화면에서 즉시 사라집니다.')) return;

    const meta = CATEGORY_META[type];
    if (meta.isFilter) {
        db.collection('app_filters')
            .doc(type)
            .update({
                options: firebase.firestore.FieldValue.arrayRemove(idOrName),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            })
            .catch((err) => alert('삭제 오류: ' + err.message));
    } else {
        db.collection('categories')
            .doc(idOrName)
            .delete()
            .catch((err) => alert('삭제 오류: ' + err.message));
    }
}

// ─── CS Category Logic ───
function switchCSSubTab(tabId) {
    document.querySelectorAll('.cs-sub-tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.cs-sub-tab-btn').forEach(btn => {
        btn.classList.remove('text-[var(--point-color)]', 'border-[var(--point-color)]');
        btn.classList.add('text-[#A7B2AE]', 'border-transparent');
    });

    document.getElementById(tabId).classList.remove('hidden');
    document.getElementById(`btn-${tabId}`).classList.remove('text-[#A7B2AE]', 'border-transparent');
    document.getElementById(`btn-${tabId}`).classList.add('text-[var(--point-color)]', 'border-[var(--point-color)]');

    if (tabId === 'cs-settings-view') {
        selectCSCategoryType(currentCSCategoryType || 'customer_report_reason');
    }
}

function selectCSCategoryType(type) {
    currentCSCategoryType = type;

    // Update active styles on the sidebar
    ['customer_report_reason', 'partner_report_reason', 'customer_inquiry_type', 'partner_inquiry_type'].forEach((key) => {
        const btn = document.getElementById(`cs-menu-cat-${key}`);
        if (!btn) return;
        if (key === type) {
            btn.className =
                'flex justify-between items-center px-4 py-3 rounded-xl text-left bg-[#11291D] border border-[var(--point-color)] text-[var(--point-color)] font-bold transition-all';
        } else {
            btn.className =
                'flex justify-between items-center px-4 py-3 rounded-xl text-left bg-[#0A1B13] border border-[#2A3731] text-[#A7B2AE] hover:bg-[#11291D] hover:text-white transition-all';
        }
    });

    // Update Header
    document.getElementById('cs-detail-cat-title').textContent = CATEGORY_META[type].title;
    document.getElementById('cs-detail-cat-desc').textContent = CATEGORY_META[type].desc;

    // Render list
    renderCSActiveCategoryList();
}

function renderCSActiveCategoryList() {
    const listContainer = document.getElementById('cs-detail-cat-list');
    if (!listContainer) return;

    const items = categoryData[currentCSCategoryType];
    const meta = CATEGORY_META[currentCSCategoryType];

    if (!items || items.length === 0) {
        listContainer.innerHTML = `<span class="text-sm text-[#A7B2AE]">등록된 항목이 없습니다.</span>`;
        return;
    }

    listContainer.innerHTML = items
        .map((item, idx) => {
            const isDefault = meta.isFilter && idx === 0;
            const displayName = meta.isFilter ? item : item.name;
            const itemId = meta.isFilter ? item : item.id;

            return `
            <div class="px-4 py-2 bg-[#11291D] border border-[#2A3731] rounded-full text-[var(--point-color)] text-sm flex items-center gap-2 group shadow-sm transition-all hover:brightness-110">
                ${isDefault ? '🔒 ' : ''}${displayName}
                ${!isDefault ? `<button onclick="removeCategoryItem('${currentCSCategoryType}', '${itemId.replace(/'/g, "\\'")}')" class="text-[#A7B2AE] opacity-0 group-hover:opacity-100 transition-opacity ml-1 hover:text-white" title="삭제">✕</button>` : ''}
            </div>
        `;
        })
        .join('');
}

function handleCSInlineSubmit(e) {
    e.preventDefault();
    const inputEl = document.getElementById('cs-inline-cat-input');
    const val = inputEl.value.trim();
    if (!val) return;

    const meta = CATEGORY_META[currentCSCategoryType];

    if (meta.isFilter) {
        const ref = db.collection('app_filters').doc(currentCSCategoryType);
        ref.get()
            .then((doc) => {
                if (doc.exists) {
                    const current = doc.data().options || [];
                    if (current.includes(val)) {
                        alert('이미 존재하는 항목입니다.');
                        return;
                    }
                    return ref.update({
                        options: firebase.firestore.FieldValue.arrayUnion(val),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    });
                } else {
                    return ref.set({
                        title: meta.title,
                        options: ['전체', val],
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    });
                }
            })
            .then(() => {
                inputEl.value = '';
            })
            .catch((err) => alert('추가 오류: ' + err.message));
    }
}

// 기본값 시딩 (소비자 앱의 하드코딩 데이터를 Firestore에 저장)
function seedDefaultFilters() {
    if (
        !confirm(
            '소비자 앱의 기본 필터 데이터를 Firestore에 동기화하시겠습니까?\n기존 데이터가 있으면 덮어씁니다.',
        )
    )
        return;

    const batch = db.batch();
    Object.keys(DEFAULT_FILTERS).forEach((key) => {
        const ref = db.collection('app_filters').doc(key);
        batch.set(ref, {
            title: DEFAULT_FILTERS[key].title,
            options: DEFAULT_FILTERS[key].options,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
    });

    batch
        .commit()
        .then(() => alert('✅ 3개 필터 그룹 동기화 완료!'))
        .catch((err) => alert('동기화 오류: ' + err.message));
}

// ═══════════════════════════════════════
// ▶ USERS
// ═══════════════════════════════════════

function loadUsers() {
    const tbody = document.getElementById('user-table-body');
    db.collection('users')
        .orderBy('createdAt', 'desc')
        .onSnapshot((snapshot) => {
            tbody.innerHTML = '';
            if (snapshot.empty) {
                tbody.innerHTML =
                    '<tr><td colspan="7" class="p-4 text-center">조회된 유저가 없습니다.</td></tr>';
                return;
            }
            snapshot.forEach((doc) => {
                const data = doc.data();
                const dStr = data.createdAt
                    ? typeof data.createdAt.toMillis === 'function'
                        ? new Date(data.createdAt.toMillis()).toLocaleString('ko-KR')
                        : new Date(data.createdAt).toLocaleString('ko-KR')
                    : '-';
                const logStr = data.lastLoginAt
                    ? typeof data.lastLoginAt.toMillis === 'function'
                        ? new Date(data.lastLoginAt.toMillis()).toLocaleString('ko-KR')
                        : new Date(data.lastLoginAt).toLocaleString('ko-KR')
                    : '-';
                tbody.innerHTML += `
                <tr class="hover:bg-white/5 transition-colors">
                    <td class="p-4 font-mono">${data.userId || '알수없음'}</td>
                    <td class="p-4">${data.name || '알수없음'}</td>
                    <td class="p-4">${data.gender || '-'}</td>
                    <td class="p-4 text-[#A7B2AE]">${data.phone || '-'}</td>
                    <td class="p-4 text-[#A7B2AE]">${dStr}</td>
                    <td class="p-4 text-[#A7B2AE]">${logStr}</td>
                    <td class="p-4 flex items-center gap-2">
                        <span class="px-2 py-1 bg-green-900/50 text-green-400 rounded text-xs border border-green-800">정상 활성</span>
                        <button onclick="deleteUser('${doc.id}', '${data.name || '알수없음'}')" class="px-2 py-1 bg-[#2A1515] text-red-400 hover:text-red-200 hover:bg-red-900/40 border border-red-900/50 rounded text-xs transition-colors">삭제</button>
                    </td>
                </tr>
            `;
            });
        });
}

function deleteUser(userId, userName) {
    if (
        confirm(
            `정말 "${userName}" 회원을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없으며 앱 접속이 즉시 차단됩니다.`,
        )
    ) {
        db.collection('users')
            .doc(userId)
            .delete()
            .then(() => {
                console.log('Deleted user:', userId);
            })
            .catch((err) => {
                console.error('회원 삭제 오류:', err);
                alert('회원 삭제에 실패했습니다: ' + err.message);
            });
    }
}

// ═══════════════════════════════════════
// ▶ LEGACY CATEGORIES (shop tags)
// ═══════════════════════════════════════

function loadCategories() {
    const container = document.getElementById('category-list-container');
    db.collection('categories')
        .orderBy('createdAt', 'asc')
        .onSnapshot((snapshot) => {
            container.innerHTML = '';
            if (snapshot.empty) {
                container.innerHTML =
                    '<span class="text-[#A7B2AE]">아직 등록된 태그 카테고리가 없습니다.</span>';
                return;
            }
            snapshot.forEach((doc) => {
                const data = doc.data();
                container.innerHTML += `
                <div class="px-4 py-2 bg-[#11291D] border border-[#2A3731] rounded-full text-[var(--point-color)] text-sm flex items-center gap-2 group shadow-sm transition-all hover:brightness-110">
                    \${data.name}
                    <button onclick="deleteCategory('\${doc.id}')" class="text-[#A7B2AE] opacity-0 group-hover:opacity-100 transition-opacity ml-1 hover:text-white" title="삭제">✕</button>
                </div>
            `;
            });
        });
}

function openCategoryModal() {
    document.getElementById('category-form').reset();
    openModal('modal-category');
}

function handleCategorySubmit(e) {
    e.preventDefault();
    const name = document.getElementById('category-name').value.trim();
    if (!name) return;

    db.collection('categories')
        .add({
            name: name,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        })
        .then(() => {
            closeModal('modal-category');
        })
        .catch((err) => alert('카테고리 생성 중 오류: ' + err.message));
}

function deleteCategory(id) {
    if (confirm('정말 삭제하시겠습니까? 소비자 앱 화면에서 해당 메뉴가 즉시 사라지게 됩니다.')) {
        db.collection('categories').doc(id).delete();
    }
}

// ═══════════════════════════════════════
// ▶ APPROVALS
// ═══════════════════════════════════════

let windowApprovals = []; // Cache for inbox filtering

function loadApprovals() {
    const inboxList = document.getElementById('approvals-inbox-list');
    if (!inboxList) return;

    db.collection('partners')
        .where('status', '==', 'pending')
        .onSnapshot((snapshot) => {
            windowApprovals = [];

            // Update KPI
            const kpiEl = document.getElementById('kpi-approvals-pending');
            if (kpiEl) kpiEl.textContent = snapshot.size;

            if (snapshot.empty) {
                inboxList.innerHTML = `
                <div class="py-10 text-center text-[#A7B2AE] flex flex-col items-center">
                    <svg class="w-8 h-8 text-[#2A3731] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                    <span class="text-sm">현재 대기 중인 입점 심사가 없습니다.</span>
                </div>
            `;
                resetApprovalDetailView();
                return;
            }

            snapshot.forEach((doc) => {
                const data = doc.data();
                data.id = doc.id;
                windowApprovals.push(data);
            });

            windowApprovals.sort((a, b) => {
                let timeA = 0,
                    timeB = 0;
                if (a.createdAt)
                    timeA =
                        typeof a.createdAt.toMillis === 'function'
                            ? a.createdAt.toMillis()
                            : new Date(a.createdAt).getTime();
                if (b.createdAt)
                    timeB =
                        typeof b.createdAt.toMillis === 'function'
                            ? b.createdAt.toMillis()
                            : new Date(b.createdAt).getTime();
                return timeB - timeA;
            });

            filterApprovalList();
        });
}

function filterApprovalList() {
    const searchVal = (document.getElementById('approval-search')?.value || '').toLowerCase();

    const filtered = windowApprovals.filter((shop) => {
        const name = (shop.name || shop.company || '').toLowerCase();
        const contact = (shop.phone || shop.managerPhone || '').toLowerCase();
        const address = (shop.address || shop.location || '').toLowerCase();

        return (
            name.includes(searchVal) || contact.includes(searchVal) || address.includes(searchVal)
        );
    });

    renderApprovalInbox(filtered);
}

function renderApprovalInbox(shops) {
    const inboxList = document.getElementById('approvals-inbox-list');
    if (!shops.length) {
        inboxList.innerHTML =
            '<div class="py-10 text-center text-[#A7B2AE] text-sm">검색 결과가 없습니다.</div>';
        return;
    }

    inboxList.innerHTML = shops
        .map((shop) => {
            let dStr = '-';
            if (shop.createdAt) {
                dStr =
                    typeof shop.createdAt.toMillis === 'function'
                        ? new Date(shop.createdAt.toMillis()).toLocaleString('ko-KR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                          })
                        : new Date(shop.createdAt).toLocaleString('ko-KR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                          });
            }
            const displayName = shop.name || shop.company || '샵 이름 없음';
            const ticketBadge =
                (shop.ticketType || shop.tier || '').includes('Premium') ||
                (shop.ticketType || shop.tier || '').includes('프리미엄')
                    ? '<span class="px-2 py-0.5 rounded text-[10px] bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 text-yellow-400 border border-yellow-500/30">Premium</span>'
                    : '<span class="px-2 py-0.5 rounded text-[10px] bg-[#11291D] text-[#A7B2AE] border border-[#2A3731]">기본 입점</span>';

            // Check if currently selected
            const currentSelectedId = document.getElementById('approval-id')?.value;
            const isActive = currentSelectedId === shop.id;
            const activeClass = isActive
                ? 'bg-[#11291D] border-[var(--point-color)] shadow-[0_0_10px_rgba(34,197,94,0.1)]'
                : 'bg-[#06110D] border-[#2A3731] hover:border-[#11291D] hover:bg-[#081510] cursor-pointer';

            return `
            <div onclick="selectApprovalReview('${shop.id}')" id="inbox-item-${shop.id}" class="p-3 border rounded-xl transition-all ${activeClass}">
                <div class="flex justify-between items-start mb-2">
                    <h5 class="font-bold text-white text-sm line-clamp-1 flex-1 pr-2">${displayName}</h5>
                    ${ticketBadge}
                </div>
                <div class="text-xs text-[#A7B2AE] flex items-center justify-between">
                    <span class="truncate pr-2">${shop.address || shop.location || '주소 미상'}</span>
                    <span class="whitespace-nowrap opacity-70">${dStr.split(' ')[dStr.split(' ').length - 1]}</span>
                </div>
            </div>
        `;
        })
        .join('');
}

function resetApprovalDetailView() {
    document.getElementById('approval-empty-state').classList.remove('hidden');
    document.getElementById('approval-form').classList.add('hidden');
    document.getElementById('approval-id').value = '';
}

function activatePartner(id) {
    if (
        !confirm(
            '해당 파트너의 입점을 승인하시겠습니까?\\n승인 즉시 소비자 앱 지도/목록에 노출됩니다.',
        )
    )
        return;

    db.collection('partners')
        .doc(id)
        .update({
            status: 'active',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        })
        .then(() => {
            alert('성공적으로 승인되었습니다!');
        })
        .catch((err) => {
            alert('승인 처리 중 오류 발생: ' + err.message);
        });
}

function rejectPartner(id) {
    if (
        !confirm(
            '정말 해당 입점 신청을 반려하시겠습니까?\\n이 작업은 취소할 수 없으며 파트너 데이터가 삭제됩니다.',
        )
    )
        return;

    db.collection('partners')
        .doc(id)
        .delete()
        .then(() => {
            alert('입점 신청이 반려(삭제)되었습니다.');
        })
        .catch((err) => {
            alert('반려 처리 중 오류 발생: ' + err.message);
        });
}

function selectApprovalReview(id) {
    db.collection('partners')
        .doc(id)
        .get()
        .then((doc) => {
            if (!doc.exists) return;
            const data = doc.data();

            // UI Handling: Hide empty state, show form
            document.getElementById('approval-empty-state').classList.add('hidden');
            document.getElementById('approval-form').classList.remove('hidden');

            // Unhighlight previous active item in list
            const prevActive = document.querySelector(
                '#approvals-inbox-list > div.border-\\[var\\(--point-color\\)\\]',
            );
            if (prevActive) {
                prevActive.classList.replace('bg-[#11291D]', 'bg-[#06110D]');
                prevActive.classList.replace('border-[var(--point-color)]', 'border-[#2A3731]');
                prevActive.classList.replace(
                    'shadow-[0_0_10px_rgba(34,197,94,0.1)]',
                    'hover:border-[#11291D]',
                );
                prevActive.classList.add('cursor-pointer');
            }

            // Highlight new item
            const newActive = document.getElementById(`inbox-item-${id}`);
            if (newActive) {
                newActive.classList.replace('bg-[#06110D]', 'bg-[#11291D]');
                newActive.classList.replace('border-[#2A3731]', 'border-[var(--point-color)]');
                newActive.classList.replace(
                    'hover:border-[#11291D]',
                    'shadow-[0_0_10px_rgba(34,197,94,0.1)]',
                );
                newActive.classList.remove('cursor-pointer');
            }

            // Setup top header of detail view
            document.getElementById('approval-view-title').textContent =
                data.name || data.company || '샵 이름 없음';

            let dStr = '-';
            if (data.createdAt) {
                dStr =
                    typeof data.createdAt.toMillis === 'function'
                        ? new Date(data.createdAt.toMillis()).toLocaleString('ko-KR')
                        : new Date(data.createdAt).toLocaleString('ko-KR');
            }
            document.getElementById('approval-view-date').textContent = dStr;

            document.getElementById('approval-id').value = id;
            document.getElementById('approval-userid').textContent = data.userId || '-';
            document.getElementById('approval-name').textContent = data.name || '-';
            document.getElementById('approval-owner').textContent = data.ownerName || '-';
            document.getElementById('approval-phone').textContent = data.phone || '-';
            document.getElementById('approval-biz-type').textContent = data.bizType || '-';
            document.getElementById('approval-biz-no').textContent = data.bizNo || '-';

            const bizImg = document.getElementById('approval-biz-doc');
            const bizImgFail = document.getElementById('approval-biz-doc-fail');
            if (data.bizDocUrl) {
                if (bizImg) {
                    bizImg.src = data.bizDocUrl;
                    bizImg.classList.remove('hidden');
                }
                if (bizImgFail) bizImgFail.classList.add('hidden');
            } else {
                if (bizImg) bizImg.classList.add('hidden');
                if (bizImgFail) bizImgFail.classList.remove('hidden');
            }

            document.getElementById('approval-tags').textContent =
                (data.categories || []).join(', ') || '-';

            const imgPreview = document.getElementById('approval-image-preview');
            const imgText = document.getElementById('approval-image-text');
            const imageUrl = data.imageUrl || data.image;
            if (imageUrl) {
                imgPreview.src = imageUrl;
                imgPreview.classList.remove('hidden');
                if (imgText) imgText.textContent = imageUrl;
            } else {
                imgPreview.classList.add('hidden');
                if (imgText) imgText.textContent = '이미지 없음';
            }

            document.getElementById('approval-catchphrase').textContent = data.catchphrase || '-';
            document.getElementById('approval-address').textContent =
                data.address || data.location || '-';
            document.getElementById('approval-description').textContent =
                data.description || data.desc || '-';
            document.getElementById('approval-hours').textContent =
                data.hours || data.businessHours || data.operatingHours || '-';
            document.getElementById('approval-min-price').textContent =
                data.minPrice || data.price || '-';

            document.getElementById('approval-cat-massage').textContent =
                data.catMassage || data.massage || '-';
            document.getElementById('approval-cat-place').textContent =
                data.catPlace || data.place || '-';
            document.getElementById('approval-cat-age').textContent =
                data.catAge || data.age || '-';
        })
        .catch((err) => {
            alert('정보를 불러오는 중 오류가 발생했습니다: ' + err.message);
        });
}

function approvePartnerFromReview(e) {
    e.preventDefault();
    const id = document.getElementById('approval-id').value;
    if (!id) return;
    const updateData = {
        status: 'active',
        approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    db.collection('partners')
        .doc(id)
        .update(updateData)
        .then(() => {
            // Firebase snapshot will auto trigger list re-render
            // so we just reset the detail view
            resetApprovalDetailView();

            // Let's create an elegant temporary notification
            const notif = document.createElement('div');
            notif.className =
                'fixed top-4 right-4 bg-green-500/90 text-white px-6 py-3 rounded-xl shadow-lg z-50 transform transition-all translate-y-[-20px] opacity-0 flex items-center gap-3 backdrop-blur-sm';
            notif.innerHTML =
                '<i class="fas fa-check-circle"></i> <span class="font-bold">가입 승인 처리가 완료되었습니다.</span>';
            document.body.appendChild(notif);
            setTimeout(() => {
                notif.classList.remove('translate-y-[-20px]', 'opacity-0');
            }, 10);
            setTimeout(() => {
                notif.classList.add('translate-y-[-20px]', 'opacity-0');
                setTimeout(() => notif.remove(), 300);
            }, 3000);
        })
        .catch((err) => {
            alert('승인 처리 중 오류 발생: ' + err.message);
        });
}

function rejectPartnerFromReview() {
    const id = document.getElementById('approval-id').value;
    if (!id) return;
    if (confirm('정말 이 샵을 영구 삭제(반려) 하시겠습니까?')) {
        db.collection('partners')
            .doc(id)
            .delete()
            .then(() => {
                alert('입점 신청이 반려되었습니다.');
                resetApprovalDetailView();
            })
            .catch((err) => alert('삭제 중 오류 발생: ' + err.message));
    }
}

// ═══════════════════════════════════════
// ▶ SHOPS
// ═══════════════════════════════════════

let windowShops = []; // Cache for filtering

function getShopOperationalStatus(shop, now = Date.now()) {
    const status = (shop?.status || '').toLowerCase();
    const expiryTs = Number(shop?.ticketExpiryTimestamp || 0);
    const isExpiredByTicket = !!expiryTs && expiryTs < now;

    if (status === 'pending') return 'pending';
    if (status === 'active' && !isExpiredByTicket) return 'active';
    return 'expired'; // includes ticket expired and sanction/inactive states
}

function refreshShopCategoryButtons(activeStatus = 'all') {
    const targets = [
        ['kpi-filter-total', 'all'],
        ['kpi-filter-active', 'active'],
        ['kpi-filter-expired', 'expired'],
    ];

    targets.forEach(([id, status]) => {
        const el = document.getElementById(id);
        if (!el) return;
        const selected = activeStatus === status;
        el.classList.toggle('ring-2', selected);
        el.classList.toggle('ring-[var(--point-color)]', selected);
        el.classList.toggle('shadow-[0_0_0_1px_rgba(212,175,55,0.25)]', selected);
    });
}

function setShopStatusFilter(status = 'all') {
    const statusSelect = document.getElementById('shop-filter-status');
    if (statusSelect) statusSelect.value = status;
    filterShops();
}
window.setShopStatusFilter = setShopStatusFilter;

function loadShops() {
    const container = document.getElementById('shop-cards-container');
    db.collection('partners').onSnapshot(
        (snapshot) => {
            windowShops = [];
            if (snapshot.empty) {
                container.innerHTML =
                    '<div class="col-span-full py-20 text-center text-[#A7B2AE]">등록된 샵이 없습니다.</div>';
                updateShopKpis();
                return;
            }

            snapshot.forEach((doc) => {
                const data = doc.data();
                data.id = doc.id;
                windowShops.push(data);
            });

            // 최신순 정렬
            windowShops.sort((a, b) => {
                let timeA = 0,
                    timeB = 0;
                if (a.createdAt)
                    timeA =
                        typeof a.createdAt.toMillis === 'function'
                            ? a.createdAt.toMillis()
                            : new Date(a.createdAt).getTime();
                if (b.createdAt)
                    timeB =
                        typeof b.createdAt.toMillis === 'function'
                            ? b.createdAt.toMillis()
                            : new Date(b.createdAt).getTime();
                return timeB - timeA;
            });

            if (windowShops.length === 0) {
                container.innerHTML =
                    '<div class="col-span-full py-20 text-center text-[#A7B2AE]">등록된 샵이 없습니다.</div>';
                updateShopKpis();
                return;
            }

            updateShopKpis();
            filterShops(); // Render initial state based on current filter
        },
        (err) => {
            console.error('loadShops Error: ', err);
            container.innerHTML = `<div class="col-span-full py-20 text-center text-red-400">오류 발생: ${err.message}</div>`;
        },
    );
}

function updateShopKpis() {
    let active = 0,
        expired = 0;

    windowShops.forEach((s) => {
        const opStatus = getShopOperationalStatus(s);
        if (opStatus === 'pending') return;
        if (opStatus === 'active') active++;
        else expired++;
    });

    const elTotal = document.getElementById('kpi-total-shops');
    const elActive = document.getElementById('kpi-active-shops');
    const elExpired = document.getElementById('kpi-expired-shops');

    if (elTotal) elTotal.innerText = active + expired;
    if (elActive) elActive.innerText = active;
    if (elExpired) elExpired.innerText = expired;
}

function filterShops() {
    const searchVal = (document.getElementById('shop-filter-search')?.value || '').toLowerCase();
    const statusVal = document.getElementById('shop-filter-status')?.value || 'all';
    const planVal = document.getElementById('shop-filter-plan')?.value || 'all';
    const container = document.getElementById('shop-cards-container');

    let filtered = windowShops.filter((s) => {
        // 1. Search Query
        const matchSearch =
            (s.name && s.name.toLowerCase().includes(searchVal)) ||
            (s.company && s.company.toLowerCase().includes(searchVal)) ||
            (s.phone && s.phone.includes(searchVal)) ||
            (s.location && s.location.toLowerCase().includes(searchVal)) ||
            (s.address && s.address.toLowerCase().includes(searchVal));
        if (searchVal && !matchSearch) return false;

        // 2. Status check
        const opStatus = getShopOperationalStatus(s);
        // 샵 관리 기본 목록은 승인 완료된 업체 중심(영업중/만료/제재)으로 운영
        if (statusVal === 'all' && opStatus === 'pending') return false;
        if (statusVal !== 'all' && opStatus !== statusVal) return false;

        // 3. Plan check (ticketType matches premium/standard/none roughly)
        const typeStr = (s.ticketType || '').toLowerCase();
        if (planVal === 'premium' && typeStr !== 'premium' && typeStr !== '프리미엄') return false;
        if (
            planVal === 'standard' &&
            typeStr !== 'normal' &&
            typeStr !== '스탠다드' &&
            typeStr !== '기본'
        )
            return false;
        if (planVal === 'none' && typeStr && typeStr !== 'none') return false;

        return true;
    });

    refreshShopCategoryButtons(statusVal);
    renderShopCards(filtered);
}

function renderShopCards(shops) {
    const container = document.getElementById('shop-cards-container');
    if (shops.length === 0) {
        container.innerHTML =
            '<div class="col-span-full py-20 text-center text-[#A7B2AE]">조건에 만족하는 샵이 없습니다.</div>';
        return;
    }

    const now = Date.now();
    let html = '';

    shops.forEach((data) => {
        const displayName = data.name || data.company || '샵 이름 없음';
        let imageUrl =
            data.imageUrl || data.image || 'https://via.placeholder.com/300x200?text=No+Image';
        const dateStr = data.createdAt
            ? typeof data.createdAt.toMillis === 'function'
                ? new Date(data.createdAt.toMillis()).toLocaleDateString('ko-KR')
                : new Date(data.createdAt).toLocaleDateString('ko-KR')
            : '-';

        const opStatus = getShopOperationalStatus(data, now);
        const isExpired = opStatus === 'expired';

        // Determine Badges
        let statusBadge = '';
        if (opStatus === 'pending') {
            statusBadge =
                '<span class="absolute top-3 left-3 bg-yellow-500/90 text-white text-xs font-bold px-2 py-1 rounded shadow">승인 대기</span>';
        } else if (opStatus === 'expired') {
            statusBadge =
                '<span class="absolute top-3 left-3 bg-red-500/90 text-white text-xs font-bold px-2 py-1 rounded shadow">입점권 만료/제재</span>';
        } else {
            statusBadge =
                '<span class="absolute top-3 left-3 bg-green-500/90 text-white text-xs font-bold px-2 py-1 rounded shadow">영업중</span>';
        }

        let planBadge = '';
        const lowerTier = (data.ticketType || data.tier || '').toLowerCase();
        if (lowerTier.includes('premium') || lowerTier.includes('프리미엄')) {
            planBadge =
                '<span class="absolute top-3 right-3 bg-[var(--point-color)] text-white text-xs font-bold px-2 py-1 rounded shadow">Premium</span>';
        } else {
            planBadge =
                '<span class="absolute top-3 right-3 bg-gray-700/90 text-gray-200 text-xs font-bold px-2 py-1 rounded shadow">Standard</span>';
        }

        const ownerName = data.ownerName || '-';
        const signupUserId = data.userId || '-';
        const ticketLabel = data.ticketType || data.ticketPlan || '입점권 없음';
        const ticketStatusText = data.ticketExpiryTimestamp
            ? `${ticketLabel} / 만료 ${new Date(data.ticketExpiryTimestamp).toLocaleDateString('ko-KR')}`
            : `${ticketLabel} / 만료일 없음`;

        html += `
            <div class="bg-[#0A1B13] border border-[#2A3731] rounded-2xl overflow-hidden hover:border-[#3A4741] transition-all flex flex-col shadow-lg relative group" onclick="openShopModal('${data.id}')">
                
                <!-- Card Image Header -->
                <div class="h-32 bg-[#06110D] relative overflow-hidden flex-shrink-0 cursor-pointer">
                    <img src="${imageUrl}" alt="shop" class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity">
                    <div class="absolute inset-0 bg-gradient-to-t from-[#0A1B13] to-transparent"></div>
                    ${statusBadge}
                    ${planBadge}
                </div>

                <!-- Card Body -->
                <div class="p-4 flex flex-col flex-1 cursor-pointer">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="text-lg font-bold text-white truncate max-w-[80%] group-hover:text-[var(--point-color)] transition-colors">${displayName}</h3>
                    </div>
                    
                    <div class="text-xs text-[#A7B2AE] mb-3 flex flex-col gap-1">
                        <div class="flex items-center gap-1.5"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> <span class="truncate">${data.address || data.location || '주소 미등록'}</span></div>
                        <div class="flex items-center gap-1.5"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg> <span>${data.phone || '연락처 미등록'}</span></div>
                        <div class="flex items-center gap-1.5"><span class="text-[#7F8E88]">대표자:</span> <span>${ownerName}</span></div>
                        <div class="flex items-center gap-1.5"><span class="text-[#7F8E88]">가입 ID:</span> <span>${signupUserId}</span></div>
                    </div>

                    <div class="mt-auto pt-3 border-t border-[#2A3731] flex flex-wrap gap-1.5 mb-3">
                        <span class="px-2 py-0.5 bg-[#11291D] border border-[#2A3731] rounded text-[10px] text-[#A7B2AE] whitespace-nowrap">가입: ${dateStr}</span>
                        <span class="px-2 py-0.5 bg-[#11291D] border border-[#2A3731] rounded text-[10px] text-[#A7B2AE] whitespace-nowrap">${ticketStatusText}</span>
                        ${data.ticketExpiryTimestamp ? `<span class="px-2 py-0.5 bg-[#11291D] border ${isExpired ? 'border-red-500/50 text-red-400' : 'border-[#2A3731] text-[#A7B2AE]'} rounded text-[10px] whitespace-nowrap">만료: ${new Date(data.ticketExpiryTimestamp).toLocaleDateString('ko-KR')}</span>` : `<span class="px-2 py-0.5 bg-[#11291D] border border-[#2A3731] rounded text-[10px] text-[#A7B2AE] whitespace-nowrap">기한없음</span>`}
                    </div>
                </div>

                <!-- Footer Quick Actions -->
                <div class="flex border-t border-[#2A3731] p-2 bg-[#06110D] gap-2">
                    <button onclick="event.stopPropagation(); openShopModal('${data.id}')" class="flex-1 py-1.5 bg-[#11291D] hover:bg-[#183928] text-[#A7B2AE] hover:text-white rounded-lg text-sm transition-colors border border-[#2A3731]">상세/수정</button>
                    <button onclick="event.stopPropagation(); cancelPartnerApproval('${data.id}')" class="flex-1 py-1.5 bg-[#2A1515] hover:bg-[#3B1D1D] text-[#FCA5A5] hover:text-white rounded-lg text-sm transition-colors border border-red-900/40">승인취소</button>
                    <button onclick="event.stopPropagation(); deleteShop('${data.id}')" class="flex-1 py-1.5 bg-[#2A1515] hover:bg-red-900/40 text-red-400 hover:text-white rounded-lg text-sm transition-colors border border-red-900/40">계정삭제</button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function buildShopCategoryCheckboxes(selected = []) {
    const cbContainer = document.getElementById('shop-category-checkboxes');
    if (!cbContainer) return;
    cbContainer.innerHTML = '';
    categoriesList.forEach((cat) => {
        const checked = selected.includes(cat.name) ? 'checked' : '';
        cbContainer.innerHTML += `
            <label class="inline-flex items-center gap-1.5 bg-[#11291D] px-3 py-1.5 rounded-lg border border-[#2A3731] cursor-pointer hover:bg-[#183928] transition-colors">
                <input type="checkbox" value="${cat.name}" ${checked} class="shop-cat-checkbox w-4 h-4 text-[var(--point-color)] bg-[#06110D] border-[#2A3731]">
                <span class="text-sm text-white/90">${cat.name}</span>
            </label>
        `;
    });
}

async function openShopModal(partnerId = '') {
    document.getElementById('shop-form').reset();
    document.getElementById('shop-id').value = '';
    const titleEl = document.getElementById('shop-modal-title');
    buildShopCategoryCheckboxes([]);

    if (partnerId) {
        try {
            const doc = await db.collection('partners').doc(partnerId).get();
            if (doc.exists) {
                const data = doc.data() || {};
                if (titleEl) titleEl.textContent = '마사지 샵 운영 정보 상세/수정';
                document.getElementById('shop-id').value = doc.id;
                document.getElementById('shop-name').value = data.name || data.company || '';
                document.getElementById('shop-location').value = data.location || data.address || '';
                document.getElementById('shop-image').value = data.image || data.imageUrl || '';
                document.getElementById('shop-tags').value = Array.isArray(data.tags)
                    ? data.tags.join(', ')
                    : '';
                buildShopCategoryCheckboxes(Array.isArray(data.categories) ? data.categories : []);
            }
        } catch (err) {
            alert('샵 상세 정보를 불러오지 못했습니다: ' + err.message);
            return;
        }
    } else if (titleEl) {
        titleEl.textContent = '마사지 샵 데이터 등록/수정';
    }

    openModal('modal-shop');
}

function handleShopSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('shop-id').value;
    const name = document.getElementById('shop-name').value.trim();
    const location = document.getElementById('shop-location').value.trim();
    const image = document.getElementById('shop-image').value.trim();
    const tagsRaw = document.getElementById('shop-tags').value;

    const tags = tagsRaw
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t);
    const checkedCats = Array.from(document.querySelectorAll('.shop-cat-checkbox:checked')).map(
        (cb) => cb.value,
    );

    const data = { name, location, image, tags, categories: checkedCats };

    if (id) {
        data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        db.collection('partners')
            .doc(id)
            .update(data)
            .then(() => closeModal('modal-shop'))
            .catch((err) => alert('기존 매장 수정 오류: ' + err.message));
    } else {
        data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        data.status = 'pending'; // Admin adds partner as pending to show in approval list
        db.collection('partners')
            .add(data)
            .then(() => closeModal('modal-shop'))
            .catch((err) => alert('신규 매장 추가 오류: ' + err.message));
    }
}

function activatePartner(id) {
    if (confirm('이 파트너의 가입을 승인하여 앱에 노출하시겠습니까?')) {
        db.collection('partners').doc(id).update({ status: 'active' });
    }
}

function cancelPartnerApproval(id) {
    if (!id) return;
    if (!confirm('이 업체의 가입 승인을 취소하시겠습니까? (승인 대기로 전환)')) return;
    db.collection('partners')
        .doc(id)
        .update({
            status: 'pending',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        })
        .then(() => {
            alert('승인 취소 처리되었습니다. 제휴 파트너 승인 탭에서 다시 심사할 수 있습니다.');
        })
        .catch((err) => alert('승인 취소 중 오류 발생: ' + err.message));
}

function deleteShop(id) {
    if (
        confirm(
            '이 샵을 데이터베이스에서 영구 삭제하시겠습니까?\n동기화된 앱에서도 즉시 지도 목록 및 메뉴에서 삭제됩니다.',
        )
    ) {
        db.collection('partners').doc(id).delete();
    }
}

async function uploadShopImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    const progressEl = document.getElementById('shop-image-progress');
    progressEl.innerText = '업로드 중... 잠시만 기다려주세요.';
    progressEl.classList.remove('hidden');

    try {
        const fileRef = firebase.storage().ref('shop_images/' + Date.now() + '_' + file.name);
        const snapshot = await fileRef.put(file);
        const downloadUrl = await snapshot.ref.getDownloadURL();
        document.getElementById('shop-image').value = downloadUrl;
        progressEl.innerText = '✅ 업로드 완료!';
    } catch (err) {
        console.error(err);
        progressEl.innerText = '업로드 실패: ' + err.message;
    }
}

// ─── Dummy Data Generator ───
async function deleteAllPartners() {
    if (
        !confirm(
            '진짜로 모든 파트너 데이터를 초기화(삭제) 하시겠습니까? 이 작업은 복구할 수 없습니다.',
        )
    )
        return;
    try {
        // 네트워크 상태와 무관하게 확실한 최신 데이터를 가져옵니다.
        const snapshot = await db.collection('partners').get({ source: 'server' });
        const reviewSnapshot = await db.collection('reviews').get({ source: 'server' });

        if (snapshot.empty && reviewSnapshot.empty) {
            alert('삭제할 파트너 또는 리뷰 데이터가 없습니다.');
            return;
        }

        // Firestore batch 사용 (한 번에 500개 제한 등 안정적 처리)
        // 만약 500개가 넘는다면 분할이 필요하지만, 여기서는 더미 규모이므로 batch 하나로 처리
        let deletedCount = 0;
        let batchIndex = 0;
        let batch = db.batch();
        let commitPromises = [];

        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
            deletedCount++;
            batchIndex++;
            if (batchIndex === 500) {
                commitPromises.push(batch.commit());
                batch = db.batch();
                batchIndex = 0;
            }
        });

        reviewSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
            batchIndex++;
            if (batchIndex === 500) {
                commitPromises.push(batch.commit());
                batch = db.batch();
                batchIndex = 0;
            }
        });

        if (batchIndex > 0) {
            commitPromises.push(batch.commit());
        }

        await Promise.all(commitPromises);

        alert(`총 ${deletedCount}개의 파트너(및 소속 리뷰들)가 성공적으로 완벽히 삭제되었습니다.`);
    } catch (err) {
        console.error('삭제 중 오류:', err);
        alert('삭제 실패: ' + err.message);
    }
}

async function generateDummyPartners() {
    if (
        !confirm(
            '이전의 테스트용 50개 임의(Mock) 파트너 데이터를 어드민(Firebase)에 등록하시겠습니까? (기존 데이터는 삭제되지 않으며 랜덤 50개가 추가로 생성됩니다)',
        )
    )
        return;

    // 지역별 시/구 데이터
    const RegionData = [
        {
            prov: '서울',
            cities: [
                '강남/서초',
                '송파/강동',
                '영등포/구로/금천',
                '강서/양천',
                '마포/서대문/은평',
                '용산/중구/종로',
                '성동/광진',
                '동대문/중랑',
                '노원/도봉/강북',
            ],
        },
        {
            prov: '경기',
            cities: [
                '수원',
                '성남(분당)',
                '고양(일산)',
                '용인',
                '부천',
                '안산',
                '안양/과천',
                '화성(동탄)',
                '평택',
                '의정부',
                '파주',
                '시흥',
                '김포',
                '광명',
                '광주',
                '구리/남양주',
            ],
        },
        {
            prov: '인천',
            cities: ['부평/계양', '남동(구월)', '연수(송도)', '서구(청라)', '중구/동구'],
        },
        { prov: '충청', cities: ['세종', '천안', '아산', '청주', '충주', '서산/당진', '제천'] },
        { prov: '대전', cities: ['둔산/서구', '유성', '중구/동구', '대덕'] },
        { prov: '강원', cities: ['춘천', '원주', '강릉', '속초/동해'] },
        { prov: '전라', cities: ['전주', '익산', '군산', '목포', '여수', '순천'] },
        { prov: '광주', cities: ['상무/서구', '수완/광산', '남구/북구', '동구'] },
        { prov: '경상', cities: ['창원', '김해', '진주', '포항', '구미', '경주'] },
        {
            prov: '부산',
            cities: ['해운대/수영', '서면/진구', '동래/연제', '남구/북구', '사하/사상'],
        },
        { prov: '제주', cities: ['제주시', '서귀포시'] },
    ];
    let validRegions = [];
    RegionData.forEach((g) => {
        g.cities.forEach((c) => {
            validRegions.push(g.prov + ' ' + c);
        });
    });

    const dbMassage = ['스웨디시', '스포츠 마사지', '타이 마사지', '커플마사지'];
    const dbPlace = ['방문 (홈케어/출장)', '1인샵 (매장 방문)', '다인샵 (일반 매장)'];
    // For Place tag display conformity
    const dbPlaceShort = ['홈케어/출장', '1인샵 (매장)', '다인샵 (일반)'];
    const dbAge = ['20대 초반', '20대 중후반', '30대 초반', '30대 중후반', '40대'];

    const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const dummyPartners = [];

    // 조건 배열들을 인덱스(count)에 따라 순차적으로 뽑으면
    // 배열 길이가 4, 3, 5로 서로소이기 때문에 60번까지 완전히 다른 조합이 나옵니다.
    let count = 0;

    // 초이스 파트너 20개
    for (let i = 1; i <= 20; i++) {
        let rRegion = validRegions[count % validRegions.length];
        let rMassage = dbMassage[count % dbMassage.length];
        let rPlaceIdx = count % dbPlace.length;
        let rPlaceFull = dbPlace[rPlaceIdx];
        let rPlaceShort = dbPlaceShort[rPlaceIdx];
        let rAge = dbAge[count % dbAge.length];

        dummyPartners.push({
            name: `아르테미스 라운지 ${i}호점`,
            location: rRegion,
            address: rRegion,
            phone: `010-1234-${(1000 + i).toString()}`,
            image: `https://picsum.photos/seed/dadok_choice_${i}/400/400`,
            status: 'active',
            price: 100000 + Math.floor(Math.random() * 5) * 10000,
            rating: parseFloat((Math.random() * 0.5 + 4.5).toFixed(1)),
            reviews: Math.floor(Math.random() * 80) + 12,

            // script.js 동기화를 위한 추가 필드
            region: rRegion,
            massage: rMassage,
            place: rPlaceShort,
            age: rAge,

            categories: [rMassage, rPlaceFull, rAge],
            tier: i % 2 === 0 ? 'VIP' : 'Premium',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        count++;
    }

    // 추천 파트너 30개
    for (let i = 1; i <= 30; i++) {
        let rRegion = validRegions[count % validRegions.length];
        let rMassage = dbMassage[count % dbMassage.length];
        let rPlaceIdx = count % dbPlace.length;
        let rPlaceFull = dbPlace[rPlaceIdx];
        let rPlaceShort = dbPlaceShort[rPlaceIdx];
        let rAge = dbAge[count % dbAge.length];

        dummyPartners.push({
            name: `프리미엄 파트너 ${i}호점`,
            location: rRegion,
            address: rRegion,
            phone: `010-9876-${(1000 + i).toString()}`,
            image: `https://picsum.photos/seed/dadok_rec_${i}/400/400`,
            status: 'active',
            price: 80000 + Math.floor(Math.random() * 5) * 10000,
            rating: parseFloat((Math.random() * 0.5 + 4.5).toFixed(1)),
            reviews: Math.floor(Math.random() * 80) + 12,

            // script.js 동기화를 위한 추가 필드
            region: rRegion,
            massage: rMassage,
            place: rPlaceShort,
            age: rAge,

            categories: [rMassage, rPlaceFull, rAge],
            tier: 'Normal',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        count++;
    }

    try {
        let count = 0;
        const progressEl = document.getElementById('discord-log');
        if (progressEl) {
            progressEl.innerText = '데이터 50건을 생성 중... (조금만 대기해주세요)';
            progressEl.classList.remove('text-gray-500');
            progressEl.classList.add('text-green-400');
        }

        const batchSize = 10;
        for (let i = 0; i < dummyPartners.length; i += batchSize) {
            const batch = db.batch();
            const slice = dummyPartners.slice(i, i + batchSize);

            slice.forEach((p) => {
                const docRef = db.collection('partners').doc();
                batch.set(docRef, p);

                const reviewRef = db.collection('reviews').doc();
                batch.set(reviewRef, {
                    partnerId: docRef.id,
                    rating: 5,
                    text: '정말 친절하고 실력이 뛰어납니다. 강력 추천해요!',
                    date: '2026.04.10',
                    author: 'jo*****',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                });
                count++;
            });
            await batch.commit();
        }

        if (progressEl) {
            progressEl.innerText = '대기 중...';
            progressEl.classList.add('text-gray-500');
            progressEl.classList.remove('text-green-400');
        }
        alert(`성공적으로 ${count}개의 더미 파트너와 리뷰가 실제 DB에 생성되었습니다!`);
    } catch (e) {
        console.error(e);
        alert('데이터 생성 중 오류가 발생했습니다: ' + e.message);
    }
}

// 디스코드 Discord Webhook testing (시뮬레이션)
function testDiscordWebhook() {
    const logBox = document.getElementById('discord-log');
    logBox.innerText = `[전송 테스트] 웹훅 테스트 URL이 현재 미입력되어 디스플레이 변경으로 작동합니다. (에러 전송 완료 모방)`;
    logBox.classList.add('text-green-400');
    setTimeout(() => {
        logBox.innerText = '대기 중...';
        logBox.classList.remove('text-green-400');
    }, 2500);
}

// 입점권 남은시간 실시간 카운트다운 로직
setInterval(() => {
    document.querySelectorAll('.countdown-timer').forEach((el) => {
        const expiry = parseInt(el.getAttribute('data-expiry'));
        if (!expiry) return;
        const diff = expiry - Date.now();
        if (diff > 0) {
            const d = Math.floor(diff / (1000 * 60 * 60 * 24));
            const h = String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, '0');
            const m = String(Math.floor((diff / 1000 / 60) % 60)).padStart(2, '0');
            const s = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');
            el.innerHTML = `남은 시간: <span class="font-bold text-white">${d}</span>일 ${h}:${m}:${s}`;
            el.className =
                'countdown-timer text-[11px] font-mono mt-1 border border-green-500/30 bg-[#06110D] text-green-400 px-2 py-0.5 rounded inline-block';
        } else {
            el.innerHTML = '⚠️ 입점권 시간 만료';
            el.className =
                'countdown-timer text-[11px] font-mono mt-1 border border-red-500/30 bg-red-500/10 text-red-400 px-2 py-0.5 rounded inline-block';
        }
    });
}, 1000);

// ═══════════════════════════════════════
// ▶ SUBSCRIPTIONS & MANUAL ADJUSTMENT
// ═══════════════════════════════════════

function switchSubTab(tabId) {
    document.querySelectorAll('.sub-tab-content').forEach((el) => el.classList.add('hidden'));
    document.querySelectorAll('.sub-tab-btn').forEach((el) => {
        el.classList.remove('text-[var(--point-color)]', 'border-[var(--point-color)]');
        el.classList.add('text-[#A7B2AE]', 'border-transparent');
    });

    document.getElementById(tabId).classList.remove('hidden');
    const btn = document.querySelector(`.sub-tab-btn[onclick="switchSubTab('${tabId}')"]`);
    if (btn) {
        btn.classList.remove('text-[#A7B2AE]', 'border-transparent');
        btn.classList.add('text-[var(--point-color)]', 'border-[var(--point-color)]');
    }
}

// ════════════ REALTME SUBSCRIPTION REQUESTS ════════════
let currentSubRequestStatus = 'pending';
let unsubscribeSubRequests = null;

function refreshSubRequestFilterButtons(active = 'pending') {
    const targets = [
        ['sub-req-filter-total', 'all'],
        ['sub-req-filter-pending', 'pending'],
        ['sub-req-filter-completed', 'completed'],
        ['sub-req-filter-rejected', 'rejected'],
    ];
    targets.forEach(([id, key]) => {
        const el = document.getElementById(id);
        if (!el) return;
        const selected = key === active;
        el.classList.toggle('ring-2', selected);
        el.classList.toggle('ring-[var(--point-color)]', selected);
        el.classList.toggle('shadow-[0_0_0_1px_rgba(212,175,55,0.2)]', selected);
    });
}

function normalizeSubRequestStatus(rawStatus) {
    const s = String(rawStatus || '').trim().toLowerCase();
    if (!s || s === 'pending' || s === 'requested' || s === 'request' || s === 'waiting') {
        return 'pending';
    }
    if (s === 'completed' || s === 'approved' || s === 'done' || s === 'success') {
        return 'completed';
    }
    if (s === 'rejected' || s === 'denied' || s === 'hold' || s === 'cancelled') {
        return 'rejected';
    }
    return 'completed';
}

function updateSubscriptionRequestCounters(rows = []) {
    let pending = 0;
    let completed = 0;
    let rejected = 0;
    rows.forEach((r) => {
        const status = normalizeSubRequestStatus(r.status);
        if (status === 'pending') pending++;
        else if (status === 'completed') completed++;
        else if (status === 'rejected') rejected++;
    });
    const total = rows.length;

    const elTotal = document.getElementById('sub-req-count-total');
    const elPending = document.getElementById('sub-req-count-pending');
    const elCompleted = document.getElementById('sub-req-count-completed');
    const elRejected = document.getElementById('sub-req-count-rejected');
    if (elTotal) elTotal.innerText = String(total);
    if (elPending) elPending.innerText = String(pending);
    if (elCompleted) elCompleted.innerText = String(completed);
    if (elRejected) elRejected.innerText = String(rejected);
}

function formatSubDateTime(value) {
    if (!value) return '-';
    let dateObj = null;
    if (typeof value.toDate === 'function') dateObj = value.toDate();
    else if (typeof value.toMillis === 'function') dateObj = new Date(value.toMillis());
    else if (typeof value === 'number') dateObj = new Date(value);
    else dateObj = new Date(value);
    if (!dateObj || Number.isNaN(dateObj.getTime())) return '-';
    return `${dateObj.getFullYear().toString().slice(-2)}.${String(dateObj.getMonth() + 1).padStart(2, '0')}.${String(dateObj.getDate()).padStart(2, '0')} ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
}

window.switchSubRequestTab = function (status) {
    const tabPending = document.getElementById('sub-req-tab-pending');
    const tabCompleted = document.getElementById('sub-req-tab-completed');

    if (tabPending && tabCompleted) {
        tabPending.classList.remove(
            'text-[var(--point-color)]',
            'border-[var(--point-color)]',
            'text-[#A7B2AE]',
            'border-transparent',
        );
        tabCompleted.classList.remove(
            'text-[var(--point-color)]',
            'border-[var(--point-color)]',
            'text-[#A7B2AE]',
            'border-transparent',
        );

        if (status === 'pending') {
            tabPending.classList.add('text-[var(--point-color)]', 'border-[var(--point-color)]');
            tabCompleted.classList.add('text-[#A7B2AE]', 'border-transparent');
        } else {
            tabCompleted.classList.add('text-[var(--point-color)]', 'border-[var(--point-color)]');
            tabPending.classList.add('text-[#A7B2AE]', 'border-transparent');
        }
    }

    currentSubRequestStatus = status === 'pending' ? 'pending' : 'all_done';
    refreshSubRequestFilterButtons(currentSubRequestStatus);
    window.loadSubscriptionRequests();
};

window.setSubRequestFilter = function (status) {
    currentSubRequestStatus = status;
    const tabPending = document.getElementById('sub-req-tab-pending');
    const tabCompleted = document.getElementById('sub-req-tab-completed');
    if (tabPending && tabCompleted) {
        tabPending.classList.remove('text-[var(--point-color)]', 'border-[var(--point-color)]');
        tabPending.classList.add('text-[#A7B2AE]', 'border-transparent');
        tabCompleted.classList.remove('text-[var(--point-color)]', 'border-[var(--point-color)]');
        tabCompleted.classList.add('text-[#A7B2AE]', 'border-transparent');

        if (status === 'pending') {
            tabPending.classList.add('text-[var(--point-color)]', 'border-[var(--point-color)]');
            tabPending.classList.remove('text-[#A7B2AE]', 'border-transparent');
        } else {
            tabCompleted.classList.add('text-[var(--point-color)]', 'border-[var(--point-color)]');
            tabCompleted.classList.remove('text-[#A7B2AE]', 'border-transparent');
        }
    }
    refreshSubRequestFilterButtons(status);
    window.loadSubscriptionRequests();
};

window.loadSubscriptionRequests = function () {
    const tbody = document.getElementById('sub-requests-table-body');
    if (!tbody) return;
    refreshSubRequestFilterButtons(currentSubRequestStatus);

    if (unsubscribeSubRequests) {
        unsubscribeSubRequests();
    }

    tbody.innerHTML =
        '<tr><td colspan="5" class="p-8 text-center text-[#A7B2AE]">로딩 중...</td></tr>';

    // createdAt 누락/지연으로 인해 orderBy 쿼리에서 빠지는 케이스를 방지하기 위해
    // 전체를 받아 메모리에서 정렬/필터링한다.
    unsubscribeSubRequests = db
        .collection('subscription_requests')
        .onSnapshot(
            (snapshot) => {
                let allRows = [];
                snapshot.forEach((doc) => {
                    const data = { ...doc.data(), id: doc.id };
                    allRows.push(data);
                });

                updateSubscriptionRequestCounters(allRows);

                let matches = [];
                allRows.forEach((data) => {
                    const normalizedStatus = normalizeSubRequestStatus(data.status);
                    const row = { ...data, normalizedStatus };
                    if (currentSubRequestStatus === 'pending') {
                        if (normalizedStatus === 'pending') matches.push(row);
                    } else if (currentSubRequestStatus === 'completed') {
                        if (normalizedStatus === 'completed') matches.push(row);
                    } else if (currentSubRequestStatus === 'rejected') {
                        if (normalizedStatus === 'rejected') matches.push(row);
                    } else if (currentSubRequestStatus === 'all') {
                        matches.push(row);
                    } else {
                        if (normalizedStatus !== 'pending') matches.push(row);
                    }
                });

                matches.sort((a, b) => {
                    const getTs = (x) => {
                        if (x?.createdAt && typeof x.createdAt.toMillis === 'function') return x.createdAt.toMillis();
                        if (x?.updatedAt && typeof x.updatedAt.toMillis === 'function') return x.updatedAt.toMillis();
                        if (x?.completedAt && typeof x.completedAt.toMillis === 'function') return x.completedAt.toMillis();
                        return 0;
                    };
                    return getTs(b) - getTs(a);
                });

                if (matches.length === 0) {
                    const emptyMsgMap = {
                        pending: '현재 입금 대기 중인 신청 건이 없습니다.',
                        completed: '처리 완료 내역이 없습니다.',
                        rejected: '반려 내역이 없습니다.',
                        all: '신청 내역이 없습니다.',
                        all_done: '처리 완료/반려 내역이 없습니다.'
                    };
                    tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-[#A7B2AE]">${emptyMsgMap[currentSubRequestStatus] || '신청 내역이 없습니다.'}</td></tr>`;
                    return;
                }

                let html = '';
                matches.forEach((data) => {
                    const reqId = data.id;
                    const dStr = formatSubDateTime(data.createdAt);
                    const completedStr = formatSubDateTime(data.completedAt || data.updatedAt);

                    let btnHtml = '';
                    if (data.normalizedStatus === 'pending') {
                        btnHtml = `
                    <div class="flex flex-col gap-1.5 items-end justify-center h-full">
                        <button onclick="approveSubscriptionRequest('${reqId}', '${data.partnerId}', ${data.months}, '${data.companyName}')" class="px-3 py-1.5 bg-[#11291D] hover:bg-[var(--point-color)] hover:text-black text-[var(--point-color)] border border-[var(--point-color)] rounded-lg text-xs font-bold transition-colors w-[150px] shadow-md relative overflow-hidden group">
                           <span class="relative z-10 flex items-center justify-center gap-1"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>입금확인 • 즉시승인</span>
                           <div class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                        </button>
                        <button onclick="rejectSubscriptionRequest('${reqId}', '${data.companyName}')" class="px-3 py-1 bg-[#0A1B13] hover:bg-black text-[#A7B2AE] hover:text-red-400 border border-[#2A3731] hover:border-red-900 rounded-lg text-[11px] transition-colors w-[150px]">보류 / 반려</button>
                    </div>`;
                    } else if (data.normalizedStatus === 'completed') {
                        btnHtml = `<div class="inline-flex flex-col items-end gap-1">
                            <span class="bg-[#11291D] text-green-400 border border-green-900/50 px-2.5 py-1 rounded-md text-xs font-bold">🟢 승인 완료</span>
                            <span class="text-[10px] text-[#A7B2AE]">처리: ${completedStr}</span>
                        </div>`;
                    } else {
                        btnHtml = `<div class="inline-flex flex-col items-end gap-1">
                            <span class="bg-[#0A1B13] text-red-400 border border-[#2A3731] px-2.5 py-1 rounded-md text-xs">🔴 반려됨<br><span class="text-[9px] text-[#A7B2AE] font-normal tracking-tighter block mt-0.5 max-w-[80px] break-keep truncate" title="${data.rejectReason || ''}">${data.rejectReason || ''}</span></span>
                            <span class="text-[10px] text-[#A7B2AE]">처리: ${completedStr}</span>
                        </div>`;
                    }

                    html += `
                <tr class="hover:bg-[#11291D]/40 transition-colors">
                    <td class="p-4 align-middle text-[#A7B2AE] font-mono text-xs">${dStr}</td>
                    <td class="p-4 align-middle">
                        <div class="font-bold text-white text-[14px]">${data.companyName || '상호명 없음'}</div>
                        <div class="text-[11px] text-[#A7B2AE] mt-0.5 truncate max-w-[120px]">${data.partnerId || ''}</div>
                    </td>
                    <td class="p-4 align-middle text-[var(--point-color)] font-bold text-sm">🎫 ${data.months}개월 입점권</td>
                    <td class="p-4 align-middle">
                        <div class="text-[13px] text-white flex items-center gap-2">
                           <span class="bg-blue-900/40 text-blue-300 border border-blue-800/60 px-1.5 py-0.5 rounded text-[10px] font-bold">입금인</span>
                           ${data.depositorName || '-'} 
                           <span class="text-[var(--point-color)] font-bold ml-1">${(data.amount || 0).toLocaleString()}원</span>
                        </div>
                        ${data.message ? `<div class="text-[11px] text-[#A7B2AE] mt-1.5 bg-[#06110D] p-1.5 rounded border border-[#2A3731] max-w-[200px] truncate" title="${data.message}">💬 ${data.message}</div>` : ''}
                    </td>
                    <td class="p-3 align-middle text-right">${btnHtml}</td>
                </tr>`;
                });
                tbody.innerHTML = html;
            },
            (err) => {
                console.error('Error loading sub requests: ', err);
                updateSubscriptionRequestCounters([]);
                tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-red-400">신청 현황 로드 실패: ${err.message}</td></tr>`;
            },
        );
};

window.approveSubscriptionRequest = async function (reqId, partnerId, addMonths, companyName) {
    try {
        if (
            !confirm(
                `[${companyName}] 업체의 입금(결제) 사실을 확인하셨나요?\n승인 시 자동으로 입점권이 ${addMonths}개월 연장됩니다.`,
            )
        )
            return;

        // Fetch partner details
        const partnerRef = db.collection('partners').doc(partnerId);
        const docSnap = await partnerRef.get();
        if (!docSnap.exists) {
            alert('파트너 정보를 찾을 수 없습니다 (삭제된 업체일 수 있습니다).');
            return;
        }

        const currentData = docSnap.data();
        const now = Date.now();
        let baseTime = now;

        // If current expiry exists and is in the future, add to it. Otherwise, add from NOW.
        if (currentData.ticketExpiryTimestamp && currentData.ticketExpiryTimestamp > now) {
            baseTime = currentData.ticketExpiryTimestamp;
        }

        // Add requested months
        const newDate = new Date(baseTime);
        newDate.setMonth(newDate.getMonth() + addMonths);
        const newExpiryStr = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-${String(newDate.getDate()).padStart(2, '0')}`;

        // 1. Update partner expiry
        await partnerRef.update({
            ticketExpiryTimestamp: newDate.getTime(),
            ticketExpiry: newExpiryStr,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        // 2. Mark request as completed
        await db.collection('subscription_requests').doc(reqId).update({
            status: 'completed',
            completedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            approvedBy: auth.currentUser?.email || 'admin',
            approvedMonths: Number(addMonths) || 0,
            approvedExpiryTimestamp: newDate.getTime(),
            approvedExpiryDate: newExpiryStr
        });

        alert(
            `✅ [${companyName}] 스마트 승인 완료!\n종료 날짜가 ${newExpiryStr} 로 연장되었습니다.`,
        );
    } catch (err) {
        console.error('Error approving subscription request', err);
        alert('승인 중 오류가 발생했습니다: ' + err.message);
    }
};

window.rejectSubscriptionRequest = async function (reqId, companyName) {
    try {
        const reason = prompt(
            `[${companyName}] 업체의 입점권 신청을 보류/반려 처리합니다.\n반려 사유(예: 입금 금액 불일치 등)를 적어주세요.`,
        );
        if (reason === null) return; // User cancelled

        await db.collection('subscription_requests').doc(reqId).update({
            status: 'rejected',
            rejectReason: reason,
            completedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            rejectedBy: auth.currentUser?.email || 'admin'
        });

        alert(`🔴 반려 처리되었습니다.\n사유: ${reason}`);
    } catch (err) {
        console.error('Error rejecting sub request', err);
        alert('처리 중 오류 발생: ' + err.message);
    }
};

function loadSubscriptionUsage() {
    const tbody = document.getElementById('sub-usage-table-body');
    if (!tbody) return;
    db.collection('partners')
        .where('status', '==', 'active')
        .onSnapshot((snapshot) => {
            tbody.innerHTML = '';
            if (snapshot.empty) {
                tbody.innerHTML =
                    '<tr><td colspan="4" class="p-4 text-center">활성 상태인 파트너가 없습니다.</td></tr>';
                return;
            }
            let docs = [];
            snapshot.forEach((doc) => docs.push(doc));
            // 남은 시간이 적은 순서대로 정렬 추가
            docs.sort(
                (a, b) =>
                    (a.data().ticketExpiryTimestamp || Infinity) -
                    (b.data().ticketExpiryTimestamp || Infinity),
            );

            docs.forEach((doc) => {
                const data = doc.data();
                const displayName = data.name || data.company || '이름 없음';
                const tierStr = data.ticketType || data.tier || '기본 입점';

                let expiryHtml = '<span class="text-[#A7B2AE]">만료일 미지정</span>';
                if (data.ticketExpiryTimestamp) {
                    const expiryDate = new Date(data.ticketExpiryTimestamp);
                    const expiryLabel = `${String(expiryDate.getMonth() + 1).padStart(2, '0')}/${String(expiryDate.getDate()).padStart(2, '0')} ${String(expiryDate.getHours()).padStart(2, '0')}:${String(expiryDate.getMinutes()).padStart(2, '0')}`;
                    expiryHtml = `
                        <div class="flex flex-col gap-1">
                            <div class="countdown-timer text-[11px] font-mono border border-[#2A3731] bg-[#06110D] text-[#A7B2AE] px-2 py-0.5 rounded inline-block" data-expiry="${data.ticketExpiryTimestamp}">계산중...</div>
                            <span class="text-[11px] text-[#A7B2AE]">만료 예정: ${expiryLabel}</span>
                        </div>
                    `;
                } else if (data.ticketExpiry) {
                    expiryHtml = `<span class="text-white">${data.ticketExpiry} 만료</span>`;
                }

                tbody.innerHTML += `
                <tr class="hover:bg-[#11291D] transition-colors">
                    <td class="p-4">
                        <div class="font-bold text-white">${displayName}</div>
                        <div class="text-xs text-[#A7B2AE] mt-0.5">${data.userId || '-'}</div>
                    </td>
                    <td class="p-4 text-[var(--point-color)] font-medium">${tierStr}</td>
                    <td class="p-4">${expiryHtml}</td>
                    <td class="p-4">
                        <button onclick="openManualSubscriptionModalWithTarget('${doc.id}', '${displayName}')" class="px-3 py-1.5 bg-[#11291D] hover:bg-[#183928] text-white border border-[#2A3731] rounded-lg text-sm transition-colors cursor-pointer">상태 변경</button>
                    </td>
                </tr>
            `;
            });
        });
}

let selectedSubTargets = [];
let manualSubPartners = [];

function setManualSubListToggleLabel() {
    const btn = document.getElementById('manual-sub-list-toggle-btn');
    const results = document.getElementById('manual-sub-search-results');
    if (!btn || !results) return;
    btn.innerText = results.classList.contains('hidden') ? '목록 열기' : '목록 닫기';
}

function toggleManualSubSearchList() {
    const input = document.getElementById('manual-sub-search');
    const results = document.getElementById('manual-sub-search-results');
    if (!input || !results) return;

    if (results.classList.contains('hidden')) {
        searchPartnersForSub(input.value || '');
    } else {
        results.classList.add('hidden');
        setManualSubListToggleLabel();
    }
}

async function loadManualSubPartners() {
    const resContainer = document.getElementById('manual-sub-search-results');
    if (resContainer) {
        resContainer.innerHTML =
            '<div class="px-4 py-3 text-sm text-[#A7B2AE] text-center">업체 목록을 불러오는 중...</div>';
        resContainer.classList.remove('hidden');
        setManualSubListToggleLabel();
    }

    try {
        const snapshot = await db.collection('partners').get({ source: 'server' });
        manualSubPartners = [];

        snapshot.forEach((doc) => {
            const data = doc.data() || {};
            manualSubPartners.push({ id: doc.id, ...data });
        });

        manualSubPartners.sort((a, b) => {
            const nameA = (a.name || a.company || '').toString().trim();
            const nameB = (b.name || b.company || '').toString().trim();
            return nameA.localeCompare(nameB, 'ko');
        });
    } catch (err) {
        console.error('manual sub partners load error:', err);
        manualSubPartners = [];
        if (resContainer) {
            resContainer.innerHTML = `<div class="px-4 py-3 text-sm text-red-400 text-center">업체 목록 로드 실패: ${err.message}</div>`;
            resContainer.classList.remove('hidden');
            setManualSubListToggleLabel();
        }
    }
}

function openManualSubscriptionModal() {
    selectedSubTargets = [];
    renderSubTargets();
    document.getElementById('manual-sub-search').value = '';
    document.getElementById('manual-sub-search-results').classList.add('hidden');
    setManualSubListToggleLabel();
    document.getElementById('manual-sub-form').reset();
    toggleManualSubInput('add');
    toggleManualSubMemo('reward_event');
    openModal('modal-manual-sub');
    loadManualSubPartners().then(() => {
        searchPartnersForSub('');
    });
}

function openManualSubscriptionModalWithTarget(id, name) {
    selectedSubTargets = [{ id, name }];
    renderSubTargets();
    document.getElementById('manual-sub-search').value = '';
    document.getElementById('manual-sub-search-results').classList.add('hidden');
    setManualSubListToggleLabel();
    document.getElementById('manual-sub-form').reset();
    toggleManualSubInput('add');
    toggleManualSubMemo('reward_event');
    openModal('modal-manual-sub');
    loadManualSubPartners().then(() => {
        searchPartnersForSub('');
    });
}

function searchPartnersForSub(query) {
    const resContainer = document.getElementById('manual-sub-search-results');

    // 수동조정 모달은 탭 상태와 무관하게 로드한 전체 파트너 목록을 사용
    const sourcePartners = manualSubPartners.length > 0 ? manualSubPartners : windowShops;

    let matches = [];
    sourcePartners.forEach((data) => {
        const n = data.name || data.company || '';
        const p = data.phone || data.managerPhone || '';

        let plan =
            data.ticketPlan === 'premium'
                ? '프리미엄'
                : data.ticketPlan === 'standard'
                  ? '스탠다드'
                  : '입점권 없음(무료)';
        let expiry = data.ticketExpiryTimestamp || 0;
        let remainStr = '';
        if (expiry > Date.now()) {
            let diff = expiry - Date.now();
            let days = Math.floor(diff / (1000 * 60 * 60 * 24));
            let hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            remainStr = `잔여 ${days}일 ${hours}시간`;
        } else {
            remainStr = '만료/미이용';
        }

        const q = (query || '').trim().toLowerCase();
        if (!q || n.toLowerCase().includes(q) || p.toLowerCase().includes(q)) {
            matches.push({ id: data.id, name: n, phone: p, plan, remainStr });
        }
    });

    if (matches.length > 0) {
        resContainer.innerHTML = matches
            .map(
                (m) => `
            <div class="px-4 py-3 hover:bg-[var(--point-color)]/20 cursor-pointer border-b border-[#2A3731] last:border-0 transition-colors" onclick="addSubTarget('${m.id}', '${m.name.replace(/'/g, "\\'")}', '${m.plan}', '${m.remainStr}')">
                <div class="flex justify-between items-center">
                    <span class="font-bold text-white text-sm">${m.name || '상호명 없음'}</span>
                    <span class="text-xs text-[#A7B2AE]">${m.phone || '번호 없음'}</span>
                </div>
                <div class="text-xs mt-1 text-[var(--point-color)] flex items-center gap-2">
                    <span class="px-1.5 py-0.5 rounded border border-[var(--point-color)]/30 opacity-90">${m.plan}</span> 
                    <span class="opacity-90">${m.remainStr}</span>
                </div>
            </div>
        `,
            )
            .join('');
        resContainer.classList.remove('hidden');
        setManualSubListToggleLabel();
    } else {
        resContainer.innerHTML =
            '<div class="px-4 py-3 text-sm text-[#A7B2AE] text-center">검색 결과가 없습니다.</div>';
        resContainer.classList.remove('hidden');
        setManualSubListToggleLabel();
    }
}

function addSubTarget(id, name, plan, remainStr) {
    if (!selectedSubTargets.find((t) => t.id === id)) {
        selectedSubTargets.push({ id, name, plan, remainStr });
        renderSubTargets();
    }
    document.getElementById('manual-sub-search').value = '';
    document.getElementById('manual-sub-search-results').classList.add('hidden');
    setManualSubListToggleLabel();
}

function removeSubTarget(id) {
    selectedSubTargets = selectedSubTargets.filter((t) => t.id !== id);
    renderSubTargets();
}

function renderSubTargets() {
    const container = document.getElementById('manual-sub-targets-container');
    const emptyMsg = document.getElementById('manual-sub-empty-msg');

    Array.from(container.querySelectorAll('.sub-chip')).forEach((el) => el.remove());

    if (selectedSubTargets.length === 0) {
        if (emptyMsg) emptyMsg.classList.remove('hidden');
    } else {
        if (emptyMsg) emptyMsg.classList.add('hidden');
        selectedSubTargets.forEach((t) => {
            const chip = document.createElement('div');
            chip.className =
                'sub-chip flex flex-col gap-1 px-3 py-2 bg-[var(--point-color)]/20 border border-[var(--point-color)]/50 rounded-lg text-sm text-white relative pr-8 w-full sm:w-auto shrink-0';
            chip.innerHTML = `
                <div class="font-bold whitespace-nowrap">${t.name}</div>
                <div class="text-xs text-[var(--point-color)] opacity-90 whitespace-nowrap">[${t.plan || '정보없음'}] ${t.remainStr || ''}</div>
                <button type="button" onclick="removeSubTarget('${t.id}')" class="absolute top-2 right-2 text-[var(--point-color)] hover:text-white">✕</button>
            `;
            container.insertBefore(chip, emptyMsg);
        });
    }
}

function toggleManualSubInput(type) {
    const valContainer = document.getElementById('manual-sub-value-container');
    const dateContainer = document.getElementById('manual-sub-date-container');
    const label = document.getElementById('manual-sub-days-label');
    const daysInput = document.getElementById('manual-sub-days');

    if (['add_1', 'add_3', 'add_6', 'add_12'].includes(type)) {
        valContainer.classList.add('hidden');
        dateContainer.classList.add('hidden');
        daysInput.required = false;
        document.getElementById('manual-sub-date').required = false;
    } else if (type === 'add') {
        valContainer.classList.remove('hidden');
        dateContainer.classList.add('hidden');
        label.innerText = '일 연장';
        daysInput.required = true;
    } else if (type === 'subtract') {
        valContainer.classList.remove('hidden');
        dateContainer.classList.add('hidden');
        label.innerText = '일 차감';
        daysInput.required = true;
    } else if (type === 'set_date') {
        valContainer.classList.add('hidden');
        dateContainer.classList.remove('hidden');
        daysInput.required = false;
        document.getElementById('manual-sub-date').required = true;
    } else if (type === 'force_stop') {
        valContainer.classList.add('hidden');
        dateContainer.classList.add('hidden');
        daysInput.required = false;
        document.getElementById('manual-sub-date').required = false;
    }
}

function toggleManualSubMemo(category) {
    const memo = document.getElementById('manual-sub-memo');
    if (category === 'custom') {
        memo.classList.remove('hidden');
        memo.required = true;
    } else {
        memo.classList.add('hidden');
        memo.required = false;
    }
}

function handleManualSubscriptionSubmit(e) {
    e.preventDefault();
    if (selectedSubTargets.length === 0) {
        alert('조치할 대상 업체를 최소 1개 이상 선택해주세요.');
        return;
    }

    const type = document.getElementById('manual-sub-type').value;
    const days = parseInt(document.getElementById('manual-sub-days').value) || 0;
    const dateInput = document.getElementById('manual-sub-date').value;
    const reasonCat = document.getElementById('manual-sub-reason-category').value;
    const reasonMemo = document.getElementById('manual-sub-memo').value;
    const notify = document.getElementById('manual-sub-notify').checked;

    let reasonText = document.querySelector(
        `#manual-sub-reason-category option[value="${reasonCat}"]`,
    ).innerText;
    if (reasonCat === 'custom') reasonText += ` - ${reasonMemo}`;

    if (!confirm(`선택한 ${selectedSubTargets.length}개 업체에 대해 조치를 실행하시겠습니까?`))
        return;

    const batch = db.batch();
    const promises = selectedSubTargets.map((target) => {
        const ref = db.collection('partners').doc(target.id);
        return ref.get().then((doc) => {
            if (!doc.exists) return;
            const data = doc.data();
            // 신규 발급의 경우, 기존 만료일이 현재보다 과거라면 '오늘 기준'으로, 만료 전이라면 '기존 만료일 기준'으로 연장
            let baseDate =
                data.ticketExpiryTimestamp && data.ticketExpiryTimestamp > Date.now()
                    ? new Date(data.ticketExpiryTimestamp)
                    : new Date();
            let newExpiry = baseDate.getTime();

            let ticketPlan = data.ticketPlan || 'standard';
            let ticketType = data.ticketType || 'None';
            let addedDaysMessage = '';

            if (type === 'add_1') {
                baseDate.setMonth(baseDate.getMonth() + 1);
                newExpiry = baseDate.getTime();
                ticketType = '1개월 입점권';
                addedDaysMessage = '+1개월';
            } else if (type === 'add_3') {
                baseDate.setMonth(baseDate.getMonth() + 3);
                newExpiry = baseDate.getTime();
                ticketType = '3개월 입점권';
                addedDaysMessage = '+3개월';
            } else if (type === 'add_6') {
                baseDate.setMonth(baseDate.getMonth() + 6);
                newExpiry = baseDate.getTime();
                ticketType = '6개월 입점권';
                ticketPlan = 'premium';
                addedDaysMessage = '+6개월(Premium)';
            } else if (type === 'add_12') {
                baseDate.setMonth(baseDate.getMonth() + 12);
                newExpiry = baseDate.getTime();
                ticketType = '12개월 입점권';
                ticketPlan = 'VIP';
                addedDaysMessage = '+12개월(VIP)';
            } else if (type === 'add') {
                newExpiry += days * 24 * 60 * 60 * 1000;
                addedDaysMessage = `+${days}일`;
            } else if (type === 'subtract') {
                newExpiry -= days * 24 * 60 * 60 * 1000;
                addedDaysMessage = `-${days}일`;
            } else if (type === 'set_date') {
                newExpiry = new Date(dateInput).getTime();
                addedDaysMessage = '만료일 변경';
            } else if (type === 'force_stop') {
                newExpiry = Date.now();
                addedDaysMessage = '강제 만료';
                ticketType = 'None';
                ticketPlan = 'none';
            }

            const d = new Date(newExpiry);
            const strDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

            batch.update(ref, {
                ticketExpiryTimestamp: newExpiry,
                ticketExpiry: strDate,
                ticketType: ticketType,
                ticketPlan: ticketPlan,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            });

            const logRef = db.collection('subscription_logs').doc();
            batch.set(logRef, {
                partnerId: target.id,
                partnerName: target.name,
                actionType: type,
                daysAdjusted: ['add', 'subtract'].includes(type) ? days : null,
                newExpiryTimestamp: newExpiry,
                reasonCategory: reasonCat,
                reasonMemo: reasonMemo,
                reasonText: reasonText,
                notify: notify,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            });

            // 알림 시스템 연동:
            if (notify) {
                const notifyRef = db.collection('notifications').doc();
                batch.set(notifyRef, {
                    targetUserId: data.userId || null,
                    partnerId: target.id,
                    title: '입점권 기간 변동 알림',
                    body: `조치 사유: ${reasonText}\n조치 내용: ${addedDaysMessage}\n\n상세한 변동 내역은 앱 내 샵 관리 메뉴를 통해 확인하실 수 있습니다.`,
                    isRead: false,
                    type: 'SUBSCRIPTION_UPDATE',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                });
            }
        });
    });

    Promise.all(promises)
        .then(() => {
            return batch.commit();
        })
        .then(() => {
            alert('조치가 성공적으로 반영되었습니다.');
            closeModal('modal-manual-sub');
        })
        .catch((err) => {
            alert('조치 중 오류 발생: ' + err.message);
        });
}

// ═══════════════════════════════════════
// ▶ SUBSCRIPTION PRODUCTS CONFIGURATION
// ═══════════════════════════════════════

function openSubscriptionProductsModal() {
    openModal('modal-subscription-products');

    // Load config from Firestore
    const configRef = db.collection('admin_configs').doc('subscription_products');
    configRef
        .get()
        .then((doc) => {
            if (doc.exists) {
                const data = doc.data();
                applySubProductsData(data);
            } else {
                // Apply defaults
                applyDefaultSubProducts();
            }
        })
        .catch((err) => {
            console.error('Failed to load subscription config:', err);
            applyDefaultSubProducts();
        });
}

function applySubProductsData(data) {
    const trialActive = document.getElementById('sub-promo-trial-active');
    const trialDays = document.getElementById('sub-promo-trial-days');

    if (data.promoTrial && data.promoTrial.active) {
        trialActive.checked = true;
        trialDays.value = data.promoTrial.days || 30;
    } else {
        trialActive.checked = false;
        trialDays.value = 30; // default 30 but inactive
    }
    togglePromoDays();

    if (data.products && data.products.length > 0) {
        renderSubProducts(data.products);
    } else {
        renderSubProducts(getDefaultProducts());
    }
}

function applyDefaultSubProducts() {
    document.getElementById('sub-promo-trial-active').checked = false;
    document.getElementById('sub-promo-trial-days').value = 30;
    togglePromoDays();
    renderSubProducts(getDefaultProducts());
}

function togglePromoDays() {
    const active = document.getElementById('sub-promo-trial-active').checked;
    const container = document.getElementById('sub-promo-trial-days-container');
    const input = document.getElementById('sub-promo-trial-days');
    if (active) {
        container.classList.remove('opacity-50');
        input.disabled = false;
    } else {
        container.classList.add('opacity-50');
        input.disabled = true;
    }
}

function resetSubProductsToDefault() {
    if (
        confirm(
            '모든 설정을 다독의 기본 상품 양식으로 덮어쓰시겠습니까? 저장 전까지는 실제 적용되지 않습니다.',
        )
    ) {
        applyDefaultSubProducts();
    }
}

function getDefaultProducts() {
    return [
        {
            id: 'starter_1',
            tier: 'basic',
            name: '1개월 입점권',
            months: 1,
            price: 300000,
            originalPrice: 300000,
            discountRate: 0,
            color: 'white',
            isActive: true,
            features: ['지역별 리스트 기본 노출', '파트너 전용 관리자 페이지'],
        },
        {
            id: 'popular_3',
            tier: 'standard',
            name: '3개월 입점권',
            months: 3,
            price: 850000,
            originalPrice: 900000,
            discountRate: 5,
            color: 'white',
            isActive: true,
            features: [
                '지역별 리스트 기본 노출',
                '검색 노출 순위 소폭 상승',
                '3개월 결제 시 5% 할인',
            ],
            badge: 'Popular',
        },
        {
            id: 'premium_6',
            tier: 'premium',
            name: '6개월 입점권 (Premium)',
            months: 6,
            price: 1530000,
            originalPrice: 1800000,
            discountRate: 15,
            color: '[var(--point-color)]',
            isActive: true,
            features: [
                '메인 [다독 초이스] 배너 노출 혜택',
                '추천 리스트 상위 노출 우선권',
                '파트너 전용 프리미엄 뱃지',
                '6개월 결제 시 15% 할인',
            ],
            badge: 'Best',
        },
        {
            id: 'vip_12',
            tier: 'vip',
            name: '12개월 입점권 (VIP)',
            months: 12,
            price: 2700000,
            originalPrice: 3600000,
            discountRate: 25,
            color: '[var(--point-color)]',
            isActive: true,
            features: [
                '메인 [다독 초이스] 상시 노출 보장',
                '검색결과 최상단 고정 노출',
                'VIP 전용 1:1 담당 매니저 배정',
                '12개월 결제 시 25% 할인',
            ],
            badge: 'VIP',
        },
    ];
}

function getDefaultProductNameByTier(tier) {
    const normalizedTier = (tier || '').toString().toLowerCase();
    const nameMap = {
        basic: '1개월 입점권',
        standard: '3개월 입점권',
        premium: '6개월 입점권 (Premium)',
        vip: '12개월 입점권 (VIP)',
    };
    return nameMap[normalizedTier] || '1개월 입점권';
}

function getAllDefaultProductNames() {
    return new Set([
        getDefaultProductNameByTier('basic'),
        getDefaultProductNameByTier('standard'),
        getDefaultProductNameByTier('premium'),
        getDefaultProductNameByTier('vip'),
    ]);
}

function syncProductNameWithTierWhenSafe(productItemEl) {
    if (!productItemEl) return;

    const tierEl = productItemEl.querySelector('.prod-tier');
    const nameEl = productItemEl.querySelector('.prod-name');
    if (!tierEl || !nameEl) return;

    const defaultNames = getAllDefaultProductNames();
    const currentName = (nameEl.value || '').trim();
    const nextDefaultName = getDefaultProductNameByTier(tierEl.value);

    // B안: 기본 상품명인 경우에만 자동 변경, 커스텀 명칭은 보존.
    if (!currentName || defaultNames.has(currentName)) {
        nameEl.value = nextDefaultName;
    }
}

function renderSubProducts(products) {
    const container = document.getElementById('sub-products-container');
    container.innerHTML = '';

    products.forEach((prod, index) => {
        const id = prod.id || `prod_${Date.now()}_${index}`;
        const normalizedTier = (prod.tier || '').toString().toLowerCase();
        const monthNum = Number(prod.months || 0);
        const selectedTier = ['basic', 'standard', 'premium', 'vip'].includes(normalizedTier)
            ? normalizedTier
            : monthNum === 12
              ? 'vip'
              : monthNum === 6
                ? 'premium'
                : monthNum === 3
                  ? 'standard'
                  : 'basic';

        let featuresHtml = '';
        if (prod.features && prod.features.length > 0) {
            featuresHtml = prod.features.join('\\n');
        }

        container.innerHTML += `
            <div class="sub-product-item border border-[#2A3731] bg-[#11291D]/30 p-5 rounded-xl shadow-sm relative group transition-all" data-id="${id}">
                <div class="absolute top-4 right-4 flex items-center gap-2">
                    <label class="text-[12px] text-[#A7B2AE] mr-1">활성화</label>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" class="sr-only peer prod-active" ${prod.isActive ? 'checked' : ''}>
                        <div class="w-16 h-9 rounded-full border border-[#4A5A54] bg-[#27342F] shadow-inner transition-all duration-200 peer-focus:ring-2 peer-focus:ring-[var(--point-color)]/50 peer-checked:bg-[var(--point-color)] peer-checked:border-[var(--point-color)]"></div>
                        <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-extrabold tracking-wider text-[#95A39D] peer-checked:opacity-0 transition-opacity">OFF</span>
                        <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-extrabold tracking-wider text-[#06110D] opacity-0 peer-checked:opacity-100 transition-opacity">ON</span>
                        <span class="absolute top-1 left-1 h-7 w-7 rounded-full bg-white border border-[#D4D9D7] shadow-md transition-transform duration-200 peer-checked:translate-x-7"></span>
                    </label>
                </div>
                
                <div class="grid grid-cols-2 gap-4 mb-4 pr-32">
                    <div>
                        <label class="block text-xs text-[#A7B2AE] mb-1">상품명</label>
                        <input type="text" class="prod-name w-full bg-[#06110D] border border-[#2A3731] rounded-lg px-3 py-2 text-white text-sm" value="${prod.name}">
                    </div>
                    <div>
                        <label class="block text-xs text-[#A7B2AE] mb-1">적용 티어</label>
                        <select class="prod-tier w-full bg-[#06110D] border border-[#2A3731] rounded-lg px-3 py-2 text-white text-sm" onchange="syncProductNameWithTierWhenSafe(this.closest('.sub-product-item'))">
                            <option value="basic" ${selectedTier === 'basic' ? 'selected' : ''}>Basic (1개월 입점권)</option>
                            <option value="standard" ${selectedTier === 'standard' ? 'selected' : ''}>Standard (3개월 입점권)</option>
                            <option value="premium" ${selectedTier === 'premium' ? 'selected' : ''}>Premium (6개월 입점권)</option>
                            <option value="vip" ${selectedTier === 'vip' ? 'selected' : ''}>VIP (12개월 입점권)</option>
                        </select>
                    </div>
                </div>
                <div class="grid grid-cols-3 gap-4 mb-4">
                    <div>
                        <label class="block text-xs text-[#A7B2AE] mb-1">기간 (개월)</label>
                        <input type="number" class="prod-months w-full bg-[#06110D] border border-[#2A3731] rounded-lg px-3 py-2 text-white text-sm" value="${prod.months}">
                    </div>
                    <div>
                        <label class="block text-xs text-[#A7B2AE] mb-1">정상가(원)</label>
                        <input type="number" class="prod-original-price w-full bg-[#06110D] border border-[#2A3731] rounded-lg px-3 py-2 text-white text-sm" value="${prod.originalPrice || prod.price}">
                    </div>
                    <div>
                        <label class="block text-[0.7rem] text-[var(--point-color)] mb-1 font-bold">할인가/판매가(원)</label>
                        <input type="number" class="prod-price w-full bg-[#06110D] border border-[var(--point-color)]/50 rounded-lg px-3 py-2 text-white text-sm font-bold" value="${prod.price}">
                    </div>
                </div>
                
                <div>
                    <label class="block text-xs text-[#A7B2AE] mb-1">제공 혜택 (줄바꿈으로 구분)</label>
                    <textarea class="prod-features w-full bg-[#06110D] border border-[#2A3731] rounded-lg px-3 py-2 text-white text-sm h-20 resize-none font-mono" placeholder="혜택 하나\\n혜택 둘">${featuresHtml}</textarea>
                </div>
                
                <div class="mt-4 flex justify-between items-center">
                    <div class="flex items-center gap-2">
                        <label class="text-xs text-[#A7B2AE]">상품 뱃지</label>
                        <input type="text" class="prod-badge bg-[#06110D] border border-[#2A3731] rounded-lg px-2 py-1.5 text-white text-xs w-20" placeholder="Best" value="${prod.badge || ''}">
                    </div>
                    <div class="flex items-center gap-2">
                        <label class="text-xs text-[#A7B2AE]">포인트 컬러</label>
                        <select class="prod-color bg-[#06110D] border border-[#2A3731] rounded-lg px-2 py-1.5 text-white text-xs">
                            <option value="white" ${prod.color === 'white' ? 'selected' : ''}>화이트(기본)</option>
                            <option value="[var(--point-color)]" ${prod.color === '[var(--point-color)]' ? 'selected' : ''}>골드(포인트)</option>
                        </select>
                    </div>
                    <button type="button" onclick="this.closest('.sub-product-item').remove()" class="px-2 py-1 rounded bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 transition-colors">삭제</button>
                </div>
            </div>
        `;
    });

    // Add product button
    container.innerHTML += `
        <button type="button" onclick="addNewEmptyProduct()" class="col-span-full py-12 text-center text-[#A7B2AE] hover:text-[#06110D] bg-[#06110D] rounded-xl border border-dashed border-[#2A3731] hover:border-[var(--point-color)] hover:bg-[var(--point-color)] transition-all group flex flex-col items-center gap-2">
            <svg class="w-8 h-8 text-gray-500 group-hover:text-[#06110D] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            <span class="font-bold text-sm">새 입점권 상품 추가하기</span>
        </button>
    `;
}

function addNewEmptyProduct() {
    const container = document.getElementById('sub-products-container');
    const products = Array.from(container.querySelectorAll('.sub-product-item')).map((el) => {
        return {
            id: el.dataset.id,
            isActive: el.querySelector('.prod-active').checked,
            name: el.querySelector('.prod-name').value,
            tier: el.querySelector('.prod-tier').value,
            months: parseInt(el.querySelector('.prod-months').value) || 1,
            originalPrice: parseInt(el.querySelector('.prod-original-price').value) || 0,
            price: parseInt(el.querySelector('.prod-price').value) || 0,
            features: el
                .querySelector('.prod-features')
                .value.split('\n')
                .map((f) => f.trim())
                .filter((f) => f),
            color: el.querySelector('.prod-color').value,
            badge: el.querySelector('.prod-badge').value,
        };
    });

    products.push({
        id: `prod_${Date.now()}`,
        isActive: true,
        name: '1개월 입점권',
        tier: 'basic',
        months: 1,
        originalPrice: 300000,
        price: 300000,
        color: 'white',
        features: ['기본 혜택'],
    });

    renderSubProducts(products);
}

function handleSubProductsSubmit(e) {
    if (e) e.preventDefault();

    const trialActive = document.getElementById('sub-promo-trial-active').checked;
    const trialDays = parseInt(document.getElementById('sub-promo-trial-days').value) || 30;

    const productElements = document.querySelectorAll('.sub-product-item');
    const products = [];

    productElements.forEach((el) => {
        let discountRate = 0;
        let p = parseInt(el.querySelector('.prod-price').value) || 0;
        let op = parseInt(el.querySelector('.prod-original-price').value) || 0;
        if (op > 0 && p < op) {
            discountRate = Math.round(((op - p) / op) * 100);
        }

        products.push({
            id: el.dataset.id || `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            isActive: el.querySelector('.prod-active').checked,
            name: el.querySelector('.prod-name').value,
            tier: el.querySelector('.prod-tier').value,
            months: parseInt(el.querySelector('.prod-months').value) || 1,
            originalPrice: op,
            price: p,
            discountRate: discountRate,
            features: el
                .querySelector('.prod-features')
                .value.split('\n')
                .map((f) => f.trim())
                .filter((f) => f),
            color: el.querySelector('.prod-color').value,
            badge: el.querySelector('.prod-badge').value,
        });
    });

    const configData = {
        promoTrial: {
            active: trialActive,
            days: trialDays,
        },
        products: products,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    db.collection('admin_configs')
        .doc('subscription_products')
        .set(configData, { merge: true })
        .then(() => {
            alert('입점권 상품 구성 정보가 저장되었습니다.');
            closeModal('modal-subscription-products');
        })
        .catch((err) => {
            console.error('Error saving config: ', err);
            alert('정보 저장 중 오류가 발생했습니다: ' + err.message);
        });
}

// ==========================================
// CS Center Logic (고객 센터)
// ==========================================

let currentCSType = 'customer_report';
let csTicketsData = [];
let activeCSTicketId = null;

function initCSTicketsListener() {
    db.collection('cs_tickets')
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
            sidebarSnapshotCache.cs = snapshot;
            csTicketsData = snapshot.docs.map(doc => {
                const data = doc.data();
                let displayDate = '';
                if (data.createdAt) {
                    if (typeof data.createdAt.toMillis === 'function') {
                        displayDate = new Date(data.createdAt.toMillis()).toLocaleString();
                    } else if (data.createdAt.seconds) { // Just in case it's a raw object
                        displayDate = new Date(data.createdAt.seconds * 1000).toLocaleString();
                    } else if (data.createdAt instanceof Date || typeof data.createdAt === 'number' || typeof data.createdAt === 'string') {
                        displayDate = new Date(data.createdAt).toLocaleString();
                    }
                }
                return {
                    id: doc.id,
                    type: data.type || 'customer_inquiry',
                    status: data.status || 'pending',
                    title: data.title || '',
                    content: data.content || '',
                    author: data.author || '',
                    date: displayDate,
                    targetId: data.targetId || null,
                    targetName: data.targetName || null,
                    memo: data.memo || ''
                };
            });
            const pendingCount = csTicketsData.filter((ticket) => ticket.status === 'pending').length;
            const unreadCount = countUnreadDocsByTimestamp(
                snapshot,
                'cs',
                ['updatedAt', 'createdAt'],
                (data) => (data.status || 'pending') === 'pending',
            );
            setSidebarCategoryCount('cs', pendingCount, unreadCount);
            
            // Update detail panel if open
            if (activeCSTicketId && document.getElementById('slide-cs-detail') && !document.getElementById('slide-cs-detail').classList.contains('translate-x-full')) {
                openCSDetailPanel(activeCSTicketId);
            }
            loadCSTickets();
        }, error => {
            console.error("Error fetching CS tickets: ", error);
        });
}

function filterCSTickets(type) {
    currentCSType = type;
    
    // Update active button styling
    document.querySelectorAll('.cs-filter-btn').forEach(btn => {
        if(btn.dataset.type === type) {
            btn.classList.add('ring-2', 'ring-[var(--point-color)]', 'bg-[#11291D]');
        } else {
            btn.classList.remove('ring-2', 'ring-[var(--point-color)]', 'bg-[#11291D]');
        }
    });

    loadCSTickets();
}

function loadCSTickets() {
    const tbody = document.getElementById('cs-ticket-table-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-[#A7B2AE]">데이터 조회 중...</td></tr>';

    const statusFilter = document.getElementById('cs-status-filter').value;
    const searchQuery = document.getElementById('cs-search-input').value.toLowerCase();

    // Filter tickets
    const filtered = csTicketsData.filter(t => {
        if (currentCSType !== 'all' && currentCSType !== t.type) return false;
        if (statusFilter !== 'all' && t.status !== statusFilter) return false;
        if (searchQuery) {
            return t.title.toLowerCase().includes(searchQuery) || t.content.toLowerCase().includes(searchQuery) || t.author.toLowerCase().includes(searchQuery);
        }
        return true;
    });

    // Update Dashboard Counts
    document.getElementById('count-customer-report').textContent = csTicketsData.filter(t => t.type === 'customer_report' && t.status === 'pending').length;
    document.getElementById('count-partner-report').textContent = csTicketsData.filter(t => t.type === 'partner_report' && t.status === 'pending').length;
    document.getElementById('count-customer-inquiry').textContent = csTicketsData.filter(t => t.type === 'customer_inquiry' && t.status === 'pending').length;
    document.getElementById('count-partner-inquiry').textContent = csTicketsData.filter(t => t.type === 'partner_inquiry' && t.status === 'pending').length;

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-[#A7B2AE]">해당하는 항목이 없습니다.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    filtered.forEach(ticket => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-[#11291D]/50 transition-colors cursor-pointer border-b border-[#2A3731]';
        tr.onclick = (e) => {
            if(!e.target.closest('button')) openCSDetailPanel(ticket.id);
        };

        const typeLabels = {
            'customer_report': '<span class="text-red-400 font-bold">고객 신고</span>',
            'partner_report': '<span class="text-orange-400 font-bold">업체 신고</span>',
            'customer_inquiry': '<span class="text-[var(--point-color)] font-bold">고객 문의</span>',
            'partner_inquiry': '<span class="text-blue-400 font-bold">업체 문의</span>',
        };

        let statusBadge = '';
        if (ticket.status === 'pending') statusBadge = '<span class="bg-red-900/50 text-red-400 border border-red-500/30 px-2 py-1 rounded text-xs px-2 min-w-[60px] inline-block text-center shadow-lg">미처리</span>';
        else if (ticket.status === 'in_progress') statusBadge = '<span class="bg-blue-900/50 text-blue-400 border border-blue-500/30 px-2 py-1 rounded text-xs min-w-[60px] inline-block text-center shadow-lg">처리중</span>';
        else statusBadge = '<span class="bg-[#11291D] text-[#A7B2AE] border border-[#2A3731] px-2 py-1 rounded text-xs min-w-[60px] inline-block text-center shadow-lg">처리완료</span>';

        tr.innerHTML = `
            <td class="p-4 whitespace-nowrap">${typeLabels[ticket.type]}</td>
            <td class="p-4 whitespace-nowrap">${statusBadge}</td>
            <td class="p-4 max-w-[300px] truncate text-white font-medium">${ticket.title}</td>
            <td class="p-4 whitespace-nowrap">${ticket.author}</td>
            <td class="p-4 whitespace-nowrap text-[#A7B2AE]">${ticket.date}</td>
            <td class="p-4 text-center">
                <button onclick="event.stopPropagation(); openCSDetailPanel('${ticket.id}')" class="px-4 py-2 bg-[#11291D] hover:bg-gradient-to-r hover:from-[var(--point-color)] hover:to-[#B59530] hover:text-[#0A1B13] border border-[#2A3731] hover:border-transparent rounded-lg text-xs transition-all font-bold shadow-sm">상세 보기</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openCSDetailPanel(ticketId) {
    activeCSTicketId = ticketId;
    const ticket = csTicketsData.find(t => t.id === ticketId);
    if (!ticket) return;

    const panel = document.getElementById('slide-cs-detail');
    const content = document.getElementById('cs-detail-content');
    const actions = document.getElementById('cs-detail-actions');
    const badge = document.getElementById('cs-detail-badge');

    // Setup Badge
    if (ticket.status === 'pending') {
        badge.className = 'px-2 py-0.5 rounded text-xs font-bold ring-1 bg-red-900/50 text-red-400 ring-red-500/30 shadow-lg';
        badge.innerText = '미처리 대기';
    } else if (ticket.status === 'resolved') {
        badge.className = 'px-2 py-0.5 rounded text-xs font-bold ring-1 bg-[#11291D] text-[#A7B2AE] ring-[#2A3731] shadow-lg';
        badge.innerText = '처리 완료됨';
    } else {
        badge.className = 'px-2 py-0.5 rounded text-xs font-bold ring-1 bg-blue-900/50 text-blue-400 ring-blue-500/30 shadow-lg';
        badge.innerText = '처리 중';
    }

    const isReport = ticket.type.includes('report');

    content.innerHTML = `
        <div class="mb-4">
            <h4 class="text-2xl font-bold text-white mb-2 leading-snug">${ticket.title}</h4>
            <div class="text-[#A7B2AE] text-sm flex gap-4 mt-3">
                <span>작성자: <strong class="text-white">${ticket.author}</strong></span>
                <span>작성일시: ${ticket.date}</span>
            </div>
        </div>

        <div class="bg-[#11291D] p-5 rounded-2xl border border-[#2A3731] text-white/90 leading-relaxed min-h-[150px] shadow-inner mb-6 whitespace-pre-wrap">${ticket.content}</div>

        ${isReport && ticket.targetName ? `
            <div class="bg-gradient-to-r from-red-900/30 to-red-900/10 border border-red-500/30 p-5 rounded-2xl mb-6 shadow-md">
                <h5 class="text-red-400 font-bold flex items-center gap-2 mb-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    신고 대상 (피신고자)
                </h5>
                <p class="text-white text-lg font-bold ml-7">${ticket.targetName} <span class="text-sm font-normal text-[#A7B2AE]">(${ticket.targetId})</span></p>
            </div>
        ` : ''}

        <div class="space-y-3 pt-6 border-t border-[#2A3731]">
            <h5 class="font-bold text-white mb-2 flex items-center gap-2">
                <svg class="w-5 h-5 text-[var(--point-color)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                관리자 내부 확인용 메모
            </h5>
            <textarea id="cs-memo-input" class="w-full bg-[#06110D] border border-[#2A3731] shadow-inner rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--point-color)] transition-colors" rows="3" placeholder="처리 내역이나 특이사항을 이곳에 기록하세요. (사용자에게 보이지 않음)">${ticket.memo || ''}</textarea>
            <div class="flex justify-end">
                <button onclick="saveCSTicketMemo('${ticket.id}')" class="px-5 py-2 bg-[#11291D] hover:bg-[#1A3A2A] rounded-xl text-white font-bold transition-colors border border-[#2A3731]">메모 저장</button>
            </div>
        </div>
    `;

    actions.innerHTML = '';
    
    // Add Resolve button
    if (ticket.status !== 'resolved') {
        actions.innerHTML += `
            <button onclick="resolveCSTicket('${ticket.id}')" class="flex-[2] py-4 bg-gradient-to-r from-[var(--point-color)] to-[#B59530] text-[#0A1B13] font-bold rounded-xl shadow-[0_5px_15px_rgba(212,175,55,0.2)] hover:shadow-[0_8px_25px_rgba(212,175,55,0.3)] hover:brightness-110 transition-all active:scale-[0.98]">CS 답변 발송 및 완료</button>
        `;
    }

    // Add Penalty button for Reports
    if (isReport && ticket.targetName) {
        actions.innerHTML += `
            <button onclick="openCSPenaltyModal('${ticket.targetId}', '${ticket.targetName}')" class="flex-1 py-4 bg-red-600/10 text-red-500 border border-red-500/50 font-bold rounded-xl shadow-lg hover:bg-red-600 hover:text-white transition-all active:scale-[0.98]">강력 패널티 부과</button>
        `;
    }

    panel.classList.remove('translate-x-full');
}

function closeCSDetailPanel() {
    activeCSTicketId = null;
    document.getElementById('slide-cs-detail').classList.add('translate-x-full');
}

function resolveCSTicket(ticketId) {
    if (confirm('이 티켓을 처리 완료로 변경하시겠습니까? (답변이 발송됩니다)')) {
        db.collection('cs_tickets').doc(ticketId).update({
            status: 'resolved',
            resolvedAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            closeCSDetailPanel();
            alert('처리가 완료되었습니다. 발송 트리거가 실행됩니다.');
        })
        .catch(error => {
            console.error("Error resolving ticket: ", error);
            alert('처리 중 오류가 발생했습니다.');
        });
    }
}

function saveCSTicketMemo(ticketId) {
    const memoValue = document.getElementById('cs-memo-input').value;
    db.collection('cs_tickets').doc(ticketId).update({
        memo: memoValue
    })
    .then(() => {
        alert('메모가 저장되었습니다.');
    })
    .catch(error => {
        console.error("Error saving memo: ", error);
        alert('메모 저장 중 오류가 발생했습니다.');
    });
}

function openCSPenaltyModal(targetId, targetName) {
    document.getElementById('penalty-target-name').value = `${targetName} (${targetId})`;
    document.getElementById('penalty-type').value = 'warning';
    document.getElementById('penalty-reason').value = '';
    
    window.currentPenaltyTargetId = targetId; 
    document.getElementById('modal-cs-penalty').classList.remove('hidden');
}

function submitCSPenalty() {
    const type = document.getElementById('penalty-type').value;
    const reason = document.getElementById('penalty-reason').value;
    
    if(!reason.trim()) {
        alert('정확한 패널티 부여를 위해 상세 사유를 반드시 작성해주세요.');
        return;
    }
    
    const targetId = window.currentPenaltyTargetId;
    if (!targetId) return;

    db.collection('penalties').add({
        targetId: targetId,
        type: type,
        reason: reason,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        relatedTicketId: activeCSTicketId
    })
    .then(() => {
        alert(`해당 유저/업체에 패널티가 정상적으로 부과되었습니다.\n[적용 조치] ${type}`);
        closeModal('modal-cs-penalty');
        
        if (activeCSTicketId) {
            resolveCSTicket(activeCSTicketId);
        }
    })
    .catch((error) => {
        console.error("Error adding penalty: ", error);
        alert('패널티 부과 중 오류가 발생했습니다.');
    });
}

function seedCSTicketsIfNeeded() {
    db.collection('cs_tickets').limit(1).get().then(snap => {
        if (snap.empty) {
            console.log("Seeding mock CS tickets...");
            const mockData = [
                { type: 'customer_report', status: 'pending', title: '마사지사가 불친절합니다', content: '예약 시간에 늦고 불친절하게 응대했습니다.', author: '김고객 (user_123)', createdAt: firebase.firestore.FieldValue.serverTimestamp(), targetId: 'shop_001', targetName: '강남 VIP 타이' },
                { type: 'customer_report', status: 'resolved', title: '노쇼 발생', content: '예약하고 방문했는데 가게 문이 닫혀 있었습니다.', author: '이사용 (user_456)', createdAt: firebase.firestore.FieldValue.serverTimestamp(), targetId: 'shop_002', targetName: '신림 힐링테라피' },
                { type: 'partner_report', status: 'pending', title: '고객 노쇼 신고', content: '예약 후 잠수탔습니다. 전화도 받지 않습니다.', author: '홍대 마사지 (shop_003)', createdAt: firebase.firestore.FieldValue.serverTimestamp(), targetId: 'user_789', targetName: '박진상' },
                { type: 'customer_inquiry', status: 'pending', title: '결제 취소 문의', content: '입금했는데 취소하고 싶어요 어떻게 하나요?', author: '최구매 (user_222)', createdAt: firebase.firestore.FieldValue.serverTimestamp(), targetId: null, targetName: null },
                { type: 'partner_inquiry', status: 'in_progress', title: '입점권 연장 문의', content: 'VIP 입점권으로 업그레이드 하고 싶습니다.', author: '제주 테라피 (shop_004)', createdAt: firebase.firestore.FieldValue.serverTimestamp(), targetId: null, targetName: null },
            ];
            mockData.forEach(async (data) => {
                await db.collection('cs_tickets').add(data);
            });
        }
    }).catch(err => console.error("Seed error: ", err));
}

document.addEventListener('DOMContentLoaded', () => {
    seedCSTicketsIfNeeded();
    initCSTicketsListener();
    filterCSTickets('customer_report');
});
