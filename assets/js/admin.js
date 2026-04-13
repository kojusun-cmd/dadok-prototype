// Firebase DB Initialization
const adminFirebaseConfig = {
    apiKey: "AIzaSyAY7VmMHV333Bi7zTgnJshIRAFWnBWn6BU",
    authDomain: "dadok-app.firebaseapp.com",
    projectId: "dadok-app",
    storageBucket: "dadok-app.firebasestorage.app",
    messagingSenderId: "702510138781",
    appId: "1:702510138781:web:fbfcfc29a8de5d3da35b74"
};
if (!firebase.apps.length) {
    firebase.initializeApp(adminFirebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

// ─── Authentication ───
auth.onAuthStateChanged(user => {
    const userInfoEl = document.getElementById('admin-user-info');
    const userEmailEl = document.getElementById('admin-user-email');
    const loginBtn = document.getElementById('admin-login-btn');
    const logoutBtn = document.getElementById('admin-logout-btn');
    const authOverlay = document.getElementById('auth-overlay');
    const mainApp = document.getElementById('main-app');

    if (user) {
        if(authOverlay) authOverlay.classList.add('hidden');
        if(mainApp) mainApp.classList.remove('hidden');
        if(userInfoEl) userInfoEl.classList.remove('hidden');
        if(userEmailEl) userEmailEl.textContent = user.email;
        if(loginBtn) loginBtn.classList.add('hidden');
        if(logoutBtn) logoutBtn.classList.remove('hidden');
    } else {
        if(authOverlay) authOverlay.classList.remove('hidden');
        if(mainApp) mainApp.classList.add('hidden');
        if(userInfoEl) userInfoEl.classList.add('hidden');
        if(loginBtn) loginBtn.classList.remove('hidden');
        if(logoutBtn) logoutBtn.classList.add('hidden');
    }
});

function adminLogin() {
    auth.signInWithPopup(provider)
        .then((result) => {
            console.log("Logged in as:", result.user.email);
        })
        .catch((error) => {
            console.error("Login failed:", error);
            if (error.code === 'auth/unauthorized-domain') {
                alert("로그인 실패: 현재 접속하신 주소(도메인)가 Firebase에 등록되지 않았습니다.\n\n해결방법: \n1. 브라우저에서 'http://localhost:5500' 또는 'http://127.0.0.1:5500' 으로 접속해주세요.\n2. file:/// 주소나 내부 IP(59.x.x.x 등)에서는 구글 로그인이 차단됩니다.");
            } else if (error.code === 'auth/network-request-failed') {
                alert("로그인 실패: 네트워크 상태를 확인해주세요.");
            } else {
                alert("로그인 실패: " + error.message + " (Code: " + error.code + ")");
            }
        });
}

function adminLogout() {
    auth.signOut().then(() => {
        console.log("Logged out");
    }).catch((error) => {
        console.error("Logout failed:", error.message);
    });
}

// ─── Global Variables ───
let currentUserCount = 0;
let currentShopCount = 0;
let categoriesList = [];

// 소비자 앱에 하드코딩되어 있던 기본 필터 데이터
const DEFAULT_FILTERS = {
    massage: {
        title: '선호하는 마사지 종류',
        options: ['상관없음(전체)', '스웨디시', '스포츠 마사지', '타이 마사지', '커플마사지']
    },
    place: {
        title: '휴식 공간 형태',
        options: ['상관없음(전체)', '방문 (홈케어/출장)', '1인샵 (매장 방문)', '다인샵 (일반 매장)']
    },
    age: {
        title: '선호하는 관리사 연령대',
        options: ['연령 무관 (전체)', '20대 초반', '20대 중후반', '30대 초반', '30대 중후반', '40대 초반', '40대 중후반']
    }
};

const FILTER_STYLES = {
    massage: { badge: 'bg-purple-900/40 border-purple-500/30 text-purple-200', deleteBtn: 'text-purple-400 hover:text-purple-200' },
    place:   { badge: 'bg-blue-900/40 border-blue-500/30 text-blue-200',     deleteBtn: 'text-blue-400 hover:text-blue-200' },
    age:     { badge: 'bg-amber-900/40 border-amber-500/30 text-amber-200',   deleteBtn: 'text-amber-400 hover:text-amber-200' }
};

const FILTER_LABELS = {
    massage: '마사지 종류',
    place: '공간 형태',
    age: '관리사 연령대'
};

// ─── Tab System ───
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-link').forEach(el => el.classList.remove('active'));

    document.getElementById(`tab-${tabId}`).classList.remove('hidden');
    const activeNav = document.querySelector(`.tab-link[onclick="switchTab('${tabId}')"]`);
    if(activeNav) activeNav.classList.add('active');

    if(tabId === 'users') loadUsers();
    else if(tabId === 'shops') loadShops();
    else if(tabId === 'approvals') loadApprovals();
    else if(tabId === 'categories') loadAllFilters();
    else if(tabId === 'subscriptions') loadSubscriptionUsage();
    else if(tabId === 'dashboard') updateDashboardStats();
}

function updateDashboardStats() {
    document.getElementById('stat-users').innerText = currentUserCount;
    document.getElementById('stat-shops').innerText = currentShopCount;
}

// ─── Modal handling ───
function openModal(modalId) {
    document.getElementById('admin-modal-overlay').classList.remove('hidden');
    document.getElementById('modal-shop').classList.add('hidden');
    document.getElementById('modal-category').classList.add('hidden');
    document.getElementById('modal-filter-option').classList.add('hidden');
    document.getElementById(modalId).classList.remove('hidden');
}

function closeModal(modalId) {
    document.getElementById('admin-modal-overlay').classList.add('hidden');
    document.getElementById(modalId).classList.add('hidden');
}

// ─── Initial Listeners ───
window.addEventListener('DOMContentLoaded', () => {
    db.collection('users').onSnapshot(snap => {
        currentUserCount = snap.size;
        updateDashboardStats();
    });
    db.collection('partners').onSnapshot(snap => {
        currentShopCount = snap.size;
        
        // Update badge for pending partners
        let pendingCount = 0;
        snap.forEach(doc => {
            if (doc.data().status === 'pending') {
                pendingCount++;
            }
        });
        const badge = document.getElementById('pending-badge');
        if (badge) {
            badge.innerText = pendingCount;
            if (pendingCount > 0) {
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
        
        updateDashboardStats();
    });
    db.collection('categories').orderBy('createdAt', 'asc').onSnapshot(snap => {
        categoriesList = snap.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
    });

    // 앱 필터 실시간 감시
    ['massage', 'place', 'age'].forEach(key => {
        db.collection('app_filters').doc(key).onSnapshot(doc => {
            renderFilterOptions(key, doc.exists ? doc.data() : null);
        });
    });
});

// ═══════════════════════════════════════
// ▶ APP FILTER MANAGEMENT (NEW)
// ═══════════════════════════════════════

function loadAllFilters() {
    ['massage', 'place', 'age'].forEach(key => {
        db.collection('app_filters').doc(key).get().then(doc => {
            renderFilterOptions(key, doc.exists ? doc.data() : null);
        });
    });
    loadCategories();
}

function renderFilterOptions(key, data) {
    const container = document.getElementById(`filter-${key}-container`);
    if (!container) return;

    if (!data || !data.options || data.options.length === 0) {
        container.innerHTML = `<span class="text-sm text-[#A7B2AE]">등록된 옵션이 없습니다. [기본값 동기화] 버튼을 눌러주세요.</span>`;
        return;
    }

    const style = FILTER_STYLES[key];
    container.innerHTML = data.options.map((opt, idx) => {
        const isDefault = idx === 0; // 첫 번째 아이템은 "전체" 옵션 (삭제 불가)
        return `
            <div class="px-4 py-2 ${style.badge} border rounded-full text-sm flex items-center gap-2 group shadow-sm transition-all hover:brightness-110">
                ${isDefault ? '🔒 ' : ''}${opt}
                ${!isDefault ? `<button onclick="removeFilterOption('${key}', '${opt.replace(/'/g, "\\'")}')" class="${style.deleteBtn} opacity-0 group-hover:opacity-100 transition-opacity ml-1" title="삭제">✕</button>` : ''}
            </div>
        `;
    }).join('');
}

// 기본값 시딩 (소비자 앱의 하드코딩 데이터를 Firestore에 저장)
function seedDefaultFilters() {
    if (!confirm('소비자 앱의 기본 필터 데이터를 Firestore에 동기화하시겠습니까?\n기존 데이터가 있으면 덮어씁니다.')) return;

    const batch = db.batch();
    Object.keys(DEFAULT_FILTERS).forEach(key => {
        const ref = db.collection('app_filters').doc(key);
        batch.set(ref, {
            title: DEFAULT_FILTERS[key].title,
            options: DEFAULT_FILTERS[key].options,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    });

    batch.commit()
        .then(() => alert('✅ 3개 필터 그룹 동기화 완료!\n\n• 마사지 종류: ' + DEFAULT_FILTERS.massage.options.length + '개\n• 공간 형태: ' + DEFAULT_FILTERS.place.options.length + '개\n• 관리사 연령: ' + DEFAULT_FILTERS.age.options.length + '개'))
        .catch(err => alert('동기화 오류: ' + err.message));
}

// 필터 옵션 추가 모달 열기
function openFilterOptionModal(key) {
    document.getElementById('filter-option-key').value = key;
    document.getElementById('filter-option-name').value = '';
    document.getElementById('filter-modal-title').innerText = `${FILTER_LABELS[key]} 옵션 추가`;
    document.getElementById('filter-option-name').placeholder = key === 'massage' ? '예: 아로마 마사지' : key === 'place' ? '예: VIP 프라이빗 룸' : '예: 50대 이상';
    openModal('modal-filter-option');
}

// 필터 옵션 추가 제출
function handleFilterOptionSubmit(e) {
    e.preventDefault();
    const key = document.getElementById('filter-option-key').value;
    const name = document.getElementById('filter-option-name').value.trim();
    if (!name || !key) return;

    const ref = db.collection('app_filters').doc(key);
    ref.get().then(doc => {
        if (doc.exists) {
            const current = doc.data().options || [];
            if (current.includes(name)) {
                alert('이미 존재하는 옵션입니다: ' + name);
                return;
            }
            return ref.update({
                options: firebase.firestore.FieldValue.arrayUnion(name),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            return ref.set({
                title: DEFAULT_FILTERS[key]?.title || key,
                options: [DEFAULT_FILTERS[key]?.options[0] || '전체', name],
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    }).then(() => {
        closeModal('modal-filter-option');
    }).catch(err => alert('옵션 추가 오류: ' + err.message));
}

// 필터 옵션 삭제
function removeFilterOption(key, optionName) {
    if (!confirm(`"${optionName}" 옵션을 삭제하시겠습니까?\n소비자 앱에서 즉시 사라집니다.`)) return;

    db.collection('app_filters').doc(key).update({
        options: firebase.firestore.FieldValue.arrayRemove(optionName),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(err => alert('삭제 오류: ' + err.message));
}


// ═══════════════════════════════════════
// ▶ USERS
// ═══════════════════════════════════════

function loadUsers() {
    const tbody = document.getElementById('user-table-body');
    db.collection('users').orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
        tbody.innerHTML = '';
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="7" class="p-4 text-center">조회된 유저가 없습니다.</td></tr>';
            return;
        }
        snapshot.forEach(doc => {
            const data = doc.data();
            const dStr = data.createdAt ? (typeof data.createdAt.toMillis === 'function' ? new Date(data.createdAt.toMillis()).toLocaleString('ko-KR') : new Date(data.createdAt).toLocaleString('ko-KR')) : '-';
            const logStr = data.lastLoginAt ? (typeof data.lastLoginAt.toMillis === 'function' ? new Date(data.lastLoginAt.toMillis()).toLocaleString('ko-KR') : new Date(data.lastLoginAt).toLocaleString('ko-KR')) : '-';
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
    if (confirm(`정말 "${userName}" 회원을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없으며 앱 접속이 즉시 차단됩니다.`)) {
        db.collection('users').doc(userId).delete()
            .then(() => {
                console.log("Deleted user:", userId);
            })
            .catch(err => {
                console.error("회원 삭제 오류:", err);
                alert('회원 삭제에 실패했습니다: ' + err.message);
            });
    }
}


// ═══════════════════════════════════════
// ▶ LEGACY CATEGORIES (shop tags)
// ═══════════════════════════════════════

function loadCategories() {
    const container = document.getElementById('category-list-container');
    db.collection('categories').orderBy('createdAt', 'asc').onSnapshot(snapshot => {
        container.innerHTML = '';
        if (snapshot.empty) {
            container.innerHTML = '<span class="text-[#A7B2AE]">아직 등록된 태그 카테고리가 없습니다.</span>';
            return;
        }
        snapshot.forEach(doc => {
            const data = doc.data();
            container.innerHTML += `
                <div class="px-4 py-2 bg-[#11291D] border border-[#2A3731] rounded-full text-white text-sm flex items-center gap-2 group shadow-sm transition-all hover:bg-[#183928]">
                    \${data.name}
                    <button onclick="deleteCategory('\${doc.id}')" class="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1 hover:text-red-300">✕</button>
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
    if(!name) return;
    
    db.collection('categories').add({
        name: name,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        closeModal('modal-category');
    }).catch(err => alert("카테고리 생성 중 오류: " + err.message));
}

function deleteCategory(id) {
    if(confirm('정말 삭제하시겠습니까? 소비자 앱 화면에서 해당 메뉴가 즉시 사라지게 됩니다.')) {
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
    
    db.collection('partners').where('status', '==', 'pending').onSnapshot((snapshot) => {
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
        
        snapshot.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;
            windowApprovals.push(data);
        });
        
        windowApprovals.sort((a, b) => {
            let timeA = 0, timeB = 0;
            if (a.createdAt) timeA = typeof a.createdAt.toMillis === 'function' ? a.createdAt.toMillis() : new Date(a.createdAt).getTime();
            if (b.createdAt) timeB = typeof b.createdAt.toMillis === 'function' ? b.createdAt.toMillis() : new Date(b.createdAt).getTime();
            return timeB - timeA;
        });
        
        filterApprovalList();
    });
}

function filterApprovalList() {
    const searchVal = (document.getElementById('approval-search')?.value || '').toLowerCase();
    
    const filtered = windowApprovals.filter(shop => {
        const name = (shop.name || shop.company || '').toLowerCase();
        const contact = (shop.phone || shop.managerPhone || '').toLowerCase();
        const address = (shop.address || shop.location || '').toLowerCase();
        
        return name.includes(searchVal) || contact.includes(searchVal) || address.includes(searchVal);
    });
    
    renderApprovalInbox(filtered);
}

function renderApprovalInbox(shops) {
    const inboxList = document.getElementById('approvals-inbox-list');
    if (!shops.length) {
        inboxList.innerHTML = '<div class="py-10 text-center text-[#A7B2AE] text-sm">검색 결과가 없습니다.</div>';
        return;
    }
    
    inboxList.innerHTML = shops.map(shop => {
        let dStr = '-';
        if (shop.createdAt) {
            dStr = typeof shop.createdAt.toMillis === 'function' 
                ? new Date(shop.createdAt.toMillis()).toLocaleString('ko-KR', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' })
                : new Date(shop.createdAt).toLocaleString('ko-KR', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });
        }
        const displayName = shop.name || shop.company || '샵 이름 없음';
        const ticketBadge = (shop.ticketType || shop.tier || '').includes('Premium') || (shop.ticketType || shop.tier || '').includes('프리미엄') 
                             ? '<span class="px-2 py-0.5 rounded text-[10px] bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 text-yellow-400 border border-yellow-500/30">Premium</span>' 
                             : '<span class="px-2 py-0.5 rounded text-[10px] bg-[#11291D] text-[#A7B2AE] border border-[#2A3731]">기본 입점</span>';
                             
        // Check if currently selected
        const currentSelectedId = document.getElementById('approval-id')?.value;
        const isActive = currentSelectedId === shop.id;
        const activeClass = isActive ? 'bg-[#11291D] border-[var(--point-color)] shadow-[0_0_10px_rgba(34,197,94,0.1)]' : 'bg-[#06110D] border-[#2A3731] hover:border-[#11291D] hover:bg-[#081510] cursor-pointer';

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
    }).join('');
}

function resetApprovalDetailView() {
    document.getElementById('approval-empty-state').classList.remove('hidden');
    document.getElementById('approval-form').classList.add('hidden');
    document.getElementById('approval-id').value = '';
}

function activatePartner(id) {
    if (!confirm('해당 파트너의 입점을 승인하시겠습니까?\\n승인 즉시 소비자 앱 지도/목록에 노출됩니다.')) return;
    
    db.collection('partners').doc(id).update({
        status: 'active',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert('성공적으로 승인되었습니다!');
    }).catch(err => {
        alert('승인 처리 중 오류 발생: ' + err.message);
    });
}

function rejectPartner(id) {
    if (!confirm('정말 해당 입점 신청을 반려하시겠습니까?\\n이 작업은 취소할 수 없으며 파트너 데이터가 삭제됩니다.')) return;
    
    db.collection('partners').doc(id).delete()
    .then(() => {
        alert('입점 신청이 반려(삭제)되었습니다.');
    }).catch(err => {
        alert('반려 처리 중 오류 발생: ' + err.message);
    });
}

function selectApprovalReview(id) {
    db.collection('partners').doc(id).get().then(doc => {
        if (!doc.exists) return;
        const data = doc.data();
        
        // UI Handling: Hide empty state, show form
        document.getElementById('approval-empty-state').classList.add('hidden');
        document.getElementById('approval-form').classList.remove('hidden');
        
        // Unhighlight previous active item in list
        const prevActive = document.querySelector('#approvals-inbox-list > div.border-\\[var\\(--point-color\\)\\]');
        if (prevActive) {
            prevActive.classList.replace('bg-[#11291D]', 'bg-[#06110D]');
            prevActive.classList.replace('border-[var(--point-color)]', 'border-[#2A3731]');
            prevActive.classList.replace('shadow-[0_0_10px_rgba(34,197,94,0.1)]', 'hover:border-[#11291D]');
            prevActive.classList.add('cursor-pointer');
        }
        
        // Highlight new item
        const newActive = document.getElementById(`inbox-item-${id}`);
        if(newActive) {
            newActive.classList.replace('bg-[#06110D]', 'bg-[#11291D]');
            newActive.classList.replace('border-[#2A3731]', 'border-[var(--point-color)]');
            newActive.classList.replace('hover:border-[#11291D]', 'shadow-[0_0_10px_rgba(34,197,94,0.1)]');
            newActive.classList.remove('cursor-pointer');
        }

        // Setup top header of detail view
        document.getElementById('approval-view-title').textContent = data.name || data.company || '샵 이름 없음';
        
        let dStr = '-';
        if (data.createdAt) {
            dStr = typeof data.createdAt.toMillis === 'function' ? new Date(data.createdAt.toMillis()).toLocaleString('ko-KR') : new Date(data.createdAt).toLocaleString('ko-KR');
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
        
        document.getElementById('approval-tags').textContent = (data.categories || []).join(', ') || '-';
        
        const imgPreview = document.getElementById('approval-image-preview');
        const imgText = document.getElementById('approval-image-text');
        const imageUrl = data.imageUrl || data.image;
        if(imageUrl) {
            imgPreview.src = imageUrl;
            imgPreview.classList.remove('hidden');
            if(imgText) imgText.textContent = imageUrl;
        } else {
            imgPreview.classList.add('hidden');
            if(imgText) imgText.textContent = '이미지 없음';
        }
        
        document.getElementById('approval-catchphrase').textContent = data.catchphrase || '-';
        document.getElementById('approval-min-price').textContent = data.minPrice || data.price || '-';
        document.getElementById('approval-tier').value = data.ticketType || data.tier || 'Normal';
        document.getElementById('approval-biz-verified').value = data.bizVerified ? 'true' : 'false';
        document.getElementById('approval-memo').value = data.adminMemo || '';
        
        document.getElementById('approval-cat-massage').textContent = data.catMassage || data.massage || '-';
        document.getElementById('approval-cat-place').textContent = data.catPlace || data.place || '-';
        document.getElementById('approval-cat-age').textContent = data.catAge || data.age || '-';

    }).catch(err => {
        alert('정보를 불러오는 중 오류가 발생했습니다: ' + err.message);
    });
}

function approvePartnerFromReview(e) {
    e.preventDefault();
    const id = document.getElementById('approval-id').value;
    
    // 사업자 확인 여부가 false면 경고!
    const bizVerified = document.getElementById('approval-biz-verified').value === 'true';
    if(!bizVerified) {
        if(!confirm('실명 및 사업자등록증이 아직 확인되지 않았습니다. 그래도 승인하시겠습니까?')) return;
    }

    const tierValue = document.getElementById('approval-tier').value;
    
    let ticketType = 'None';
    let ticketPlan = 'none';
    let monthsToAdd = 0;
    
    if (tierValue === '1') {
        ticketType = '1개월 입점권';
        ticketPlan = 'standard';
        monthsToAdd = 1;
    } else if (tierValue === '3') {
        ticketType = '3개월 입점권';
        ticketPlan = 'standard';
        monthsToAdd = 3;
    } else if (tierValue === '6') {
        ticketType = '6개월 입점권';
        ticketPlan = 'premium';
        monthsToAdd = 6;
    } else if (tierValue === '12') {
        ticketType = '12개월 입점권';
        ticketPlan = 'VIP';
        monthsToAdd = 12;
    }
    
    const updateData = {
        ticketType: ticketType,
        ticketPlan: ticketPlan,
        bizVerified: bizVerified,
        adminMemo: document.getElementById('approval-memo').value.trim(),
        status: 'active',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    if (monthsToAdd > 0) {
        const now = new Date();
        now.setMonth(now.getMonth() + monthsToAdd);
        updateData.ticketExpiryTimestamp = now.getTime();
        updateData.ticketExpiry = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    } else {
        updateData.ticketExpiryTimestamp = 0;
        updateData.ticketExpiry = '';
    }
    
    db.collection('partners').doc(id).update(updateData).then(() => {
        // Firebase snapshot will auto trigger list re-render
        // so we just reset the detail view
        resetApprovalDetailView();
        
        // Let's create an elegant temporary notification
        const notif = document.createElement('div');
        notif.className = 'fixed top-4 right-4 bg-green-500/90 text-white px-6 py-3 rounded-xl shadow-lg z-50 transform transition-all translate-y-[-20px] opacity-0 flex items-center gap-3 backdrop-blur-sm';
        notif.innerHTML = '<i class="fas fa-check-circle"></i> <span class="font-bold">성공적으로 입점 승인 완료되었습니다.</span>';
        document.body.appendChild(notif);
        setTimeout(() => { notif.classList.remove('translate-y-[-20px]', 'opacity-0'); }, 10);
        setTimeout(() => { notif.classList.add('translate-y-[-20px]', 'opacity-0'); setTimeout(()=>notif.remove(), 300); }, 3000);
        
    }).catch(err => {
        alert('승인 처리 중 오류 발생: ' + err.message);
    });
}

function rejectPartnerFromReview() {
    const id = document.getElementById('approval-id').value;
    if(!id) return;
    if(confirm('정말 이 샵을 영구 삭제(반려) 하시겠습니까?')) {
        db.collection('partners').doc(id).delete().then(() => {
            alert('입점 신청이 반려되었습니다.');
            resetApprovalDetailView();
        }).catch(err => alert('삭제 중 오류 발생: ' + err.message));
    }
}


// ═══════════════════════════════════════
// ▶ SHOPS
// ═══════════════════════════════════════

let windowShops = []; // Cache for filtering

function loadShops() {
    const container = document.getElementById('shop-cards-container');
    db.collection('partners').onSnapshot(snapshot => {
        windowShops = [];
        if (snapshot.empty) {
            container.innerHTML = '<div class="col-span-full py-20 text-center text-[#A7B2AE]">등록된 샵이 없습니다.</div>';
            updateShopKpis();
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;
            windowShops.push(data);
        });

        // 최신순 정렬
        windowShops.sort((a, b) => {
            let timeA = 0, timeB = 0;
            if (a.createdAt) timeA = typeof a.createdAt.toMillis === 'function' ? a.createdAt.toMillis() : new Date(a.createdAt).getTime();
            if (b.createdAt) timeB = typeof b.createdAt.toMillis === 'function' ? b.createdAt.toMillis() : new Date(b.createdAt).getTime();
            return timeB - timeA;
        });

        updateShopKpis();
        filterShops(); // Render initial state based on current filter
    }, err => {
        console.error("loadShops Error: ", err);
        container.innerHTML = `<div class="col-span-full py-20 text-center text-red-400">오류 발생: ${err.message}</div>`;
    });
}

function updateShopKpis() {
    let active = 0, expired = 0, pending = 0;
    const now = Date.now();

    windowShops.forEach(s => {
        if (s.status === 'pending') {
            pending++;
        } else {
            let isExpired = false;
            // Check expiry
            if (s.ticketExpiryTimestamp && s.ticketExpiryTimestamp < now) {
                isExpired = true;
            }
            // Check expiry text strictly manually if needed, but timestamp is better
            
            if (isExpired) {
                expired++;
            } else {
                active++;
            }
        }
    });

    const elTotal = document.getElementById('kpi-total-shops');
    const elActive = document.getElementById('kpi-active-shops');
    const elExpired = document.getElementById('kpi-expired-shops');
    const elPending = document.getElementById('kpi-pending-shops');

    if (elTotal) elTotal.innerText = windowShops.length;
    if (elActive) elActive.innerText = active;
    if (elExpired) elExpired.innerText = expired;
    if (elPending) elPending.innerText = pending;
}

function filterShops() {
    const searchVal = (document.getElementById('shop-filter-search')?.value || '').toLowerCase();
    const statusVal = document.getElementById('shop-filter-status')?.value || 'all';
    const planVal = document.getElementById('shop-filter-plan')?.value || 'all';
    const container = document.getElementById('shop-cards-container');

    const now = Date.now();

    let filtered = windowShops.filter(s => {
        // 1. Search Query
        const matchSearch = 
            (s.name && s.name.toLowerCase().includes(searchVal)) ||
            (s.company && s.company.toLowerCase().includes(searchVal)) ||
            (s.phone && s.phone.includes(searchVal)) ||
            (s.location && s.location.toLowerCase().includes(searchVal)) ||
            (s.address && s.address.toLowerCase().includes(searchVal));
        if (searchVal && !matchSearch) return false;

        // 2. Status check
        // active: status === 'active' AND not expired
        // pending: status === 'pending'
        // expired: status === 'active' AND expired
        let isExpired = false;
        if (s.ticketExpiryTimestamp && s.ticketExpiryTimestamp < now) isExpired = true;

        if (statusVal === 'active') {
            if (s.status !== 'active' || isExpired) return false;
        } else if (statusVal === 'pending') {
            if (s.status !== 'pending') return false;
        } else if (statusVal === 'expired') {
            if (s.status !== 'active' || !isExpired) return false;
        }

        // 3. Plan check (ticketType matches premium/standard/none roughly)
        const typeStr = (s.ticketType || '').toLowerCase();
        if (planVal === 'premium' && typeStr !== 'premium' && typeStr !== '프리미엄') return false;
        if (planVal === 'standard' && typeStr !== 'normal' && typeStr !== '스탠다드' && typeStr !== '기본') return false;
        if (planVal === 'none' && typeStr && typeStr !== 'none') return false;

        return true;
    });

    renderShopCards(filtered);
}

function renderShopCards(shops) {
    const container = document.getElementById('shop-cards-container');
    if (shops.length === 0) {
        container.innerHTML = '<div class="col-span-full py-20 text-center text-[#A7B2AE]">조건에 만족하는 샵이 없습니다.</div>';
        return;
    }

    const now = Date.now();
    let html = '';

    shops.forEach(data => {
        const displayName = data.name || data.company || '샵 이름 없음';
        let imageUrl = data.imageUrl || data.image || 'https://via.placeholder.com/300x200?text=No+Image';
        const dateStr = data.createdAt ? (typeof data.createdAt.toMillis === 'function' ? new Date(data.createdAt.toMillis()).toLocaleDateString('ko-KR') : new Date(data.createdAt).toLocaleDateString('ko-KR')) : '-';
        
        let isExpired = false;
        if (data.ticketExpiryTimestamp && data.ticketExpiryTimestamp < now) {
            isExpired = true;
        }

        // Determine Badges
        let statusBadge = '';
        if (data.status === 'pending') {
            statusBadge = '<span class="absolute top-3 left-3 bg-yellow-500/90 text-white text-xs font-bold px-2 py-1 rounded shadow">승인 대기</span>';
        } else if (isExpired) {
            statusBadge = '<span class="absolute top-3 left-3 bg-red-500/90 text-white text-xs font-bold px-2 py-1 rounded shadow">입점권 만료</span>';
        } else {
            statusBadge = '<span class="absolute top-3 left-3 bg-green-500/90 text-white text-xs font-bold px-2 py-1 rounded shadow">영업중</span>';
        }

        let planBadge = '';
        const lowerTier = (data.ticketType || data.tier || '').toLowerCase();
        if (lowerTier.includes('premium') || lowerTier.includes('프리미엄')) {
            planBadge = '<span class="absolute top-3 right-3 bg-[var(--point-color)] text-white text-xs font-bold px-2 py-1 rounded shadow">Premium</span>';
        } else {
            planBadge = '<span class="absolute top-3 right-3 bg-gray-700/90 text-gray-200 text-xs font-bold px-2 py-1 rounded shadow">Standard</span>';
        }

        // Action Buttons logic
        let activateBtn = '';
        if (data.status === 'pending') {
            activateBtn = `<button onclick="event.stopPropagation(); activatePartner('${data.id}')" class="flex-1 py-2 bg-green-900/40 text-green-400 hover:bg-green-600 hover:text-white rounded-lg text-sm font-bold transition-colors">✔ 승인</button>`;
        }

        html += `
            <div class="bg-[#0A1B13] border border-[#2A3731] rounded-2xl overflow-hidden hover:border-[#3A4741] transition-all flex flex-col shadow-lg relative group" onclick="goToShopApprovalDetails('${data.id}')">
                
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
                    </div>

                    <div class="mt-auto pt-3 border-t border-[#2A3731] flex flex-wrap gap-1.5 mb-3">
                        <span class="px-2 py-0.5 bg-[#11291D] border border-[#2A3731] rounded text-[10px] text-[#A7B2AE] whitespace-nowrap">가입: ${dateStr}</span>
                        ${data.ticketExpiryTimestamp ? `<span class="px-2 py-0.5 bg-[#11291D] border ${isExpired ? 'border-red-500/50 text-red-400' : 'border-[#2A3731] text-[#A7B2AE]'} rounded text-[10px] whitespace-nowrap">만료: ${new Date(data.ticketExpiryTimestamp).toLocaleDateString('ko-KR')}</span>` : `<span class="px-2 py-0.5 bg-[#11291D] border border-[#2A3731] rounded text-[10px] text-[#A7B2AE] whitespace-nowrap">기한없음</span>`}
                    </div>
                </div>

                <!-- Footer Quick Actions -->
                <div class="flex border-t border-[#2A3731] p-2 bg-[#06110D] gap-2">
                    ${activateBtn}
                    <button onclick="event.stopPropagation(); triggerManualSubAdjust('${data.id}', '${data.name || data.company || ''}')" class="flex-1 py-1.5 bg-[#11291D] hover:bg-[#183928] text-[#A7B2AE] hover:text-white rounded-lg text-sm transition-colors border border-[#2A3731]">권한 조정</button>
                    ${data.status !== 'pending' ? `<button onclick="event.stopPropagation(); goToShopApprovalDetails('${data.id}')" class="flex-1 py-1.5 bg-[#11291D] hover:bg-[#183928] text-[#A7B2AE] hover:text-white rounded-lg text-sm transition-colors border border-[#2A3731]">상세/수정</button>` : ''}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// 샵 관리자 페이지에서 상세/수정 클릭 혹은 카드 클릭 시 제휴 파트너 승인(Approvals) 탭으로 이동하고 해당 샵의 상세 내용을 표시하는 함수
function goToShopApprovalDetails(id) {
    switchTab('approvals');
    selectApprovalReview(id);
}

// 퀵 액션으로 '강제 수동 조정'을 여는 함수 (기존 구현 연동)
function triggerManualSubAdjust(id, name) {
    const p = windowShops.find(x => x.id === id);
    let plan = '기본 입점';
    let remainStr = '정보 없음';

    if (p) {
        plan = p.ticketType === 'premium' ? '프리미엄' : (p.ticketType === 'standard' ? '스탠다드' : '입점권 없음');
        let expiry = p.ticketExpiryTimestamp || 0;
        if (expiry > Date.now()) {
            let diff = expiry - Date.now();
            let days = Math.floor(diff / (1000 * 60 * 60 * 24));
            let hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            remainStr = `잔여 ${days}일 ${hours}시간`;
        } else {
            remainStr = '만료/미이용';
        }
    }

    selectedSubTargets = [{id, name, plan, remainStr}];
    renderSubTargets();
    document.getElementById('manual-sub-search').value = '';
    
    const resultsContainer = document.getElementById('manual-sub-search-results');
    if (resultsContainer) resultsContainer.classList.add('hidden');
    
    const form = document.getElementById('manual-sub-form');
    if (form) form.reset();
    
    toggleManualSubInput('add');
    toggleManualSubMemo('reward_event');
    openModal('modal-manual-sub');
}

function openShopModal() {
    document.getElementById('shop-form').reset();
    document.getElementById('shop-id').value = '';
    
    const cbContainer = document.getElementById('shop-category-checkboxes');
    cbContainer.innerHTML = '';
    categoriesList.forEach(cat => {
        cbContainer.innerHTML += `
            <label class="inline-flex items-center gap-1.5 bg-[#11291D] px-3 py-1.5 rounded-lg border border-[#2A3731] cursor-pointer hover:bg-[#183928] transition-colors">
                <input type="checkbox" value="\${cat.name}" class="shop-cat-checkbox w-4 h-4 text-[var(--point-color)] bg-[#06110D] border-[#2A3731]">
                <span class="text-sm text-white/90">\${cat.name}</span>
            </label>
        `;
    });

    openModal('modal-shop');
}

function handleShopSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('shop-id').value;
    const name = document.getElementById('shop-name').value.trim();
    const location = document.getElementById('shop-location').value.trim();
    const image = document.getElementById('shop-image').value.trim();
    const ticketType = document.getElementById('shop-ticket-type').value;
    const ticketExpiry = document.getElementById('shop-ticket-expiry').value;
    const tagsRaw = document.getElementById('shop-tags').value;
    
    const tags = tagsRaw.split(',').map(t => t.trim()).filter(t => t);
    const checkedCats = Array.from(document.querySelectorAll('.shop-cat-checkbox:checked')).map(cb => cb.value);

    const data = { name, location, image, ticketType, ticketExpiry, tags, categories: checkedCats };

    if (id) {
        data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        db.collection('partners').doc(id).update(data)
          .then(() => closeModal('modal-shop'))
          .catch(err => alert("기존 매장 수정 오류: "+err.message));
    } else {
        data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        data.status = 'pending'; // Admin adds partner as pending to show in approval list
        db.collection('partners').add(data)
          .then(() => closeModal('modal-shop'))
          .catch(err => alert("신규 매장 추가 오류: "+err.message));
    }
}

function activatePartner(id) {
    if(confirm('이 파트너의 가입을 승인하여 앱에 노출하시겠습니까?')) {
        db.collection('partners').doc(id).update({ status: 'active' });
    }
}

function deleteShop(id) {
    if(confirm('이 샵을 데이터베이스에서 영구 삭제하시겠습니까?\n동기화된 앱에서도 즉시 지도 목록 및 메뉴에서 삭제됩니다.')) {
        db.collection('partners').doc(id).delete();
    }
}

async function uploadShopImage(event) {
    const file = event.target.files[0];
    if(!file) return;

    const progressEl = document.getElementById('shop-image-progress');
    progressEl.innerText = '업로드 중... 잠시만 기다려주세요.';
    progressEl.classList.remove('hidden');

    try {
        const fileRef = firebase.storage().ref('shop_images/' + Date.now() + '_' + file.name);
        const snapshot = await fileRef.put(file);
        const downloadUrl = await snapshot.ref.getDownloadURL();
        document.getElementById('shop-image').value = downloadUrl;
        progressEl.innerText = '✅ 업로드 완료!';
    } catch(err) {
        console.error(err);
        progressEl.innerText = '업로드 실패: ' + err.message;
    }
}

// ─── Dummy Data Generator ───
async function deleteAllPartners() {
    if(!confirm("진짜로 모든 파트너 데이터를 초기화(삭제) 하시겠습니까? 이 작업은 복구할 수 없습니다.")) return;
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

        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
            deletedCount++;
            batchIndex++;
            if (batchIndex === 500) {
                commitPromises.push(batch.commit());
                batch = db.batch();
                batchIndex = 0;
            }
        });

        reviewSnapshot.docs.forEach(doc => {
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
        console.error("삭제 중 오류:", err);
        alert("삭제 실패: " + err.message);
    }
}

async function generateDummyPartners() {
    if(!confirm("이전의 테스트용 50개 임의(Mock) 파트너 데이터를 어드민(Firebase)에 등록하시겠습니까? (기존 데이터는 삭제되지 않으며 랜덤 50개가 추가로 생성됩니다)")) return;

    // 지역별 시/구 데이터
    const RegionData = [
        { prov: '서울', cities: ['강남/서초', '송파/강동', '영등포/구로/금천', '강서/양천', '마포/서대문/은평', '용산/중구/종로', '성동/광진', '동대문/중랑', '노원/도봉/강북'] },
        { prov: '경기', cities: ['수원', '성남(분당)', '고양(일산)', '용인', '부천', '안산', '안양/과천', '화성(동탄)', '평택', '의정부', '파주', '시흥', '김포', '광명', '광주', '구리/남양주'] },
        { prov: '인천', cities: ['부평/계양', '남동(구월)', '연수(송도)', '서구(청라)', '중구/동구'] },
        { prov: '충청', cities: ['세종', '천안', '아산', '청주', '충주', '서산/당진', '제천'] },
        { prov: '대전', cities: ['둔산/서구', '유성', '중구/동구', '대덕'] },
        { prov: '강원', cities: ['춘천', '원주', '강릉', '속초/동해'] },
        { prov: '전라', cities: ['전주', '익산', '군산', '목포', '여수', '순천'] },
        { prov: '광주', cities: ['상무/서구', '수완/광산', '남구/북구', '동구'] },
        { prov: '경상', cities: ['창원', '김해', '진주', '포항', '구미', '경주'] },
        { prov: '부산', cities: ['해운대/수영', '서면/진구', '동래/연제', '남구/북구', '사하/사상'] },
        { prov: '제주', cities: ['제주시', '서귀포시'] }
    ];
    let validRegions = [];
    RegionData.forEach(g => {
        g.cities.forEach(c => {
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
            status: "active",
            price: 100000 + (Math.floor(Math.random() * 5) * 10000),
            rating: parseFloat((Math.random() * 0.5 + 4.5).toFixed(1)),
            reviews: Math.floor(Math.random() * 80) + 12,
            
            // script.js 동기화를 위한 추가 필드
            region: rRegion,
            massage: rMassage,
            place: rPlaceShort,
            age: rAge,
            
            categories: [rMassage, rPlaceFull, rAge], 
            tier: i % 2 === 0 ? 'VIP' : 'Premium',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
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
            status: "active",
            price: 80000 + (Math.floor(Math.random() * 5) * 10000),
            rating: parseFloat((Math.random() * 0.5 + 4.5).toFixed(1)),
            reviews: Math.floor(Math.random() * 80) + 12,
            
            // script.js 동기화를 위한 추가 필드
            region: rRegion,
            massage: rMassage,
            place: rPlaceShort,
            age: rAge,
            
            categories: [rMassage, rPlaceFull, rAge], 
            tier: 'Normal',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        count++;
    }

    try {
        let count = 0;
        const progressEl = document.getElementById('discord-log'); 
        if(progressEl) {
            progressEl.innerText = "데이터 50건을 생성 중... (조금만 대기해주세요)";
            progressEl.classList.remove('text-gray-500');
            progressEl.classList.add('text-green-400');
        }

        const batchSize = 10;
        for (let i = 0; i < dummyPartners.length; i += batchSize) {
            const batch = db.batch();
            const slice = dummyPartners.slice(i, i + batchSize);
            
            slice.forEach(p => {
                const docRef = db.collection("partners").doc();
                batch.set(docRef, p);
                
                const reviewRef = db.collection("reviews").doc();
                batch.set(reviewRef, {
                    partnerId: docRef.id,
                    rating: 5,
                    text: "정말 친절하고 실력이 뛰어납니다. 강력 추천해요!",
                    date: "2026.04.10",
                    author: "jo*****",
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                count++;
            });
            await batch.commit();
        }

        if(progressEl) {
            progressEl.innerText = "대기 중...";
            progressEl.classList.add('text-gray-500');
            progressEl.classList.remove('text-green-400');
        }
        alert(`성공적으로 ${count}개의 더미 파트너와 리뷰가 실제 DB에 생성되었습니다!`);
    } catch(e) {
        console.error(e);
        alert("데이터 생성 중 오류가 발생했습니다: " + e.message);
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
    document.querySelectorAll('.countdown-timer').forEach(el => {
        const expiry = parseInt(el.getAttribute('data-expiry'));
        if (!expiry) return;
        const diff = expiry - Date.now();
        if (diff > 0) {
            const d = Math.floor(diff / (1000 * 60 * 60 * 24));
            const h = String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, '0');
            const m = String(Math.floor((diff / 1000 / 60) % 60)).padStart(2, '0');
            const s = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');
            el.innerHTML = `남은 시간: <span class="font-bold text-white">${d}</span>일 ${h}:${m}:${s}`;
            el.className = 'countdown-timer text-[11px] font-mono mt-1 border border-green-500/30 bg-[#06110D] text-green-400 px-2 py-0.5 rounded inline-block';
        } else {
            el.innerHTML = '⚠️ 입점권 시간 만료';
            el.className = 'countdown-timer text-[11px] font-mono mt-1 border border-red-500/30 bg-red-500/10 text-red-400 px-2 py-0.5 rounded inline-block';
        }
    });
}, 1000);

// ═══════════════════════════════════════
// ▶ SUBSCRIPTIONS & MANUAL ADJUSTMENT
// ═══════════════════════════════════════

function switchSubTab(tabId) {
    document.querySelectorAll('.sub-tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.sub-tab-btn').forEach(el => {
        el.classList.remove('text-[var(--point-color)]', 'border-[var(--point-color)]');
        el.classList.add('text-[#A7B2AE]', 'border-transparent');
    });

    document.getElementById(tabId).classList.remove('hidden');
    const btn = document.querySelector(`.sub-tab-btn[onclick="switchSubTab('${tabId}')"]`);
    if(btn) {
        btn.classList.remove('text-[#A7B2AE]', 'border-transparent');
        btn.classList.add('text-[var(--point-color)]', 'border-[var(--point-color)]');
    }
}

// ════════════ REALTME SUBSCRIPTION REQUESTS ════════════
let currentSubRequestStatus = 'pending';
let unsubscribeSubRequests = null;

window.switchSubRequestTab = function(status) {
    currentSubRequestStatus = status;
    const tabPending = document.getElementById('sub-req-tab-pending');
    const tabCompleted = document.getElementById('sub-req-tab-completed');
    
    if(tabPending && tabCompleted) {
        tabPending.classList.remove('text-[var(--point-color)]', 'border-[var(--point-color)]', 'text-[#A7B2AE]', 'border-transparent');
        tabCompleted.classList.remove('text-[var(--point-color)]', 'border-[var(--point-color)]', 'text-[#A7B2AE]', 'border-transparent');
        
        if (status === 'pending') {
            tabPending.classList.add('text-[var(--point-color)]', 'border-[var(--point-color)]');
            tabCompleted.classList.add('text-[#A7B2AE]', 'border-transparent');
        } else {
            tabCompleted.classList.add('text-[var(--point-color)]', 'border-[var(--point-color)]');
            tabPending.classList.add('text-[#A7B2AE]', 'border-transparent');
        }
    }
    
    window.loadSubscriptionRequests();
};

window.loadSubscriptionRequests = function() {
    const tbody = document.getElementById('sub-requests-table-body');
    if (!tbody) return;
    
    if (unsubscribeSubRequests) {
        unsubscribeSubRequests();
    }
    
    tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-[#A7B2AE]">로딩 중...</td></tr>';
    
    // We fetch all records and filter in memory to avoid throwing composite index errors across projects.
    unsubscribeSubRequests = db.collection('subscription_requests')
        .orderBy('createdAt', 'desc')
        .limit(100)
        .onSnapshot(snapshot => {
            let matches = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                if (currentSubRequestStatus === 'pending') {
                    if (data.status === 'pending') matches.push({...data, id: doc.id});
                } else {
                    if (data.status === 'completed' || data.status === 'rejected') matches.push({...data, id: doc.id});
                }
            });

            if(matches.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-[#A7B2AE]">${currentSubRequestStatus === 'pending' ? '현재 입금 대기 중인 신청 건이 없습니다.' : '처리 완료/반려 내역이 없습니다.'}</td></tr>`;
                return;
            }
            
            let html = '';
            matches.forEach(data => {
                const reqId = data.id;
                const d = data.createdAt ? new Date(data.createdAt.toMillis()) : new Date();
                const dStr = `${d.getFullYear().toString().substr(-2)}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
                
                let btnHtml = '';
                if(data.status === 'pending') {
                    btnHtml = `
                    <div class="flex flex-col gap-1.5 items-end justify-center h-full">
                        <button onclick="approveSubscriptionRequest('${reqId}', '${data.partnerId}', ${data.months}, '${data.companyName}')" class="px-3 py-1.5 bg-[#11291D] hover:bg-[var(--point-color)] hover:text-black text-[var(--point-color)] border border-[var(--point-color)] rounded-lg text-xs font-bold transition-colors w-[150px] shadow-md relative overflow-hidden group">
                           <span class="relative z-10 flex items-center justify-center gap-1"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>입금확인 • 즉시승인</span>
                           <div class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                        </button>
                        <button onclick="rejectSubscriptionRequest('${reqId}', '${data.companyName}')" class="px-3 py-1 bg-[#0A1B13] hover:bg-black text-[#A7B2AE] hover:text-red-400 border border-[#2A3731] hover:border-red-900 rounded-lg text-[11px] transition-colors w-[150px]">보류 / 반려</button>
                    </div>`;
                } else if(data.status === 'completed') {
                    btnHtml = `<span class="bg-[#11291D] text-green-400 border border-green-900/50 px-2.5 py-1 rounded-md text-xs font-bold">🟢 승인 완료</span>`;
                } else {
                    btnHtml = `<span class="bg-[#0A1B13] text-red-400 border border-[#2A3731] px-2.5 py-1 rounded-md text-xs">🔴 반려됨<br><span class="text-[9px] text-[#A7B2AE] font-normal tracking-tighter block mt-0.5 max-w-[80px] break-keep truncate" title="${data.rejectReason || ''}">${data.rejectReason || ''}</span></span>`;
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
        }, err => {
            console.error("Error loading sub requests: ", err);
        });
};

window.approveSubscriptionRequest = async function(reqId, partnerId, addMonths, companyName) {
    try {
        if (!confirm(`[${companyName}] 업체의 입금(결제) 사실을 확인하셨나요?\n승인 시 자동으로 입점권이 ${addMonths}개월 연장됩니다.`)) return;
        
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
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // 2. Mark request as completed
        await db.collection('subscription_requests').doc(reqId).update({
            status: 'completed',
            completedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert(`✅ [${companyName}] 스마트 승인 완료!\n종료 날짜가 ${newExpiryStr} 로 연장되었습니다.`);

    } catch (err) {
        console.error('Error approving subscription request', err);
        alert('승인 중 오류가 발생했습니다: ' + err.message);
    }
};

window.rejectSubscriptionRequest = async function(reqId, companyName) {
    try {
        const reason = prompt(`[${companyName}] 업체의 입점권 신청을 보류/반려 처리합니다.\n반려 사유(예: 입금 금액 불일치 등)를 적어주세요.`);
        if (reason === null) return; // User cancelled
        
        await db.collection('subscription_requests').doc(reqId).update({
            status: 'rejected',
            rejectReason: reason,
            completedAt: firebase.firestore.FieldValue.serverTimestamp()
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
    db.collection('partners').where('status', '==', 'active').onSnapshot(snapshot => {
        tbody.innerHTML = '';
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center">활성 상태인 파트너가 없습니다.</td></tr>';
            return;
        }
        let docs = [];
        snapshot.forEach(doc => docs.push(doc));
        // 남은 시간이 적은 순서대로 정렬 추가
        docs.sort((a,b) => (a.data().ticketExpiryTimestamp || Infinity) - (b.data().ticketExpiryTimestamp || Infinity));

        docs.forEach(doc => {
            const data = doc.data();
            const displayName = data.name || data.company || '이름 없음';
            const tierStr = data.ticketType || data.tier || '기본 입점';
            
            let expiryHtml = '<span class="text-[#A7B2AE]">만료일 미지정</span>';
            if (data.ticketExpiryTimestamp) {
                expiryHtml = `<div class="countdown-timer text-[11px] font-mono border border-[#2A3731] bg-[#06110D] text-[#A7B2AE] px-2 py-0.5 rounded inline-block" data-expiry="${data.ticketExpiryTimestamp}">계산중...</div>`;
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
        resContainer.innerHTML = '<div class="px-4 py-3 text-sm text-[#A7B2AE] text-center">업체 목록을 불러오는 중...</div>';
        resContainer.classList.remove('hidden');
        setManualSubListToggleLabel();
    }

    try {
        const snapshot = await db.collection('partners').get({ source: 'server' });
        manualSubPartners = [];

        snapshot.forEach(doc => {
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
    selectedSubTargets = [{id, name}];
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
    sourcePartners.forEach(data => {
        const n = data.name || data.company || '';
        const p = data.phone || data.managerPhone || '';
        
        let plan = data.ticketPlan === 'premium' ? '프리미엄' : (data.ticketPlan === 'standard' ? '스탠다드' : '입점권 없음(무료)');
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
        resContainer.innerHTML = matches.map(m => `
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
        `).join('');
        resContainer.classList.remove('hidden');
        setManualSubListToggleLabel();
    } else {
        resContainer.innerHTML = '<div class="px-4 py-3 text-sm text-[#A7B2AE] text-center">검색 결과가 없습니다.</div>';
        resContainer.classList.remove('hidden');
        setManualSubListToggleLabel();
    }
}

function addSubTarget(id, name, plan, remainStr) {
    if (!selectedSubTargets.find(t => t.id === id)) {
        selectedSubTargets.push({id, name, plan, remainStr});
        renderSubTargets();
    }
    document.getElementById('manual-sub-search').value = '';
    document.getElementById('manual-sub-search-results').classList.add('hidden');
    setManualSubListToggleLabel();
}

function removeSubTarget(id) {
    selectedSubTargets = selectedSubTargets.filter(t => t.id !== id);
    renderSubTargets();
}

function renderSubTargets() {
    const container = document.getElementById('manual-sub-targets-container');
    const emptyMsg = document.getElementById('manual-sub-empty-msg');
    
    Array.from(container.querySelectorAll('.sub-chip')).forEach(el => el.remove());
    
    if (selectedSubTargets.length === 0) {
        if(emptyMsg) emptyMsg.classList.remove('hidden');
    } else {
        if(emptyMsg) emptyMsg.classList.add('hidden');
        selectedSubTargets.forEach(t => {
            const chip = document.createElement('div');
            chip.className = 'sub-chip flex flex-col gap-1 px-3 py-2 bg-[var(--point-color)]/20 border border-[var(--point-color)]/50 rounded-lg text-sm text-white relative pr-8 w-full sm:w-auto shrink-0';
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
    
    let reasonText = document.querySelector(`#manual-sub-reason-category option[value="${reasonCat}"]`).innerText;
    if (reasonCat === 'custom') reasonText += ` - ${reasonMemo}`;
    
    if (!confirm(`선택한 ${selectedSubTargets.length}개 업체에 대해 조치를 실행하시겠습니까?`)) return;
    
    const batch = db.batch();
    const promises = selectedSubTargets.map(target => {
        const ref = db.collection('partners').doc(target.id);
        return ref.get().then(doc => {
            if (!doc.exists) return;
            const data = doc.data();
            // 신규 발급의 경우, 기존 만료일이 현재보다 과거라면 '오늘 기준'으로, 만료 전이라면 '기존 만료일 기준'으로 연장
            let baseDate = (data.ticketExpiryTimestamp && data.ticketExpiryTimestamp > Date.now()) ? new Date(data.ticketExpiryTimestamp) : new Date();
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
                newExpiry += (days * 24 * 60 * 60 * 1000);
                addedDaysMessage = `+${days}일`;
            } else if (type === 'subtract') {
                newExpiry -= (days * 24 * 60 * 60 * 1000);
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
            const strDate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

            batch.update(ref, {
                ticketExpiryTimestamp: newExpiry,
                ticketExpiry: strDate,
                ticketType: ticketType,
                ticketPlan: ticketPlan,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
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
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
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
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        });
    });
    
    Promise.all(promises).then(() => {
        return batch.commit();
    }).then(() => {
        alert('조치가 성공적으로 반영되었습니다.');
        closeModal('modal-manual-sub');
    }).catch(err => {
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
    configRef.get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            applySubProductsData(data);
        } else {
            // Apply defaults
            applyDefaultSubProducts();
        }
    }).catch(err => {
        console.error("Failed to load subscription config:", err);
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
    if(confirm('모든 설정을 다독의 기본 상품 양식으로 덮어쓰시겠습니까? 저장 전까지는 실제 적용되지 않습니다.')) {
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
            features: [
                '지역별 리스트 기본 노출',
                '파트너 전용 관리자 페이지'
            ]
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
                '3개월 결제 시 5% 할인'
            ],
            badge: 'Popular'
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
                '6개월 결제 시 15% 할인'
            ],
            badge: 'Best'
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
                '12개월 결제 시 25% 할인'
            ],
            badge: 'VIP'
        }
    ];
}

function getDefaultProductNameByTier(tier) {
    const normalizedTier = (tier || '').toString().toLowerCase();
    const nameMap = {
        basic: '1개월 입점권',
        standard: '3개월 입점권',
        premium: '6개월 입점권 (Premium)',
        vip: '12개월 입점권 (VIP)'
    };
    return nameMap[normalizedTier] || '1개월 입점권';
}

function getAllDefaultProductNames() {
    return new Set([
        getDefaultProductNameByTier('basic'),
        getDefaultProductNameByTier('standard'),
        getDefaultProductNameByTier('premium'),
        getDefaultProductNameByTier('vip')
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
            : (monthNum === 12 ? 'vip' : monthNum === 6 ? 'premium' : monthNum === 3 ? 'standard' : 'basic');
        
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
    const products = Array.from(container.querySelectorAll('.sub-product-item')).map(el => {
        return {
            id: el.dataset.id,
            isActive: el.querySelector('.prod-active').checked,
            name: el.querySelector('.prod-name').value,
            tier: el.querySelector('.prod-tier').value,
            months: parseInt(el.querySelector('.prod-months').value) || 1,
            originalPrice: parseInt(el.querySelector('.prod-original-price').value) || 0,
            price: parseInt(el.querySelector('.prod-price').value) || 0,
            features: el.querySelector('.prod-features').value.split('\n').map(f => f.trim()).filter(f => f),
            color: el.querySelector('.prod-color').value,
            badge: el.querySelector('.prod-badge').value
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
        features: ['기본 혜택']
    });
    
    renderSubProducts(products);
}

function handleSubProductsSubmit(e) {
    if(e) e.preventDefault();
    
    const trialActive = document.getElementById('sub-promo-trial-active').checked;
    const trialDays = parseInt(document.getElementById('sub-promo-trial-days').value) || 30;
    
    const productElements = document.querySelectorAll('.sub-product-item');
    const products = [];
    
    productElements.forEach(el => {
        let discountRate = 0;
        let p = parseInt(el.querySelector('.prod-price').value) || 0;
        let op = parseInt(el.querySelector('.prod-original-price').value) || 0;
        if(op > 0 && p < op) {
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
            features: el.querySelector('.prod-features').value.split('\n').map(f => f.trim()).filter(f => f),
            color: el.querySelector('.prod-color').value,
            badge: el.querySelector('.prod-badge').value
        });
    });
    
    const configData = {
        promoTrial: {
            active: trialActive,
            days: trialDays
        },
        products: products,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    db.collection('admin_configs').doc('subscription_products').set(configData, {merge: true})
        .then(() => {
            alert('입점권 상품 구성 정보가 저장되었습니다.');
            closeModal('modal-subscription-products');
        })
        .catch(err => {
            console.error("Error saving config: ", err);
            alert("정보 저장 중 오류가 발생했습니다: " + err.message);
        });
}
