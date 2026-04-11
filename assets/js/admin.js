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
            console.error("Login failed:", error.message);
            alert("로그인 실패: " + error.message);
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
            const dStr = data.createdAt ? new Date(data.createdAt.toMillis()).toLocaleString('ko-KR') : '-';
            const logStr = data.lastLoginAt ? new Date(data.lastLoginAt.toMillis()).toLocaleString('ko-KR') : '-';
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

function loadApprovals() {
    const tbody = document.getElementById('approvals-table-body');
    if (!tbody) return;
    
    db.collection('partners').where('status', '==', 'pending').onSnapshot((snapshot) => {
        tbody.innerHTML = '';
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-[#A7B2AE]">현재 입점 승인을 대기 중인 파트너가 없습니다.</td></tr>';
            return;
        }
        snapshot.forEach(doc => {
            const data = doc.data();
            const dStr = data.createdAt ? new Date(data.createdAt.toMillis()).toLocaleString('ko-KR') : '-';
            const categoriesInfo = data.categories && data.categories.length > 0 ? data.categories.join(', ') : '미지정';
            tbody.innerHTML += `
                <tr class="hover:bg-white/5 transition-colors">
                    <td class="p-4 font-medium">
                        ${data.name || '샵 이름 없음'} <br>
                        <span class="text-xs text-[#A7B2AE] font-normal">${data.ownerName || '대표자 미상'}</span>
                    </td>
                    <td class="p-4 text-[#A7B2AE] text-sm">
                        ${data.address || data.location || '-'}<br>
                        <span class="text-xs text-[#A7B2AE]">${data.phone || '-'}</span>
                    </td>
                    <td class="p-4 text-[#A7B2AE] text-sm">
                        요청: ${data.ticketType || '기본 입점'}<br>
                        <span class="text-xs text-[#A7B2AE]">카테고리: ${categoriesInfo}</span>
                    </td>
                    <td class="p-4 text-[#A7B2AE] text-sm">${dStr}</td>
                    <td class="p-4 whitespace-nowrap">
                        <button onclick="openApprovalReviewModal('${doc.id}')" class="px-3 py-1.5 bg-white text-[#0A1B13] font-bold rounded-lg text-sm mr-2 transition-colors hover:brightness-110 shadow-sm border border-gray-200">상세 심사 및 승인</button>
                        <button onclick="rejectPartner('${doc.id}')" class="px-3 py-1.5 bg-[#11291D] hover:bg-red-900/50 text-red-400 hover:text-red-300 font-bold border border-red-900/30 rounded-lg text-sm transition-colors">즉시 반려</button>
                    </td>
                </tr>
            `;
        });
    });
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

function openApprovalReviewModal(id) {
    db.collection('partners').doc(id).get().then(doc => {
        if (!doc.exists) return;
        const data = doc.data();
        
        document.getElementById('approval-id').value = id;
        document.getElementById('approval-name').value = data.name || '';
        document.getElementById('approval-owner').value = data.ownerName || '';
        document.getElementById('approval-address').value = data.address || data.location || '';
        document.getElementById('approval-phone').value = data.phone || '';
        document.getElementById('approval-tags').value = (data.categories || []).join(', ');
        document.getElementById('approval-image').value = data.imageUrl || '';
        if(data.imageUrl) {
            document.getElementById('approval-image-preview').src = data.imageUrl;
            document.getElementById('approval-image-preview').classList.remove('hidden');
        } else {
            document.getElementById('approval-image-preview').classList.add('hidden');
        }
        document.getElementById('approval-catchphrase').value = data.catchphrase || '';
        document.getElementById('approval-min-price').value = data.minPrice || '';
        document.getElementById('approval-tier').value = data.ticketType || 'Normal';
        document.getElementById('approval-biz-verified').value = data.bizVerified ? 'true' : 'false';
        document.getElementById('approval-memo').value = data.adminMemo || '';
        
        // 동적으로 Select 박스 옵션 채우기
        const populateSelect = (key, selectId, existingValue) => {
            db.collection('app_filters').doc(key).get().then(fDoc => {
                const selectElement = document.getElementById(selectId);
                selectElement.innerHTML = '';
                if(fDoc.exists) {
                    const opts = fDoc.data().options || [];
                    opts.forEach(opt => {
                        const optionHTML = `<option value="${opt}">${opt}</option>`;
                        selectElement.innerHTML += optionHTML;
                    });
                    if (existingValue && opts.includes(existingValue)) {
                        selectElement.value = existingValue;
                    }
                }
            });
        };
        populateSelect('massage', 'approval-cat-massage', data.catMassage);
        populateSelect('place', 'approval-cat-place', data.catPlace);
        populateSelect('age', 'approval-cat-age', data.catAge);

        openModal('modal-approval-review');
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

    const updateData = {
        name: document.getElementById('approval-name').value.trim(),
        ownerName: document.getElementById('approval-owner').value.trim(),
        address: document.getElementById('approval-address').value.trim(),
        phone: document.getElementById('approval-phone').value.trim(),
        catMassage: document.getElementById('approval-cat-massage').value,
        catPlace: document.getElementById('approval-cat-place').value,
        catAge: document.getElementById('approval-cat-age').value,
        categories: document.getElementById('approval-tags').value.split(',').map(s=>s.trim()).filter(Boolean),
        imageUrl: document.getElementById('approval-image').value.trim(),
        catchphrase: document.getElementById('approval-catchphrase').value.trim(),
        minPrice: Number(document.getElementById('approval-min-price').value),
        ticketType: document.getElementById('approval-tier').value,
        bizVerified: bizVerified,
        adminMemo: document.getElementById('approval-memo').value.trim(),
        status: 'active',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    db.collection('partners').doc(id).update(updateData).then(() => {
        alert('승인 및 정보 업데이트가 완료되었습니다!');
        closeModal('modal-approval-review');
    }).catch(err => {
        alert('승인 처리 중 오류 발생: ' + err.message);
    });
}

function rejectPartnerFromModal() {
    const id = document.getElementById('approval-id').value;
    if(!id) return;
    if(confirm('정말 이 샵을 영구 삭제(반려) 하시겠습니까?')) {
        db.collection('partners').doc(id).delete().then(() => {
            alert('입점 신청이 반려되었습니다.');
            closeModal('modal-approval-review');
        }).catch(err => alert('삭제 중 오류 발생: ' + err.message));
    }
}


// ═══════════════════════════════════════
// ▶ SHOPS
// ═══════════════════════════════════════

function loadShops() {
    const container = document.getElementById('shop-list-container');
    db.collection('partners').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
        container.innerHTML = '';
        if (snapshot.empty) {
            container.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-[#A7B2AE]">등록된 샵이 없습니다.</td></tr>';
            return;
        }
        snapshot.forEach(doc => {
            const data = doc.data();
            const dateStr = data.createdAt ? data.createdAt.toDate().toLocaleString('ko-KR') : '-';
            const ticketTypeStr = data.ticketType || '기본 입점 (뱃지 없음)';
            const ticketExpiryStr = data.ticketExpiry ? `${data.ticketExpiry} 만료` : '만료일 미지정';
            
            const isPending = data.status === 'pending';
            const statusBadge = isPending 
                ? '<span class="text-red-400 bg-red-400/10 border border-red-500/20 px-2 py-1 rounded text-xs">승인대기</span>' 
                : '<span class="text-green-400 bg-green-400/10 border border-green-500/20 px-2 py-1 rounded text-xs">정상 활성</span>';
            
            const activateBtn = isPending 
                ? `<button onclick="activatePartner('${doc.id}')" class="text-xs text-green-400 hover:text-green-200 ml-2">가입 승인</button>` 
                : '';

            container.innerHTML += `
                <tr class="hover:bg-[#11291D] transition-colors">
                    <td class="p-4">
                        <div class="font-bold text-white">${data.name}</div>
                        <div class="text-xs text-[var(--point-color)] mt-0.5">${data.tier || '기본'} | ${data.massage || '-'}</div>
                    </td>
                    <td class="p-4">
                        <div class="text-white">${data.address || data.location || '-'}</div>
                        <div class="text-xs text-[#A7B2AE] mt-0.5">${data.phone || '-'}</div>
                    </td>
                    <td class="p-4">
                        <div class="text-white font-medium text-[var(--point-color)]">${ticketTypeStr}</div>
                        <div class="text-xs text-[#A7B2AE] mt-0.5">${ticketExpiryStr}</div>
                    </td>
                    <td class="p-4 text-[#A7B2AE]">${dateStr}</td>
                    <td class="p-4">
                        <div class="flex items-center">
                            ${statusBadge}
                            ${activateBtn}
                            <button onclick="deleteShop('${doc.id}')" class="text-xs text-red-400 hover:text-red-200 ml-3" title="삭제">
                                삭제
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
    });
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

// ─── Discord Webhook testing ───
function testDiscordWebhook() {
    const logBox = document.getElementById('discord-log');
    logBox.innerText = `[전송 테스트] 웹훅 시스템 URL이 현재 미입력되어 시뮬레이션 환경용으로 작동합니다. (에러 전송 완료 모방)`;
    logBox.classList.add('text-green-400');
    setTimeout(() => {
        logBox.innerText = '시스템 대기 중...';
        logBox.classList.remove('text-green-400');
    }, 2500);
}
