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
        loadDevAlertSecurityConfig().finally(() => {
            renderDevAlertGuardState();
        });
    } else {
        if (authOverlay) authOverlay.classList.remove('hidden');
        if (mainApp) mainApp.classList.add('hidden');
        if (userInfoEl) userInfoEl.classList.add('hidden');
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
        stopSidebarBadgeReadsListener();
        renderDevAlertGuardState();
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
const CALL_LOG_PAGE_SIZE = 30;
const CALL_LOG_PERIOD_DEFAULT = '7d';
let callLogRows = [];
let callLogLastDoc = null;
let callLogHasMore = false;
let callLogLoading = false;
let callLogUiInitialized = false;
let callLogUserOptions = [];
let callLogPartnerOptions = [];
let callLogFilters = {
    search: '',
    role: 'all',
    subjectUserId: 'all',
    business: 'all',
    period: CALL_LOG_PERIOD_DEFAULT,
    fromDate: '',
    toDate: '',
    sort: 'desc',
};
const CHAT_LOG_PAGE_SIZE = 30;
const CHAT_LOG_PERIOD_DEFAULT = '7d';
let chatLogRows = [];
let chatLogLastDoc = null;
let chatLogHasMore = false;
let chatLogLoading = false;
let chatLogUiInitialized = false;
let chatLogFilters = {
    search: '',
    role: 'all',
    subjectUserId: 'all',
    period: CHAT_LOG_PERIOD_DEFAULT,
    fromDate: '',
    toDate: '',
    sort: 'desc',
};
let adminChatThreadsUnsub = null;
let adminChatMessagesUnsub = null;
let adminChatSelectedThreadId = null;
const USERS_PAGE_SIZE = 20;
let usersUnsubscribe = null;
let usersControlsInitialized = false;
let usersAllRows = [];
let usersFilteredRows = [];
let usersCurrentPage = 1;
let usersSelectedId = null;
const USERS_KPI_REFRESH_MS = 60 * 1000;
let usersKpiRefreshTimer = null;
const SIDEBAR_BADGE_MAP = {
    users: 'users-badge',
    approvals: 'pending-badge',
    shops: 'shops-badge',
    subscriptions: 'subscriptions-badge',
    messages: 'messages-badge',
    categories: 'categories-badge',
    cs: 'cs-badge',
    'admin-chat': 'admin-chat-badge',
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
    'admin-chat': 0,
};
let sidebarBadgeUnreadCounts = {
    users: 0,
    approvals: 0,
    shops: 0,
    subscriptions: 0,
    messages: 0,
    categories: 0,
    cs: 0,
    'admin-chat': 0,
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
    adminChatMessages: null,
};

const DEV_ALERT_ACTIONS = {
    simulateError: 'simulate_discord_error',
    generateDummy: 'generate_dummy_partners',
    resetAll: 'delete_all_partners',
};
const DEV_ALERT_BUTTON_IDS = {
    simulateError: 'btn-dev-alert-error',
    generateDummy: 'btn-dev-alert-dummy',
    resetAll: 'btn-dev-alert-reset',
};
const DEV_ALERT_DEFAULT_BUTTON_LABELS = {
    simulateError: '에러 시뮬레이션 버튼',
    generateDummy: '더미 업체/리뷰 생성',
    resetAll: '업체 데이터 전체 초기화',
};
const DEV_ALERT_COOLDOWN_MS = 30 * 1000;
const DEV_ALERT_DELETE_CONFIRM_TEXT = 'DELETE ALL';
const DEV_ALERT_DEFAULT_ALLOWED_EMAILS = ['kojusun@gmail.com'];
const SENSITIVE_VIEW_MIN_REASON_LENGTH = 5;
const SENSITIVE_VIEW_SCOPE_LABELS = {
    callLogs: '전화 클릭 로그',
    chatLogs: '채팅창 확인',
    messageCenter: '메세지 센터(수신자/이력)',
};

let devAlertSecurityConfig = {
    enabled: false,
    allowedEmails: [],
    allowInProduction: false,
};
let devAlertCooldownUntilByAction = {
    simulateError: 0,
    generateDummy: 0,
    resetAll: 0,
};
let devAlertCooldownTimer = null;
let sensitiveViewAccessSession = {
    callLogs: false,
    chatLogs: false,
    messageCenter: false,
};

function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
}

function isLocalDevelopmentHost() {
    const hostname = String(window.location.hostname || '').toLowerCase();
    return (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        hostname.endsWith('.local')
    );
}

function isProductionEnvironment() {
    return !isLocalDevelopmentHost();
}

function getDevAlertAllowedEmails() {
    const configured = Array.isArray(devAlertSecurityConfig.allowedEmails)
        ? devAlertSecurityConfig.allowedEmails
        : [];
    const source =
        configured.length > 0 ? configured : DEV_ALERT_DEFAULT_ALLOWED_EMAILS;
    return [...new Set(source.map(normalizeEmail).filter(Boolean))];
}

function hasDevAlertPermission() {
    const currentEmail = normalizeEmail(auth.currentUser?.email);
    if (!currentEmail) return false;
    const allowlist = getDevAlertAllowedEmails();
    if (allowlist.length === 0) return false;
    return allowlist.includes(currentEmail);
}

function setDiscordLog(message, tone = 'neutral') {
    const logBox = document.getElementById('discord-log');
    if (!logBox) return;
    logBox.innerText = message;
    logBox.classList.remove('text-gray-500', 'text-green-400', 'text-red-300', 'text-yellow-300');
    if (tone === 'success') logBox.classList.add('text-green-400');
    else if (tone === 'danger') logBox.classList.add('text-red-300');
    else if (tone === 'warn') logBox.classList.add('text-yellow-300');
    else logBox.classList.add('text-gray-500');
}

function setDevAlertGuardMessage(message = '') {
    const guardEl = document.getElementById('dev-alert-guard-message');
    if (!guardEl) return;
    if (!message) {
        guardEl.classList.add('hidden');
        guardEl.textContent = '';
        return;
    }
    guardEl.textContent = message;
    guardEl.classList.remove('hidden');
}

function getDevAlertCooldownRemainingMs(actionKey) {
    const untilMs = Number(devAlertCooldownUntilByAction[actionKey] || 0);
    return Math.max(0, untilMs - Date.now());
}

function setDevAlertButtonDisabled(button, disabled) {
    if (!button) return;
    button.disabled = disabled;
    button.classList.toggle('opacity-60', disabled);
    button.classList.toggle('cursor-not-allowed', disabled);
}

function setDevAlertControlsVisible(visible) {
    const controls = document.getElementById('dev-alert-controls');
    if (!controls) return;
    controls.style.display = visible ? 'block' : 'none';
}

function updateDevAlertButtonsState() {
    const canUse =
        Boolean(auth.currentUser) &&
        devAlertSecurityConfig.enabled &&
        hasDevAlertPermission() &&
        (!isProductionEnvironment() || devAlertSecurityConfig.allowInProduction);

    Object.entries(DEV_ALERT_BUTTON_IDS).forEach(([actionKey, buttonId]) => {
        const button = document.getElementById(buttonId);
        if (!button) return;

        const defaultLabel = DEV_ALERT_DEFAULT_BUTTON_LABELS[actionKey] || button.textContent || '';
        const remainingMs = getDevAlertCooldownRemainingMs(actionKey);
        const isCooling = remainingMs > 0;
        setDevAlertButtonDisabled(button, !canUse || isCooling);

        if (isCooling) {
            button.textContent = `${defaultLabel} (${Math.ceil(remainingMs / 1000)}초)`;
        } else {
            button.textContent = defaultLabel;
        }
    });
}

function stopDevAlertCooldownTicker() {
    if (!devAlertCooldownTimer) return;
    clearInterval(devAlertCooldownTimer);
    devAlertCooldownTimer = null;
}

function startDevAlertCooldownTicker() {
    if (devAlertCooldownTimer) return;
    devAlertCooldownTimer = setInterval(() => {
        updateDevAlertButtonsState();
        const hasCooldown = Object.keys(DEV_ALERT_BUTTON_IDS).some(
            (actionKey) => getDevAlertCooldownRemainingMs(actionKey) > 0,
        );
        if (!hasCooldown) stopDevAlertCooldownTicker();
    }, 1000);
}

function consumeDevAlertCooldown(actionKey) {
    const remainMs = getDevAlertCooldownRemainingMs(actionKey);
    if (remainMs > 0) {
        setDiscordLog(`보호 대기중: ${Math.ceil(remainMs / 1000)}초 후 다시 시도해주세요.`, 'warn');
        return false;
    }
    devAlertCooldownUntilByAction[actionKey] = Date.now() + DEV_ALERT_COOLDOWN_MS;
    updateDevAlertButtonsState();
    startDevAlertCooldownTicker();
    return true;
}

async function writeDevAlertAuditLog(action, status, details = {}) {
    const payload = {
        action: String(action || ''),
        status: String(status || ''),
        details: details && typeof details === 'object' ? details : {},
        actorEmail: auth.currentUser?.email || '',
        actorUid: auth.currentUser?.uid || '',
        host: window.location.hostname || '',
        path: window.location.pathname || '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    };
    try {
        await db.collection('admin_audit_logs').add(payload);
    } catch (err) {
        console.warn('개발 알림 감사 로그 기록 실패:', err?.message || err);
    }
}

function setCallLogTableMessage(message, tone = 'muted') {
    const tbody = document.getElementById('call-log-table-body');
    if (!tbody) return;
    const cls =
        tone === 'error'
            ? 'text-red-400'
            : tone === 'warn'
                ? 'text-yellow-300'
                : 'text-[#A7B2AE]';
    tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center ${cls}">${escapeHtml(message)}</td></tr>`;
}

function setCallLogMeta(message = '') {
    const el = document.getElementById('call-log-meta');
    if (!el) return;
    el.textContent = message;
}

function setCallLogReasonEditorVisible(visible) {
    const wrap = document.getElementById('call-log-reason-wrap');
    if (!wrap) return;
    wrap.classList.toggle('hidden', !visible);
}

function clearCallLogReasonEditor() {
    const input = document.getElementById('call-log-reason-input');
    if (input) input.value = '';
}

function setCallLogLoadMoreVisible(visible, label = '더 보기', disabled = false) {
    const btn = document.getElementById('call-log-load-more');
    if (!btn) return;
    btn.classList.toggle('hidden', !visible);
    btn.textContent = label;
    btn.disabled = disabled;
    btn.classList.toggle('opacity-60', disabled);
    btn.classList.toggle('cursor-not-allowed', disabled);
}

function updateCallLogDateRangeInputState() {
    const periodEl = document.getElementById('call-log-period');
    const fromEl = document.getElementById('call-log-from');
    const toEl = document.getElementById('call-log-to');
    if (!periodEl || !fromEl || !toEl) return;
    // 날짜 수동 입력은 항상 가능하게 유지
    fromEl.disabled = false;
    toEl.disabled = false;
}

function sortCallLogSubjectOptions(options = []) {
    return [...options].sort((a, b) =>
        String(a.label || '').localeCompare(String(b.label || ''), 'ko', {
            sensitivity: 'base',
            numeric: true,
        }),
    );
}

function getCallLogSubjectOptionsByRole(role) {
    if (role === 'user') return callLogUserOptions;
    if (role === 'partner') return callLogPartnerOptions;
    const combined = [
        ...callLogUserOptions.map((row) => ({ ...row, label: `[개인] ${row.label}` })),
        ...callLogPartnerOptions.map((row) => ({ ...row, label: `[업체] ${row.label}` })),
    ];
    return sortCallLogSubjectOptions(combined);
}

function updateCallLogSubjectSelectedLabel() {
    const selectedEl = document.getElementById('call-log-subject-selected');
    if (!selectedEl) return;
    if (!callLogFilters.subjectUserId || callLogFilters.subjectUserId === 'all') {
        selectedEl.textContent = '선택 대상: 전체';
        return;
    }
    const role = callLogFilters.role || 'all';
    const options = getCallLogSubjectOptionsByRole(role);
    const selected = options.find((row) => row.userId === callLogFilters.subjectUserId);
    selectedEl.textContent = selected
        ? `선택 대상: ${selected.label}`
        : `선택 대상: ${callLogFilters.subjectUserId}`;
}

function renderCallLogSubjectList() {
    const roleEl = document.getElementById('call-log-role');
    const listEl = document.getElementById('call-log-subject-list');
    const titleEl = document.getElementById('call-log-subject-title');
    if (!roleEl || !listEl || !titleEl) return;

    const role = roleEl.value || 'all';
    const titleMap = {
        all: '전체 대상 목록 (개인 + 업체)',
        user: '개인회원 목록',
        partner: '업체회원 목록',
    };
    titleEl.textContent = titleMap[role] || '대상 목록';

    const source = getCallLogSubjectOptionsByRole(role);
    const selectedId = callLogFilters.subjectUserId || 'all';

    const allButtonClass =
        selectedId === 'all'
            ? 'w-full text-left px-3 py-2 rounded-lg text-sm bg-[var(--point-color)]/20 border border-[var(--point-color)] text-[var(--point-color)]'
            : 'w-full text-left px-3 py-2 rounded-lg text-sm border border-[#2A3731] text-[#A7B2AE] hover:text-white hover:border-[var(--point-color)] transition-colors';
    let html = `<button type="button" data-user-id="all" class="${allButtonClass}">전체</button>`;

    if (!source.length) {
        html += '<div class="px-3 py-2 text-xs text-[#7F8E88]">표시할 대상이 없습니다.</div>';
    } else {
        source.forEach((row) => {
            const itemClass =
                row.userId === selectedId
                    ? 'w-full text-left px-3 py-2 rounded-lg text-sm bg-[var(--point-color)]/20 border border-[var(--point-color)] text-[var(--point-color)]'
                    : 'w-full text-left px-3 py-2 rounded-lg text-sm border border-[#2A3731] text-[#A7B2AE] hover:text-white hover:border-[var(--point-color)] transition-colors';
            html += `<button type="button" data-user-id="${escapeHtml(row.userId)}" class="${itemClass}">${escapeHtml(row.label)}</button>`;
        });
    }
    listEl.innerHTML = html;
    listEl.querySelectorAll('button[data-user-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
            callLogFilters.subjectUserId = btn.getAttribute('data-user-id') || 'all';
            updateCallLogSubjectSelectedLabel();
            renderCallLogSubjectList();
        });
    });
}

function setCallLogSubjectPanelVisible(visible) {
    const panel = document.getElementById('call-log-subject-panel');
    const toggle = document.getElementById('call-log-subject-toggle');
    if (!panel || !toggle) return;
    panel.classList.toggle('hidden', !visible);
    toggle.textContent = visible ? '대상 리스트 닫기' : '대상 리스트 열기';
}

function resetCallLogFilterInputs() {
    const defaults = {
        search: '',
        role: 'all',
        subjectUserId: 'all',
        business: 'all',
        period: CALL_LOG_PERIOD_DEFAULT,
        fromDate: '',
        toDate: '',
        sort: 'desc',
    };
    const searchEl = document.getElementById('call-log-search');
    const roleEl = document.getElementById('call-log-role');
    const businessEl = document.getElementById('call-log-business');
    const periodEl = document.getElementById('call-log-period');
    const fromEl = document.getElementById('call-log-from');
    const toEl = document.getElementById('call-log-to');
    const sortEl = document.getElementById('call-log-sort');
    if (searchEl) searchEl.value = defaults.search;
    if (roleEl) roleEl.value = defaults.role;
    if (businessEl) businessEl.value = defaults.business;
    if (periodEl) periodEl.value = defaults.period;
    if (fromEl) fromEl.value = defaults.fromDate;
    if (toEl) toEl.value = defaults.toDate;
    if (sortEl) sortEl.value = defaults.sort;
    callLogFilters = { ...defaults };
    renderCallLogSubjectList();
    updateCallLogSubjectSelectedLabel();
    setCallLogSubjectPanelVisible(false);
    updateCallLogDateRangeInputState();
}

function readCallLogFilterInputs() {
    const searchEl = document.getElementById('call-log-search');
    const roleEl = document.getElementById('call-log-role');
    const businessEl = document.getElementById('call-log-business');
    const periodEl = document.getElementById('call-log-period');
    const fromEl = document.getElementById('call-log-from');
    const toEl = document.getElementById('call-log-to');
    const sortEl = document.getElementById('call-log-sort');
    const nextRole = roleEl?.value || 'all';
    const roleChanged = callLogFilters.role !== nextRole;
    const nextSubjectUserId = roleChanged ? 'all' : callLogFilters.subjectUserId || 'all';
    callLogFilters = {
        search: String(searchEl?.value || '').trim(),
        role: nextRole,
        subjectUserId: nextSubjectUserId,
        business: businessEl?.value || 'all',
        period: periodEl?.value || CALL_LOG_PERIOD_DEFAULT,
        fromDate: fromEl?.value || '',
        toDate: toEl?.value || '',
        sort: sortEl?.value === 'asc' ? 'asc' : 'desc',
    };
    if (roleChanged) {
        renderCallLogSubjectList();
    }
    updateCallLogSubjectSelectedLabel();
}

function getCallLogDateRange() {
    const now = new Date();
    const to = new Date(now);
    // 사용자가 날짜를 직접 입력했으면 기간 프리셋보다 우선 적용
    if (callLogFilters.fromDate || callLogFilters.toDate) {
        const manualFrom = callLogFilters.fromDate
            ? new Date(`${callLogFilters.fromDate}T00:00:00`)
            : null;
        const manualTo = callLogFilters.toDate
            ? new Date(`${callLogFilters.toDate}T23:59:59`)
            : null;
        return { from: manualFrom, to: manualTo };
    }
    if (callLogFilters.period === 'all') {
        return { from: null, to: null };
    }
    if (callLogFilters.period === 'today') {
        const from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        return { from, to };
    }
    if (callLogFilters.period === '7d' || callLogFilters.period === '30d') {
        const days = callLogFilters.period === '7d' ? 7 : 30;
        const from = new Date(now);
        from.setHours(0, 0, 0, 0);
        from.setDate(from.getDate() - (days - 1));
        return { from, to };
    }
    if (callLogFilters.period === 'custom') {
        const from = callLogFilters.fromDate
            ? new Date(`${callLogFilters.fromDate}T00:00:00`)
            : null;
        const toDate = callLogFilters.toDate
            ? new Date(`${callLogFilters.toDate}T23:59:59`)
            : null;
        return { from, to: toDate };
    }
    return { from: null, to: null };
}

function maskPhoneNumber(raw) {
    const digits = String(raw || '').replace(/\D/g, '');
    if (digits.length < 8) return raw || '-';
    if (digits.length === 11) {
        return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
    }
    return `${digits.slice(0, 2)}****${digits.slice(-2)}`;
}

function normalizeCallRoleLabel(value) {
    const role = String(value || '').toLowerCase();
    if (role === 'user') return '개인회원';
    if (role === 'partner') return '업체회원';
    return value || '-';
}

function buildCallLogSearchIndex(row) {
    return [
        row.partnerName,
        row.phoneDigits,
        row.callerName,
        row.callerUserId,
        row.callerRole,
    ]
        .map((v) => String(v || '').toLowerCase())
        .join(' ');
}

function getFilteredCallLogRows() {
    const keyword = String(callLogFilters.search || '').toLowerCase();
    const rows = callLogRows.filter((row) => {
        if (!keyword) return true;
        return buildCallLogSearchIndex(row).includes(keyword);
    });
    rows.sort((a, b) => {
        if (callLogFilters.sort === 'asc') return a.createdAtMs - b.createdAtMs;
        return b.createdAtMs - a.createdAtMs;
    });
    return rows;
}

function renderCallLogRows() {
    const tbody = document.getElementById('call-log-table-body');
    if (!tbody) return;
    const filteredRows = getFilteredCallLogRows();
    if (!callLogRows.length) {
        setCallLogTableMessage('전화 클릭 로그가 없습니다.');
        setCallLogMeta('조회 결과 0건');
        return;
    }
    if (!filteredRows.length) {
        setCallLogTableMessage('검색/필터 조건에 맞는 로그가 없습니다.');
        setCallLogMeta(`조건 일치 0건 / 로드 ${callLogRows.length}건`);
        return;
    }

    let html = '';
    filteredRows.forEach((d) => {
        html += `
            <tr class="hover:bg-white/5 transition-colors">
                <td class="p-4 text-[#A7B2AE]">${formatAdminDateTime(d.createdAtRaw)}</td>
                <td class="p-4 text-white">${escapeHtml(d.partnerName || '-')}</td>
                <td class="p-4 font-mono text-[#A7B2AE]">${escapeHtml(d.phoneDigits || '-')}</td>
                <td class="p-4 text-white">${escapeHtml(d.callerName || d.callerUserId || '-')}</td>
                <td class="p-4 text-[#A7B2AE]">${escapeHtml(normalizeCallRoleLabel(d.callerRole))}</td>
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
    setCallLogMeta(`조건 일치 ${filteredRows.length}건 / 로드 ${callLogRows.length}건`);
}

function toCsvCell(value) {
    const escaped = String(value ?? '').replace(/"/g, '""');
    return `"${escaped}"`;
}

function exportCallLogsCsv() {
    const rows = getFilteredCallLogRows();
    if (!rows.length) {
        alert('내보낼 로그가 없습니다.');
        return;
    }
    const header = ['시간', '업체', '전화번호', '발신자', '역할', '영업시간 여부'];
    const lines = [header.map(toCsvCell).join(',')];
    rows.forEach((row) => {
        lines.push(
            [
                formatAdminDateTime(row.createdAtRaw),
                row.partnerName || '-',
                row.phoneDigits || '-',
                row.callerName || row.callerUserId || '-',
                normalizeCallRoleLabel(row.callerRole),
                row.isBusinessOpen ? '영업중' : '영업외',
            ]
                .map(toCsvCell)
                .join(','),
        );
    });
    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `call_click_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function updateCallLogPaginationUi() {
    if (callLogLoading) {
        setCallLogLoadMoreVisible(true, '불러오는 중...', true);
        return;
    }
    setCallLogLoadMoreVisible(callLogHasMore, '더 보기', false);
}

async function ensureCallLogAccessForSearch() {
    if (sensitiveViewAccessSession.callLogs) return true;
    setCallLogReasonEditorVisible(true);
    setCallLogMeta('열람 사유를 입력한 뒤 확인 후 조회를 진행해주세요.');
    return false;
}

function resetCallLogUiState() {
    callLogRows = [];
    callLogLastDoc = null;
    callLogHasMore = false;
    callLogLoading = false;
    sensitiveViewAccessSession.callLogs = false;

    resetCallLogFilterInputs();
    setCallLogSubjectPanelVisible(false);
    clearCallLogReasonEditor();
    setCallLogReasonEditorVisible(false);
    setCallLogTableMessage('조건 설정 후 조회 버튼을 눌러주세요.');
    setCallLogMeta('조회 전입니다.');
    updateCallLogPaginationUi();
}

function setChatLogTableMessage(message, tone = 'muted') {
    const tbody = document.getElementById('chat-log-table-body');
    if (!tbody) return;
    const cls =
        tone === 'error'
            ? 'text-red-400'
            : tone === 'warn'
                ? 'text-yellow-300'
                : 'text-[#A7B2AE]';
    tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center ${cls}">${escapeHtml(message)}</td></tr>`;
}

function setChatLogMeta(message = '') {
    const el = document.getElementById('chat-log-meta');
    if (!el) return;
    el.textContent = message;
}

function setChatLogLoadMoreVisible(visible, label = '더 보기', disabled = false) {
    const btn = document.getElementById('chat-log-load-more');
    if (!btn) return;
    btn.classList.toggle('hidden', !visible);
    btn.textContent = label;
    btn.disabled = disabled;
    btn.classList.toggle('opacity-60', disabled);
    btn.classList.toggle('cursor-not-allowed', disabled);
}

function setChatLogReasonEditorVisible(visible) {
    const wrap = document.getElementById('chat-log-reason-wrap');
    if (!wrap) return;
    wrap.classList.toggle('hidden', !visible);
}

function clearChatLogReasonEditor() {
    const input = document.getElementById('chat-log-reason-input');
    if (input) input.value = '';
}

function getChatLogSubjectOptionsByRole(role) {
    if (role === 'user') return callLogUserOptions;
    if (role === 'partner') return callLogPartnerOptions;
    const combined = [
        ...callLogUserOptions.map((row) => ({ ...row, label: `[개인] ${row.label}` })),
        ...callLogPartnerOptions.map((row) => ({ ...row, label: `[업체] ${row.label}` })),
    ];
    return sortCallLogSubjectOptions(combined);
}

function setChatLogSubjectPanelVisible(visible) {
    const panel = document.getElementById('chat-log-subject-panel');
    const toggle = document.getElementById('chat-log-subject-toggle');
    if (!panel || !toggle) return;
    panel.classList.toggle('hidden', !visible);
    toggle.textContent = visible ? '대상 리스트 닫기' : '대상 리스트 열기';
}

function updateChatLogSubjectSelectedLabel() {
    const selectedEl = document.getElementById('chat-log-subject-selected');
    if (!selectedEl) return;
    if (!chatLogFilters.subjectUserId || chatLogFilters.subjectUserId === 'all') {
        selectedEl.textContent = '선택 대상: 전체';
        return;
    }
    const options = getChatLogSubjectOptionsByRole(chatLogFilters.role || 'all');
    const selected = options.find((row) => row.userId === chatLogFilters.subjectUserId);
    selectedEl.textContent = selected
        ? `선택 대상: ${selected.label}`
        : `선택 대상: ${chatLogFilters.subjectUserId}`;
}

function renderChatLogSubjectList() {
    const roleEl = document.getElementById('chat-log-role');
    const listEl = document.getElementById('chat-log-subject-list');
    const titleEl = document.getElementById('chat-log-subject-title');
    if (!roleEl || !listEl || !titleEl) return;
    const role = roleEl.value || 'all';
    const titleMap = {
        all: '전체 대상 목록 (개인 + 업체)',
        user: '개인회원 목록',
        partner: '업체회원 목록',
    };
    titleEl.textContent = titleMap[role] || '대상 목록';
    const source = getChatLogSubjectOptionsByRole(role);
    const selectedId = chatLogFilters.subjectUserId || 'all';

    const allClass =
        selectedId === 'all'
            ? 'w-full text-left px-3 py-2 rounded-lg text-sm bg-[var(--point-color)]/20 border border-[var(--point-color)] text-[var(--point-color)]'
            : 'w-full text-left px-3 py-2 rounded-lg text-sm border border-[#2A3731] text-[#A7B2AE] hover:text-white hover:border-[var(--point-color)] transition-colors';
    let html = `<button type="button" data-user-id="all" class="${allClass}">전체</button>`;
    if (!source.length) {
        html += '<div class="px-3 py-2 text-xs text-[#7F8E88]">표시할 대상이 없습니다.</div>';
    } else {
        source.forEach((row) => {
            const itemClass =
                row.userId === selectedId
                    ? 'w-full text-left px-3 py-2 rounded-lg text-sm bg-[var(--point-color)]/20 border border-[var(--point-color)] text-[var(--point-color)]'
                    : 'w-full text-left px-3 py-2 rounded-lg text-sm border border-[#2A3731] text-[#A7B2AE] hover:text-white hover:border-[var(--point-color)] transition-colors';
            html += `<button type="button" data-user-id="${escapeHtml(row.userId)}" class="${itemClass}">${escapeHtml(row.label)}</button>`;
        });
    }
    listEl.innerHTML = html;
    listEl.querySelectorAll('button[data-user-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
            chatLogFilters.subjectUserId = btn.getAttribute('data-user-id') || 'all';
            updateChatLogSubjectSelectedLabel();
            renderChatLogSubjectList();
        });
    });
}

function getChatLogDateRange() {
    const now = new Date();
    if (chatLogFilters.fromDate || chatLogFilters.toDate) {
        const from = chatLogFilters.fromDate
            ? new Date(`${chatLogFilters.fromDate}T00:00:00`)
            : null;
        const to = chatLogFilters.toDate
            ? new Date(`${chatLogFilters.toDate}T23:59:59`)
            : null;
        return { from, to };
    }
    if (chatLogFilters.period === 'all') return { from: null, to: null };
    if (chatLogFilters.period === 'today') {
        const from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        return { from, to: now };
    }
    const days = chatLogFilters.period === '30d' ? 30 : 7;
    const from = new Date(now);
    from.setHours(0, 0, 0, 0);
    from.setDate(from.getDate() - (days - 1));
    return { from, to: now };
}

function readChatLogFilterInputs() {
    const searchEl = document.getElementById('chat-log-search');
    const roleEl = document.getElementById('chat-log-role');
    const periodEl = document.getElementById('chat-log-period');
    const fromEl = document.getElementById('chat-log-from');
    const toEl = document.getElementById('chat-log-to');
    const sortEl = document.getElementById('chat-log-sort');
    const nextRole = roleEl?.value || 'all';
    const roleChanged = chatLogFilters.role !== nextRole;
    const nextSubjectUserId = roleChanged ? 'all' : chatLogFilters.subjectUserId || 'all';
    chatLogFilters = {
        search: String(searchEl?.value || '').trim(),
        role: nextRole,
        subjectUserId: nextSubjectUserId,
        period: periodEl?.value || CHAT_LOG_PERIOD_DEFAULT,
        fromDate: fromEl?.value || '',
        toDate: toEl?.value || '',
        sort: sortEl?.value === 'asc' ? 'asc' : 'desc',
    };
    if (roleChanged) {
        renderChatLogSubjectList();
    }
    updateChatLogSubjectSelectedLabel();
}

function resetChatLogFilterInputs() {
    const searchEl = document.getElementById('chat-log-search');
    const roleEl = document.getElementById('chat-log-role');
    const periodEl = document.getElementById('chat-log-period');
    const fromEl = document.getElementById('chat-log-from');
    const toEl = document.getElementById('chat-log-to');
    const sortEl = document.getElementById('chat-log-sort');
    if (searchEl) searchEl.value = '';
    if (roleEl) roleEl.value = 'all';
    if (periodEl) periodEl.value = CHAT_LOG_PERIOD_DEFAULT;
    if (fromEl) fromEl.value = '';
    if (toEl) toEl.value = '';
    if (sortEl) sortEl.value = 'desc';
    chatLogFilters = {
        search: '',
        role: 'all',
        subjectUserId: 'all',
        period: CHAT_LOG_PERIOD_DEFAULT,
        fromDate: '',
        toDate: '',
        sort: 'desc',
    };
    renderChatLogSubjectList();
    updateChatLogSubjectSelectedLabel();
    setChatLogSubjectPanelVisible(false);
}

function renderChatLogRows() {
    const tbody = document.getElementById('chat-log-table-body');
    if (!tbody) return;
    if (!chatLogRows.length) {
        setChatLogTableMessage('채팅 로그가 없습니다.');
        setChatLogMeta('조회 결과 0건');
        return;
    }
    const keyword = chatLogFilters.search.toLowerCase();
    const filtered = chatLogRows.filter((row) => {
        if (!keyword) return true;
        return [row.threadId, row.senderName, row.senderUserId, row.text]
            .map((v) => String(v || '').toLowerCase())
            .join(' ')
            .includes(keyword);
    });
    if (!filtered.length) {
        setChatLogTableMessage('검색 조건에 맞는 채팅 로그가 없습니다.');
        setChatLogMeta(`조건 일치 0건 / 로드 ${chatLogRows.length}건`);
        return;
    }
    filtered.sort((a, b) =>
        chatLogFilters.sort === 'asc' ? a.createdAtMs - b.createdAtMs : b.createdAtMs - a.createdAtMs,
    );
    let html = '';
    filtered.forEach((row) => {
        html += `
            <tr class="hover:bg-white/5 transition-colors">
                <td class="p-4 text-[#A7B2AE]">${formatAdminDateTime(row.createdAtRaw)}</td>
                <td class="p-4 text-white font-mono text-xs">${escapeHtml(row.threadId || '-')}</td>
                <td class="p-4 text-white">${escapeHtml(row.senderName || row.senderUserId || '-')}</td>
                <td class="p-4 text-[#A7B2AE]">${escapeHtml(normalizeCallRoleLabel(row.senderRole || '-'))}</td>
                <td class="p-4 text-[#A7B2AE] max-w-[420px] truncate">${escapeHtml(row.text || '-')}</td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
    setChatLogMeta(`조건 일치 ${filtered.length}건 / 로드 ${chatLogRows.length}건`);
}

async function fetchChatLogs({ loadMore = false } = {}) {
    if (chatLogLoading) return;
    if (loadMore && !chatLogHasMore) return;
    chatLogLoading = true;
    setChatLogLoadMoreVisible(true, '불러오는 중...', true);
    if (!loadMore) {
        chatLogRows = [];
        chatLogLastDoc = null;
        chatLogHasMore = false;
        setChatLogTableMessage('불러오는 중...');
    }
    try {
        const range = getChatLogDateRange();
        if (
            chatLogFilters.period === 'custom' &&
            (!range.from || !range.to || range.from.getTime() > range.to.getTime())
        ) {
            alert('직접 선택 기간을 정확히 입력해주세요.');
            return;
        }
        let query = db.collection('chat_messages');
        if (range.from) {
            query = query.where('createdAt', '>=', firebase.firestore.Timestamp.fromDate(range.from));
        }
        if (range.to) {
            query = query.where('createdAt', '<=', firebase.firestore.Timestamp.fromDate(range.to));
        }
        if (chatLogFilters.role !== 'all') {
            query = query.where('senderRole', '==', chatLogFilters.role);
        }
        if (chatLogFilters.subjectUserId && chatLogFilters.subjectUserId !== 'all') {
            query = query.where('senderUserId', '==', chatLogFilters.subjectUserId);
        }
        query = query.orderBy('createdAt', chatLogFilters.sort).limit(CHAT_LOG_PAGE_SIZE);
        if (loadMore && chatLogLastDoc) query = query.startAfter(chatLogLastDoc);
        const snap = await query.get();
        const mapped = snap.docs.map((doc) => {
            const d = doc.data() || {};
            const date = typeof d.createdAt?.toDate === 'function' ? d.createdAt.toDate() : null;
            return {
                id: doc.id,
                threadId: d.threadId || '',
                senderRole: d.senderRole || '',
                senderName: d.senderName || '',
                senderUserId: d.senderUserId || '',
                text: d.text || '',
                createdAtRaw: d.createdAt || null,
                createdAtMs: date ? date.getTime() : 0,
            };
        });
        chatLogRows = loadMore ? chatLogRows.concat(mapped) : mapped;
        chatLogLastDoc = snap.docs.length ? snap.docs[snap.docs.length - 1] : null;
        chatLogHasMore = snap.size === CHAT_LOG_PAGE_SIZE;
        renderChatLogRows();
    } catch (err) {
        console.error('채팅 로그 로드 실패:', err);
        setChatLogTableMessage(`로드 실패: ${err.message}`, 'error');
        setChatLogMeta('조회 실패');
    } finally {
        chatLogLoading = false;
        setChatLogLoadMoreVisible(chatLogHasMore, '더 보기', false);
    }
}

function resetChatLogUiState() {
    chatLogRows = [];
    chatLogLastDoc = null;
    chatLogHasMore = false;
    chatLogLoading = false;
    sensitiveViewAccessSession.chatLogs = false;
    resetChatLogFilterInputs();
    clearChatLogReasonEditor();
    setChatLogReasonEditorVisible(false);
    setChatLogTableMessage('조건 설정 후 조회 버튼을 눌러주세요.');
    setChatLogMeta('조회 전입니다.');
    setChatLogLoadMoreVisible(false);
}

function resetMessageCenterUiState() {
    if (unsubscribeAdminMessages) {
        unsubscribeAdminMessages();
        unsubscribeAdminMessages = null;
    }
    if (messageSchedulerTimer) {
        clearInterval(messageSchedulerTimer);
        messageSchedulerTimer = null;
    }
    const ids = [
        'msg-title-input',
        'msg-body-input',
        'msg-schedule-at',
    ];
    ids.forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    resetMessageAttachmentInput();
    const selectDefaults = [
        ['msg-template-select', ''],
        ['msg-link-type', 'none'],
        ['msg-delivery-mode', 'notice'],
        ['msg-category', 'notice'],
        ['msg-priority', 'normal'],
    ];
    selectDefaults.forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.value = value;
    });
    sensitiveViewAccessSession.messageCenter = false;
}

async function fetchCallClickLogs({ loadMore = false } = {}) {
    if (callLogLoading) return;
    if (loadMore && !callLogHasMore) return;

    const range = getCallLogDateRange();
    if (
        callLogFilters.period === 'custom' &&
        (!range.from || !range.to || range.from.getTime() > range.to.getTime())
    ) {
        alert('직접 선택 기간을 정확히 입력해주세요.');
        return;
    }

    callLogLoading = true;
    updateCallLogPaginationUi();
    if (!loadMore) {
        callLogRows = [];
        callLogLastDoc = null;
        callLogHasMore = false;
        setCallLogTableMessage('불러오는 중...');
        setCallLogMeta('조회 중...');
    }

    try {
        let query = db.collection('call_click_logs');
        if (range.from) {
            query = query.where('createdAt', '>=', firebase.firestore.Timestamp.fromDate(range.from));
        }
        if (range.to) {
            query = query.where('createdAt', '<=', firebase.firestore.Timestamp.fromDate(range.to));
        }
        if (callLogFilters.role !== 'all') {
            query = query.where('callerRole', '==', callLogFilters.role);
        }
        if (callLogFilters.subjectUserId && callLogFilters.subjectUserId !== 'all') {
            query = query.where('callerUserId', '==', callLogFilters.subjectUserId);
        }
        if (callLogFilters.business !== 'all') {
            query = query.where('isBusinessOpen', '==', callLogFilters.business === 'open');
        }

        query = query
            .orderBy('createdAt', callLogFilters.sort === 'asc' ? 'asc' : 'desc')
            .limit(CALL_LOG_PAGE_SIZE);

        if (loadMore && callLogLastDoc) {
            query = query.startAfter(callLogLastDoc);
        }

        const snap = await query.get();
        const mapped = snap.docs.map((doc) => {
            const data = doc.data() || {};
            const createdAtDate = typeof data.createdAt?.toDate === 'function' ? data.createdAt.toDate() : null;
            return {
                id: doc.id,
                createdAtRaw: data.createdAt || null,
                createdAtMs: createdAtDate ? createdAtDate.getTime() : 0,
                partnerName: data.partnerName || '',
                phoneDigits: data.phoneDigits || '',
                callerName: data.callerName || '',
                callerUserId: data.callerUserId || '',
                callerRole: data.callerRole || '',
                isBusinessOpen: Boolean(data.isBusinessOpen),
            };
        });

        callLogRows = loadMore ? callLogRows.concat(mapped) : mapped;
        callLogLastDoc = snap.docs.length ? snap.docs[snap.docs.length - 1] : null;
        callLogHasMore = snap.size === CALL_LOG_PAGE_SIZE;
        renderCallLogRows();
    } catch (err) {
        console.error('전화 클릭 로그 로드 실패:', err);
        setCallLogTableMessage(`로드 실패: ${err.message}`, 'error');
        setCallLogMeta('조회 실패');
    } finally {
        callLogLoading = false;
        updateCallLogPaginationUi();
    }
}

function initializeCallLogControls() {
    if (callLogUiInitialized) return;
    callLogUiInitialized = true;
    resetCallLogFilterInputs();

    const applyBtn = document.getElementById('call-log-apply');
    const resetBtn = document.getElementById('call-log-reset');
    const loadMoreBtn = document.getElementById('call-log-load-more');
    const csvBtn = document.getElementById('call-log-csv');
    const periodEl = document.getElementById('call-log-period');
    const searchEl = document.getElementById('call-log-search');
    const roleEl = document.getElementById('call-log-role');
    const subjectToggleBtn = document.getElementById('call-log-subject-toggle');
    const subjectCloseBtn = document.getElementById('call-log-subject-close');
    const reasonConfirmBtn = document.getElementById('call-log-reason-confirm');
    const reasonCancelBtn = document.getElementById('call-log-reason-cancel');

    if (applyBtn) {
        applyBtn.addEventListener('click', async () => {
            readCallLogFilterInputs();
            const canAccess = await ensureCallLogAccessForSearch();
            if (!canAccess) return;
            setCallLogReasonEditorVisible(false);
            await fetchCallClickLogs({ loadMore: false });
        });
    }
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            resetCallLogFilterInputs();
            callLogRows = [];
            callLogLastDoc = null;
            callLogHasMore = false;
            updateCallLogPaginationUi();
            setCallLogTableMessage('조건 설정 후 조회 버튼을 눌러주세요.');
            setCallLogMeta('필터가 초기화되었습니다.');
        });
    }
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', async () => {
            if (!sensitiveViewAccessSession.callLogs) return;
            await fetchCallClickLogs({ loadMore: true });
        });
    }
    if (csvBtn) {
        csvBtn.addEventListener('click', exportCallLogsCsv);
    }
    if (periodEl) {
        periodEl.addEventListener('change', () => {
            updateCallLogDateRangeInputState();
        });
    }
    if (roleEl) {
        roleEl.addEventListener('change', () => {
            callLogFilters.role = roleEl.value || 'all';
            callLogFilters.subjectUserId = 'all';
            renderCallLogSubjectList();
            updateCallLogSubjectSelectedLabel();
        });
    }
    if (subjectToggleBtn) {
        subjectToggleBtn.addEventListener('click', () => {
            const panel = document.getElementById('call-log-subject-panel');
            const isHidden = panel ? panel.classList.contains('hidden') : true;
            if (isHidden) {
                renderCallLogSubjectList();
            }
            setCallLogSubjectPanelVisible(isHidden);
        });
    }
    if (subjectCloseBtn) {
        subjectCloseBtn.addEventListener('click', () => {
            setCallLogSubjectPanelVisible(false);
        });
    }
    if (searchEl) {
        searchEl.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                readCallLogFilterInputs();
                ensureCallLogAccessForSearch().then((canAccess) => {
                    if (!canAccess) return;
                    setCallLogReasonEditorVisible(false);
                    fetchCallClickLogs({ loadMore: false });
                });
            }
        });
    }
    if (reasonCancelBtn) {
        reasonCancelBtn.addEventListener('click', () => {
            setCallLogReasonEditorVisible(false);
            clearCallLogReasonEditor();
            setCallLogMeta('열람 사유 입력이 취소되었습니다.');
        });
    }
    if (reasonConfirmBtn) {
        reasonConfirmBtn.addEventListener('click', async () => {
            const input = document.getElementById('call-log-reason-input');
            const reason = String(input?.value || '').trim();
            if (reason.length < SENSITIVE_VIEW_MIN_REASON_LENGTH) {
                setCallLogMeta(`열람 사유를 최소 ${SENSITIVE_VIEW_MIN_REASON_LENGTH}자 이상 입력해주세요.`);
                if (input) input.focus();
                return;
            }
            sensitiveViewAccessSession.callLogs = true;
            await writeDevAlertAuditLog('sensitive_view_granted', 'granted', {
                scope: 'callLogs',
                viewReason: reason,
            });
            setCallLogReasonEditorVisible(false);
            clearCallLogReasonEditor();
            readCallLogFilterInputs();
            await fetchCallClickLogs({ loadMore: false });
        });
    }
}

async function loadCallClickLogs() {
    initializeCallLogControls();
    renderCallLogSubjectList();
    updateCallLogSubjectSelectedLabel();
    readCallLogFilterInputs();
    callLogRows = [];
    callLogLastDoc = null;
    callLogHasMore = false;
    setCallLogReasonEditorVisible(false);
    setCallLogTableMessage('조건 설정 후 조회 버튼을 눌러주세요.');
    setCallLogMeta('조회 전입니다.');
    updateCallLogPaginationUi();
}

function initializeChatLogControls() {
    if (chatLogUiInitialized) return;
    chatLogUiInitialized = true;
    resetChatLogFilterInputs();
    const applyBtn = document.getElementById('chat-log-apply');
    const resetBtn = document.getElementById('chat-log-reset');
    const loadMoreBtn = document.getElementById('chat-log-load-more');
    const reasonConfirmBtn = document.getElementById('chat-log-reason-confirm');
    const reasonCancelBtn = document.getElementById('chat-log-reason-cancel');
    const searchEl = document.getElementById('chat-log-search');
    const roleEl = document.getElementById('chat-log-role');
    const subjectToggleBtn = document.getElementById('chat-log-subject-toggle');
    const subjectCloseBtn = document.getElementById('chat-log-subject-close');

    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            if (!sensitiveViewAccessSession.chatLogs) {
                setChatLogReasonEditorVisible(true);
                setChatLogMeta('열람 사유를 입력한 뒤 확인 후 조회를 진행해주세요.');
                return;
            }
            readChatLogFilterInputs();
            fetchChatLogs({ loadMore: false });
        });
    }
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            resetChatLogUiState();
        });
    }
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            if (!sensitiveViewAccessSession.chatLogs) return;
            fetchChatLogs({ loadMore: true });
        });
    }
    if (searchEl) {
        searchEl.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            if (!sensitiveViewAccessSession.chatLogs) {
                setChatLogReasonEditorVisible(true);
                return;
            }
            readChatLogFilterInputs();
            fetchChatLogs({ loadMore: false });
        });
    }
    if (roleEl) {
        roleEl.addEventListener('change', () => {
            chatLogFilters.role = roleEl.value || 'all';
            chatLogFilters.subjectUserId = 'all';
            renderChatLogSubjectList();
            updateChatLogSubjectSelectedLabel();
        });
    }
    if (subjectToggleBtn) {
        subjectToggleBtn.addEventListener('click', () => {
            const panel = document.getElementById('chat-log-subject-panel');
            const isHidden = panel ? panel.classList.contains('hidden') : true;
            if (isHidden) {
                renderChatLogSubjectList();
            }
            setChatLogSubjectPanelVisible(isHidden);
        });
    }
    if (subjectCloseBtn) {
        subjectCloseBtn.addEventListener('click', () => {
            setChatLogSubjectPanelVisible(false);
        });
    }
    if (reasonCancelBtn) {
        reasonCancelBtn.addEventListener('click', () => {
            setChatLogReasonEditorVisible(false);
            clearChatLogReasonEditor();
        });
    }
    if (reasonConfirmBtn) {
        reasonConfirmBtn.addEventListener('click', async () => {
            const input = document.getElementById('chat-log-reason-input');
            const reason = String(input?.value || '').trim();
            if (reason.length < SENSITIVE_VIEW_MIN_REASON_LENGTH) {
                setChatLogMeta(`열람 사유를 최소 ${SENSITIVE_VIEW_MIN_REASON_LENGTH}자 이상 입력해주세요.`);
                if (input) input.focus();
                return;
            }
            sensitiveViewAccessSession.chatLogs = true;
            await writeDevAlertAuditLog('sensitive_view_granted', 'granted', {
                scope: 'chatLogs',
                viewReason: reason,
            });
            setChatLogReasonEditorVisible(false);
            clearChatLogReasonEditor();
            readChatLogFilterInputs();
            await fetchChatLogs({ loadMore: false });
        });
    }
}

async function loadChatLogsTab() {
    initializeChatLogControls();
    resetChatLogUiState();
    renderChatLogSubjectList();
    updateChatLogSubjectSelectedLabel();
}

function cleanupAdminChatConsole() {
    if (typeof adminChatMessagesUnsub === 'function') {
        try {
            adminChatMessagesUnsub();
        } catch (e) {
            /* noop */
        }
        adminChatMessagesUnsub = null;
    }
    if (typeof adminChatThreadsUnsub === 'function') {
        try {
            adminChatThreadsUnsub();
        } catch (e) {
            /* noop */
        }
        adminChatThreadsUnsub = null;
    }
    adminChatSelectedThreadId = null;
}

function getAdminChatPeerLabel(thread = {}) {
    const id = String(thread.id || '');
    if (id.startsWith('admin__p_')) return thread.partnerName || '업체';
    if (id.startsWith('admin__u_')) return thread.userName || '고객';
    return thread.partnerName || thread.userName || '대화';
}

function getAdminConsoleUnread(thread = {}) {
    const id = String(thread.id || '');
    if (id.startsWith('admin__p_')) return Number(thread.unreadForUser || 0);
    if (id.startsWith('admin__u_')) return Number(thread.unreadForPartner || 0);
    return 0;
}

function getChatMessageCreatedMs(createdAt) {
    if (!createdAt) return 0;
    if (typeof createdAt.toMillis === 'function') return createdAt.toMillis();
    if (typeof createdAt === 'number') return createdAt;
    if (typeof createdAt.seconds === 'number') return createdAt.seconds * 1000;
    return 0;
}

function sortChatMessagesByCreatedAsc(rows) {
    rows.sort((a, b) => getChatMessageCreatedMs(a.createdAt) - getChatMessageCreatedMs(b.createdAt));
}

function renderAdminChatThreadList(rows = []) {
    const el = document.getElementById('admin-chat-thread-list');
    if (!el) return;
    if (!rows.length) {
        el.innerHTML =
            '<p class="text-sm text-[#A7B2AE] p-4 text-center">다독 관리자 연결 대화가 없습니다.<br><span class="text-[11px]">메세지 센터에서 발송하면 여기에 표시됩니다.</span></p>';
        return;
    }
    el.innerHTML = rows
        .map((t) => {
            const label = escapeHtml(getAdminChatPeerLabel(t));
            const unread = getAdminConsoleUnread(t);
            const last = escapeHtml(String(t.lastMessage || '').slice(0, 120));
            const timeMs = t.updatedAt?.toMillis ? t.updatedAt.toMillis() : 0;
            const timeLabel = timeMs ? formatMessageDate(new Date(timeMs)) : '-';
            const active =
                String(adminChatSelectedThreadId) === String(t.id)
                    ? 'ring-2 ring-[var(--point-color)] bg-[#11291D]'
                    : 'hover:bg-[#11291D]/80';
            // onclick은 큰따옴표 속성이면 JSON.stringify의 " 와 충돌 → 속성은 작은따옴표로 감쌈
            const idArg = JSON.stringify(t.id);
            return `
            <div class="flex gap-1 items-stretch rounded-xl border border-[#2A3731] bg-[#06110D] ${active} transition-colors">
                <button type="button" class="flex-1 min-w-0 text-left px-3 py-2.5 rounded-l-[10px] rounded-r-none"
                    onclick='openAdminChatConsoleThread(${idArg})'>
                    <div class="flex justify-between gap-2 items-start">
                        <span class="text-white font-semibold text-sm truncate">${label}</span>
                        ${unread > 0 ? `<span class="shrink-0 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">${unread}</span>` : ''}
                    </div>
                    <p class="text-[12px] text-[#A7B2AE] truncate mt-0.5">${last || '—'}</p>
                    <span class="text-[10px] text-[#6B7A72] mt-1 inline-block">${timeLabel}</span>
                </button>
                <button type="button" class="shrink-0 w-10 flex items-center justify-center rounded-r-[10px] border-l border-[#2A3731] text-[#6B7A72] hover:text-red-400 hover:bg-red-950/20 transition-colors"
                    title="대화 삭제" aria-label="대화 삭제"
                    onclick='event.stopPropagation(); deleteAdminChatThread(${idArg})'>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                </button>
            </div>`;
        })
        .join('');
}

function renderAdminChatMessagePane(messages = []) {
    const el = document.getElementById('admin-chat-messages');
    if (!el) return;
    if (!messages.length) {
        el.innerHTML =
            '<p class="text-sm text-[#A7B2AE] text-center py-8">메시지가 없습니다.</p>';
        return;
    }
    el.innerHTML = messages
        .map((m) => {
            const mine = (m.senderRole || '') === 'admin';
            const safe = escapeHtml(String(m.text || '')).replace(/\n/g, '<br>');
            const ts = m.createdAt?.toMillis ? formatMessageDate(new Date(m.createdAt.toMillis())) : '';
            if (mine) {
                return `<div class="flex justify-end mb-2"><div class="max-w-[85%] bg-[var(--point-color)]/25 border border-[var(--point-color)]/50 text-white px-3 py-2 rounded-2xl rounded-tr-sm text-sm">${safe}<div class="text-[10px] text-[#A7B2AE] text-right mt-1">${ts}</div></div></div>`;
            }
            const who =
                m.senderRole === 'partner'
                    ? '업체'
                    : m.senderRole === 'user'
                      ? '회원'
                      : escapeHtml(m.senderName || '상대');
            return `<div class="flex justify-start mb-2"><div class="max-w-[85%] bg-[#08150F] border border-[#2A3731] text-[#C8D1CD] px-3 py-2 rounded-2xl rounded-tl-sm text-sm"><span class="text-[10px] text-[var(--point-color)] font-bold">${who}</span><div class="mt-0.5">${safe}</div><div class="text-[10px] text-[#6B7A72] mt-1">${ts}</div></div></div>`;
        })
        .join('');
    el.scrollTop = el.scrollHeight;
}

async function markAdminThreadRead(threadId) {
    const id = String(threadId || '');
    if (!id) return;
    const patch = id.startsWith('admin__p_') ? { unreadForUser: 0 } : { unreadForPartner: 0 };
    try {
        await db
            .collection('chat_threads')
            .doc(id)
            .set(
                {
                    ...patch,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                },
                { merge: true },
            );
    } catch (e) {
        console.warn('관리자 읽음 처리 실패:', e);
    }
}

function loadAdminChatConsole() {
    cleanupAdminChatConsole();
    backfillAdminUserChatThreadsMetadata().catch(() => {});
    const listEl = document.getElementById('admin-chat-thread-list');
    const msgEl = document.getElementById('admin-chat-messages');
    const headerEl = document.getElementById('admin-chat-header-title');
    const compose = document.getElementById('admin-chat-compose');
    if (headerEl) headerEl.textContent = '대화를 선택하세요';
    if (msgEl) {
        msgEl.innerHTML =
            '<p class="text-sm text-[#A7B2AE] text-center py-8">왼쪽에서 대화를 선택하면 메시지가 표시됩니다.</p>';
    }
    if (compose) compose.classList.add('hidden');
    if (listEl) listEl.innerHTML = '<p class="text-sm text-[#A7B2AE] p-4 text-center">불러오는 중...</p>';

    const FieldPath = firebase.firestore.FieldPath;
    try {
        adminChatThreadsUnsub = db
            .collection('chat_threads')
            .orderBy(FieldPath.documentId())
            .startAt('admin__')
            .endAt('admin__\uf8ff')
            .onSnapshot(
                (snap) => {
                    const rows = snap.docs.map((d) => ({ ...(d.data() || {}), id: d.id }));
                    rows.sort((a, b) => {
                        const am = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
                        const bm = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
                        return bm - am;
                    });
                    renderAdminChatThreadList(rows);
                },
                (err) => {
                    console.error('관리자 채팅 목록 로드 실패:', err);
                    if (listEl) {
                        listEl.innerHTML = `<p class="text-sm text-red-300 p-4">목록을 불러오지 못했습니다. Firestore 인덱스·규칙을 확인하세요.<br><span class="text-[11px] text-[#A7B2AE]">${escapeHtml(err.message || '')}</span></p>`;
                    }
                },
            );
    } catch (err) {
        console.error(err);
        if (listEl) listEl.innerHTML = '<p class="text-sm text-red-300 p-4">채팅 목록 쿼리 초기화 실패</p>';
    }
}

window.openAdminChatConsoleThread = async function (threadId) {
    const id = String(threadId || '');
    if (!id || !db) return;
    adminChatSelectedThreadId = id;
    const headerEl = document.getElementById('admin-chat-header-title');
    const compose = document.getElementById('admin-chat-compose');
    const snap = await db.collection('chat_threads').doc(id).get();
    const t = snap.exists ? { id: snap.id, ...(snap.data() || {}) } : { id };
    if (headerEl) {
        headerEl.textContent = `${getAdminChatPeerLabel(t)} · 관리자 대화`;
    }
    if (compose) compose.classList.remove('hidden');

    if (typeof adminChatMessagesUnsub === 'function') {
        adminChatMessagesUnsub();
        adminChatMessagesUnsub = null;
    }
    const msgEl = document.getElementById('admin-chat-messages');
    if (msgEl) msgEl.innerHTML = '<p class="text-sm text-[#A7B2AE] text-center py-6">연결 중...</p>';

    adminChatMessagesUnsub = db
        .collection('chat_messages')
        .where('threadId', '==', id)
        .onSnapshot(
            (snap) => {
                const rows = snap.docs.map((d) => ({ ...(d.data() || {}), id: d.id }));
                sortChatMessagesByCreatedAsc(rows);
                renderAdminChatMessagePane(rows);
            },
            (err) => {
                console.error('관리자 채팅 메시지:', err);
                if (msgEl) {
                    msgEl.innerHTML = `<p class="text-sm text-red-300 p-4">메시지를 불러오지 못했습니다.<br><span class="text-[11px]">${escapeHtml(err.message || '')}</span></p>`;
                }
            },
        );

    await markAdminThreadRead(id);
};

async function deleteAllChatMessagesForAdminThread(threadId) {
    const id = String(threadId || '');
    if (!id) return;
    const snapshot = await db.collection('chat_messages').where('threadId', '==', id).get();
    const docs = snapshot.docs;
    const chunkSize = 450;
    for (let i = 0; i < docs.length; i += chunkSize) {
        const batch = db.batch();
        docs.slice(i, i + chunkSize).forEach((d) => batch.delete(d.ref));
        await batch.commit();
    }
}

window.deleteAdminChatThread = async function (threadId) {
    const id = String(threadId || '');
    if (!id || !db) return;
    if (!id.startsWith('admin__')) {
        alert('삭제할 수 없는 대화입니다.');
        return;
    }
    if (!confirm('이 대화방을 삭제할까요?\n목록과 저장된 모든 메시지가 삭제됩니다.')) return;
    try {
        await deleteAllChatMessagesForAdminThread(id);
        await db.collection('chat_threads').doc(id).delete();
        if (String(adminChatSelectedThreadId) === id) {
            if (typeof adminChatMessagesUnsub === 'function') {
                try {
                    adminChatMessagesUnsub();
                } catch (e) {
                    /* noop */
                }
                adminChatMessagesUnsub = null;
            }
            adminChatSelectedThreadId = null;
            const msgEl = document.getElementById('admin-chat-messages');
            if (msgEl) {
                msgEl.innerHTML =
                    '<p class="text-sm text-[#A7B2AE] text-center py-8">왼쪽에서 대화를 선택하면 메시지가 표시됩니다.</p>';
            }
            const compose = document.getElementById('admin-chat-compose');
            if (compose) compose.classList.add('hidden');
            const headerEl = document.getElementById('admin-chat-header-title');
            if (headerEl) headerEl.textContent = '대화를 선택하세요';
        }
    } catch (e) {
        console.error(e);
        alert('삭제 실패: ' + (e.message || ''));
    }
};

window.sendAdminConsoleMessage = async function () {
    const input = document.getElementById('admin-chat-input');
    const text = String(input?.value || '').trim();
    const id = adminChatSelectedThreadId;
    if (!text || !id) return;
    const isP = id.startsWith('admin__p_');
    const unreadField = isP ? 'unreadForPartner' : 'unreadForUser';
    const targetDocId = isP ? id.replace(/^admin__p_/, '') : id.replace(/^admin__u_/, '');
    const threadMetaPatch = isP
        ? {
              isAdminChannel: true,
              participantPartnerDocId: targetDocId,
          }
        : {
              isAdminChannel: true,
              participantUserDocId: targetDocId,
          };
    try {
        await db.collection('chat_messages').add({
            threadId: id,
            senderRole: 'admin',
            senderDocId: 'admin',
            senderUserId: auth.currentUser?.email || 'admin',
            senderName: '다독 관리자',
            text,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        await db
            .collection('chat_threads')
            .doc(id)
            .set(
                {
                    ...threadMetaPatch,
                    lastMessage: text,
                    lastSenderRole: 'admin',
                    lastAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    [unreadField]: firebase.firestore.FieldValue.increment(1),
                },
                { merge: true },
            );
        if (input) input.value = '';
    } catch (e) {
        console.error(e);
        alert('전송 실패: ' + (e.message || ''));
    }
};

async function loadDevAlertSecurityConfig() {
    try {
        const snap = await db.collection('admin_configs').doc('security').get();
        if (!snap.exists) return;
        const data = snap.data() || {};
        devAlertSecurityConfig.enabled = Boolean(data.devAlertEnabled);
        const allowlist = Array.isArray(data.devAlertAllowedEmails)
            ? data.devAlertAllowedEmails
            : [];
        devAlertSecurityConfig.allowedEmails = allowlist
            .map(normalizeEmail)
            .filter(Boolean);
        devAlertSecurityConfig.allowInProduction = Boolean(data.devAlertAllowInProduction);
    } catch (err) {
        console.warn('security 설정 로드 실패, 기본 정책 사용:', err?.message || err);
    }
}

function renderDevAlertGuardState() {
    const controls = document.getElementById('dev-alert-controls');
    if (!controls) return;

    let guardMessage = '';
    if (!auth.currentUser) {
        guardMessage = '로그인 후 권한이 확인되면 개발 알림 기능이 활성화됩니다.';
    } else if (!devAlertSecurityConfig.enabled) {
        guardMessage = '관리자 보안 설정에서 개발 알림 기능이 비활성화되어 있습니다.';
    } else if (isProductionEnvironment() && !devAlertSecurityConfig.allowInProduction) {
        guardMessage = '운영 환경에서는 개발 알림 버튼이 차단됩니다.';
    } else if (!hasDevAlertPermission()) {
        guardMessage = '현재 계정은 개발 알림 권한이 없습니다.';
    }

    if (guardMessage) {
        setDevAlertControlsVisible(false);
        setDevAlertGuardMessage(guardMessage);
        setDiscordLog('개발 알림 보호 모드 활성화', 'warn');
    } else {
        setDevAlertControlsVisible(true);
        setDevAlertGuardMessage('');
        setDiscordLog('대기 중...', 'neutral');
    }
    updateDevAlertButtonsState();
}

async function assertDevAlertAccess(actionKey) {
    if (!auth.currentUser) {
        alert('로그인 후 다시 시도해주세요.');
        await writeDevAlertAuditLog(actionKey, 'blocked', { reason: 'not_authenticated' });
        renderDevAlertGuardState();
        return false;
    }
    if (!devAlertSecurityConfig.enabled) {
        alert('개발 알림 기능이 비활성화되어 있습니다. 관리자 설정에서 활성화해주세요.');
        await writeDevAlertAuditLog(actionKey, 'blocked', { reason: 'feature_disabled' });
        renderDevAlertGuardState();
        return false;
    }
    if (isProductionEnvironment() && !devAlertSecurityConfig.allowInProduction) {
        alert('운영 환경에서는 개발 알림 기능이 차단됩니다.');
        await writeDevAlertAuditLog(actionKey, 'blocked', { reason: 'production_blocked' });
        renderDevAlertGuardState();
        return false;
    }
    if (!hasDevAlertPermission()) {
        alert('현재 계정에는 개발 알림 권한이 없습니다.');
        await writeDevAlertAuditLog(actionKey, 'blocked', { reason: 'permission_denied' });
        renderDevAlertGuardState();
        return false;
    }
    return true;
}

async function confirmPartnerResetSafetyChecks() {
    const firstConfirm = confirm(
        '진짜로 모든 파트너 데이터를 초기화(삭제) 하시겠습니까? 이 작업은 복구할 수 없습니다.',
    );
    if (!firstConfirm) return false;

    const typed = prompt(
        `정말 진행하려면 "${DEV_ALERT_DELETE_CONFIRM_TEXT}" 를 정확히 입력하세요.`,
    );
    if (typed !== DEV_ALERT_DELETE_CONFIRM_TEXT) {
        alert('확인 문구가 일치하지 않아 작업이 취소되었습니다.');
        return false;
    }

    alert('최종 안전 대기 5초 후 마지막 확인이 표시됩니다.');
    for (let remain = 5; remain > 0; remain--) {
        setDiscordLog(`초기화 안전 대기중... ${remain}초`, 'warn');
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return confirm('최종 확인: 업체/리뷰 데이터를 전체 초기화합니다. 계속할까요?');
}

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

/** admin__ 채팅 스레드에서 관리자가 아닌 쪽이 보낸 메시지(관리자 수신) 건수 */
function countAdminChannelReceivedMessages(snapshot) {
    if (!snapshot) return 0;
    let n = 0;
    snapshot.forEach((doc) => {
        const data = typeof doc.data === 'function' ? doc.data() || {} : {};
        if (String(data.senderRole || '') === 'admin') return;
        n++;
    });
    return n;
}

function recomputeSidebarUnreadFromCache() {
    if (!sidebarBadgeReadsLoaded) {
        renderAllSidebarCategoryBadges();
        return;
    }

    if (sidebarSnapshotCache.users) {
        const newUsers = countUnreadDocsByTimestamp(
            sidebarSnapshotCache.users,
            'users',
            ['createdAt'],
        );
        sidebarBadgeCounts.users = newUsers;
        sidebarBadgeUnreadCounts.users = newUsers;
    }

    if (sidebarSnapshotCache.partners) {
        sidebarBadgeUnreadCounts.shops = countUnreadDocsByTimestamp(
            sidebarSnapshotCache.partners,
            'shops',
            ['approvedAt'],
            (data) => String(data?.status || '').toLowerCase() !== 'pending',
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

    if (sidebarSnapshotCache.adminChatMessages) {
        const snap = sidebarSnapshotCache.adminChatMessages;
        sidebarBadgeCounts['admin-chat'] = countAdminChannelReceivedMessages(snap);
        sidebarBadgeUnreadCounts['admin-chat'] = countUnreadDocsByTimestamp(
            snap,
            'admin-chat',
            ['createdAt'],
            (data) => String(data.senderRole || '') !== 'admin',
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

    // 채팅 운영·회원 관리: 새로 갱신된 건수만 빨간 배지로 표시, 없으면 숨김
    if (key === 'admin-chat' || key === 'users' || key === 'shops') {
        if (!sidebarBadgeReadsLoaded || unreadCount <= 0) {
            badge.classList.add('hidden');
            return;
        }
        badge.textContent = String(unreadCount);
        badge.className = getSidebarBadgeStyleClass(true);
        badge.classList.remove('hidden');
        return;
    }

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
async function switchTab(tabId) {
    if (tabId !== 'calllogs') {
        resetCallLogUiState();
    }
    if (tabId !== 'chatcheck') {
        resetChatLogUiState();
    }
    if (tabId !== 'admin-chat') {
        cleanupAdminChatConsole();
    }
    if (tabId !== 'messages') {
        resetMessageCenterUiState();
    }
    if (tabId !== 'users') {
        stopUsersKpiAutoRefresh();
    }

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
    else if (tabId === 'messages') {
        await loadMessageCenter();
    }
    else if (tabId === 'dashboard') {
        updateDashboardStats();
    }
    else if (tabId === 'calllogs') {
        await loadCallClickLogs();
    }
    else if (tabId === 'chatcheck') {
        await loadChatLogsTab();
    }
    else if (tabId === 'admin-chat') {
        loadAdminChatConsole();
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

    if (modalId === 'modal-shop') {
        markShopChangesReviewed(shopModalCurrentPartnerId, shopModalLivePartnerData);
        shopModalCurrentPartnerId = '';
        clearShopModalRealtimeListeners();
        if (Array.isArray(shopFilteredRows) && shopFilteredRows.length > 0) {
            renderShopCards(shopFilteredRows);
        }
    }

    const targetModal = document.getElementById(modalId);
    if (targetModal) targetModal.classList.add('hidden');
}

// ─── Message Center ───
let messageCenterUsers = [];
let messageCenterPartners = [];
let unsubscribeAdminMessages = null;
let messageSchedulerTimer = null;
let isProcessingScheduledMessages = false;
let adminUserThreadBackfillDone = false;
let adminUserThreadBackfillPromise = null;

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
    if (mode === 'chat') return '문의 채팅만';
    return '공지/안내함+채팅';
}

async function backfillAdminUserChatThreadsMetadata() {
    if (adminUserThreadBackfillDone) {
        return { scanned: 0, updated: 0, skipped: true };
    }
    if (adminUserThreadBackfillPromise) return adminUserThreadBackfillPromise;

    adminUserThreadBackfillPromise = (async () => {
        const FieldPath = firebase.firestore.FieldPath;
        const limitSize = 200;
        let cursorDoc = null;
        let scanned = 0;
        let updated = 0;

        while (true) {
            let query = db
                .collection('chat_threads')
                .orderBy(FieldPath.documentId())
                .startAt('admin__u_')
                .endAt('admin__u_\uf8ff')
                .limit(limitSize);
            if (cursorDoc) query = query.startAfter(cursorDoc);

            const snap = await query.get();
            if (snap.empty) break;
            cursorDoc = snap.docs[snap.docs.length - 1];
            const batch = db.batch();
            let changedInBatch = 0;

            snap.docs.forEach((doc) => {
                scanned += 1;
                const threadId = String(doc.id || '');
                const data = doc.data() || {};
                const expectedUserDocId = threadId.replace(/^admin__u_/, '');
                if (!expectedUserDocId || expectedUserDocId === threadId) return;

                const patch = {};
                if (String(data.participantUserDocId || '').trim() !== expectedUserDocId) {
                    patch.participantUserDocId = expectedUserDocId;
                }
                if (String(data.id || '').trim() !== threadId) {
                    patch.id = threadId;
                }
                if (Object.keys(patch).length === 0) return;

                batch.set(doc.ref, patch, { merge: true });
                changedInBatch += 1;
            });

            if (changedInBatch > 0) {
                await batch.commit();
                updated += changedInBatch;
            }
            if (snap.size < limitSize) break;
        }

        adminUserThreadBackfillDone = true;
        if (updated > 0) {
            console.log(`[admin chat backfill] scanned=${scanned}, updated=${updated}`);
        }
        return { scanned, updated, skipped: false };
    })()
        .catch((err) => {
            console.error('관리자 사용자 채팅 스레드 백필 실패:', err);
            throw err;
        })
        .finally(() => {
            adminUserThreadBackfillPromise = null;
        });

    return adminUserThreadBackfillPromise;
}

const MESSAGE_ATTACHMENT_MAX_COUNT = 3;
const MESSAGE_ATTACHMENT_MAX_SIZE = 10 * 1024 * 1024;
const MESSAGE_ATTACHMENT_ALLOWED_EXT = [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'webp',
    'pdf',
    'txt',
    'doc',
    'docx',
    'xls',
    'xlsx',
    'ppt',
    'pptx',
    'zip',
    'rar',
];

function formatMessageAttachmentSize(bytes = 0) {
    const size = Number(bytes || 0);
    if (!Number.isFinite(size) || size <= 0) return '0B';
    if (size < 1024) return `${size}B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
    return `${(size / (1024 * 1024)).toFixed(1)}MB`;
}

function getMessageAttachmentExt(fileName = '') {
    const raw = String(fileName || '').trim().toLowerCase();
    const dot = raw.lastIndexOf('.');
    if (dot <= -1 || dot >= raw.length - 1) return '';
    return raw.slice(dot + 1);
}

function validateMessageAttachmentFiles(files = []) {
    if (!files.length) return { ok: true };
    if (files.length > MESSAGE_ATTACHMENT_MAX_COUNT) {
        return { ok: false, message: `첨부파일은 최대 ${MESSAGE_ATTACHMENT_MAX_COUNT}개까지 가능합니다.` };
    }
    for (const file of files) {
        if (!file) continue;
        if (Number(file.size || 0) > MESSAGE_ATTACHMENT_MAX_SIZE) {
            return {
                ok: false,
                message: `파일당 최대 용량은 10MB입니다. (${file.name})`,
            };
        }
        const ext = getMessageAttachmentExt(file.name);
        if (!ext || !MESSAGE_ATTACHMENT_ALLOWED_EXT.includes(ext)) {
            return {
                ok: false,
                message: `지원하지 않는 첨부파일 형식입니다. (${file.name})`,
            };
        }
    }
    return { ok: true };
}

function renderMessageAttachmentPreview(files = []) {
    const preview = document.getElementById('msg-attachments-preview');
    if (!preview) return;
    if (!files.length) {
        preview.innerHTML = '선택된 첨부파일 없음';
        return;
    }
    preview.innerHTML = files
        .map((file) => {
            const name = escapeHtml(file?.name || '파일');
            const size = formatMessageAttachmentSize(file?.size || 0);
            return `<div class="text-[#C8D1CD]">${name} <span class="text-[#7F8E88]">(${size})</span></div>`;
        })
        .join('');
}

function resetMessageAttachmentInput() {
    const input = document.getElementById('msg-attachments-input');
    if (input) input.value = '';
    renderMessageAttachmentPreview([]);
}

window.handleMessageAttachmentInput = function (inputEl) {
    const files = Array.from(inputEl?.files || []);
    const validation = validateMessageAttachmentFiles(files);
    if (!validation.ok) {
        alert(validation.message);
        if (inputEl) inputEl.value = '';
        renderMessageAttachmentPreview([]);
        return;
    }
    renderMessageAttachmentPreview(files);
};

async function uploadMessageAttachments(messageId, files = []) {
    if (!files.length) return [];
    if (typeof firebase === 'undefined' || typeof firebase.storage !== 'function') {
        throw new Error('파일 저장소 연결이 비활성화되어 첨부파일 업로드를 진행할 수 없습니다.');
    }
    const storage = firebase.storage();
    const uploaded = [];
    for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        if (!file) continue;
        const safeName = String(file.name || `attachment-${i + 1}`)
            .replace(/[^\w.\-]+/g, '_')
            .slice(0, 120);
        const filePath = `admin_message_attachments/${messageId}/${Date.now()}_${i + 1}_${safeName}`;
        const ref = storage.ref().child(filePath);
        await ref.put(file);
        const downloadUrl = await ref.getDownloadURL();
        uploaded.push({
            name: file.name || safeName,
            url: downloadUrl,
            path: filePath,
            size: Number(file.size || 0),
            contentType: String(file.type || ''),
        });
    }
    return uploaded;
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
                    attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
                    attachmentCount: Number(payload.attachmentCount || 0),
                    isRead: false,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            const isPartner = r.type === 'partner';
            const chatThreadId = isPartner ? `admin__p_${r.docId}` : `admin__u_${r.docId}`;
            const threadRef = db.collection('chat_threads').doc(chatThreadId);
            const chatMessageRef = db.collection('chat_messages').doc();
            const unreadField = isPartner ? 'unreadForPartner' : 'unreadForUser';

            // 공지/채팅 모두 앱 채팅방에 동일 스레드로 기록 (공지만 선택해도 업체·회원 채팅에 표시)
            const threadPayload = isPartner
                ? {
                      id: chatThreadId,
                      isAdminChannel: true,
                      participantPartnerDocId: r.docId,
                      participantPartnerUserId: r.userId || '',
                      partnerName: r.name || '업체',
                      userName: '다독 관리자',
                      userId: 'admin',
                      userImage: '',
                      lastMessage: payload.body,
                      lastSenderRole: 'admin',
                      lastAt: firebase.firestore.FieldValue.serverTimestamp(),
                      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                      [unreadField]: firebase.firestore.FieldValue.increment(1),
                  }
                : {
                      id: chatThreadId,
                      isAdminChannel: true,
                      participantUserDocId: r.docId,
                      participantUserId: r.userId || '',
                      userName: r.name || '고객',
                      partnerName: '다독 관리자',
                      partnerUserId: 'admin',
                      partnerImage: '',
                      lastMessage: payload.body,
                      lastSenderRole: 'admin',
                      lastAt: firebase.firestore.FieldValue.serverTimestamp(),
                      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                      [unreadField]: firebase.firestore.FieldValue.increment(1),
                  };

            batch.set(threadRef, threadPayload, { merge: true });
            batch.set(chatMessageRef, {
                threadId: chatThreadId,
                senderRole: 'admin',
                senderDocId: 'admin',
                senderUserId: auth.currentUser?.email || 'admin',
                senderName: '다독 관리자',
                text: payload.body,
                category: payload.category || 'notice',
                messageId,
                attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
                attachmentCount: Number(payload.attachmentCount || 0),
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
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
        console.error('예약 메세지 스케줄러 오류:', err);
    } finally {
        isProcessingScheduledMessages = false;
    }
}

async function loadMessageCenter() {
    backfillAdminUserChatThreadsMetadata().catch(() => {});
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
        console.error('메세지 수신자 목록 로드 실패:', err);
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
    const attachmentInput = document.getElementById('msg-attachments-input');
    const attachmentFiles = Array.from(attachmentInput?.files || []);
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

    const attachmentValidation = validateMessageAttachmentFiles(attachmentFiles);
    if (!attachmentValidation.ok) {
        alert(attachmentValidation.message);
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
            attachments: [],
            attachmentCount: 0,
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
        let uploadedAttachments = [];
        if (attachmentFiles.length > 0) {
            uploadedAttachments = await uploadMessageAttachments(messageRef.id, attachmentFiles);
            await messageRef.update({
                attachments: uploadedAttachments,
                attachmentCount: uploadedAttachments.length,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
        }
        const payloadWithAttachments = {
            ...payload,
            attachments: uploadedAttachments,
            attachmentCount: uploadedAttachments.length,
        };
        if (scheduledDate) {
            alert(`예약 발송이 등록되었습니다.\n예정 시각: ${formatMessageDate(scheduledDate)}`);
        } else {
            const result = await dispatchAdminMessage(messageRef, payloadWithAttachments);
            if (!result.ok) {
                alert('메세지 발송에 실패했습니다. 수신자 목록을 확인해주세요.');
                return;
            }
            alert(`메세지가 ${result.count}명에게 발송되었습니다.\n발송 시각: ${formatMessageDate(new Date())}`);
        }

        const templateEl = document.getElementById('msg-template-select');
        const linkEl = document.getElementById('msg-link-type');
        const deliveryEl = document.getElementById('msg-delivery-mode');
        document.getElementById('msg-title-input').value = '';
        document.getElementById('msg-body-input').value = '';
        if (templateEl) templateEl.value = '';
        if (linkEl) linkEl.value = 'none';
        if (deliveryEl) deliveryEl.value = 'notice';
        resetMessageAttachmentInput();
        window.clearMessageSchedule();
        loadAdminMessageHistory();
    } catch (err) {
        console.error('메세지 발송 실패:', err);
        alert('메세지 발송 중 오류가 발생했습니다: ' + err.message);
    } finally {
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.innerText = '메세지 발송';
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
                const attachments = Array.isArray(data.attachments) ? data.attachments : [];
                const attachmentsHtml = attachments.length
                    ? `<div class="mt-2 flex flex-wrap gap-1.5">${attachments
                          .map(
                              (att, idx) =>
                                  `<a href="${escapeHtml(att?.url || '#')}" target="_blank" rel="noopener" class="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-[#2A3731] text-[10px] text-[#C8D1CD] hover:border-[var(--point-color)] hover:text-[var(--point-color)] transition-colors">${escapeHtml(att?.name || `첨부파일 ${idx + 1}`)}</a>`,
                          )
                          .join('')}</div>`
                    : '';
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
                        ${attachmentsHtml}
                    </div>
                `;
            });
            container.innerHTML = html;
        }, (err) => {
            console.error('메세지 이력 로드 실패:', err);
            container.innerHTML = `<div class="text-red-400 text-sm">이력 로드 실패: ${escapeHtml(err.message)}</div>`;
        });
}

// ─── Initial Listeners ───
window.addEventListener('DOMContentLoaded', () => {
    renderDevAlertGuardState();
    setCallLogTableMessage('조건 설정 후 조회 버튼을 눌러주세요.');
    db.collection('users').onSnapshot((snap) => {
        sidebarSnapshotCache.users = snap;
        currentUserCount = snap.size;
        callLogUserOptions = sortCallLogSubjectOptions(
            snap.docs
                .map((doc) => {
                    const data = doc.data() || {};
                    const userId = String(data.userId || doc.id || '').trim();
                    if (!userId) return null;
                    const name = String(data.name || data.userName || data.nickname || '').trim();
                    return {
                        userId,
                        label: name ? `${name} (${userId})` : userId,
                    };
                })
                .filter(Boolean),
        );
        renderCallLogSubjectList();
        updateCallLogSubjectSelectedLabel();
        renderChatLogSubjectList();
        updateChatLogSubjectSelectedLabel();
        const newUsers = countUnreadDocsByTimestamp(snap, 'users', ['createdAt']);
        setSidebarCategoryCount('users', newUsers, newUsers);
        recomputeSidebarUnreadFromCache();
        updateDashboardStats();
    });
    db.collection('partners').onSnapshot((snap) => {
        sidebarSnapshotCache.partners = snap;
        currentShopCount = snap.size;
        callLogPartnerOptions = sortCallLogSubjectOptions(
            snap.docs
                .map((doc) => {
                    const data = doc.data() || {};
                    const userId = String(data.userId || doc.id || '').trim();
                    if (!userId) return null;
                    const name = String(data.name || data.company || data.ownerName || '').trim();
                    return {
                        userId,
                        label: name ? `${name} (${userId})` : userId,
                    };
                })
                .filter(Boolean),
        );
        renderCallLogSubjectList();
        updateCallLogSubjectSelectedLabel();
        renderChatLogSubjectList();
        updateChatLogSubjectSelectedLabel();
        const shopUnread = countUnreadDocsByTimestamp(
            snap,
            'shops',
            ['approvedAt'],
            (data) => String(data?.status || '').toLowerCase() !== 'pending',
        );
        setSidebarCategoryCount('shops', 0, shopUnread);

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

    db.collection('chat_messages')
        .where('threadId', '>=', 'admin__')
        .where('threadId', '<=', 'admin__\uf8ff')
        .onSnapshot(
            (snap) => {
                sidebarSnapshotCache.adminChatMessages = snap;
                const totalReceived = countAdminChannelReceivedMessages(snap);
                const unread = countUnreadDocsByTimestamp(snap, 'admin-chat', ['createdAt'], (data) =>
                    String(data.senderRole || '') !== 'admin',
                );
                setSidebarCategoryCount('admin-chat', totalReceived, unread);
                recomputeSidebarUnreadFromCache();
            },
            (err) => console.error('채팅 운영 사이드바 배지 스트림 실패:', err),
        );
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

function normalizeUserStatus(data = {}) {
    const raw = String(data.accountStatus || data.status || '').toLowerCase();
    if (
        raw.includes('suspend') ||
        raw.includes('blocked') ||
        raw.includes('ban') ||
        raw.includes('정지') ||
        raw.includes('제재') ||
        data.isSuspended === true ||
        data.isBlocked === true
    ) {
        return 'sanctioned';
    }
    return 'active';
}

function getUserStatusMeta(status) {
    if (status === 'sanctioned') {
        return {
            label: '제재/정지',
            cls: 'bg-red-900/40 text-red-300 border border-red-700/50',
        };
    }
    return {
        label: '정상 활성',
        cls: 'bg-green-900/40 text-green-300 border border-green-700/50',
    };
}

function getUserLastLoginMs(data = {}) {
    return normalizeMsTimestamp(data.lastLoginAt);
}

function buildUserRow(doc) {
    const data = doc.data() || {};
    const createdAtMs = normalizeMsTimestamp(data.createdAt);
    const lastLoginMs = getUserLastLoginMs(data);
    const status = normalizeUserStatus(data);
    const dormant = status === 'active' && lastLoginMs > 0 && Date.now() - lastLoginMs > 30 * 24 * 60 * 60 * 1000;
    return {
        id: doc.id,
        userId: data.userId || doc.id || '알수없음',
        name: data.name || '알수없음',
        gender: data.gender || '-',
        phone: data.phone || '-',
        phoneMasked: data.phone || '-',
        profileImageUrl:
            data.profileImageUrl ||
            data.photoURL ||
            data.avatarUrl ||
            data.image ||
            '',
        createdAtRaw: data.createdAt || null,
        createdAtMs,
        lastLoginAtRaw: data.lastLoginAt || null,
        lastLoginMs,
        status,
        dormant,
        raw: data,
    };
}

function updateUsersKpis(rows = []) {
    const total = rows.length;
    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayMs = todayStart.getTime();
    let today = 0;
    let dormant = 0;
    let sanctioned = 0;
    rows.forEach((row) => {
        if (row.createdAtMs >= todayMs) today++;
        const isDormant = row.status === 'active' && row.lastLoginMs > 0 && now - row.lastLoginMs > 30 * 24 * 60 * 60 * 1000;
        if (isDormant) dormant++;
        if (row.status === 'sanctioned') sanctioned++;
    });
    const mapping = [
        ['users-kpi-total-value', total],
        ['users-kpi-today-value', today],
        ['users-kpi-dormant-value', dormant],
        ['users-kpi-sanctioned-value', sanctioned],
    ];
    mapping.forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = String(value);
    });
}

function stopUsersKpiAutoRefresh() {
    if (usersKpiRefreshTimer) {
        clearInterval(usersKpiRefreshTimer);
        usersKpiRefreshTimer = null;
    }
}

function startUsersKpiAutoRefresh() {
    stopUsersKpiAutoRefresh();
    updateUsersKpis(usersAllRows);
    usersKpiRefreshTimer = setInterval(() => {
        updateUsersKpis(usersAllRows);
    }, USERS_KPI_REFRESH_MS);
}

function readUsersFilterInputs() {
    const search = String(document.getElementById('user-filter-search')?.value || '')
        .trim()
        .toLowerCase();
    const status = document.getElementById('user-filter-status')?.value || 'all';
    const gender = document.getElementById('user-filter-gender')?.value || 'all';
    const period = document.getElementById('user-filter-period')?.value || 'all';
    const sort = document.getElementById('user-filter-sort')?.value || 'created_desc';
    return { search, status, gender, period, sort };
}

function applyUsersFiltersAndRender() {
    const tbody = document.getElementById('user-table-body');
    if (!tbody) return;

    const filters = readUsersFilterInputs();
    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartMs = todayStart.getTime();
    const periodMsMap = {
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '90d': 90 * 24 * 60 * 60 * 1000,
    };

    usersFilteredRows = usersAllRows.filter((row) => {
        if (filters.search) {
            const searchSpace = [row.userId, row.name, row.phone].join(' ').toLowerCase();
            if (!searchSpace.includes(filters.search)) return false;
        }
        if (filters.status === 'active' && row.status !== 'active') return false;
        if (filters.status === 'dormant' && !row.dormant) return false;
        if (filters.status === 'sanctioned' && row.status !== 'sanctioned') return false;
        if (filters.gender !== 'all' && row.gender !== filters.gender) return false;
        if (filters.period !== 'all') {
            if (filters.period === 'today') {
                if (!row.createdAtMs || row.createdAtMs < todayStartMs) return false;
                return true;
            }
            const rangeMs = periodMsMap[filters.period] || 0;
            if (!rangeMs) return false;
            if (!row.createdAtMs || now - row.createdAtMs > rangeMs) return false;
        }
        return true;
    });

    usersFilteredRows.sort((a, b) => {
        if (filters.sort === 'name_asc') {
            return String(a.name).localeCompare(String(b.name), 'ko', {
                sensitivity: 'base',
                numeric: true,
            });
        }
        if (filters.sort === 'last_login_desc') {
            return (b.lastLoginMs || 0) - (a.lastLoginMs || 0);
        }
        return (b.createdAtMs || 0) - (a.createdAtMs || 0);
    });

    usersCurrentPage = 1;
    renderUsersTablePage();
}

function renderUsersTablePage() {
    const tbody = document.getElementById('user-table-body');
    const pageMeta = document.getElementById('user-pagination-meta');
    const prevBtn = document.getElementById('user-page-prev');
    const nextBtn = document.getElementById('user-page-next');
    if (!tbody) return;

    const total = usersFilteredRows.length;
    const totalPages = Math.max(1, Math.ceil(total / USERS_PAGE_SIZE));
    if (usersCurrentPage > totalPages) usersCurrentPage = totalPages;
    const start = (usersCurrentPage - 1) * USERS_PAGE_SIZE;
    const pageRows = usersFilteredRows.slice(start, start + USERS_PAGE_SIZE);

    if (!pageRows.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="p-4 text-center text-[#A7B2AE]">조회된 유저가 없습니다.</td></tr>';
    } else {
        let html = '';
        pageRows.forEach((row) => {
            const statusMeta = row.dormant
                ? {
                      label: '휴면 추정',
                      cls: 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/50',
                  }
                : getUserStatusMeta(row.status);
            const selectedCls =
                usersSelectedId === row.id ? 'bg-[#11291D]' : 'hover:bg-white/5 transition-colors cursor-pointer';
            html += `
                <tr class="${selectedCls}" onclick="selectUserRow('${row.id}')">
                    <td class="p-4 font-mono text-[12px]">${escapeHtml(row.userId)}</td>
                    <td class="p-4">${escapeHtml(row.name)}</td>
                    <td class="p-4">${escapeHtml(row.gender)}</td>
                    <td class="p-4 text-[#A7B2AE]">${escapeHtml(row.phoneMasked)}</td>
                    <td class="p-4 text-[#A7B2AE]">${formatAdminDateTime(row.createdAtRaw)}</td>
                    <td class="p-4 text-[#A7B2AE]">${formatAdminDateTime(row.lastLoginAtRaw)}</td>
                    <td class="p-4">
                        <span class="px-2 py-1 rounded text-xs ${statusMeta.cls}">${statusMeta.label}</span>
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    }

    if (pageMeta) {
        pageMeta.textContent = `총 ${total}명 · ${usersCurrentPage}/${Math.max(1, totalPages)} 페이지`;
    }
    if (prevBtn) prevBtn.disabled = usersCurrentPage <= 1;
    if (nextBtn) nextBtn.disabled = usersCurrentPage >= totalPages;
    if (prevBtn) {
        prevBtn.classList.toggle('opacity-50', usersCurrentPage <= 1);
        prevBtn.classList.toggle('cursor-not-allowed', usersCurrentPage <= 1);
    }
    if (nextBtn) {
        nextBtn.classList.toggle('opacity-50', usersCurrentPage >= totalPages);
        nextBtn.classList.toggle('cursor-not-allowed', usersCurrentPage >= totalPages);
    }
}

function renderUserDetailPanel(userRow) {
    const panel = document.getElementById('user-detail-panel');
    if (!panel) return;
    if (!userRow) {
        panel.innerHTML = '회원을 선택하면 상세 정보와 관리 액션이 표시됩니다.';
        return;
    }
    const statusMeta = userRow.dormant
        ? {
              label: '휴면 추정',
              cls: 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/50',
          }
        : getUserStatusMeta(userRow.status);
    const profileImageUrl = String(userRow.profileImageUrl || '').trim();
    const profileImageHtml = profileImageUrl
        ? `<img src="${escapeHtml(profileImageUrl)}" alt="user profile" class="w-full h-full object-cover">`
        : `<svg class="w-10 h-10 text-[var(--point-color)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>`;
    panel.innerHTML = `
        <div class="space-y-3">
            <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                    <div class="w-14 h-14 rounded-full overflow-hidden border border-[var(--point-color)]/50 bg-[#06110D] flex items-center justify-center shrink-0">
                        ${profileImageHtml}
                    </div>
                    <div class="text-white font-bold text-base truncate">${escapeHtml(userRow.name)}</div>
                </div>
                <span class="px-2 py-1 rounded text-xs ${statusMeta.cls}">${statusMeta.label}</span>
            </div>
            <div class="text-xs text-[#A7B2AE]">아이디: <span class="text-white font-mono">${escapeHtml(userRow.userId)}</span></div>
            <div class="text-xs text-[#A7B2AE]">전화번호: <span class="text-white">${escapeHtml(userRow.phoneMasked)}</span></div>
            <div class="text-xs text-[#A7B2AE]">성별: <span class="text-white">${escapeHtml(userRow.gender)}</span></div>
            <div class="text-xs text-[#A7B2AE]">가입일시: <span class="text-white">${formatAdminDateTime(userRow.createdAtRaw)}</span></div>
            <div class="text-xs text-[#A7B2AE]">최근 접속: <span class="text-white">${formatAdminDateTime(userRow.lastLoginAtRaw)}</span></div>
            <div class="pt-3 border-t border-[#2A3731] flex gap-2">
                <button onclick="deleteUser('${userRow.id}', '${escapeHtml(userRow.name)}')" class="flex-1 px-3 py-2 rounded-lg text-xs font-bold bg-red-900/30 text-red-300 border border-red-800/40 hover:bg-red-900/50 transition-colors">회원 삭제</button>
                <button onclick="alert('1차 구성에서는 상세 액션 UI만 준비되었습니다.')" class="flex-1 px-3 py-2 rounded-lg text-xs font-bold bg-[#11291D] text-[#A7B2AE] border border-[#2A3731] hover:text-white transition-colors">관리자 메모</button>
            </div>
        </div>
    `;
}

window.selectUserRow = function (userId) {
    usersSelectedId = userId;
    renderUsersTablePage();
    const selected = usersAllRows.find((row) => row.id === userId) || null;
    renderUserDetailPanel(selected);
};

function initializeUsersControls() {
    if (usersControlsInitialized) return;
    usersControlsInitialized = true;

    const applyBtn = document.getElementById('user-filter-apply');
    const resetBtn = document.getElementById('user-filter-reset');
    const prevBtn = document.getElementById('user-page-prev');
    const nextBtn = document.getElementById('user-page-next');
    const kpiTotal = document.getElementById('users-kpi-total');
    const kpiToday = document.getElementById('users-kpi-today');
    const kpiDormant = document.getElementById('users-kpi-dormant');
    const kpiSanctioned = document.getElementById('users-kpi-sanctioned');

    if (applyBtn) applyBtn.addEventListener('click', applyUsersFiltersAndRender);
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            const defaults = {
                search: '',
                status: 'all',
                gender: 'all',
                period: 'all',
                sort: 'created_desc',
            };
            if (document.getElementById('user-filter-search')) document.getElementById('user-filter-search').value = defaults.search;
            if (document.getElementById('user-filter-status')) document.getElementById('user-filter-status').value = defaults.status;
            if (document.getElementById('user-filter-gender')) document.getElementById('user-filter-gender').value = defaults.gender;
            if (document.getElementById('user-filter-period')) document.getElementById('user-filter-period').value = defaults.period;
            if (document.getElementById('user-filter-sort')) document.getElementById('user-filter-sort').value = defaults.sort;
            usersSelectedId = null;
            renderUserDetailPanel(null);
            applyUsersFiltersAndRender();
        });
    }
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (usersCurrentPage <= 1) return;
            usersCurrentPage--;
            renderUsersTablePage();
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const totalPages = Math.max(1, Math.ceil(usersFilteredRows.length / USERS_PAGE_SIZE));
            if (usersCurrentPage >= totalPages) return;
            usersCurrentPage++;
            renderUsersTablePage();
        });
    }
    if (kpiTotal) {
        kpiTotal.addEventListener('click', () => {
            const statusEl = document.getElementById('user-filter-status');
            if (statusEl) statusEl.value = 'all';
            applyUsersFiltersAndRender();
        });
    }
    if (kpiToday) {
        kpiToday.addEventListener('click', () => {
            const periodEl = document.getElementById('user-filter-period');
            if (periodEl) periodEl.value = 'today';
            applyUsersFiltersAndRender();
        });
    }
    if (kpiDormant) {
        kpiDormant.addEventListener('click', () => {
            const statusEl = document.getElementById('user-filter-status');
            if (statusEl) statusEl.value = 'dormant';
            applyUsersFiltersAndRender();
        });
    }
    if (kpiSanctioned) {
        kpiSanctioned.addEventListener('click', () => {
            const statusEl = document.getElementById('user-filter-status');
            if (statusEl) statusEl.value = 'sanctioned';
            applyUsersFiltersAndRender();
        });
    }
}

function loadUsers() {
    const tbody = document.getElementById('user-table-body');
    if (!tbody) return;
    initializeUsersControls();
    startUsersKpiAutoRefresh();
    if (usersUnsubscribe) {
        usersUnsubscribe();
        usersUnsubscribe = null;
    }
    tbody.innerHTML = '<tr><td colspan="7" class="p-4 text-center text-[#A7B2AE]">로딩중...</td></tr>';
    usersUnsubscribe = db
        .collection('users')
        .orderBy('createdAt', 'desc')
        .onSnapshot((snapshot) => {
            usersAllRows = snapshot.docs.map((doc) => buildUserRow(doc));
            updateUsersKpis(usersAllRows);
            applyUsersFiltersAndRender();
            if (usersSelectedId) {
                const selected = usersAllRows.find((row) => row.id === usersSelectedId) || null;
                renderUserDetailPanel(selected);
            } else {
                renderUserDetailPanel(null);
            }
        }, (err) => {
            console.error('회원 목록 로드 실패:', err);
            tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-red-400">${escapeHtml(err.message)}</td></tr>`;
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
                if (usersSelectedId === userId) {
                    usersSelectedId = null;
                    renderUserDetailPanel(null);
                }
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
            approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
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
            document.getElementById('approval-phone').textContent =
                data.phoneNumber || data.mobile || data.mobilePhone || data.contact || data.phone || '-';
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
const SHOP_REGION_UNITS = [
    '서울',
    '경기',
    '인천',
    '충청',
    '대전',
    '강원',
    '전라',
    '광주',
    '경상',
    '부산',
    '제주',
];
let shopFilterUiInitialized = false;
let shopNameOptions = [];
let shopRegionOptions = [];
let shopTicketCountdownIntervalStarted = false;
const shopTicketTypeBackfillInFlight = new Set();
const SHOP_PAGE_SIZE = 18;
let shopFilteredRows = [];
let shopVisibleCount = SHOP_PAGE_SIZE;
let shopModalRealtimeUnsubs = [];
let shopModalLivePartnerData = null;
let shopModalLiveReqRows = [];
let shopModalLiveLogRows = [];
let shopModalLivePenaltyRows = [];
let shopModalCurrentPartnerId = '';
let shopModalSubscriptionExpanded = false;
const SHOP_SUBSCRIPTION_HISTORY_COLLAPSED = 8;

function getDefaultShopFilterState() {
    return {
        nameId: 'all',
        nameLabel: '전체',
        phone: '',
        region: 'all',
        status: 'all',
        plan: 'all',
        sort: 'created_desc',
    };
}

let shopFilterDraft = getDefaultShopFilterState();
let shopFilterApplied = getDefaultShopFilterState();
let shopChangeBaselineMap = {};
let shopChangeBaselineStorageKey = '';
let shopChangeBaselineDirty = false;

const SHOP_CHANGE_TRACKED_FIELDS = [
    'basic_name',
    'basic_owner',
    'basic_mobile',
    'basic_contact',
    'basic_biz_type',
    'basic_biz_no',
    'ops_region',
    'ops_massage',
    'ops_place',
    'ops_age',
    'ops_call_enabled',
    'ops_call_start',
    'ops_call_end',
    'ops_address',
    'ops_description',
    'menus_items',
];

const SHOP_CHANGE_FIELD_SECTION = {
    basic_name: 'basic',
    basic_owner: 'basic',
    basic_mobile: 'basic',
    basic_contact: 'basic',
    basic_biz_type: 'basic',
    basic_biz_no: 'basic',
    ops_region: 'ops',
    ops_massage: 'ops',
    ops_place: 'ops',
    ops_age: 'ops',
    ops_call_enabled: 'ops',
    ops_call_start: 'ops',
    ops_call_end: 'ops',
    ops_address: 'ops',
    ops_description: 'ops',
    menus_items: 'menus',
};

function getShopChangeBaselineStorageKey() {
    const uid = auth?.currentUser?.uid || 'anonymous';
    return `dadok_admin_shop_change_baseline_${uid}`;
}

function ensureShopChangeBaselineLoaded() {
    const nextKey = getShopChangeBaselineStorageKey();
    if (shopChangeBaselineStorageKey === nextKey) return;
    shopChangeBaselineStorageKey = nextKey;
    shopChangeBaselineDirty = false;
    try {
        const raw = localStorage.getItem(nextKey);
        const parsed = raw ? JSON.parse(raw) : {};
        shopChangeBaselineMap = parsed && typeof parsed === 'object' ? parsed : {};
    } catch (err) {
        console.warn('샵 변경 기준선 로드 실패:', err);
        shopChangeBaselineMap = {};
    }
}

function persistShopChangeBaselineIfDirty() {
    if (!shopChangeBaselineDirty) return;
    ensureShopChangeBaselineLoaded();
    try {
        localStorage.setItem(shopChangeBaselineStorageKey, JSON.stringify(shopChangeBaselineMap));
        shopChangeBaselineDirty = false;
    } catch (err) {
        console.warn('샵 변경 기준선 저장 실패:', err);
    }
}

function normalizeShopComparableText(value = '') {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
}

function normalizeShopComparableList(value = '') {
    const list = String(value == null ? '' : value)
        .split(/[\n,]/)
        .map((item) => normalizeShopComparableText(item))
        .filter(Boolean);
    return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b, 'ko')).join('|');
}

function normalizeShopComparableRegions(data = {}) {
    if (Array.isArray(data.regionList) && data.regionList.length > 0) {
        const list = data.regionList
            .map((item) => normalizeShopComparableText(item))
            .filter(Boolean);
        return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b, 'ko')).join('|');
    }
    return normalizeShopComparableList(data.region || '');
}

function normalizeShopComparableMenus(rawMenus) {
    if (!Array.isArray(rawMenus)) return '';
    const rows = rawMenus
        .map((menu) => {
            const m = menu && typeof menu === 'object' ? menu : {};
            const name = normalizeShopComparableText(m.name || '');
            const price = String(m.price == null ? '' : m.price).replace(/\D/g, '');
            const theme = normalizeShopComparableText(m.theme || '');
            const desc = normalizeShopComparableText(m.desc || '');
            const composed = [name, price, theme, desc].join('||');
            return composed === '||||||' ? '' : composed;
        })
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'ko'));
    return rows.join('@@');
}

function buildShopComparableSnapshot(data = {}) {
    return {
        basic_name: normalizeShopComparableText(data.name || data.company || ''),
        basic_owner: normalizeShopComparableText(data.ownerName || data.ceoName || ''),
        basic_mobile: normalizeShopComparableText(
            data.phoneNumber || data.mobile || data.mobilePhone || data.contact || data.phone || '',
        ),
        basic_contact: normalizeShopComparableText(
            data.phoneNumber ||
                data.contact ||
                data.officePhone ||
                data.mobile ||
                data.mobilePhone ||
                data.phone ||
                '',
        ),
        basic_biz_type: normalizeShopComparableText(data.businessType || data.bizType || ''),
        basic_biz_no: normalizeShopComparableText(data.businessNumber || data.bizNo || ''),
        ops_region: normalizeShopComparableRegions(data),
        ops_massage: normalizeShopComparableList(data.massage || ''),
        ops_place: normalizeShopComparableList(data.place || ''),
        ops_age: normalizeShopComparableList(data.age || ''),
        ops_call_enabled: String(typeof data.callEnabled === 'boolean' ? data.callEnabled : true),
        ops_call_start: normalizeShopComparableText(data.callAvailableStart || ''),
        ops_call_end: normalizeShopComparableText(data.callAvailableEnd || ''),
        ops_address: normalizeShopComparableText(data.address || data.location || ''),
        ops_description: normalizeShopComparableText(
            data.catchphrase != null && String(data.catchphrase).trim() !== ''
                ? data.catchphrase
                : data.description || data.desc || '',
        ),
        menus_items: normalizeShopComparableMenus(data.menus),
    };
}

function getShopChangeSummary(partnerId = '', data = {}, options = {}) {
    const { initializeIfMissing = true } = options;
    ensureShopChangeBaselineLoaded();
    const pid = String(partnerId || '').trim();
    if (!pid) return { total: 0, sectionCounts: { basic: 0, ops: 0, menus: 0 } };
    const current = buildShopComparableSnapshot(data);
    const baseline = shopChangeBaselineMap[pid];
    if (!baseline || typeof baseline !== 'object') {
        if (initializeIfMissing) {
            shopChangeBaselineMap[pid] = current;
            shopChangeBaselineDirty = true;
        }
        return { total: 0, sectionCounts: { basic: 0, ops: 0, menus: 0 } };
    }

    const sectionCounts = { basic: 0, ops: 0, menus: 0 };
    let total = 0;
    SHOP_CHANGE_TRACKED_FIELDS.forEach((field) => {
        const prev = normalizeShopComparableText(baseline[field] || '');
        const next = normalizeShopComparableText(current[field] || '');
        if (prev === next) return;
        total++;
        const section = SHOP_CHANGE_FIELD_SECTION[field] || 'ops';
        sectionCounts[section] = (sectionCounts[section] || 0) + 1;
    });
    return { total, sectionCounts };
}

function renderShopModalChangeBadges(summary) {
    const badgeMap = {
        basic: document.getElementById('shop-change-basic-badge'),
        ops: document.getElementById('shop-change-ops-badge'),
        menus: document.getElementById('shop-change-menus-badge'),
    };
    ['basic', 'ops', 'menus'].forEach((section) => {
        const el = badgeMap[section];
        if (!el) return;
        const n = Number(summary?.sectionCounts?.[section] || 0);
        if (n > 0) {
            el.textContent = `N ${n}`;
            el.classList.remove('hidden');
            return;
        }
        el.textContent = 'N';
        el.classList.add('hidden');
    });
}

function markShopChangesReviewed(partnerId = '', data = null) {
    const pid = String(partnerId || '').trim();
    if (!pid) return;
    const source = data && typeof data === 'object' ? data : shopModalLivePartnerData || {};
    ensureShopChangeBaselineLoaded();
    shopChangeBaselineMap[pid] = buildShopComparableSnapshot(source);
    shopChangeBaselineDirty = true;
    persistShopChangeBaselineIfDirty();
}

function getShopOperationalStatus(shop, now = Date.now()) {
    const status = (shop?.status || '').toLowerCase();
    const expiryTs = Number(shop?.ticketExpiryTimestamp || 0);
    const isExpiredByTicket = !!expiryTs && expiryTs < now;

    if (status === 'pending') return 'pending';
    if (status === 'active' && !isExpiredByTicket) return 'active';
    return 'expired'; // includes ticket expired and sanction/inactive states
}

function extractShopPrimaryRegion(rawValue = '') {
    const text = String(rawValue || '').trim();
    if (!text) return '';
    const normalized = text.replace(/\s+/g, '');
    if (normalized.includes('서울')) return '서울';
    if (normalized.includes('경기')) return '경기';
    if (normalized.includes('인천')) return '인천';
    if (
        normalized.includes('충청') ||
        normalized.includes('충북') ||
        normalized.includes('충남') ||
        normalized.includes('세종')
    )
        return '충청';
    if (normalized.includes('대전')) return '대전';
    if (normalized.includes('강원')) return '강원';
    if (normalized.includes('전라') || normalized.includes('전북') || normalized.includes('전남'))
        return '전라';
    if (normalized.includes('광주')) return '광주';
    if (normalized.includes('부산')) return '부산';
    if (
        normalized.includes('경상') ||
        normalized.includes('경북') ||
        normalized.includes('경남') ||
        normalized.includes('대구') ||
        normalized.includes('울산')
    )
        return '경상';
    if (normalized.includes('제주')) return '제주';
    return '';
}

function normalizeDigits(value = '') {
    return String(value || '').replace(/\D/g, '');
}

function getShopPlanBucket(shop = {}) {
    const rawType = String(shop.ticketType || shop.tier || shop.ticketPlan || '').toLowerCase();
    const compactType = rawType.replace(/\s+/g, '');
    if (!compactType || compactType === 'none') {
        const expiryTs = Number(shop.ticketExpiryTimestamp || 0);
        if (expiryTs && expiryTs > Date.now()) return 'active_untyped';
        return 'none';
    }

    if (
        compactType.includes('12개월') ||
        compactType.includes('12month') ||
        compactType.includes('12-month') ||
        compactType.includes('year')
    )
        return '12m';
    if (
        compactType.includes('6개월') ||
        compactType.includes('6month') ||
        compactType.includes('6-month')
    )
        return '6m';
    if (
        compactType.includes('3개월') ||
        compactType.includes('3month') ||
        compactType.includes('3-month')
    )
        return '3m';
    if (
        compactType.includes('1개월') ||
        compactType.includes('1month') ||
        compactType.includes('1-month')
    )
        return '1m';

    return 'none';
}

function getShopPlanLabel(planBucket = 'none') {
    if (planBucket === '1m') return '입점권 활성화(1개월)';
    if (planBucket === '3m') return '입점권 활성화(3개월)';
    if (planBucket === '6m') return '입점권 활성화(6개월)';
    if (planBucket === '12m') return '입점권 활성화(12개월)';
    if (planBucket === 'active_untyped') return '입점권 활성화(유형 미지정)';
    return '입점권 없음';
}

function getShopSummaryPlanLabel(planBucket = 'none') {
    const label = getShopPlanLabel(planBucket);
    return label.replace('활성화(', '활성화\n(');
}

function getTicketTypeByMonths(months) {
    const n = Number(months || 0);
    if (n === 1) return '1개월 입점권';
    if (n === 3) return '3개월 입점권';
    if (n === 6) return '6개월 입점권';
    if (n === 12) return '12개월 입점권';
    return '';
}

async function backfillShopTicketTypesIfNeeded(shops = []) {
    const now = Date.now();
    const targets = shops.filter((shop) => {
        if (!shop?.id) return false;
        const expiryTs = Number(shop.ticketExpiryTimestamp || 0);
        if (!expiryTs || expiryTs <= now) return false;
        const typeRaw = String(shop.ticketType || shop.tier || shop.ticketPlan || '').trim();
        if (typeRaw && typeRaw.toLowerCase() !== 'none') return false;
        if (shopTicketTypeBackfillInFlight.has(shop.id)) return false;
        return true;
    });

    targets.forEach(async (shop) => {
        shopTicketTypeBackfillInFlight.add(shop.id);
        try {
            const reqSnap = await db
                .collection('subscription_requests')
                .where('partnerId', '==', shop.id)
                .limit(30)
                .get();

            let inferredType = '';
            let latestScore = 0;
            reqSnap.forEach((doc) => {
                const row = doc.data() || {};
                const status = normalizeSubRequestStatus(row.status);
                if (status !== 'completed') return;
                const typeFromRow =
                    String(row.approvedTicketType || '').trim() ||
                    getTicketTypeByMonths(row.approvedMonths || row.months || 0);
                if (!typeFromRow) return;
                const score =
                    Number(row.approvedExpiryTimestamp || 0) ||
                    (typeof row.completedAt?.toMillis === 'function' ? row.completedAt.toMillis() : 0) ||
                    (typeof row.updatedAt?.toMillis === 'function' ? row.updatedAt.toMillis() : 0);
                if (score >= latestScore) {
                    latestScore = score;
                    inferredType = typeFromRow;
                }
            });

            if (!inferredType) {
                const remainDays = Math.ceil(
                    (Number(shop.ticketExpiryTimestamp || 0) - Date.now()) / (1000 * 60 * 60 * 24),
                );
                if (remainDays > 0) {
                    if (remainDays <= 45) inferredType = '1개월 입점권';
                    else if (remainDays <= 120) inferredType = '3개월 입점권';
                    else if (remainDays <= 240) inferredType = '6개월 입점권';
                    else inferredType = '12개월 입점권';
                }
            }

            if (inferredType) {
                await db.collection('partners').doc(shop.id).update({
                    ticketType: inferredType,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                });
            }
        } catch (err) {
            console.warn('입점권 유형 자동보정 실패:', shop.id, err);
        } finally {
            shopTicketTypeBackfillInFlight.delete(shop.id);
        }
    });
}

function formatCountdownDaysTime(diffMs = 0) {
    const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = String(Math.floor((totalSeconds % 86400) / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${days}일 ${hours}:${minutes}:${seconds}`;
}

function getShopTicketCountdownView(expiryTs) {
    const parsedExpiry = Number(expiryTs || 0);
    if (!parsedExpiry) {
        return { text: '남은시간: 만료 시각 미설정', tone: 'muted' };
    }
    const diff = parsedExpiry - Date.now();
    if (diff <= 0) {
        return { text: `만료됨 (${formatCountdownDaysTime(Math.abs(diff))} 경과)`, tone: 'expired' };
    }
    if (diff <= 24 * 60 * 60 * 1000) {
        return { text: `남은시간: ${formatCountdownDaysTime(diff)}`, tone: 'critical' };
    }
    if (diff <= 7 * 24 * 60 * 60 * 1000) {
        return { text: `남은시간: ${formatCountdownDaysTime(diff)}`, tone: 'warning' };
    }
    return { text: `남은시간: ${formatCountdownDaysTime(diff)}`, tone: 'good' };
}

function updateShopTicketCountdowns() {
    document.querySelectorAll('.shop-ticket-countdown').forEach((el) => {
        const expiry = Number(el.getAttribute('data-expiry') || 0);
        const view = getShopTicketCountdownView(expiry);
        el.textContent = view.text;
        const toneClass =
            view.tone === 'good'
                ? 'border-green-500/40 text-green-300 bg-green-900/15'
                : view.tone === 'warning'
                    ? 'border-yellow-500/40 text-yellow-300 bg-yellow-900/15'
                    : view.tone === 'critical'
                        ? 'border-red-500/40 text-red-300 bg-red-900/20'
                        : view.tone === 'expired'
                            ? 'border-red-500/60 text-red-400 bg-red-900/25'
                            : 'border-[#2A3731] text-[#A7B2AE] bg-[#06110D]';
        el.className = `shop-ticket-countdown mt-1.5 px-2.5 py-1 rounded text-[13px] font-mono border ${toneClass}`;
    });
}

function buildShopNameOptions() {
    const approved = windowShops.filter((s) => getShopOperationalStatus(s) !== 'pending');
    return approved
        .map((s) => {
            const label = String(s.name || s.company || s.userId || s.id || '').trim();
            if (!label) return null;
            return { id: s.id, label };
        })
        .filter(Boolean)
        .sort((a, b) => String(a.label).localeCompare(String(b.label), 'ko'));
}

function buildShopRegionOptions() {
    return SHOP_REGION_UNITS.slice();
}

function updateShopSelectedLabels() {
    const nameEl = document.getElementById('shop-filter-name-selected');
    const regionEl = document.getElementById('shop-filter-region-selected');
    if (nameEl) {
        nameEl.textContent =
            shopFilterDraft.nameId === 'all'
                ? '상호명: 전체 (승인완료)'
                : `상호명: ${shopFilterDraft.nameLabel}`;
    }
    if (regionEl) {
        regionEl.textContent =
            shopFilterDraft.region === 'all'
                ? '지역: 전체'
                : `지역: ${shopFilterDraft.region}`;
    }
}

function setShopNamePanelVisible(visible) {
    const panel = document.getElementById('shop-filter-name-panel');
    if (!panel) return;
    panel.classList.toggle('hidden', !visible);
}

function setShopRegionPanelVisible(visible) {
    const panel = document.getElementById('shop-filter-region-panel');
    if (!panel) return;
    panel.classList.toggle('hidden', !visible);
}

function renderShopNameOptions() {
    const listEl = document.getElementById('shop-filter-name-list');
    if (!listEl) return;
    let html = '';
    const allClass =
        shopFilterDraft.nameId === 'all'
            ? 'w-full text-left px-3 py-2 rounded-lg text-sm border border-[var(--point-color)] text-[var(--point-color)] bg-[#11291D]'
            : 'w-full text-left px-3 py-2 rounded-lg text-sm border border-[#2A3731] text-[#A7B2AE] hover:text-white hover:border-[var(--point-color)]';
    html += `<button type="button" data-name-id="all" data-name-label="전체" class="${allClass}">전체</button>`;
    if (!shopNameOptions.length) {
        html += '<div class="text-xs text-[#A7B2AE] px-1 py-2">승인완료 업체가 없습니다.</div>';
        listEl.innerHTML = html;
        return;
    }
    shopNameOptions.forEach((row) => {
        const selected = shopFilterDraft.nameId === row.id;
        const cls = selected
            ? 'w-full text-left px-3 py-2 rounded-lg text-sm border border-[var(--point-color)] text-[var(--point-color)] bg-[#11291D]'
            : 'w-full text-left px-3 py-2 rounded-lg text-sm border border-[#2A3731] text-[#A7B2AE] hover:text-white hover:border-[var(--point-color)]';
        html += `<button type="button" data-name-id="${escapeHtml(row.id)}" data-name-label="${escapeHtml(row.label)}" class="${cls}">${escapeHtml(row.label)}</button>`;
    });
    listEl.innerHTML = html;
}

function renderShopRegionOptions() {
    const listEl = document.getElementById('shop-filter-region-list');
    if (!listEl) return;
    let html = '';
    const allClass =
        shopFilterDraft.region === 'all'
            ? 'w-full text-left px-3 py-2 rounded-lg text-sm border border-[var(--point-color)] text-[var(--point-color)] bg-[#11291D]'
            : 'w-full text-left px-3 py-2 rounded-lg text-sm border border-[#2A3731] text-[#A7B2AE] hover:text-white hover:border-[var(--point-color)]';
    html += `<button type="button" data-region="all" class="${allClass}">전체</button>`;
    if (!shopRegionOptions.length) {
        html += '<div class="text-xs text-[#A7B2AE] px-1 py-2">승인완료 업체의 지역 데이터가 없습니다.</div>';
        listEl.innerHTML = html;
        return;
    }
    shopRegionOptions.forEach((region) => {
        const selected = shopFilterDraft.region === region;
        const cls = selected
            ? 'w-full text-left px-3 py-2 rounded-lg text-sm border border-[var(--point-color)] text-[var(--point-color)] bg-[#11291D]'
            : 'w-full text-left px-3 py-2 rounded-lg text-sm border border-[#2A3731] text-[#A7B2AE] hover:text-white hover:border-[var(--point-color)]';
        html += `<button type="button" data-region="${escapeHtml(region)}" class="${cls}">${escapeHtml(region)}</button>`;
    });
    listEl.innerHTML = html;
}

function syncShopFilterInputsFromDraft() {
    const phoneEl = document.getElementById('shop-filter-phone');
    const statusEl = document.getElementById('shop-filter-status');
    const planEl = document.getElementById('shop-filter-plan');
    const sortEl = document.getElementById('shop-filter-sort');
    if (phoneEl) phoneEl.value = shopFilterDraft.phone;
    if (statusEl) statusEl.value = shopFilterDraft.status;
    if (planEl) planEl.value = shopFilterDraft.plan;
    if (sortEl) sortEl.value = shopFilterDraft.sort;
    updateShopSelectedLabels();
    renderShopNameOptions();
    renderShopRegionOptions();
}

function applyShopFilters() {
    const phoneEl = document.getElementById('shop-filter-phone');
    const statusEl = document.getElementById('shop-filter-status');
    const planEl = document.getElementById('shop-filter-plan');
    const sortEl = document.getElementById('shop-filter-sort');
    shopFilterDraft.phone = String(phoneEl?.value || '').trim();
    shopFilterDraft.status = statusEl?.value || 'all';
    shopFilterDraft.plan = planEl?.value || 'all';
    shopFilterDraft.sort = sortEl?.value || 'created_desc';
    shopFilterApplied = { ...shopFilterDraft };
    shopVisibleCount = SHOP_PAGE_SIZE;
    setShopNamePanelVisible(false);
    setShopRegionPanelVisible(false);
    filterShops();
}

function resetShopFilters() {
    shopFilterDraft = getDefaultShopFilterState();
    shopFilterApplied = getDefaultShopFilterState();
    shopVisibleCount = SHOP_PAGE_SIZE;
    syncShopFilterInputsFromDraft();
    filterShops();
}

function updateShopListMeta(total = 0, shown = 0) {
    const metaEl = document.getElementById('shop-list-meta');
    const loadMoreBtn = document.getElementById('shop-load-more');
    if (metaEl) metaEl.textContent = `총 ${total}개 중 ${shown}개 표시`;
    if (loadMoreBtn) {
        const canLoadMore = total > shown;
        loadMoreBtn.classList.toggle('hidden', !canLoadMore);
        loadMoreBtn.textContent = canLoadMore
            ? `업체 배너 더 보기 (${total - shown}개 남음)`
            : '업체 배너 더 보기';
    }
}

function initializeShopFilterControls() {
    if (shopFilterUiInitialized) return;
    shopFilterUiInitialized = true;

    const nameToggle = document.getElementById('shop-filter-name-toggle');
    const nameClose = document.getElementById('shop-filter-name-close');
    const nameList = document.getElementById('shop-filter-name-list');
    const regionToggle = document.getElementById('shop-filter-region-toggle');
    const regionClose = document.getElementById('shop-filter-region-close');
    const regionList = document.getElementById('shop-filter-region-list');
    const applyBtn = document.getElementById('shop-filter-apply');
    const resetBtn = document.getElementById('shop-filter-reset');
    const loadMoreBtn = document.getElementById('shop-load-more');
    const phoneEl = document.getElementById('shop-filter-phone');
    const statusEl = document.getElementById('shop-filter-status');
    const planEl = document.getElementById('shop-filter-plan');
    const sortEl = document.getElementById('shop-filter-sort');

    if (nameToggle) {
        nameToggle.addEventListener('click', () => {
            const panel = document.getElementById('shop-filter-name-panel');
            const isHidden = panel ? panel.classList.contains('hidden') : true;
            setShopRegionPanelVisible(false);
            setShopNamePanelVisible(isHidden);
        });
    }
    if (nameClose) nameClose.addEventListener('click', () => setShopNamePanelVisible(false));
    if (nameList) {
        nameList.addEventListener('click', (event) => {
            const btn = event.target.closest('button[data-name-id]');
            if (!btn) return;
            shopFilterDraft.nameId = btn.getAttribute('data-name-id') || 'all';
            shopFilterDraft.nameLabel = btn.getAttribute('data-name-label') || '전체';
            updateShopSelectedLabels();
            renderShopNameOptions();
            setShopNamePanelVisible(false);
        });
    }

    if (regionToggle) {
        regionToggle.addEventListener('click', () => {
            const panel = document.getElementById('shop-filter-region-panel');
            const isHidden = panel ? panel.classList.contains('hidden') : true;
            setShopNamePanelVisible(false);
            setShopRegionPanelVisible(isHidden);
        });
    }
    if (regionClose) regionClose.addEventListener('click', () => setShopRegionPanelVisible(false));
    if (regionList) {
        regionList.addEventListener('click', (event) => {
            const btn = event.target.closest('button[data-region]');
            if (!btn) return;
            shopFilterDraft.region = btn.getAttribute('data-region') || 'all';
            updateShopSelectedLabels();
            renderShopRegionOptions();
            setShopRegionPanelVisible(false);
        });
    }

    if (applyBtn) applyBtn.addEventListener('click', applyShopFilters);
    if (resetBtn) resetBtn.addEventListener('click', resetShopFilters);
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            shopVisibleCount += SHOP_PAGE_SIZE;
            renderShopCards(shopFilteredRows);
        });
    }
    if (phoneEl) phoneEl.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            applyShopFilters();
        }
    });

    const syncDraft = () => {
        shopFilterDraft.phone = String(phoneEl?.value || '').trim();
        shopFilterDraft.status = statusEl?.value || 'all';
        shopFilterDraft.plan = planEl?.value || 'all';
        shopFilterDraft.sort = sortEl?.value || 'created_desc';
    };
    if (phoneEl) phoneEl.addEventListener('input', syncDraft);
    if (statusEl) statusEl.addEventListener('change', syncDraft);
    if (planEl) planEl.addEventListener('change', syncDraft);
    if (sortEl) sortEl.addEventListener('change', syncDraft);
    document.addEventListener('click', (event) => {
        const namePanel = document.getElementById('shop-filter-name-panel');
        const nameBtn = document.getElementById('shop-filter-name-toggle');
        const regionPanel = document.getElementById('shop-filter-region-panel');
        const regionBtn = document.getElementById('shop-filter-region-toggle');
        const target = event.target;
        if (namePanel && nameBtn && !namePanel.contains(target) && !nameBtn.contains(target)) {
            setShopNamePanelVisible(false);
        }
        if (regionPanel && regionBtn && !regionPanel.contains(target) && !regionBtn.contains(target)) {
            setShopRegionPanelVisible(false);
        }
    });

    syncShopFilterInputsFromDraft();
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
    shopFilterDraft.status = status;
    shopFilterApplied.status = status;
    applyShopFilters();
}
window.setShopStatusFilter = setShopStatusFilter;

function loadShops() {
    const container = document.getElementById('shop-cards-container');
    initializeShopFilterControls();
    if (!shopTicketCountdownIntervalStarted) {
        shopTicketCountdownIntervalStarted = true;
        setInterval(updateShopTicketCountdowns, 1000);
    }
    db.collection('partners').onSnapshot(
        (snapshot) => {
            windowShops = [];
            if (snapshot.empty) {
                container.innerHTML =
                    '<div class="col-span-full py-20 text-center text-[#A7B2AE]">등록된 샵이 없습니다.</div>';
                shopFilteredRows = [];
                shopVisibleCount = SHOP_PAGE_SIZE;
                updateShopListMeta(0, 0);
                shopNameOptions = [];
                shopRegionOptions = [];
                renderShopNameOptions();
                renderShopRegionOptions();
                updateShopKpis();
                return;
            }

            snapshot.forEach((doc) => {
                const data = doc.data();
                if (String(data?.status || '').toLowerCase() === 'pending') return;
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
                shopFilteredRows = [];
                shopVisibleCount = SHOP_PAGE_SIZE;
                updateShopListMeta(0, 0);
                shopNameOptions = [];
                shopRegionOptions = [];
                renderShopNameOptions();
                renderShopRegionOptions();
                updateShopKpis();
                return;
            }

            shopNameOptions = buildShopNameOptions();
            shopRegionOptions = buildShopRegionOptions();
            if (shopFilterDraft.nameId !== 'all' && !shopNameOptions.some((row) => row.id === shopFilterDraft.nameId)) {
                shopFilterDraft.nameId = 'all';
                shopFilterDraft.nameLabel = '전체';
                shopFilterApplied.nameId = 'all';
                shopFilterApplied.nameLabel = '전체';
            }
            if (shopFilterDraft.region !== 'all' && !shopRegionOptions.includes(shopFilterDraft.region)) {
                shopFilterDraft.region = 'all';
                shopFilterApplied.region = 'all';
            }
            renderShopNameOptions();
            renderShopRegionOptions();
            updateShopSelectedLabels();
            updateShopKpis();
            filterShops(); // Render initial state based on current filter
            backfillShopTicketTypesIfNeeded(windowShops);
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
    const selectedNameId = shopFilterApplied.nameId || 'all';
    const phoneVal = normalizeDigits(shopFilterApplied.phone || '');
    const regionVal = shopFilterApplied.region || 'all';
    const statusVal = shopFilterApplied.status || 'all';
    const planVal = shopFilterApplied.plan || 'all';
    const sortVal = shopFilterApplied.sort || 'created_desc';
    const container = document.getElementById('shop-cards-container');
    if (!container) return;

    let filtered = windowShops.filter((s) => {
        // 1. Name list selection
        if (selectedNameId !== 'all' && String(s.id || '') !== selectedNameId) return false;

        // 2. Phone Search
        const phoneSource = normalizeDigits(`${s.phone || ''} ${s.contact || ''} ${s.phoneNumber || ''}`);
        if (phoneVal && !phoneSource.includes(phoneVal)) return false;

        // 3. Region Search
        const regionSource = extractShopPrimaryRegion(`${s.region || ''} ${s.location || ''} ${s.address || ''}`);
        if (regionVal !== 'all' && regionSource !== regionVal) return false;

        // 4. Status check
        const opStatus = getShopOperationalStatus(s);
        // 샵 관리 기본 목록은 승인 완료된 업체 중심(영업중/만료/제재)으로 운영
        if (statusVal === 'all' && opStatus === 'pending') return false;
        if (statusVal !== 'all' && opStatus !== statusVal) return false;

        // 5. Plan check
        const planBucket = getShopPlanBucket(s);
        if (planVal !== 'all') {
            if (planVal === 'none') {
                if (planBucket !== 'none') return false;
            } else if (planBucket !== planVal) {
                return false;
            }
        }

        return true;
    });

    filtered.sort((a, b) => {
        const createdA = a?.createdAt && typeof a.createdAt.toMillis === 'function'
            ? a.createdAt.toMillis()
            : new Date(a?.createdAt || 0).getTime() || 0;
        const createdB = b?.createdAt && typeof b.createdAt.toMillis === 'function'
            ? b.createdAt.toMillis()
            : new Date(b?.createdAt || 0).getTime() || 0;
        const expiryA = Number(a?.ticketExpiryTimestamp || Number.MAX_SAFE_INTEGER);
        const expiryB = Number(b?.ticketExpiryTimestamp || Number.MAX_SAFE_INTEGER);
        const nameA = String(a?.name || a?.company || '').trim();
        const nameB = String(b?.name || b?.company || '').trim();

        if (sortVal === 'created_asc') return createdA - createdB;
        if (sortVal === 'expiry_asc') return expiryA - expiryB;
        if (sortVal === 'name_asc') return nameA.localeCompare(nameB, 'ko');
        return createdB - createdA;
    });

    shopFilteredRows = filtered;
    refreshShopCategoryButtons(statusVal);
    renderShopCards(shopFilteredRows);
}

function renderShopCards(shops) {
    const container = document.getElementById('shop-cards-container');
    ensureShopChangeBaselineLoaded();
    const total = shops.length;
    if (total === 0) {
        container.innerHTML =
            '<div class="col-span-full py-20 text-center text-[#A7B2AE]">조건에 만족하는 샵이 없습니다.</div>';
        updateShopListMeta(0, 0);
        return;
    }

    const now = Date.now();
    let html = '';
    const visibleCount = Math.min(shopVisibleCount, total);
    const visibleRows = shops.slice(0, visibleCount);

    visibleRows.forEach((data) => {
        const displayName = data.name || data.company || '샵 이름 없음';
        const changeSummary = getShopChangeSummary(data.id || data.userId || '', data, {
            initializeIfMissing: true,
        });
        const changedCountBadge =
            changeSummary.total > 0
                ? `<span class="inline-flex items-center justify-center min-w-[1.6rem] h-6 px-2 rounded-full bg-[#7C2D12] text-[#FDBA74] text-[12px] font-extrabold">${changeSummary.total}</span>`
                : '';
        let imageUrl =
            data.imageThumb ||
            data.thumbnailImage ||
            data.thumbImage ||
            data.imageDetail ||
            data.detailImage ||
            data.bannerImage ||
            data.imageUrl ||
            data.image ||
            'https://via.placeholder.com/300x200?text=No+Image';
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

        const planBucket = getShopPlanBucket(data);
        const planLabel = getShopPlanLabel(planBucket);
        const planBadgeClass =
            planBucket === 'none'
                ? 'bg-gray-800/95 text-white ring-1 ring-gray-300/40'
                : planBucket === 'active_untyped'
                    ? 'bg-yellow-500/95 text-black ring-1 ring-yellow-200/70'
                    : 'bg-green-600/95 text-white ring-1 ring-green-200/70';
        const planBadge = `<span class="absolute top-3 right-3 ${planBadgeClass} text-[12px] font-extrabold px-3 py-1.5 rounded-lg shadow-lg tracking-tight">${planLabel}</span>`;

        const ownerName = data.ownerName || '-';
        const signupUserId = data.userId || '-';
        const ticketLabel = planLabel;
        const expiryText = data.ticketExpiryTimestamp
            ? new Date(data.ticketExpiryTimestamp).toLocaleString('ko-KR')
            : '만료 시각 미설정';
        const countdownView = getShopTicketCountdownView(data.ticketExpiryTimestamp);
        const ticketToneClass =
            countdownView.tone === 'expired' || isExpired
                ? 'border-red-500/50'
                : countdownView.tone === 'critical'
                    ? 'border-red-500/40'
                    : countdownView.tone === 'warning'
                        ? 'border-yellow-500/40'
                        : 'border-green-500/30';

        html += `
            <div class="bg-[#0A1B13] border border-[#2A3731] rounded-2xl overflow-hidden hover:border-[#3A4741] transition-all flex flex-col shadow-lg relative group" onclick="openShopModal('${data.id}')">
                
                <!-- Card Image Header -->
                <div class="h-72 relative overflow-hidden flex-shrink-0 cursor-pointer bg-[#06110D]">
                    <img src="${imageUrl}" alt="shop" class="w-full h-full object-contain opacity-95 group-hover:opacity-100 transition-opacity">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent"></div>
                    ${statusBadge}
                    ${planBadge}
                </div>

                <!-- Card Body -->
                <div class="px-4 py-2 bg-[#0A1B13] flex flex-col flex-1 cursor-pointer relative z-10">
                    <div class="mb-1">
                        <h3 class="text-[20px] font-extrabold text-white tracking-tight leading-tight flex items-center gap-2">
                            <span class="truncate">${displayName}</span>
                            ${changedCountBadge}
                        </h3>
                    </div>
                    <div class="text-[15px] text-[#C8D1CD] mb-1.5 truncate">
                        <span class="text-[#8C9A95]">대표자</span> <span class="text-white/90">${ownerName}</span>
                        <span class="mx-1.5 text-[#4B5A54]">|</span>
                        <span class="text-[#8C9A95]">가입ID</span> <span class="text-white/90">${signupUserId}</span>
                        <span class="mx-1.5 text-[#4B5A54]">|</span>
                        <span class="text-[#8C9A95]">연락처</span> <span class="text-white/90">${data.phoneNumber || data.mobile || data.mobilePhone || data.contact || data.phone || '미등록'}</span>
                    </div>
                    <div class="text-[13px] text-[#A7B2AE] mt-1 mb-0.5">
                        찐리뷰 <span class="text-white/90 font-semibold">${(() => {
                            const st = data.stats && typeof data.stats === 'object' ? data.stats : {};
                            const n = Number(
                                Number.isFinite(Number(st.totalReviews))
                                    ? st.totalReviews
                                    : data.reviews || 0,
                            );
                            const av = Number(data.rating);
                            const avs = Number.isFinite(av) && n > 0 ? av.toFixed(1) : '0.0';
                            return `${n.toLocaleString()}건 · 평균 ${avs}점`;
                        })()}</span>
                    </div>
                    <div class="pt-0 mb-0.5">
                        <span class="inline-block px-2 py-0.5 bg-[#11291D] border border-[#2A3731] rounded text-[11px] text-[#A7B2AE] whitespace-nowrap mb-1">가입: ${dateStr}</span>
                        <div class="rounded-xl border ${ticketToneClass} bg-[#06110D] px-3 py-1.5">
                            <div class="text-[12px] text-[#A7B2AE]">입점권 현황</div>
                            <div class="text-[20px] font-extrabold ${planBucket === 'none' ? 'text-gray-200' : 'text-white'} mt-0.5 tracking-tight">${ticketLabel}</div>
                            <div class="text-[13px] text-[#A7B2AE] mt-1">만료 시각: ${expiryText}</div>
                            <div class="shop-ticket-countdown mt-1.5 px-2.5 py-1 rounded text-[13px] font-mono border ${countdownView.tone === 'expired' ? 'border-red-500/60 text-red-400 bg-red-900/25' : 'border-[#2A3731] text-[#A7B2AE] bg-[#06110D]'}" data-expiry="${Number(data.ticketExpiryTimestamp || 0)}">${countdownView.text}</div>
                        </div>
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
    persistShopChangeBaselineIfDirty();
    updateShopListMeta(total, visibleCount);
    updateShopTicketCountdowns();
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

function getShopStatusLabelForModal(shop = {}) {
    const status = getShopOperationalStatus(shop);
    if (status === 'active') return '운영중 (승인완료)';
    if (status === 'expired') return '입점권 만료/제재';
    return '승인대기';
}

function getSubscriptionLogTicketLabel(row = {}) {
    const a = String(row.actionType || '').trim();
    if (a === 'add_1') return '1개월 입점권';
    if (a === 'add_3') return '3개월 입점권';
    if (a === 'add_6') return '6개월 입점권 (Premium)';
    if (a === 'add_12') return '12개월 입점권 (VIP)';
    if (a === 'add') {
        const d = row.daysAdjusted;
        return Number.isFinite(Number(d)) ? `일 수 연장 (+${d}일)` : '일 수 연장';
    }
    if (a === 'subtract') {
        const d = row.daysAdjusted;
        return Number.isFinite(Number(d)) ? `일 수 차감 (-${d}일)` : '일 수 차감';
    }
    if (a === 'set_date') return '만료일 직접 설정';
    if (a === 'force_stop') return '강제 만료';
    return a ? `수동 조정 (${a})` : '수동 조정';
}

function mapSubscriptionRequestToHistoryRow(row = {}) {
    const status = normalizeSubRequestStatus(row.status);
    const months = Number(row.months || 0);
    const titleOrMonths =
        (row.ticketTitle && String(row.ticketTitle).trim()) ||
        getTicketTypeByMonths(months) ||
        (months ? `${months}개월 입점 신청` : '입점권 신청');
    let statusLabel = '승인 완료';
    let ticketKind = titleOrMonths;
    let processedAt = row.completedAt || row.updatedAt || row.createdAt;
    let expiryTs = row.approvedExpiryTimestamp;

    if (status === 'completed') {
        ticketKind =
            row.approvedTicketType ||
            getTicketTypeByMonths(row.approvedMonths || months) ||
            titleOrMonths;
        processedAt = row.completedAt || row.updatedAt;
        expiryTs = row.approvedExpiryTimestamp;
    } else if (status === 'pending') {
        statusLabel = '신청 대기';
        ticketKind = titleOrMonths;
        processedAt = row.createdAt || row.updatedAt;
        expiryTs = null;
    } else if (status === 'rejected') {
        statusLabel = '반려';
        ticketKind = titleOrMonths;
        processedAt = row.completedAt || row.updatedAt;
        expiryTs = null;
    }

    let timeCaption = '신청·구매·처리 시각';
    if (status === 'pending') timeCaption = '신청 시각';
    else if (status === 'rejected') timeCaption = '반려 처리 시각';
    else if (status === 'completed') timeCaption = '승인·처리 시각';

    const sortKey = Math.max(
        getTimestampMs(row.completedAt),
        getTimestampMs(row.updatedAt),
        getTimestampMs(row.createdAt),
    );

    const badgeClass =
        status === 'completed'
            ? 'bg-[var(--point-color)]/20 text-[var(--point-color)] border border-[var(--point-color)]/35'
            : status === 'pending'
              ? 'bg-amber-500/15 text-amber-200 border border-amber-500/30'
              : status === 'rejected'
                ? 'bg-red-500/15 text-red-300 border border-red-500/35'
                : 'bg-[#11291D] text-[#A7B2AE] border border-[#2A3731]';

    return {
        kind: 'request',
        statusLabel,
        badgeClass,
        ticketKind,
        timeCaption,
        processedAtLabel: formatAdminDateTime(processedAt),
        expiryLabel: expiryTs != null && expiryTs !== '' ? formatAdminDateTime(expiryTs) : '-',
        sortKey,
        extraLine:
            status === 'rejected' && row.rejectReason
                ? `반려 사유: ${String(row.rejectReason)}`
                : '',
    };
}

function mapSubscriptionLogToHistoryRow(row = {}) {
    const ticketKind = getSubscriptionLogTicketLabel(row);
    return {
        kind: 'log',
        statusLabel: '수동 조정',
        badgeClass: 'bg-[#22332B] text-[#C8D1CD] border border-[#2A3731]',
        ticketKind,
        timeCaption: '처리 시각',
        processedAtLabel: formatAdminDateTime(row.createdAt),
        expiryLabel: formatAdminDateTime(row.newExpiryTimestamp),
        sortKey: Math.max(getTimestampMs(row.createdAt), Number(row.newExpiryTimestamp || 0)),
        extraLine: row.reasonText ? `사유: ${String(row.reasonText)}` : '',
    };
}

function buildShopSubscriptionHistoryRows() {
    const reqRows = shopModalLiveReqRows.map((row) => mapSubscriptionRequestToHistoryRow(row));
    const logRows = shopModalLiveLogRows.map((row) => mapSubscriptionLogToHistoryRow(row));
    return reqRows.concat(logRows).sort((a, b) => b.sortKey - a.sortKey);
}

function renderShopSubscriptionHistory(items = []) {
    const el = document.getElementById('shop-subscription-history');
    const toggleBtn = document.getElementById('shop-subscription-history-toggle');
    if (!el) return;

    const total = items.length;
    const cap = SHOP_SUBSCRIPTION_HISTORY_COLLAPSED;
    const expanded = shopModalSubscriptionExpanded;
    const visibleItems =
        !expanded && total > cap ? items.slice(0, cap) : items;

    if (!total) {
        el.innerHTML = '<p class="text-[#8C9A95]">입점권 관련 이력이 없습니다.</p>';
        if (toggleBtn) toggleBtn.classList.add('hidden');
        return;
    }

    if (toggleBtn) {
        if (total > cap) {
            toggleBtn.classList.remove('hidden');
            toggleBtn.textContent = expanded
                ? '접기 (요약만 보기)'
                : `전체 이력 펼쳐보기 (${total}건)`;
        } else {
            toggleBtn.classList.add('hidden');
        }
    }

    el.className = expanded
        ? 'space-y-2 text-sm text-[#C8D1CD] max-h-[min(70vh,28rem)] overflow-y-auto pr-1'
        : 'space-y-2 text-sm text-[#C8D1CD] max-h-56 overflow-y-auto pr-1';

    let html = '';
    visibleItems.forEach((row) => {
        html += `
            <div class="border border-[#2A3731] rounded-lg px-3 py-2.5 bg-[#0A1B13]">
                <div class="flex flex-wrap items-center gap-2 mb-1.5">
                    <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${row.badgeClass}">${escapeHtml(row.statusLabel)}</span>
                </div>
                <div class="text-[13px] text-white font-medium leading-snug">입점권 종류 · ${escapeHtml(row.ticketKind)}</div>
                <div class="text-[12px] text-[#B8C4BF] mt-1">${escapeHtml(row.timeCaption)} · ${escapeHtml(row.processedAtLabel)}</div>
                <div class="text-[12px] text-[#8C9A95] mt-0.5">종료 시각 · ${escapeHtml(row.expiryLabel)}</div>
                ${
                    row.extraLine
                        ? `<div class="text-[11px] text-[#A7B2AE] mt-1.5 leading-relaxed">${escapeHtml(row.extraLine)}</div>`
                        : ''
                }
            </div>
        `;
    });
    el.innerHTML = html;
}

window.toggleShopModalSubscriptionHistory = function toggleShopModalSubscriptionHistory() {
    shopModalSubscriptionExpanded = !shopModalSubscriptionExpanded;
    const pid = document.getElementById('shop-id')?.value;
    if (pid) renderShopModalRealtimeView(pid);
};

function renderShopPenaltyHistory(items = []) {
    const el = document.getElementById('shop-penalty-history');
    if (!el) return;
    if (!items.length) {
        el.innerHTML = '<p class="text-[#8C9A95]">경고/제재 이력이 없습니다.</p>';
        return;
    }
    let html = '';
    items.forEach((row) => {
        html += `
            <div class="border border-red-900/40 rounded-lg px-3 py-2 bg-[#1A0F10]">
                <div class="text-red-300 text-sm font-semibold">${escapeHtml(row.type || '제재')}</div>
                <div class="text-[12px] text-[#C9A5AA] mt-1">사유: ${escapeHtml(row.reason || '-')}</div>
                <div class="text-[12px] text-[#8C9A95] mt-1">처리시각: ${escapeHtml(row.whenLabel || '-')}</div>
            </div>
        `;
    });
    el.innerHTML = html;
}

function getTimestampMs(value) {
    if (!value) return 0;
    if (typeof value.toMillis === 'function') return value.toMillis();
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
}

function clearShopModalRealtimeListeners() {
    shopModalRealtimeUnsubs.forEach((unsub) => {
        if (typeof unsub === 'function') {
            try {
                unsub();
            } catch (err) {
                console.warn('shop modal unsubscribe warning:', err);
            }
        }
    });
    shopModalRealtimeUnsubs = [];
    shopModalLivePartnerData = null;
    shopModalLiveReqRows = [];
    shopModalLiveLogRows = [];
    shopModalLivePenaltyRows = [];
    shopModalSubscriptionExpanded = false;
}

function setShopModalReadonlyMode() {
    const form = document.getElementById('shop-form');
    if (!form) return;
    form.querySelectorAll('input, textarea, select').forEach((el) => {
        if (el.id === 'shop-id') return;
        if (el.id === 'shop-admin-placement') {
            el.disabled = false;
            el.classList.remove('opacity-90', 'cursor-not-allowed');
            return;
        }
        const tag = String(el.tagName || '').toLowerCase();
        if (tag === 'select') {
            el.disabled = true;
            el.classList.add('opacity-90', 'cursor-not-allowed');
        } else {
            el.readOnly = true;
            el.classList.add('cursor-default');
        }
    });
}

/** 파트너 대시보드 `regionList` 배열 → 관리자 모달 표시용 (상세주소와 분리) */
function formatPartnerActivityRegionsForAdmin(data = {}) {
    const d = data || {};
    if (Array.isArray(d.regionList) && d.regionList.length) {
        return d.regionList.map((x) => String(x).trim()).filter(Boolean).join('\n');
    }
    if (typeof d.region === 'string' && d.region.trim()) {
        return d.region.trim();
    }
    return '';
}

/** 콤마 구분 문자열 또는 배열 → 줄바꿈으로 풀어서 전체 노출 */
function formatPartnerCommaOrMultilineField(val) {
    if (val == null) return '';
    if (Array.isArray(val)) {
        return val.map((x) => String(x).trim()).filter(Boolean).join('\n');
    }
    const s = String(val).trim();
    if (!s) return '';
    return s
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)
        .join('\n');
}

function normalizeMenusArrayForAdmin(raw) {
    if (raw == null) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'object') {
        const keys = Object.keys(raw).filter((k) => /^\d+$/.test(k));
        if (keys.length) {
            return keys
                .map((k) => Number(k))
                .sort((a, b) => a - b)
                .map((k) => raw[String(k)]);
        }
        return [raw];
    }
    return [];
}

function formatOneMenuRowForAdmin(m) {
    if (m == null) return '';
    if (typeof m === 'string' || typeof m === 'number' || typeof m === 'boolean') {
        return String(m).trim();
    }
    if (typeof m !== 'object') return String(m);
    const name = m.name != null ? String(m.name).trim() : '';
    const theme = m.theme != null ? String(m.theme).trim() : '';
    const desc = m.desc != null ? String(m.desc).trim() : '';
    let priceLabel = '';
    if (m.price != null) {
        const digits = String(m.price).replace(/[^0-9]/g, '');
        if (digits && !Number.isNaN(Number(digits))) {
            priceLabel = `${Number(digits).toLocaleString('ko-KR')}원`;
        } else if (String(m.price).trim()) {
            priceLabel = String(m.price).trim();
        }
    }
    const parts = [
        name && `코스: ${name}`,
        theme && `테마: ${theme}`,
        desc && `상세: ${desc}`,
        priceLabel && `가격: ${priceLabel}`,
    ].filter(Boolean);
    if (parts.length) return parts.join('  |  ');
    try {
        return JSON.stringify(m, null, 2);
    } catch (e) {
        return '';
    }
}

function formatPartnerMenusForAdminField(data = {}) {
    const d = data || {};
    const mt = d.menuText;
    let raw = d.menus != null ? d.menus : d.pricing;
    raw = normalizeMenusArrayForAdmin(raw);
    if (!raw.length) {
        if (Array.isArray(mt) && mt.length) {
            return mt.map(formatOneMenuRowForAdmin).filter(Boolean).join('\n');
        }
        if (typeof mt === 'string' || typeof mt === 'number' || typeof mt === 'boolean') {
            return String(mt).trim();
        }
        if (mt != null && typeof mt === 'object') {
            return formatOneMenuRowForAdmin(mt);
        }
        return '';
    }
    return raw.map(formatOneMenuRowForAdmin).filter(Boolean).join('\n');
}

function renderShopModalRealtimeView(partnerId = '') {
    const data = shopModalLivePartnerData || {};
    if (!partnerId) return;
    const changeSummary = getShopChangeSummary(partnerId, data, { initializeIfMissing: true });
    renderShopModalChangeBadges(changeSummary);

    const titleEl = document.getElementById('shop-modal-title');
    const summaryStatusEl = document.getElementById('shop-summary-status');
    const summaryTicketEl = document.getElementById('shop-summary-ticket');
    const summaryVisitorsEl = document.getElementById('shop-summary-visitors');
    const summaryReviewsEl = document.getElementById('shop-summary-reviews');

    if (titleEl) titleEl.textContent = '마사지 샵 운영 정보 상세(읽기전용)';
    document.getElementById('shop-id').value = partnerId;
    document.getElementById('shop-user-id').value = data.userId || partnerId || '';
    document.getElementById('shop-name').value = data.name || data.company || '';
    document.getElementById('shop-location').value = formatPartnerActivityRegionsForAdmin(data);
    document.getElementById('shop-owner-name').value = data.ownerName || data.ceoName || '';
    document.getElementById('shop-mobile').value =
        data.phoneNumber || data.mobile || data.mobilePhone || data.contact || data.phone || '';
    document.getElementById('shop-contact').value =
        data.phoneNumber || data.contact || data.officePhone || data.mobile || data.mobilePhone || data.phone || '';
    document.getElementById('shop-business-type').value = data.businessType || data.bizType || '';
    document.getElementById('shop-business-number').value =
        data.businessNumber || data.bizNo || '';
    document.getElementById('shop-massage').value = formatPartnerCommaOrMultilineField(data.massage);
    document.getElementById('shop-place').value = formatPartnerCommaOrMultilineField(data.place);
    document.getElementById('shop-age').value = formatPartnerCommaOrMultilineField(data.age);
    document.getElementById('shop-call-enabled').value =
        (typeof data.callEnabled === 'boolean' ? data.callEnabled : true) ? 'on' : 'off';
    const adminPlacementSelect = document.getElementById('shop-admin-placement');
    if (adminPlacementSelect) {
        const placementRaw = String(data.adminPlacement || '').trim().toLowerCase();
        const placement =
            placementRaw === 'choice' || placementRaw === 'recommend' ? placementRaw : 'auto';
        adminPlacementSelect.value = placement;
    }
    document.getElementById('shop-call-start').value = data.callAvailableStart || '';
    document.getElementById('shop-call-end').value = data.callAvailableEnd || '';
    document.getElementById('shop-address-detail').value = data.address || data.location || '';
    document.getElementById('shop-description').value =
        data.catchphrase != null && String(data.catchphrase).trim() !== ''
            ? data.catchphrase
            : data.description || data.desc || '';
    document.getElementById('shop-menus').value = formatPartnerMenusForAdminField(data);

    const st = data.stats && typeof data.stats === 'object' ? data.stats : {};

    if (summaryStatusEl) summaryStatusEl.textContent = getShopStatusLabelForModal(data);
    if (summaryTicketEl) summaryTicketEl.textContent = getShopSummaryPlanLabel(getShopPlanBucket(data));
    if (summaryVisitorsEl) {
        // 파트너 대시보드는 sync 시 `stats.*`에 저장 — 루트 필드만 보면 0으로 보이던 문제 방지
        const totalVisitors = Number(
            Number.isFinite(Number(st.totalVisitors))
                ? st.totalVisitors
                : data.totalVisitors || data.visitCountTotal || data.visitorCount || 0,
        );
        const todayVisitors = Number(
            Number.isFinite(Number(st.todayVisitors))
                ? st.todayVisitors
                : data.todayVisitors || data.todayVisitCount || data.dailyVisitors || 0,
        );
        summaryVisitorsEl.textContent = `누적 ${totalVisitors.toLocaleString()} / 오늘 ${todayVisitors.toLocaleString()}`;
    }
    if (summaryReviewsEl) {
        const reviews = Number(
            Number.isFinite(Number(st.totalReviews)) ? st.totalReviews : data.reviews || data.reviewCount || 0,
        );
        const avg = Number(data.rating);
        const avgLabel = Number.isFinite(avg) && reviews > 0 ? avg.toFixed(1) : '0.0';
        summaryReviewsEl.textContent =
            reviews > 0 ? `${reviews.toLocaleString()}건 · 평균 ${avgLabel}점` : '0건';
    }

    const penalties = shopModalLivePenaltyRows
        .map((row) => ({
            type: row.type || '제재',
            reason: row.reason || '',
            whenLabel: formatAdminDateTime(row.createdAt || null),
            whenMs: getTimestampMs(row.createdAt),
        }))
        .sort((a, b) => b.whenMs - a.whenMs)
        .slice(0, 5);
    renderShopPenaltyHistory(penalties);

    const subscriptionRows = buildShopSubscriptionHistoryRows();
    renderShopSubscriptionHistory(subscriptionRows);
}

window.saveShopPlacementOverride = async function () {
    const partnerId = String(document.getElementById('shop-id')?.value || '').trim();
    if (!partnerId) {
        alert('업체 정보를 찾을 수 없습니다. 다시 열어서 시도해주세요.');
        return;
    }
    const placementRaw = String(document.getElementById('shop-admin-placement')?.value || 'auto')
        .trim()
        .toLowerCase();
    const placement =
        placementRaw === 'choice' || placementRaw === 'recommend' ? placementRaw : 'auto';
    const payload = {
        adminPlacement: placement,
        adminPlacementUpdatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        adminPlacementUpdatedBy: auth.currentUser?.email || 'admin',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };
    try {
        await db.collection('partners').doc(partnerId).update(payload);
        if (shopModalLivePartnerData && typeof shopModalLivePartnerData === 'object') {
            shopModalLivePartnerData = { ...shopModalLivePartnerData, ...payload };
        }
        alert('메인 노출 분류가 저장되었습니다.');
    } catch (err) {
        console.error('노출 분류 저장 실패:', err);
        alert('노출 분류 저장 중 오류가 발생했습니다: ' + (err.message || 'unknown'));
    }
};

async function openShopModal(partnerId = '') {
    if (!partnerId) {
        alert('읽기전용 상세 화면은 승인된 업체를 선택해서만 확인할 수 있습니다.');
        return;
    }

    clearShopModalRealtimeListeners();
    shopModalCurrentPartnerId = partnerId;
    document.getElementById('shop-form').reset();
    document.getElementById('shop-id').value = partnerId;
    renderShopSubscriptionHistory([]);
    renderShopPenaltyHistory([]);
    renderShopModalChangeBadges({ sectionCounts: { basic: 0, ops: 0, menus: 0 } });
    setShopModalReadonlyMode();
    openModal('modal-shop');

    const partnerUnsub = db
        .collection('partners')
        .doc(partnerId)
        .onSnapshot(
            (doc) => {
                if (!doc.exists) {
                    alert('해당 업체 데이터가 삭제되어 상세 화면을 닫습니다.');
                    closeModal('modal-shop');
                    return;
                }
                shopModalLivePartnerData = doc.data() || {};
                renderShopModalRealtimeView(partnerId);
            },
            (err) => {
                console.error('shop partner snapshot error:', err);
            },
        );

    const reqUnsub = db
        .collection('subscription_requests')
        .where('partnerId', '==', partnerId)
        .onSnapshot(
            (snapshot) => {
                shopModalLiveReqRows = snapshot.docs.map((d) => d.data() || {});
                renderShopModalRealtimeView(partnerId);
            },
            (err) => {
                console.error('shop subscription_requests snapshot error:', err);
            },
        );

    const logUnsub = db
        .collection('subscription_logs')
        .where('partnerId', '==', partnerId)
        .onSnapshot(
            (snapshot) => {
                shopModalLiveLogRows = snapshot.docs.map((d) => d.data() || {});
                renderShopModalRealtimeView(partnerId);
            },
            (err) => {
                console.error('shop subscription_logs snapshot error:', err);
            },
        );

    const penaltyUnsub = db
        .collection('penalties')
        .where('targetId', '==', partnerId)
        .limit(50)
        .onSnapshot(
            (snapshot) => {
                shopModalLivePenaltyRows = snapshot.docs.map((d) => d.data() || {});
                renderShopModalRealtimeView(partnerId);
            },
            (err) => {
                console.error('shop penalties snapshot error:', err);
            },
        );

    shopModalRealtimeUnsubs.push(partnerUnsub, reqUnsub, logUnsub, penaltyUnsub);
}

function handleShopSubmit(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    alert('현재 화면은 읽기전용입니다. 변경은 파트너 대시보드 또는 관련 운영 화면에서 처리됩니다.');
    return false;
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
    const auditAction = DEV_ALERT_ACTIONS.resetAll;
    if (!(await assertDevAlertAccess(auditAction))) return;

    if (getDevAlertCooldownRemainingMs('resetAll') > 0) {
        consumeDevAlertCooldown('resetAll');
        return;
    }
    if (!(await confirmPartnerResetSafetyChecks())) {
        setDiscordLog('전체 초기화 요청이 취소되었습니다.', 'warn');
        await writeDevAlertAuditLog(auditAction, 'cancelled', { reason: 'user_cancelled' });
        return;
    }
    if (!consumeDevAlertCooldown('resetAll')) return;

    await writeDevAlertAuditLog(auditAction, 'requested');
    try {
        // 네트워크 상태와 무관하게 확실한 최신 데이터를 가져옵니다.
        const snapshot = await db.collection('partners').get({ source: 'server' });
        const reviewSnapshot = await db.collection('reviews').get({ source: 'server' });

        if (snapshot.empty && reviewSnapshot.empty) {
            alert('삭제할 파트너 또는 리뷰 데이터가 없습니다.');
            await writeDevAlertAuditLog(auditAction, 'completed', {
                deletedPartners: 0,
                deletedReviews: 0,
                message: 'already_empty',
            });
            return;
        }

        let deletedPartners = 0;
        let deletedReviews = 0;
        let batchIndex = 0;
        let batch = db.batch();
        let commitPromises = [];

        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
            deletedPartners++;
            batchIndex++;
            if (batchIndex === 500) {
                commitPromises.push(batch.commit());
                batch = db.batch();
                batchIndex = 0;
            }
        });

        reviewSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
            deletedReviews++;
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
        setDiscordLog('업체/리뷰 전체 초기화 완료', 'success');
        alert(
            `총 ${deletedPartners}개의 파트너와 ${deletedReviews}개의 리뷰가 성공적으로 삭제되었습니다.`,
        );
        await writeDevAlertAuditLog(auditAction, 'completed', {
            deletedPartners,
            deletedReviews,
        });
    } catch (err) {
        console.error('삭제 중 오류:', err);
        setDiscordLog('전체 초기화 실패', 'danger');
        alert('삭제 실패: ' + err.message);
        await writeDevAlertAuditLog(auditAction, 'failed', {
            message: err?.message || String(err),
        });
    }
}

/** 방문자 찐리뷰(partner_reviews)만 전부 삭제하고 모든 partners의 평점·건수를 0으로 맞춤 — 업체 문서는 유지 */
async function resetAllVisitorPartnerReviewsOnly() {
    if (!auth.currentUser) {
        alert('관리자 로그인이 필요합니다.');
        return;
    }
    if (
        !confirm(
            '모든 업체의 방문자 찐리뷰(partner_reviews)를 삭제하고, 평점·리뷰 수를 0으로 초기화합니다. 계속할까요?',
        )
    ) {
        return;
    }
    try {
        const rs = await db.collection('partner_reviews').get({ source: 'server' });
        let batch = db.batch();
        let ops = 0;
        const commits = [];
        rs.docs.forEach((doc) => {
            batch.delete(doc.ref);
            ops++;
            if (ops >= 450) {
                commits.push(batch.commit());
                batch = db.batch();
                ops = 0;
            }
        });
        if (ops > 0) commits.push(batch.commit());
        await Promise.all(commits);

        const ps = await db.collection('partners').get({ source: 'server' });
        batch = db.batch();
        ops = 0;
        commits.length = 0;
        ps.docs.forEach((doc) => {
            const d = doc.data() || {};
            const prevStats = d.stats && typeof d.stats === 'object' ? d.stats : {};
            batch.set(
                doc.ref,
                {
                    reviews: 0,
                    rating: 0,
                    stats: {
                        ...prevStats,
                        totalReviews: 0,
                    },
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                },
                { merge: true },
            );
            ops++;
            if (ops >= 450) {
                commits.push(batch.commit());
                batch = db.batch();
                ops = 0;
            }
        });
        if (ops > 0) commits.push(batch.commit());
        await Promise.all(commits);

        alert('방문자 찐리뷰가 모두 초기화되었습니다.');
    } catch (err) {
        console.error(err);
        alert('초기화 실패: ' + (err && err.message ? err.message : String(err)));
    }
}

async function generateDummyPartners() {
    const auditAction = DEV_ALERT_ACTIONS.generateDummy;
    if (!(await assertDevAlertAccess(auditAction))) return;

    if (getDevAlertCooldownRemainingMs('generateDummy') > 0) {
        consumeDevAlertCooldown('generateDummy');
        return;
    }
    if (
        !confirm(
            '테스트용 50개 더미 파트너/리뷰 데이터를 생성하시겠습니까? 기존 데이터는 유지되고 50건이 추가됩니다.',
        )
    ) {
        await writeDevAlertAuditLog(auditAction, 'cancelled', { reason: 'user_cancelled' });
        return;
    }
    if (!consumeDevAlertCooldown('generateDummy')) return;
    await writeDevAlertAuditLog(auditAction, 'requested', { targetCount: 50 });

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
        await writeDevAlertAuditLog(auditAction, 'completed', {
            createdPartners: count,
            createdReviews: count,
        });
        alert(`성공적으로 ${count}개의 더미 파트너와 리뷰가 실제 DB에 생성되었습니다!`);
    } catch (e) {
        console.error(e);
        await writeDevAlertAuditLog(auditAction, 'failed', {
            message: e?.message || String(e),
        });
        alert('데이터 생성 중 오류가 발생했습니다: ' + e.message);
    }
}

// 디스코드 Discord Webhook testing (시뮬레이션)
async function testDiscordWebhook() {
    const auditAction = DEV_ALERT_ACTIONS.simulateError;
    if (!(await assertDevAlertAccess(auditAction))) return;
    if (!consumeDevAlertCooldown('simulateError')) return;

    const logBox = document.getElementById('discord-log');
    if (!logBox) return;
    logBox.innerText = `[전송 테스트] 웹훅 테스트 URL이 현재 미입력되어 디스플레이 변경으로 작동합니다. (에러 전송 완료 모방)`;
    logBox.classList.add('text-green-400');
    await writeDevAlertAuditLog(auditAction, 'completed', {
        mode: 'ui_simulation',
    });
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

function getSubRemainingTimeCellHtml(row = {}) {
    const expiryTs = Number(row.approvedExpiryTimestamp || row.ticketExpiryTimestamp || 0);
    if (row.normalizedStatus === 'rejected') {
        return '<div class="text-[11px] text-red-400">반려 건</div>';
    }
    if (row.normalizedStatus !== 'completed') {
        return '<div class="text-[11px] text-[#6F7B76]">승인 완료 후 표시</div>';
    }
    if (!expiryTs) {
        return '<div class="text-[11px] text-[#A7B2AE]">만료일 정보 없음</div>';
    }

    const expiryDate = new Date(expiryTs);
    const expiryLabel = Number.isNaN(expiryDate.getTime())
        ? '-'
        : `${String(expiryDate.getMonth() + 1).padStart(2, '0')}/${String(expiryDate.getDate()).padStart(2, '0')} ${String(expiryDate.getHours()).padStart(2, '0')}:${String(expiryDate.getMinutes()).padStart(2, '0')}`;

    return `
        <div class="flex flex-col gap-1">
            <div class="countdown-timer text-[11px] font-mono border border-[#2A3731] bg-[#06110D] text-[#A7B2AE] px-2 py-0.5 rounded inline-block" data-expiry="${expiryTs}">계산중...</div>
            <span class="text-[11px] text-[#A7B2AE]">만료 예정: ${expiryLabel}</span>
        </div>
    `;
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
        '<tr><td colspan="6" class="p-8 text-center text-[#A7B2AE]">로딩 중...</td></tr>';

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
                    tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-[#A7B2AE]">${emptyMsgMap[currentSubRequestStatus] || '신청 내역이 없습니다.'}</td></tr>`;
                    return;
                }

                let html = '';
                matches.forEach((data) => {
                    const reqId = data.id;
                    const dStr = formatSubDateTime(data.createdAt);
                    const completedStr = formatSubDateTime(data.completedAt || data.updatedAt);
                    const remainingTimeHtml = getSubRemainingTimeCellHtml(data);

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
                    <td class="p-4 align-middle">${remainingTimeHtml}</td>
                    <td class="p-3 align-middle text-right">${btnHtml}</td>
                </tr>`;
                });
                tbody.innerHTML = html;
            },
            (err) => {
                console.error('Error loading sub requests: ', err);
                updateSubscriptionRequestCounters([]);
                tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-red-400">신청 현황 로드 실패: ${err.message}</td></tr>`;
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
        const approvedMonths = Number(addMonths) || 0;
        const approvedTicketType =
            approvedMonths === 1
                ? '1개월 입점권'
                : approvedMonths === 3
                    ? '3개월 입점권'
                    : approvedMonths === 6
                        ? '6개월 입점권'
                        : approvedMonths === 12
                            ? '12개월 입점권'
                            : `${approvedMonths}개월 입점권`;

        // 1. Update partner expiry
        await partnerRef.update({
            ticketExpiryTimestamp: newDate.getTime(),
            ticketExpiry: newExpiryStr,
            ticketType: approvedTicketType,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        // 2. Mark request as completed
        await db.collection('subscription_requests').doc(reqId).update({
            status: 'completed',
            completedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            approvedBy: auth.currentUser?.email || 'admin',
            approvedMonths,
            approvedTicketType,
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
        const p = data.phoneNumber || data.mobile || data.mobilePhone || data.contact || data.phone || data.managerPhone || '';

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

function normalizeCSTicketAttachmentUrls(data = {}) {
    const collectFromArray = (arr) => {
        if (!Array.isArray(arr) || !arr.length) return [];
        const out = [];
        arr.forEach((item) => {
            if (item == null) return;
            if (typeof item === 'string') {
                const s = item.trim();
                if (s) out.push(s);
                return;
            }
            if (typeof item === 'object') {
                const u = item.url || item.href || item.src || item.downloadURL || item.downloadUrl;
                if (u) out.push(String(u).trim());
            }
        });
        return out;
    };

    const tryKeys = ['attachmentUrls', 'imageUrls', 'photos', 'attachments', 'images', 'files'];
    for (let i = 0; i < tryKeys.length; i++) {
        const key = tryKeys[i];
        const v = data[key];
        if (Array.isArray(v) && v.length) {
            const list = collectFromArray(v);
            if (list.length) return [...new Set(list)];
        }
        if (typeof v === 'string' && v.trim().startsWith('http')) {
            return [v.trim()];
        }
    }
    if (typeof data.attachmentUrls === 'string' && data.attachmentUrls.trim()) {
        return [data.attachmentUrls.trim()];
    }
    if (typeof data.attachmentUrl === 'string' && data.attachmentUrl.trim()) {
        return [data.attachmentUrl.trim()];
    }
    if (typeof data.photoUrl === 'string' && data.photoUrl.trim()) {
        return [data.photoUrl.trim()];
    }
    return [];
}

/** 첨부 영역은 항상 표시 (없으면 안내 문구) */
function renderCSTicketAttachmentBlock(attachmentUrls = []) {
    const urls = Array.isArray(attachmentUrls) ? attachmentUrls.filter(Boolean) : [];
    const cards = urls
        .map((url) => {
            const u = escapeHtml(url);
            return `
            <div class="relative rounded-xl overflow-hidden border border-[#2A3731] bg-[#06110D] w-[min(100%,220px)] shrink-0">
                <a href="${u}" target="_blank" rel="noopener noreferrer" class="block aspect-square bg-black/40">
                    <img src="${u}" alt="첨부 이미지" class="w-full h-full object-cover hover:opacity-90 transition-opacity" loading="lazy" referrerpolicy="no-referrer" />
                </a>
            </div>`;
        })
        .join('');
    const emptyHint = `
        <div class="rounded-xl border border-dashed border-[#2A3731] bg-[#06110D] px-4 py-6 text-center text-sm text-[#A7B2AE] leading-relaxed">
            등록된 첨부 이미지가 없습니다.<br>
            <span class="text-[11px] text-[#6B7A72]">앱에서 사진을 함께 올린 경우 Firestore 필드 <code class="text-[var(--point-color)]">attachmentUrls</code> · Storage 업로드가 필요합니다.</span>
        </div>`;
    return `
        <div class="mb-6 border border-[#2A3731] rounded-2xl p-4 bg-[#08150F]/80">
            <h5 class="font-bold text-white mb-3 flex items-center gap-2 flex-wrap">
                <svg class="w-5 h-5 text-[var(--point-color)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                첨부 사진
                <span class="text-sm font-normal text-[#A7B2AE]">(${urls.length}장)</span>
            </h5>
            ${urls.length ? `<div class="flex flex-wrap gap-3">${cards}</div><p class="text-[11px] text-[#6B7A72] mt-3">썸네일을 누르면 새 탭에서 원본을 엽니다.</p>` : emptyHint}
        </div>`;
}

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
                    authorRole: data.authorRole || '',
                    authorDocId: data.authorDocId || '',
                    authorUserId: data.authorUserId || '',
                    userId: data.userId || '',
                    writerId: data.writerId || '',
                    writerUserId: data.writerUserId || '',
                    requesterId: data.requesterId || '',
                    requesterUserId: data.requesterUserId || '',
                    targetUserId: data.targetUserId || '',
                    targetPartnerId: data.targetPartnerId || '',
                    date: displayDate,
                    targetId: data.targetId || null,
                    targetName: data.targetName || null,
                    memo: data.memo || '',
                    replyTextUser: data.replyTextUser || '',
                    replyTextPartner: data.replyTextPartner || '',
                    replyText: data.replyText || '',
                    repliedAt: data.repliedAt || null,
                    repliedBy: data.repliedBy || '',
                    attachmentUrls: normalizeCSTicketAttachmentUrls(data),
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
            const attachHay = Array.isArray(t.attachmentUrls) ? t.attachmentUrls.join(' ').toLowerCase() : '';
            return (
                t.title.toLowerCase().includes(searchQuery) ||
                t.content.toLowerCase().includes(searchQuery) ||
                t.author.toLowerCase().includes(searchQuery) ||
                attachHay.includes(searchQuery)
            );
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

        const attachHint =
            ticket.attachmentUrls && ticket.attachmentUrls.length
                ? `<span class="inline-flex items-center justify-center shrink-0 text-[var(--point-color)]" title="사진 ${ticket.attachmentUrls.length}장">📎</span>`
                : '';
        tr.innerHTML = `
            <td class="p-4 whitespace-nowrap">${typeLabels[ticket.type]}</td>
            <td class="p-4 whitespace-nowrap">${statusBadge}</td>
            <td class="p-4 max-w-[300px] text-white font-medium"><div class="flex items-center gap-1.5 min-w-0"><span class="truncate">${escapeHtml(ticket.title)}</span>${attachHint}</div></td>
            <td class="p-4 whitespace-nowrap">${escapeHtml(ticket.author)}</td>
            <td class="p-4 whitespace-nowrap text-[#A7B2AE]">${ticket.date}</td>
            <td class="p-4 text-center">
                <div class="flex flex-wrap items-center justify-center gap-2">
                    <button type="button" onclick="event.stopPropagation(); openCSDetailPanel('${ticket.id}')" class="px-4 py-2 bg-[#11291D] hover:bg-gradient-to-r hover:from-[var(--point-color)] hover:to-[#B59530] hover:text-[#0A1B13] border border-[#2A3731] hover:border-transparent rounded-lg text-xs transition-all font-bold shadow-sm">상세 보기</button>
                    <button type="button" onclick="event.stopPropagation(); deleteCSTicket('${ticket.id}')" class="px-3 py-2 bg-transparent hover:bg-red-950/40 text-red-400 border border-red-500/40 rounded-lg text-xs font-bold transition-colors">삭제</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function openCSDetailPanel(ticketId) {
    activeCSTicketId = ticketId;
    let ticket = csTicketsData.find((t) => t.id === ticketId);
    if (!ticket) return;

    try {
        const snap = await db.collection('cs_tickets').doc(ticketId).get();
        if (snap.exists) {
            const raw = snap.data() || {};
            const urls = normalizeCSTicketAttachmentUrls(raw);
            ticket = { ...ticket, attachmentUrls: urls };
        }
    } catch (e) {
        console.warn('CS 티켓 상세 동기화 실패:', e);
    }

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
            <h4 class="text-2xl font-bold text-white mb-2 leading-snug">${escapeHtml(ticket.title)}</h4>
            <div class="text-[#A7B2AE] text-sm flex gap-4 mt-3">
                <span>작성자: <strong class="text-white">${escapeHtml(ticket.author)}</strong></span>
                <span>작성일시: ${escapeHtml(ticket.date)}</span>
            </div>
        </div>

        <div class="bg-[#11291D] p-5 rounded-2xl border border-[#2A3731] text-white/90 leading-relaxed min-h-[150px] shadow-inner mb-6 whitespace-pre-wrap">${escapeHtml(ticket.content)}</div>

        ${renderCSTicketAttachmentBlock(ticket.attachmentUrls)}

        ${isReport && ticket.targetName ? `
            <div class="bg-gradient-to-r from-red-900/30 to-red-900/10 border border-red-500/30 p-5 rounded-2xl mb-6 shadow-md">
                <h5 class="text-red-400 font-bold flex items-center gap-2 mb-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    신고 대상 (피신고자)
                </h5>
                <p class="text-white text-lg font-bold ml-7">${escapeHtml(ticket.targetName)} <span class="text-sm font-normal text-[#A7B2AE]">(${escapeHtml(String(ticket.targetId || ''))})</span></p>
            </div>
        ` : ''}

        <div class="space-y-3 pt-6 border-t border-[#2A3731]">
            <h5 class="font-bold text-white mb-2 flex items-center gap-2">
                <svg class="w-5 h-5 text-[var(--point-color)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                관리자 내부 확인용 메모
            </h5>
            <textarea id="cs-memo-input" class="w-full bg-[#06110D] border border-[#2A3731] shadow-inner rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--point-color)] transition-colors" rows="3" placeholder="처리 내역이나 특이사항을 이곳에 기록하세요. (사용자에게 보이지 않음)">${escapeHtml(ticket.memo || '')}</textarea>
            <div class="flex justify-end">
                <button onclick="saveCSTicketMemo('${ticket.id}')" class="px-5 py-2 bg-[#11291D] hover:bg-[#1A3A2A] rounded-xl text-white font-bold transition-colors border border-[#2A3731]">메모 저장</button>
            </div>
        </div>

        <div class="space-y-3 pt-6 border-t border-[#2A3731]">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button onclick="openCSMessageComposer('${ticket.id}', 'user')" class="w-full py-4 bg-[#11291D] text-[var(--point-color)] border border-[var(--point-color)] font-bold rounded-xl shadow-lg hover:bg-[var(--point-color)]/20 transition-all active:scale-[0.98]">사용자 메세지 별도 작성</button>
                <button onclick="openCSMessageComposer('${ticket.id}', 'partner')" class="w-full py-4 bg-[#11291D] text-blue-300 border border-blue-500/50 font-bold rounded-xl shadow-lg hover:bg-blue-500/10 transition-all active:scale-[0.98]">업체 메세지 별도 작성</button>
            </div>
        </div>

    `;

    actions.className =
        'p-4 border-t border-[#2A3731] bg-[#06110D] flex flex-wrap items-stretch gap-3 shrink-0';
    actions.innerHTML = '';

    actions.innerHTML += `
        <button type="button" onclick="deleteCSTicket('${ticket.id}')" class="shrink-0 px-4 py-4 bg-transparent text-red-400 border border-red-500/40 font-bold rounded-xl hover:bg-red-950/50 transition-all active:scale-[0.98]">접수 삭제</button>
    `;

    // Add Resolve button
    if (ticket.status !== 'resolved') {
        actions.innerHTML += `
            <button type="button" onclick="resolveCSTicket('${ticket.id}')" class="flex-[2] min-w-[200px] py-4 bg-gradient-to-r from-[var(--point-color)] to-[#B59530] text-white font-bold rounded-xl shadow-[0_5px_15px_rgba(212,175,55,0.2)] hover:shadow-[0_8px_25px_rgba(212,175,55,0.3)] hover:brightness-110 transition-all active:scale-[0.98]">CS 답변 저장 및 완료</button>
        `;
    }

    // Add Penalty button for Reports
    if (isReport && ticket.targetName) {
        actions.innerHTML += `
            <button type="button" onclick="openCSPenaltyModal('${ticket.targetId}', '${ticket.targetName}')" class="flex-1 min-w-[160px] py-4 bg-red-600/10 text-red-500 border border-red-500/50 font-bold rounded-xl shadow-lg hover:bg-red-600 hover:text-white transition-all active:scale-[0.98]">강력 패널티 부과</button>
        `;
    }

    panel.classList.remove('translate-x-full');
}

async function deleteCSTicket(ticketId) {
    const id = String(ticketId || '').trim();
    if (!id || !db) return;
    if (!confirm('이 신고·문의 접수를 삭제할까요?\n삭제 후에는 복구할 수 없습니다.')) return;
    try {
        await db.collection('cs_tickets').doc(id).delete();
        if (String(activeCSTicketId) === id) {
            closeCSDetailPanel();
        }
    } catch (e) {
        console.error('CS 티켓 삭제 실패:', e);
        alert('삭제에 실패했습니다: ' + (e.message || ''));
    }
}

function closeCSDetailPanel() {
    activeCSTicketId = null;
    document.getElementById('slide-cs-detail').classList.add('translate-x-full');
}

function resolveCSTicket(ticketId) {
    const replyUserValue = String(document.getElementById('cs-reply-user-input')?.value || '').trim();
    const replyPartnerValue = String(document.getElementById('cs-reply-partner-input')?.value || '').trim();
    if (confirm('이 티켓을 처리 완료로 변경하시겠습니까? (메세지 발송은 별도 진행)')) {
        const payload = {
            status: 'resolved',
            repliedAt: firebase.firestore.FieldValue.serverTimestamp(),
            repliedBy: auth.currentUser?.email || 'admin',
            resolvedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        };
        if (replyUserValue || replyPartnerValue) {
            payload.replyTextUser = replyUserValue;
            payload.replyTextPartner = replyPartnerValue;
            payload.replyText = replyUserValue || replyPartnerValue || '';
        }
        db.collection('cs_tickets').doc(ticketId).update(payload)
        .then(() => {
            closeCSDetailPanel();
            alert('CS 티켓이 답변 저장 후 완료 처리되었습니다.\n메세지 발송은 별도 버튼으로 진행해주세요.');
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

function collectTicketRecipientTokens(ticket, audience = 'user') {
    const tokens = [];
    const pushToken = (v) => {
        const raw = String(v || '').trim();
        if (!raw) return;
        tokens.push(raw);

        const innerMatches = raw.match(/\(([^)]+)\)/g) || [];
        innerMatches.forEach((chunk) => {
            const extracted = String(chunk).replace(/[()]/g, '').trim();
            if (extracted) tokens.push(extracted);
        });

        raw.split(/[,\s/|]+/).forEach((part) => {
            const extracted = String(part || '').trim();
            if (extracted && extracted.length >= 2) tokens.push(extracted);
        });
    };
    const isUserTicket = String(ticket?.type || '').startsWith('customer_');
    const isPartnerTicket = String(ticket?.type || '').startsWith('partner_');

    if (audience === 'user') {
        if (ticket?.authorRole === 'user' || isUserTicket) {
            pushToken(ticket.authorDocId);
            pushToken(ticket.author);
        }
        if (isPartnerTicket) pushToken(ticket.targetId);
    } else {
        if (ticket?.authorRole === 'partner' || isPartnerTicket) {
            pushToken(ticket.authorDocId);
            pushToken(ticket.author);
        }
        if (isUserTicket) pushToken(ticket.targetId);
    }

    // Backward-compat fields in older CS docs
    pushToken(ticket?.authorUserId);
    pushToken(ticket?.userId);
    pushToken(ticket?.writerId);
    pushToken(ticket?.writerUserId);
    pushToken(ticket?.requesterId);
    pushToken(ticket?.requesterUserId);
    pushToken(ticket?.targetUserId);
    pushToken(ticket?.targetPartnerId);

    return [...new Set(tokens)];
}

function findMessageRecipientFromTicket(ticket, audience = 'user') {
    const source = audience === 'partner' ? messageCenterPartners : messageCenterUsers;
    const normalized = collectTicketRecipientTokens(ticket, audience);

    if (!normalized.length || !source.length) return null;

    const normalizedLower = normalized.map((token) => String(token || '').toLowerCase().trim());
    return (
        source.find((row) => normalized.includes(String(row.id || '').trim())) ||
        source.find((row) => normalized.includes(String(row.userId || '').trim())) ||
        source.find((row) =>
            normalizedLower.some((token) => token === String(row.id || '').toLowerCase().trim()),
        ) ||
        source.find((row) =>
            normalized.some((token) => String(row.userId || '').toLowerCase() === token.toLowerCase()),
        ) ||
        source.find((row) =>
            normalized.some((token) => String(row.userId || '').toLowerCase().includes(token.toLowerCase())),
        ) ||
        source.find((row) =>
            normalized.some((token) => token.toLowerCase().includes(String(row.userId || '').toLowerCase())),
        ) ||
        source.find((row) =>
            normalized.some((token) => String(row.name || '').toLowerCase() === token.toLowerCase()),
        ) ||
        source.find((row) =>
            normalized.some((token) => String(row.name || '').toLowerCase().includes(token.toLowerCase())),
        ) ||
        null
    );
}

async function resolveMessageRecipientFromTicket(ticket, audience = 'user') {
    const hitFromCache = findMessageRecipientFromTicket(ticket, audience);
    if (hitFromCache) return hitFromCache;

    const tokens = collectTicketRecipientTokens(ticket, audience);
    if (!tokens.length) return null;

    const collectionName = audience === 'partner' ? 'partners' : 'users';
    const isPartner = audience === 'partner';
    const tried = new Set();
    for (const tokenRaw of tokens) {
        const token = String(tokenRaw || '').trim();
        if (!token || tried.has(token)) continue;
        tried.add(token);
        try {
            const byDocId = await db.collection(collectionName).doc(token).get();
            if (byDocId.exists) {
                const data = byDocId.data() || {};
                const row = {
                    id: byDocId.id,
                    userId: data.userId || byDocId.id,
                    name: isPartner
                        ? data.name || data.company || data.ownerName || '업체명 없음'
                        : data.name || data.userName || data.nickname || '이름 없음',
                };
                if (isPartner) {
                    const exists = messageCenterPartners.some((v) => v.id === row.id);
                    messageCenterPartners = exists
                        ? messageCenterPartners
                        : messageCenterPartners.concat(row);
                    messageCenterPartners.sort((a, b) =>
                        String(a.name || '').localeCompare(String(b.name || ''), 'ko'),
                    );
                } else {
                    const exists = messageCenterUsers.some((v) => v.id === row.id);
                    messageCenterUsers = exists ? messageCenterUsers : messageCenterUsers.concat(row);
                    messageCenterUsers.sort((a, b) =>
                        String(a.name || '').localeCompare(String(b.name || ''), 'ko'),
                    );
                }
                return row;
            }

            const userIdSnap = await db
                .collection(collectionName)
                .where('userId', '==', token)
                .limit(1)
                .get();
            if (!userIdSnap.empty) {
                const doc = userIdSnap.docs[0];
                const data = doc.data() || {};
                const row = {
                    id: doc.id,
                    userId: data.userId || doc.id,
                    name: isPartner
                        ? data.name || data.company || '업체명 없음'
                        : data.name || data.userName || data.nickname || '이름 없음',
                };
                if (isPartner) {
                    const exists = messageCenterPartners.some((v) => v.id === row.id);
                    messageCenterPartners = exists
                        ? messageCenterPartners
                        : messageCenterPartners.concat(row);
                    messageCenterPartners.sort((a, b) =>
                        String(a.name || '').localeCompare(String(b.name || ''), 'ko'),
                    );
                } else {
                    const exists = messageCenterUsers.some((v) => v.id === row.id);
                    messageCenterUsers = exists ? messageCenterUsers : messageCenterUsers.concat(row);
                    messageCenterUsers.sort((a, b) =>
                        String(a.name || '').localeCompare(String(b.name || ''), 'ko'),
                    );
                }
                return row;
            }

            const nameFields = isPartner ? ['name', 'company', 'ownerName'] : ['name', 'userName', 'nickname'];
            for (const field of nameFields) {
                const nameSnap = await db
                    .collection(collectionName)
                    .where(field, '==', token)
                    .limit(1)
                    .get();
                if (!nameSnap.empty) {
                    const doc = nameSnap.docs[0];
                    const data = doc.data() || {};
                    const row = {
                        id: doc.id,
                        userId: data.userId || doc.id,
                        name: isPartner
                            ? data.name || data.company || data.ownerName || '업체명 없음'
                            : data.name || data.userName || data.nickname || '이름 없음',
                    };
                    if (isPartner) {
                        const exists = messageCenterPartners.some((v) => v.id === row.id);
                        messageCenterPartners = exists
                            ? messageCenterPartners
                            : messageCenterPartners.concat(row);
                        messageCenterPartners.sort((a, b) =>
                            String(a.name || '').localeCompare(String(b.name || ''), 'ko'),
                        );
                    } else {
                        const exists = messageCenterUsers.some((v) => v.id === row.id);
                        messageCenterUsers = exists ? messageCenterUsers : messageCenterUsers.concat(row);
                        messageCenterUsers.sort((a, b) =>
                            String(a.name || '').localeCompare(String(b.name || ''), 'ko'),
                        );
                    }
                    return row;
                }
            }
        } catch (err) {
            console.warn('CS 수신자 userId 직접 조회 실패:', err);
        }
    }
    return null;
}

function trySelectRecipientInComposer(recipient = null, fallbackTokens = []) {
    const recipientSelect = document.getElementById('msg-recipient-select');
    if (!recipientSelect) return false;
    if (recipient?.id) {
        recipientSelect.value = recipient.id;
        if (recipientSelect.value === recipient.id) return true;
    }
    const tokens = fallbackTokens
        .map((v) => String(v || '').trim().toLowerCase())
        .filter(Boolean);
    if (!tokens.length) return false;
    for (const option of Array.from(recipientSelect.options || [])) {
        const val = String(option.value || '').toLowerCase();
        const txt = String(option.textContent || '').toLowerCase();
        const matched = tokens.some((token) => val === token || txt.includes(token) || token.includes(val));
        if (matched) {
            recipientSelect.value = option.value;
            return true;
        }
    }
    return false;
}

window.openCSMessageComposer = async function (ticketId, audience = 'user') {
    const ticket = csTicketsData.find((t) => t.id === ticketId);
    if (!ticket) {
        alert('티켓 정보를 찾을 수 없습니다.');
        return;
    }
    const targetAudience = audience === 'partner' ? 'partner' : 'user';
    try {
        await loadMessageCenterRecipients();
        const recipient = await resolveMessageRecipientFromTicket(ticket, targetAudience);
        await switchTab('messages');

        const audienceEl = document.getElementById('msg-audience-type');
        const scopeEl = document.getElementById('msg-target-scope');
        const categoryEl = document.getElementById('msg-category');
        const priorityEl = document.getElementById('msg-priority');
        const linkEl = document.getElementById('msg-link-type');
        const titleEl = document.getElementById('msg-title-input');
        const bodyEl = document.getElementById('msg-body-input');
        const templateEl = document.getElementById('msg-template-select');
        const replyUserDraft = String(
            document.getElementById('cs-reply-user-input')?.value || ticket.replyTextUser || '',
        ).trim();
        const replyPartnerDraft = String(
            document.getElementById('cs-reply-partner-input')?.value || ticket.replyTextPartner || '',
        ).trim();
        const replyDraft = targetAudience === 'partner' ? replyPartnerDraft : replyUserDraft;

        if (audienceEl) audienceEl.value = targetAudience;
        if (scopeEl) scopeEl.value = 'single';
        if (templateEl) templateEl.value = '';
        refreshMessageRecipientOptions();

        const fallbackTokens = collectTicketRecipientTokens(ticket, targetAudience);
        const selected = trySelectRecipientInComposer(recipient, fallbackTokens);
        if (categoryEl) categoryEl.value = 'result';
        if (priorityEl) priorityEl.value = 'important';
        if (linkEl) {
            refreshMessageLinkOptions();
            linkEl.value = 'support_center';
        }

        if (titleEl) {
            const audienceLabel = targetAudience === 'partner' ? '업체' : '회원';
            titleEl.value = `[CS 처리안내] ${audienceLabel} 문의/신고 답변 안내`;
        }
        if (bodyEl) {
            bodyEl.value = replyDraft || '안녕하세요.\nCS 요청 건 처리 결과를 안내드립니다.\n감사합니다.';
        }

        if (!selected) {
            alert(
                `${targetAudience === 'partner' ? '업체' : '사용자'} 수신자를 자동으로 찾지 못했습니다.\n메세지 센터에서 수신자를 직접 선택해주세요.`,
            );
        }
    } catch (error) {
        console.error('CS 메세지 작성 화면 이동 실패:', error);
        alert('메세지 센터 이동 중 오류가 발생했습니다.');
    }
};

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
