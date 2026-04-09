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

// ─── Global Variables ───
let currentUserCount = 0;
let currentShopCount = 0;
let categoriesList = [];

// 소비자 앱에 하드코딩되어 있던 기본 필터 데이터
const DEFAULT_FILTERS = {
    massage: {
        title: '선호하는 마사지 종류',
        options: ['상관없음(전체)', '스웨디시', '스포츠 마사지', '타이 마사지', '커플 마사지']
    },
    place: {
        title: '휴식 공간 형태',
        options: ['상관없음(전체)', '프라이빗 방문 (홈케어/출장)', '프라이빗 1인샵 (매장 방문)', '스탠다드 다인샵 (일반 매장)']
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
            tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center">조회된 유저가 없습니다.</td></tr>';
            return;
        }
        snapshot.forEach(doc => {
            const data = doc.data();
            const dStr = data.createdAt ? new Date(data.createdAt.toMillis()).toLocaleString('ko-KR') : '-';
            tbody.innerHTML += `
                <tr class="hover:bg-white/5 transition-colors">
                    <td class="p-4 font-mono">${data.userId || '알수없음'}</td>
                    <td class="p-4">${data.name || '알수없음'}</td>
                    <td class="p-4 text-[#A7B2AE]">${data.phone || '-'}</td>
                    <td class="p-4 text-[#A7B2AE]">${dStr}</td>
                    <td class="p-4"><span class="px-2 py-1 bg-green-900/50 text-green-400 rounded text-xs border border-green-800">정상 활성</span></td>
                </tr>
            `;
        });
    });
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
                        최저가: ${Number(data.price || 0).toLocaleString()}원<br>
                        <span class="text-xs text-[#A7B2AE]">카테고리: ${categoriesInfo}</span>
                    </td>
                    <td class="p-4 text-[#A7B2AE] text-sm">${dStr}</td>
                    <td class="p-4 whitespace-nowrap">
                        <button onclick="activatePartner('${doc.id}')" class="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg text-sm mr-2 transition-colors">승인 (Activate)</button>
                        <button onclick="rejectPartner('${doc.id}')" class="px-3 py-1.5 bg-[#11291D] hover:bg-red-900/50 text-red-400 hover:text-red-300 font-bold border border-red-900/30 rounded-lg text-sm transition-colors">반려</button>
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

// ═══════════════════════════════════════
// ▶ SHOPS
// ═══════════════════════════════════════

function loadShops() {
    const container = document.getElementById('shop-list-container');
    db.collection('partners').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
        container.innerHTML = '';
        if (snapshot.empty) {
            container.innerHTML = '<div class="col-span-full py-10 text-center text-[#A7B2AE]">등록된 파트너 샵이 없습니다. 우측 상단의 [신규 매장 등록] 버튼을 눌러주세요.</div>';
            return;
        }
        snapshot.forEach(doc => {
            const data = doc.data();
            const cats = data.categories && data.categories.length > 0 ? data.categories.join(', ') : '카테고리 미지정';
            const imgUrl = data.image || 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
            
            const isPending = data.status === 'pending';
            const statusBadge = isPending 
                ? '<div class="absolute top-3 left-3 bg-red-600 text-white px-2.5 py-1 rounded-full text-xs font-bold border border-red-800">승인대기</div>' 
                : '<div class="absolute top-3 left-3 bg-green-600 text-white px-2.5 py-1 rounded-full text-xs font-bold border border-green-800">활성됨</div>';
            
            const activateBtn = isPending 
                ? `<button onclick="activatePartner('${doc.id}')" class="text-xs text-green-500 hover:text-white font-medium bg-green-500/10 hover:bg-green-500 transition-colors px-3 py-1.5 rounded-lg border border-green-500/20 mr-2">가입 승인</button>` 
                : '';

            container.innerHTML += `
                <div class="bg-[#0A1B13] border border-[#2A3731] rounded-2xl overflow-hidden hover:border-[var(--point-color)] transition-colors group shadow-lg flex flex-col">
                    <div class="h-40 bg-[#11291D] relative overflow-hidden shrink-0">
                        <img src="${imgUrl}" class="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" alt="샵 이미지">
                        ${statusBadge}
                        <div class="absolute top-3 right-3 bg-black/70 backdrop-blur text-white px-2.5 py-1 rounded-full text-xs font-bold border border-white/10">
                            ★ ${data.stats?.rating || data.rating || '0.0'} (${data.stats?.count || data.reviews || 0})
                        </div>
                    </div>
                    <div class="p-5 flex flex-col flex-1">
                        <h3 class="text-xl font-bold text-white mb-1 line-clamp-1">${data.name}</h3>
                        <p class="text-sm text-[#A7B2AE] mb-4 line-clamp-1">${data.address || data.location || ''}</p>
                        
                        <div class="mt-auto pt-4 border-t border-[#2A3731] flex justify-between items-center">
                            <span class="text-white font-bold text-lg">${Number(data.price || 0).toLocaleString()}<span class="text-sm font-normal text-gray-400 ml-0.5">원~</span></span>
                            <div>
                                ${activateBtn}
                                <button onclick="deleteShop('${doc.id}')" class="text-xs text-red-500 hover:text-white font-medium bg-red-500/10 hover:bg-red-500 transition-colors px-3 py-1.5 rounded-lg border border-red-500/20">데이터 삭제</button>
                            </div>
                        </div>
                    </div>
                </div>
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
    const price = document.getElementById('shop-price').value;
    const rating = document.getElementById('shop-rating').value;
    const reviews = document.getElementById('shop-reviews').value;
    const tagsRaw = document.getElementById('shop-tags').value;
    
    const tags = tagsRaw.split(',').map(t => t.trim()).filter(t => t);
    const checkedCats = Array.from(document.querySelectorAll('.shop-cat-checkbox:checked')).map(cb => cb.value);

    const data = { name, location, image, price: Number(price), rating: Number(rating || 0), reviews: Number(reviews || 0), tags, categories: checkedCats };

    if (id) {
        data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        db.collection('partners').doc(id).update(data)
          .then(() => closeModal('modal-shop'))
          .catch(err => alert("기존 매장 수정 오류: "+err.message));
    } else {
        data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        data.status = 'active'; // Admin adds partner directly as active
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
async function generateDummyPartners() {
    if(!confirm("가상의 파트너(마사지샵) 데이터와 리뷰를 대량생성합니다. 계속하시겠습니까?")) return;

    const dummyPartners = [
        {
            name: "라포레 스파 (La Foret)", location: "강남대로 100길, 테헤란로", phone: "02-123-4567", categoryMatch: {"마사지 종류": "스웨디시", "공간 형태": "프라이빗 1인샵 (매장 방문)", "관리사 연령대": "20대 초반"},
            image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            status: "active",
            amenities: ["샤워실", "와이파이", "개인실"], createdAt: firebase.firestore.FieldValue.serverTimestamp()
        },
        {
            name: "더 타이 힐링 (The Thai)", location: "서울시 마포구 홍대입구", phone: "02-987-6543", categoryMatch: {"마사지 종류": "타이 마사지", "공간 형태": "스탠다드 다인샵 (일반 매장)", "관리사 연령대": "30대 중후반"},
            image: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            status: "active",
            amenities: ["샤워실", "수면가능", "단체석"], createdAt: firebase.firestore.FieldValue.serverTimestamp()
        },
        {
            name: "시크릿 테라피", location: "서울시 용산구 이태원동", phone: "010-1234-5678", categoryMatch: {"마사지 종류": "스포츠 마사지", "공간 형태": "프라이빗 방문 (홈케어/출장)", "관리사 연령대": "20대 중후반"},
            image: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            status: "active",
            amenities: ["출장", "야간영업"], createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }
    ];

    try {
        let count = 0;
        for(let p of dummyPartners) {
            const docRef = await db.collection("partners").add(p);
            
            // 더미 리뷰 생성
            await db.collection("reviews").add({
                partnerId: docRef.id,
                rating: 5,
                text: "정말 친절하고 실력이 뛰어납니다. 강력 추천해요!",
                date: "2026.04.09",
                author: "jo*****",
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            await db.collection("reviews").add({
                partnerId: docRef.id,
                rating: 4,
                text: "시설이 깔끔하고 좋아요~ 재방문 의사 있습니다.",
                date: "2026.04.08",
                author: "ka*****",
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                reply: "감사합니다 고객님! 다음 방문때도 정성껏 모시겠습니다.",
                replyAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            count++;
        }
        alert(`성공적으로 ${count}개의 더미 파트너와 리뷰가 생성되었습니다.`);
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
