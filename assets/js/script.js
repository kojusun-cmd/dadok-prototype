// removed DOMContentLoaded wrapper
                                const regionData = {
                                    '서울': ['전체', '강남/서초', '송파/강동', '영등포/구로/금천', '강서/양천', '마포/서대문/은평', '용산/중구/종로', '성동/광진', '동대문/중랑', '노원/도봉/강북', '기타'],
                                    '경기': ['전체', '수원', '성남(분당)', '고양(일산)', '용인', '부천', '안산', '안양/과천', '화성(동탄)', '평택', '의정부', '파주', '시흥', '김포', '광명', '광주', '구리/남양주', '기타'],
                                    '인천': ['전체', '부평/계양', '남동(구월)', '연수(송도)', '서구(청라)', '중구/동구', '기타'],
                                    '충청': ['전체', '세종', '천안', '아산', '청주', '충주', '서산/당진', '제천', '기타'],
                                    '대전': ['전체', '둔산/서구', '유성', '중구/동구', '대덕', '기타'],
                                    '강원': ['전체', '춘천', '원주', '강릉', '속초/동해', '기타'],
                                    '전라': ['전체', '전주', '익산', '군산', '목포', '여수', '순천', '기타'],
                                    '광주': ['전체', '상무/서구', '수완/광산', '남구/북구', '동구', '기타'],
                                    '경상': ['전체', '창원', '김해', '진주', '포항', '구미', '경주', '기타'],
                                    '부산': ['전체', '해운대/수영', '서면/진구', '동래/연제', '남구/북구', '사하/사상', '기타'],
                                    '제주': ['전체', '제주시', '서귀포시', '기타']
                                };

                                const selectedRegionsCount = document.getElementById('selected-regions-count');
                                const selectedRegionsContainer = document.getElementById('selected-regions-container');
                                const regionTabsContainer = document.getElementById('region-tabs-container');
                                const regionSubOptionsContainer = document.getElementById('region-sub-options-container');

                                const selectedRegions = new Set(['서울 강남/서초']);
                                let currentActiveTab = '서울';

                                window.renderRegionTabs = function () {
                                    if (!regionTabsContainer) return;
                                    regionTabsContainer.innerHTML = '';
                                    Object.keys(regionData).forEach(province => {
                                        const btn = document.createElement('button');
                                        const isActive = province === currentActiveTab;
                                        btn.className = isActive
                                            ? 'flex-shrink-0 px-4 py-2 rounded-full bg-[#D4AF37] text-[#06110D] text-[12px] font-bold transition-all'
                                            : 'flex-shrink-0 px-4 py-2 rounded-full border border-[#2A3731] text-white  text-[12px] hover:border-[var(--point-color)] transition-all';
                                        btn.innerText = province;
                                        btn.onclick = () => {
                                            currentActiveTab = province;
                                            window.renderRegionTabs();
                                            window.renderRegionSubOptions();
                                        };
                                        regionTabsContainer.appendChild(btn);
                                    });
                                }

                                window.renderRegionSubOptions = function () {
                                    if (!regionSubOptionsContainer) return;
                                    regionSubOptionsContainer.innerHTML = '';
                                    const districts = regionData[currentActiveTab] || [];
                                    districts.forEach(district => {
                                        const fullRegionName = `${currentActiveTab} ${district}`;
                                        const isSelected = selectedRegions.has(fullRegionName);

                                        const btn = document.createElement('button');
                                        btn.className = isSelected
                                            ? 'py-2.5 text-[13px] text-center rounded-lg border border-[var(--point-color)] bg-[#D4AF37]/10 text-[var(--point-color)] font-medium transition-all'
                                            : 'py-2.5 text-[13px] text-center rounded-lg border border-[#2A3731] text-[var(--text-sub)] hover:border-[var(--point-color)] hover:text-white transition-all';
                                        btn.innerText = district;

                                        btn.onclick = () => {
                                            if (selectedRegions.has(fullRegionName)) {
                                                selectedRegions.delete(fullRegionName);
                                            } else {
                                                selectedRegions.add(fullRegionName);
                                            }
                                            window.renderRegionSubOptions();
                                            window.renderSelectedRegions();
                                        };
                                        regionSubOptionsContainer.appendChild(btn);
                                    });
                                }

                                window.renderSelectedRegions = function () {
                                    if (!selectedRegionsContainer || !selectedRegionsCount) return;
                                    selectedRegionsContainer.innerHTML = '';
                                    selectedRegionsCount.innerText = `${selectedRegions.size}개 선택됨`;

                                    selectedRegions.forEach(region => {
                                        const btn = document.createElement('button');
                                        btn.className = 'px-4 py-2 rounded-full border border-[var(--point-color)] bg-[#D4AF37]/10 text-white  text-[13px] font-medium transition-all flex items-center gap-1';

                                        const parts = region.split(' ');
                                        const dist = parts.slice(1).join(' ');
                                        const displayText = (dist === '전체' || dist === '기타') ? region : dist;

                                        btn.innerHTML = `${displayText} <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
                                        btn.onclick = () => {
                                            selectedRegions.delete(region);
                                            window.renderRegionSubOptions();
                                            window.renderSelectedRegions();
                                        };
                                        selectedRegionsContainer.appendChild(btn);
                                    });
                                }

                                if (selectedRegionsContainer) {
                                    window.renderRegionTabs();
                                    window.renderRegionSubOptions();
                                    window.renderSelectedRegions();

                                    // PC 테스트를 위한 마우스 드래그 스크롤 기능 추가
                                    let isDown = false;
                                    let startX;
                                    let scrollLeft;

                                    regionTabsContainer.addEventListener('mousedown', (e) => {
                                        isDown = true;
                                        startX = e.pageX - regionTabsContainer.offsetLeft;
                                        scrollLeft = regionTabsContainer.scrollLeft;
                                    });
                                    regionTabsContainer.addEventListener('mouseleave', () => {
                                        isDown = false;
                                    });
                                    regionTabsContainer.addEventListener('mouseup', () => {
                                        isDown = false;
                                    });
                                    regionTabsContainer.addEventListener('mousemove', (e) => {
                                        if (!isDown) return;
                                        e.preventDefault();
                                        const x = e.pageX - regionTabsContainer.offsetLeft;
                                        const walk = (x - startX) * 2; // 드래그 속도 조절
                                        regionTabsContainer.scrollLeft = scrollLeft - walk;
                                    });
                                }

                                // --- 범용 아코디언 + 태그 카테고리 로직 ---
                                function setupCategory(idPrefix, initialData, initialSelected) {
                                    const data = initialData;
                                    const selected = new Set(initialSelected);
                                    const countEl = document.getElementById(`selected-${idPrefix}-count`);
                                    const containerEl = document.getElementById(`selected-${idPrefix}-container`);
                                    const boxEl = document.getElementById(`${idPrefix}-selector-box`);

                                    if (!boxEl || !containerEl || !countEl) return;

                                    const renderOptions = () => {
                                        boxEl.innerHTML = '';
                                        data.forEach(item => {
                                            const isSelected = selected.has(item);
                                            const btn = document.createElement('button');
                                            btn.className = isSelected
                                                ? 'py-2.5 text-[13px] text-center rounded-lg border border-[var(--point-color)] bg-[#D4AF37]/10 text-[var(--point-color)] font-medium transition-all'
                                                : 'py-2.5 text-[13px] text-center rounded-lg border border-[#2A3731] text-[var(--text-sub)] hover:border-[var(--point-color)] hover:text-white transition-all';
                                            btn.innerText = item;
                                            btn.onclick = () => {
                                                selected.has(item) ? selected.delete(item) : selected.add(item);
                                                renderOptions();
                                                renderSelected();
                                            };
                                            boxEl.appendChild(btn);
                                        });
                                    };

                                    const renderSelected = () => {
                                        containerEl.innerHTML = '';
                                        countEl.innerText = `${selected.size}개 선택됨`;
                                        selected.forEach(item => {
                                            const btn = document.createElement('button');
                                            btn.className = 'px-4 py-2 rounded-full border border-[var(--point-color)] bg-[#D4AF37]/10 text-white  text-[13px] font-medium transition-all flex items-center gap-1 mb-2';
                                            btn.innerHTML = `${item} <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
                                            btn.onclick = () => {
                                                selected.delete(item);
                                                renderOptions();
                                                renderSelected();
                                            };
                                            containerEl.appendChild(btn);
                                        });
                                    };

                                    renderOptions();
                                    renderSelected();
                                }

                                setupCategory('massage', ['상관없음(전체)', '스웨디시', '스포츠 마사지', '타이 마사지', '커플마사지'], ['스웨디시']);
                                setupCategory('space', ['상관없음(전체)', '방문 (홈케어/출장)', '1인샵 (매장 방문)', '다인샵 (일반 매장)'], ['상관없음(전체)']);
                                setupCategory('age', ['연령 무관 (전체)', '20대 초반', '20대 중후반', '30대 초반', '30대 중후반', '40대 초반', '40대 중후반'], ['연령 무관 (전체)']);

const filterSheet = document.getElementById('filter-sheet');
            const profileSheet = document.getElementById('profile-sheet');
            const overlay = document.getElementById('overlay');
            const cta = document.getElementById('cta-button');
            const filterOptionsDiv = document.getElementById('filter-options');
            const filterTitle = document.getElementById('filter-title');

            // 지역별 시/구 데이터 (프로토타입 구조)
            // 서울 경기 인천 충청 대전 강원 전라 광주 경상 부산 제주 (대구 옵션 추가)
            const RegionData = [
                { prov: '서울', cities: ['전체', '강남/서초', '송파/강동', '영등포/구로/금천', '강서/양천', '마포/서대문/은평', '용산/중구/종로', '성동/광진', '동대문/중랑', '노원/도봉/강북', '기타'] },
                { prov: '경기', cities: ['전체', '수원', '성남(분당)', '고양(일산)', '용인', '부천', '안산', '안양/과천', '화성(동탄)', '평택', '의정부', '파주', '시흥', '김포', '광명', '광주', '구리/남양주', '기타'] },
                { prov: '인천', cities: ['전체', '부평/계양', '남동(구월)', '연수(송도)', '서구(청라)', '중구/동구', '기타'] },
                { prov: '충청', cities: ['전체', '세종', '천안', '아산', '청주', '충주', '서산/당진', '제천', '기타'] },
                { prov: '대전', cities: ['전체', '둔산/서구', '유성', '중구/동구', '대덕', '기타'] },
                { prov: '강원', cities: ['전체', '춘천', '원주', '강릉', '속초/동해', '기타'] },
                { prov: '전라', cities: ['전체', '전주', '익산', '군산', '목포', '여수', '순천', '기타'] },
                { prov: '광주', cities: ['전체', '상무/서구', '수완/광산', '남구/북구', '동구', '기타'] },
                { prov: '경상', cities: ['전체', '창원', '김해', '진주', '포항', '구미', '경주', '기타'] },
                { prov: '부산', cities: ['전체', '해운대/수영', '서면/진구', '동래/연제', '남구/북구', '사하/사상', '기타'] },
                { prov: '제주', cities: ['전체', '제주시', '서귀포시', '기타'] }
            ];

            const FilterConfig = {
                'region': {
                    title: '지역 선택',
                    type: 'accordion',
                    data: RegionData
                },
                'massage': {
                    title: '선호하는 마사지 종류',
                    type: 'list',
                    options: ['상관없음(전체)', '스웨디시', '스포츠 마사지', '타이 마사지', '커플마사지']
                },
                'place': {
                    title: '휴식 공간 형태',
                    type: 'list',
                    options: ['상관없음(전체)', '방문 (홈케어/출장)', '1인샵 (매장 방문)', '다인샵 (일반 매장)']
                },
                'age': {
                    title: '선호하는 관리사 연령대',
                    type: 'list',
                    options: ['연령 무관 (전체)', '20대 초반', '20대 중후반', '30대 초반', '30대 중후반', '40대 초반', '40대 중후반']
                }
            };

            let currentFilterKey = '';

            // --- 필터 상태 및 필터링된 데이터 ---
            let activeFilters = {
                region: [],
                massage: [],
                place: [],
                age: []
            };
            let tempFilters = null;
            let recommendInterval = null;
            let filteredChoiceDB = [];
            let filteredRecDB = [];

            function toggleFilterContainer(e) {
                if (e) e.preventDefault();
                const container = document.getElementById('filter-options-container');
                const btn = document.getElementById('filter-toggle-btn');
                if (!container || !btn) return;
                
                const isHidden = container.classList.contains('hidden');
                
                const filterIconSvg = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>`;
                const closeIconSvg = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path></svg>`;

                if (isHidden) {
                    container.classList.remove('hidden');
                    btn.style.opacity = '0.9';
                    btn.innerHTML = `${closeIconSvg} 상세검색 접기`;
                    
                    // 배경(외부) 클릭 시 닫기
                    setTimeout(() => {
                        document.addEventListener('click', closeFilterContainerOutside);
                    }, 0);
                } else {
                    container.classList.add('hidden');
                    btn.style.opacity = '1';
                    btn.innerHTML = `${filterIconSvg} 조건 상세 검색`;
                    
                    document.removeEventListener('click', closeFilterContainerOutside);
                }
            }

            function closeFilterContainerOutside(e) {
                const container = document.getElementById('filter-options-container');
                const btn = document.getElementById('filter-toggle-btn');
                
                if (container && !container.classList.contains('hidden') && btn) {
                    if (!container.contains(e.target) && !btn.contains(e.target)) {
                        // 모달 내 셀렉트박스나 다른 모달(지역/마사지 등)을 클릭했을 때의 예외 처리
                        // (만약 추가적인 하위 모달 클릭 시 닫히면 안 될 경우 e.target 의 closest 검사 추가 가능)
                        if (e.target.closest('.bottom-sheet') || e.target.closest('#filter-modal')) {
                            return; 
                        }

                        container.classList.add('hidden');
                        btn.style.opacity = '1';
                        const filterIconSvg = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>`;
                        btn.innerHTML = `${filterIconSvg} 조건 상세 검색`;
                        document.removeEventListener('click', closeFilterContainerOutside);
                    }
                }
            }

            function openFilter(key) {
                currentFilterKey = key;

                // 필터 모달을 열 때 현재 필터 상태를 임시 저장
                tempFilters = JSON.parse(JSON.stringify(activeFilters));

                const config = FilterConfig[key];
                filterTitle.innerText = config.title;
                filterOptionsDiv.innerHTML = '';
                filterOptionsDiv.scrollTop = 0; // 스크롤 초기화

            const searchBtnHtml = `
            <div class="sticky bottom-0 w-full mt-2 pt-4 pb-4 z-20" style="margin-bottom: -1.5rem;">
                <button onclick="executeFilterSearch()" class="w-full py-[18px] rounded-2xl font-bold text-[18px] text-[#06110D] shadow-[0_4px_15px_rgba(212,175,55,0.3)] hover:brightness-110 active:scale-95 transition-all" style="background: var(--point-color);">검색 결과 보기</button>
            </div>
        `;

                if (config.type === 'accordion') {
                    // 지역: 아코디언/그룹 형태 렌더링
                    let html = `<div class="pb-2">`;
                    config.data.forEach(group => {
                        let hasActive = group.cities.some(c => {
                            let val = c === '전체' ? `${group.prov} 전체` : `${group.prov} ${c}`;
                            return tempFilters[key].includes(val);
                        });
                        let isExpanded = hasActive; // 선택된 지역이 있으면 기본으로 펼침
                        let displayStyle = isExpanded ? 'display: grid;' : 'display: none;';
                        let svgClass = isExpanded ? 'rotate-180' : '';

                        html += `
                    <div class="region-group-title flex justify-between items-center cursor-pointer select-none" onclick="toggleRegion(this)">
                        <span>${group.prov}</span>
                        <svg class="w-5 h-5 transition-transform duration-300 transform ${svgClass}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                    <div class="region-list pt-2" style="${displayStyle}">
                        ${group.cities.map(city => {
                            let val = city === '전체' ? `${group.prov} 전체` : `${group.prov} ${city}`;
                            let isActive = tempFilters[key].includes(val) ? 'bg-[var(--point-color)] text-[#06110D] font-bold border-transparent' : '';
                            return `<button class="filter-btn text-center ${isActive}" onclick="applyFilter(this, '${key}', '${val}')">${city}</button>`;
                        }).join('')}
                    </div>
                `;
                    });
                    html += `</div>`;
                    filterOptionsDiv.innerHTML = html + searchBtnHtml;
                } else {
                    // 일반 리스트 바인딩
                    let html = `<div class="filter-list-col mt-4">`;
                    config.options.forEach(opt => {
                        let isActive = tempFilters[key].includes(opt) ? 'bg-[var(--point-color)] text-[#06110D] font-bold border-transparent' : '';
                        html += `<button class="filter-btn ${isActive}" onclick="applyFilter(this, '${key}', '${opt}')">${opt}</button>`;
                    });
                    html += `</div>`;
                    filterOptionsDiv.innerHTML = html + searchBtnHtml;
                }

                filterSheet.classList.add('open');
                overlay.classList.add('show');
                document.body.style.overflow = 'hidden';
            }

            function toggleRegion(element) {
                const list = element.nextElementSibling;
                const icon = element.querySelector('svg');
                if (list.style.display === 'none') {
                    list.style.display = 'grid';
                    icon.classList.add('rotate-180');
                    // 열 때 스무스하게 보이기 위해 처리할 수도 있지만 지금은 grid만 토글
                } else {
                    list.style.display = 'none';
                    icon.classList.remove('rotate-180');
                }
            }

            function applyFilter(btn, key, fullValue) {
                // "전체"(아무것도 선택 안된 상태) 리셋 값만 처리
                if (fullValue === '전체') {
                    tempFilters[key] = [];
                    if (btn) {
                        const parent = btn.closest('#filter-options');
                        if (parent) {
                            parent.querySelectorAll('.filter-btn').forEach(b => {
                                b.classList.remove('bg-[var(--point-color)]', 'text-[#06110D]', 'font-bold', 'border-transparent');
                            });
                        }
                        btn.classList.add('bg-[var(--point-color)]', 'text-[#06110D]', 'font-bold', 'border-transparent');
                    }
                } else {
                    if (tempFilters[key].includes(fullValue)) {
                        tempFilters[key] = tempFilters[key].filter(v => v !== fullValue);
                        if (btn) btn.classList.remove('bg-[var(--point-color)]', 'text-[#06110D]', 'font-bold', 'border-transparent');
                    } else {
                        tempFilters[key].push(fullValue);
                        if (btn) btn.classList.add('bg-[var(--point-color)]', 'text-[#06110D]', 'font-bold', 'border-transparent');
                    }
                }
            }

            function removeFilterItem(key, val) {
                activeFilters[key] = activeFilters[key].filter(v => v !== val);
                updateChipText(key);
                applyFiltersToData();
            }

            function updateChipText(key) {
                const chipTextSpan = document.getElementById(`val-${key}`);
                const defaults = { 'region': '지역 선택', 'massage': '마사지 종류', 'place': '공간 형태', 'age': '관리사 연령' };

                if (activeFilters[key].length === 0) {
                    chipTextSpan.innerText = defaults[key];
                    chipTextSpan.parentElement.classList.remove('active');
                } else {
                    let first = activeFilters[key][0];
                    let shortValue = first;
                    if (first === '상관없음(전체)') shortValue = '상관없음';
                    else if (first === '연령 무관 (전체)') shortValue = '연령 무관';
                    else if (first.endsWith(' 전체')) shortValue = first;
                    else {
                        shortValue = first.split(' ').pop();
                        if (shortValue.length > 6) shortValue = shortValue.substring(0, 6) + '..';
                    }
                    if (activeFilters[key].length > 1) {
                        shortValue += ` 외 ${activeFilters[key].length - 1}건`;
                    }
                    chipTextSpan.innerText = shortValue;
                    chipTextSpan.parentElement.classList.add('active');
                }
            }

            let isFavorite = false;
            let userFavorites = [];
            let userChats = [];
            let currentPartner = null;

            window.removeFavorite = function (id) {
                userFavorites = userFavorites.filter(p => p.id !== id);
                renderFavoritesList();
                if (currentPartner && currentPartner.id === id) {
                    isFavorite = false;
                    const heartIcon = document.getElementById('heart-icon');
                    if (heartIcon) {
                        heartIcon.setAttribute('fill', 'none');
                        heartIcon.classList.remove('drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]', 'scale-110');
                    }
                }
            };

            let chatOpenedFromModal = false;
            let profileOpenedFromFavorites = false;
            let profileOpenedFromPartnerDashboard = false;

            function openProfileFromFavorites(name, desc, id, reviews, rating, massage, place, age, image, ticketType, ticketExpiry) {
                profileOpenedFromFavorites = true;
                openProfile(name, desc, id, reviews, rating, massage, place, age, image, ticketType, ticketExpiry);

                setTimeout(() => {
                    document.getElementById('profile-sheet').style.zIndex = '240';
                    document.getElementById('overlay').style.zIndex = '230';
                    document.getElementById('cta-button').style.zIndex = '250';
                }, 10);
            }

            window.resumeChat = function (id) {
                const chat = userChats.find(c => c.id === id);
                if (chat) {
                    currentPartner = chat;
                    chatOpenedFromModal = true;
                    setTimeout(() => {
                        const chatName = document.getElementById('chat-profile-name');
                        chatName.innerText = chat.name;
                        chatName.dataset.resume = "true";
                        if (chat.image) {
                            document.getElementById('chat-header-img').style.backgroundImage = `url('${chat.image}')`;
                            document.getElementById('chat-default-avatar').style.backgroundImage = `url('${chat.image}')`;
                        }
                        document.getElementById('chat-sheet').style.zIndex = '250';
                        document.getElementById('overlay').style.zIndex = '240';
                        document.getElementById('chat-sheet').classList.add('open');
                        overlay.classList.add('show');
                    }, 50);
                }
            };

            function openProfile(name, desc, id, reviews, rating, massage, place, age, image, ticketType, ticketExpiry) {
                trackPartnerProfileView(id);

                if (id === 'my-partner') {
                    if (localStorage.getItem('myPartnerProfile')) {
                        currentPartner = JSON.parse(localStorage.getItem('myPartnerProfile'));
                    } else if (!currentPartner) {
                        currentPartner = { name, desc, id, reviews, rating, image, menus: [], tags: [] };
                    }
                } else {
                    currentPartner = { name, desc, id, reviews, rating, massage, place, age, image, ticketType, ticketExpiry };
                }

                document.getElementById('profile-name').innerText = currentPartner.name;
                document.getElementById('profile-desc').innerText = currentPartner.desc;
                if (currentPartner.image) {
                    document.getElementById('profile-img').style.backgroundImage = `url('${currentPartner.image}')`;
                } else {
                    document.getElementById('profile-img').style.backgroundImage = 'none';
                }

                const tagsContainer = document.getElementById('profile-tags');
                if (tagsContainer) {
                    if (currentPartner.tags && currentPartner.tags.length > 0) {
                        tagsContainer.innerHTML = currentPartner.tags.map(tag =>
                            `<span class="bg-transparent border border-[var(--point-color)] text-white  px-3 py-1.5 rounded-full text-sm font-medium">${tag}</span>`
                        ).join('');
                    } else if (currentPartner.massage && currentPartner.place && currentPartner.age) {
                        tagsContainer.innerHTML = `
                    <span class="bg-transparent border border-[var(--point-color)] text-white  px-3 py-1.5 rounded-full text-sm font-medium">${currentPartner.massage}</span>
                    <span class="bg-transparent border border-[var(--point-color)] text-white  px-3 py-1.5 rounded-full text-sm font-medium">${currentPartner.place}</span>
                    <span class="bg-transparent border border-[var(--point-color)] text-white  px-3 py-1.5 rounded-full text-sm font-medium">${currentPartner.age}</span>
                `;
                    } else {
                        tagsContainer.innerHTML = '';
                    }
                }

                // 가격표(메뉴) 동적 렌더링
                const priceTable = document.querySelector('.price-table');
                if (priceTable) {
                    let menus = currentPartner.menus;
                    if (!menus || menus.length === 0) {
                        menus = [
                            { name: 'A 코스', theme: '스웨디시 & 스포츠 케어', desc: '건식 및 소프트 아로마 60분', price: '100,000' },
                            { name: 'B 코스 (BEST)', theme: '시그니처 감성 테라피', desc: '프리미엄 슈 감성 케어 90분', price: '140,000' },
                            { name: 'C 코스 (VIP)', theme: '로얄 딥티슈 & VIP 케어', desc: '전신 딥티슈 + 집중 감성 케어 120분', price: '180,000' }
                        ];
                    }

                    priceTable.innerHTML = menus.map((menu, index) => {
                        const isLast = index === menus.length - 1;
                        const borderClass = isLast ? 'border-none pb-0' : '';
                        return `
                    <tr>
                        <td class="course-name text-[18.5px] ${borderClass}">
                            <span class="text-base font-bold text-[var(--point-color)] opacity-80 block mb-1.5">${menu.name}</span>
                            ${menu.theme}<br>
                            <span class="text-[15.5px] font-normal mt-1.5 block" style="color: var(--text-sub);">${menu.desc}</span>
                        </td>
                        <td class="course-price text-[22px] break-keep ${borderClass}" style="color: var(--point-color);">${menu.price}원</td>
                    </tr>
                `;
                    }).join('');
                }

                if (reviews !== undefined && rating !== undefined) {
                    window.partnerCustomReviews = window.partnerCustomReviews || {};
                    const customReviews = window.partnerCustomReviews[id] || [];

                    let customTotal = 0;
                    customReviews.forEach(r => customTotal += parseFloat(r.rating) || 0);

                    let finalRating = parseFloat(rating) || 4.9;
                    let totalCount = reviews + customReviews.length;
                    if (totalCount > 0) {
                        finalRating = ((parseFloat(rating) * reviews) + customTotal) / totalCount;
                    }

                    document.getElementById('profile-rating-display').innerText = finalRating.toFixed(1);
                    document.getElementById('profile-review-display').innerText = `방문자 찐리뷰 ${totalCount}개 확인하기`;

                    // 리뷰 시트에서 계산 시 사용하기 위해 원래의 데이터를 저장
                    window.currentProfileReviews = reviews;
                    window.currentProfileRating = rating;
                }

                // 관심업체 상태 복원
                isFavorite = userFavorites.some(p => p.id === id);
                const heartIcon = document.getElementById('heart-icon');
                if (heartIcon) {
                    if (isFavorite) {
                        heartIcon.setAttribute('fill', 'currentColor');
                        heartIcon.classList.add('drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]', 'scale-110');
                    } else {
                        heartIcon.setAttribute('fill', 'none');
                        heartIcon.classList.remove('drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]', 'scale-110');
                    }
                }

                // 프로필 헤더 스크롤 맨 위로 초기화
                profileSheet.scrollTop = 0;

                const listSheet = document.getElementById('list-sheet');
                const filterSheet = document.getElementById('filter-sheet');
                if ((listSheet && listSheet.classList.contains('open')) || (filterSheet && filterSheet.classList.contains('open'))) {
                    overlay.style.zIndex = '95';
                }

                profileSheet.classList.add('open');
                overlay.classList.add('show');

                // 버튼 슬라이드 업 애니메이션
                setTimeout(() => {
                    cta.style.transform = 'translateX(-50%) translateY(0)';
                    cta.classList.remove('pointer-events-none', 'opacity-0');
                }, 200);

                document.body.style.overflow = 'hidden';
            }

            // --- 파트너 실시간 동기화 배열 ---
            let DB_CHOICE = [];
            let DB_RECOMMEND = [];

            // 랜덤 풀에 사용될 전체 옵션 데이터 설정
            const ALL_MASSAGES = ['스웨디시', '스포츠 마사지', '타이 마사지', '커플마사지'];
            const ALL_PLACES = ['방문 (홈케어/출장)', '1인샵 (매장 방문)', '다인샵 (일반 매장)'];
            const ALL_AGES = ['20대 초반', '20대 중후반', '30대 초반', '30대 중후반', '40대 초반', '40대 중후반'];
            const ALL_REGIONS = [
                '서울 강남/서초', '서울 송파/강동', '서울 영등포/구로/금천', '서울 마포/서대문/은평', 
                '경기 분당(성남)', '경기 고양(일산)', '경기 수원', '인천 부평/계양', 
                '충청 천안', '충청 세종', '대전 둔산/서구', '강원 춘천', 
                '전라 전주', '광주 상무/서구', '경상 창원', '부산 해운대/수영', '제주 제주시'
            ];

            // 업체 통계 헬퍼 함수
            // 랜덤 상세 조건 선택 함수
            function getRandomCondition(tagData, fallback) {
                if (!tagData) return fallback;
                if (Array.isArray(tagData)) {
                    if (tagData.length === 0) return fallback;
                    return tagData[Math.floor(Math.random() * tagData.length)].trim();
                }
                if (typeof tagData === 'string') {
                    const parts = tagData.split(',').map(s => s.trim()).filter(s => s.length > 0);
                    if (parts.length > 0) {
                        return parts[Math.floor(Math.random() * parts.length)];
                    }
                }
                return tagData;
            }

            function getPartnerStats(partner) {
                window.partnerCustomReviews = window.partnerCustomReviews || {};
                let cArr = window.partnerCustomReviews[partner.id] || [];
                let cTot = 0;
                cArr.forEach(r => cTot += parseFloat(r.rating) || 0);
                let totCount = partner.reviews + cArr.length;
                let avgRating = parseFloat(partner.rating) || 4.9;
                if (totCount > 0) {
                    avgRating = ((parseFloat(partner.rating) * partner.reviews) + cTot) / totCount;
                }
                return { count: totCount, rating: avgRating.toFixed(1) };
            }

            function getPartnerTicketExpiryMs(rawData = {}) {
                const data = rawData || {};

                if (typeof data.ticketExpiryTimestamp === 'number' && Number.isFinite(data.ticketExpiryTimestamp)) {
                    return data.ticketExpiryTimestamp;
                }

                if (data.ticketExpiryTimestamp && typeof data.ticketExpiryTimestamp.toDate === 'function') {
                    return data.ticketExpiryTimestamp.toDate().getTime();
                }

                if (data.ticketExpiresAt && typeof data.ticketExpiresAt.toDate === 'function') {
                    return data.ticketExpiresAt.toDate().getTime();
                }

                if (typeof data.ticketExpiry === 'string' && data.ticketExpiry.trim()) {
                    const parsed = Date.parse(data.ticketExpiry);
                    if (!Number.isNaN(parsed)) return parsed;
                }

                return 0;
            }

            function isPartnerApproved(rawData = {}) {
                return (rawData?.status || '') === 'active';
            }

            // 앱 배너 노출은 "관리자 승인 + 입점권 부여 + 유효기간 내"를 모두 충족해야 함
            function canExposePartnerBanner(rawData = {}) {
                const data = rawData || {};
                const hasTicketType = !!data.ticketType && data.ticketType !== 'None';
                const expiryMs = getPartnerTicketExpiryMs(data);
                const now = Date.now();
                return isPartnerApproved(data) && hasTicketType && expiryMs > now;
            }

            // Firebase 실시간 연동 (onSnapshot)
            if (typeof db !== 'undefined') {
                db.collection("partners").onSnapshot((snapshot) => {
                    let fetchedChoice = [];
                    let fetchedRecommend = [];
                    let index = 0;
                    
                    snapshot.forEach((doc) => {
                        let data = doc.data();
                        
                        let rawPlaceData = data.place || ALL_PLACES;
                        let placeArray = Array.isArray(rawPlaceData) ? rawPlaceData : (typeof rawPlaceData === 'string' ? rawPlaceData.split(',').map(s=>s.trim()) : [rawPlaceData]);
                        let cleanPlaceArray = placeArray.map(p => typeof p === 'string' ? p.replace('프라이빗 방문', '방문').replace('프라이빗 1인샵', '1인샵').replace('스탠다드 다인샵', '다인샵') : p);
                        let cleanPlace = getRandomCondition(cleanPlaceArray, ALL_PLACES);

                        if (!canExposePartnerBanner(data)) {
                            return;
                        }

                        let appPartner = {
                            id: doc.id,
                            name: data.name || '무명 업체',
                            regionList: data.region || ALL_REGIONS,
                            massageList: data.massage || ALL_MASSAGES,
                            placeList: cleanPlaceArray,
                            ageList: data.age || ALL_AGES,
                            region: getRandomCondition(data.region, ALL_REGIONS),
                            massage: getRandomCondition(data.massage, ALL_MASSAGES),
                            place: cleanPlace,
                            age: getRandomCondition(data.age, ALL_AGES),
                            rating: data.rating?.toString() || (Math.random() * 0.5 + 4.5).toFixed(1),
                            ticketType: data.ticketType || '일반 입점',
                            ticketExpiry: data.ticketExpiry || '',
                            reviews: data.reviews || Math.floor(Math.random() * 80) + 12,
                            image: data.image || `https://picsum.photos/seed/dadok_${index}/400/400`,
                            menus: data.pricing || [],
                            desc: data.description || '여성을 위한 프라이빗 라운지',
                            tier: data.tier || 'Premium',
                            ticketExpiryTimestamp: getPartnerTicketExpiryMs(data)
                        };

                        // 파티셔닝
                        if (appPartner.tier === 'VIP') {
                            fetchedChoice.push(appPartner);
                        } else {
                            fetchedRecommend.push(appPartner);
                        }
                        index++;
                    });
                    // 파이어베이스 데이터가 부족할 경우 실제 DB에 데이터를 바로 추가 (1회성 동작) - 삭제됨

                    // DB 배열 업데이트
                    DB_CHOICE = [...fetchedChoice];
                    DB_RECOMMEND = [...fetchedRecommend];
                    
                    // 로컬스토리지에 저장된 유저 생성 매장 덧붙이기
                    const applyLocalData = () => {
                        const savedProfile = localStorage.getItem('myPartnerProfile');
                        if (savedProfile) {
                            let savedPartner = JSON.parse(savedProfile);
                            currentPartner = savedPartner;
                            if (!canExposePartnerBanner(savedPartner)) {
                                return;
                            }
                            let rawLocalPlaceData = savedPartner.place || ALL_PLACES;
                            let placeLocalArray = Array.isArray(rawLocalPlaceData) ? rawLocalPlaceData : (typeof rawLocalPlaceData === 'string' ? rawLocalPlaceData.split(',').map(s=>s.trim()) : [rawLocalPlaceData]);
                            let cleanLocalPlaceArray = placeLocalArray.map(p => typeof p === 'string' ? p.replace('프라이빗 방문', '방문').replace('프라이빗 1인샵', '1인샵').replace('스탠다드 다인샵', '다인샵') : p);
                            let cleanLocalPlace = getRandomCondition(cleanLocalPlaceArray, ALL_PLACES);

                            let myPartnerMock = {
                                id: savedPartner.id || `local_${Date.now()}`,
                                name: savedPartner.name,
                                regionList: savedPartner.region || ALL_REGIONS,
                                massageList: savedPartner.massage || ALL_MASSAGES,
                                placeList: cleanLocalPlaceArray,
                                ageList: savedPartner.age || ALL_AGES,
                                region: getRandomCondition(savedPartner.region, ALL_REGIONS),
                                massage: getRandomCondition(savedPartner.massage, ALL_MASSAGES),
                                place: cleanLocalPlace,
                                age: getRandomCondition(savedPartner.age, ALL_AGES),
                                rating: savedPartner.rating || '5.0',
                                ticketType: savedPartner.ticketType || '일반 입점',
                                ticketExpiry: savedPartner.ticketExpiry || '',
                                reviews: savedPartner.reviews || 0,
                                tier: 'Premium',
                                ticketExpiryTimestamp: getPartnerTicketExpiryMs(savedPartner),
                                image: savedPartner.image || 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
                                menus: savedPartner.pricing || [],
                                desc: savedPartner.description || '새로 둥록된 파트너'
                            };
                            DB_CHOICE.unshift(myPartnerMock);
                        }
                    };
                    
                    applyLocalData();
                    
                    filteredChoiceDB = [...DB_CHOICE];
                    filteredRecDB = [...DB_RECOMMEND];
                    
                    // 화면 업데이트 (검색 조건 적용)
                    applyFiltersToData();
                });
            } else {
                console.error("Firebase is not loaded.");
            }

            // -- 데이터 필터링 적용 매칭 로직 --
            function matchFilter(partner) {
                if (activeFilters.region.length > 0) {
                    let passed = false;
                    let pList = Array.isArray(partner.regionList) ? partner.regionList : (typeof partner.regionList === 'string' ? partner.regionList.split(',').map(s=>s.trim()) : [partner.regionList]);
                    for (let r of activeFilters.region) {
                        if (r.endsWith(' 전체')) {
                            let prov = r.split(' ')[0]; // '서울'
                            if (pList.some(v => v && typeof v === 'string' && v.startsWith(prov))) passed = true;
                        } else {
                            if (pList.some(v => v && typeof v === 'string' && v === r)) passed = true;
                        }
                    }
                    if (!passed) return false;
                }
                if (activeFilters.massage.length > 0) {
                    let passed = false;
                    let pList = Array.isArray(partner.massageList) ? partner.massageList : (typeof partner.massageList === 'string' ? partner.massageList.split(',').map(s=>s.trim()) : [partner.massageList]);
                    for (let m of activeFilters.massage) {
                        if (m === '상관없음(전체)' || pList.some(v => v && typeof v === 'string' && v === m)) passed = true;
                    }
                    if (!passed) return false;
                }
                if (activeFilters.place.length > 0) {
                    let passed = false;
                    let pList = Array.isArray(partner.placeList) ? partner.placeList : (typeof partner.placeList === 'string' ? partner.placeList.split(',').map(s=>s.trim()) : [partner.placeList]);
                    for (let p of activeFilters.place) {
                        if (p === '상관없음(전체)') passed = true;
                        if (p.includes('방문') && pList.some(v => v && typeof v === 'string' && (v.includes('홈케어') || v.includes('방문')))) passed = true;
                        if (p.includes('1인샵') && pList.some(v => v && typeof v === 'string' && v.includes('1인샵'))) passed = true;
                        if (p.includes('다인샵') && pList.some(v => v && typeof v === 'string' && v.includes('다인샵'))) passed = true;
                    }
                    if (!passed) return false;
                }
                if (activeFilters.age.length > 0) {
                    let passed = false;
                    let pList = Array.isArray(partner.ageList) ? partner.ageList : (typeof partner.ageList === 'string' ? partner.ageList.split(',').map(s=>s.trim()) : [partner.ageList]);
                    for (let a of activeFilters.age) {
                        if (a === '연령 무관 (전체)') passed = true;
                        let f = a.substring(0, 6); // ex: "20대 초반"
                        if (pList.some(v => v && typeof v === 'string' && v.includes(f))) passed = true;
                    }
                    if (!passed) return false;
                }
                return true;
            }

            function applyFiltersToData() {
                filteredChoiceDB = DB_CHOICE.filter(matchFilter);
                filteredRecDB = DB_RECOMMEND.filter(matchFilter);

                const summaryDiv = document.getElementById('active-filters-summary');
                if (summaryDiv) {
                    let pillsHtml = '';
                    Object.keys(activeFilters).forEach(key => {
                        activeFilters[key].forEach(val => {
                            let disp = val;
                            if (disp === '상관없음(전체)') disp = '상관없음';
                            else if (disp === '연령 무관 (전체)') disp = '연령 무관';
                            pillsHtml += `<span class="px-3 py-1.5 text-[13px] bg-transparent border border-[var(--point-color)] text-white  font-medium rounded-full cursor-pointer flex items-center gap-1 hover:bg-[var(--point-color)] hover:text-[#06110D] transition-colors" onclick="removeFilterItem('${key}', '${val}')">${disp} <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></span>`;
                        });
                    });
                    summaryDiv.innerHTML = pillsHtml;
                }

                initializeDynamicContent(); // 데이터 변경 후 메인화면 리렌더링

                // 리스트뷰가 열려있다면 갱신
                const listSheet = document.getElementById('list-sheet');
                if (listSheet && listSheet.classList.contains('open')) {
                    const listTitleText = document.getElementById('list-title').innerText;
                    if (listTitleText.includes('초이스')) openListView('choice');
                    else openListView('recommend');
                }
            }

            function openListView(type) {
                const listSheet = document.getElementById('list-sheet');
                const listContent = document.getElementById('list-content');
                const listTitle = document.getElementById('list-title');

                listContent.innerHTML = '';
                listSheet.scrollTop = 0;

                let db = type === 'choice' ? [...filteredChoiceDB] : [...filteredRecDB];
                listTitle.innerText = type === 'choice' ? '다독 초이스 전체보기' : '추천 파트너 전체보기';

                if (db.length === 0) {
                    listContent.innerHTML = `<div class="p-5 text-sm text-center w-full" style="color:var(--text-sub);">조건에 맞는 업체가 없습니다.</div>`;
                } else {
                    // 매번 리스트뷰 열 때마다 랜덤 섞기
                    db.sort(() => Math.random() - 0.5);

                    let html = '';
                    for (let partner of db) {
                        let stats = getPartnerStats(partner);
                        let badgeHtml = '';
                        if (partner.tier === 'VIP') {
                            badgeHtml = `<div class="absolute top-2 left-2 z-10 bg-gradient-to-r from-[#D4AF37] to-[#B38D1B] text-[#06110D] text-[10px] font-extrabold px-2 py-0.5 rounded opacity-95 tracking-wide shadow-md">VIP</div>`;
                        } else if (partner.tier === 'Premium') {
                            badgeHtml = `<div class="absolute top-2 left-2 z-10 bg-[var(--surface-color)] text-[var(--point-color)] text-[10px] font-extrabold px-2 py-0.5 rounded border border-[var(--point-color)] opacity-95 tracking-wide shadow-md">Premium</div>`;
                        }

                        let rndRegion = getRandomCondition(partner.regionList, partner.region);
                        let rndMassage = getRandomCondition(partner.massageList, partner.massage);
                        let rndPlace = getRandomCondition(partner.placeList, partner.place);
                        let rndAge = getRandomCondition(partner.ageList, partner.age);
                        html += `
                <div class="card p-4 flex gap-4 mb-4 items-center relative" onclick="openProfile('${partner.name}', '${rndRegion} · ${rndPlace}', '${partner.id}', ${partner.reviews || 0}, ${partner.rating || 0}, '${rndMassage}', '${rndPlace}', '${rndAge}', '${partner.image}', '${partner.ticketType || '일반 입점'}', '${partner.ticketExpiry || ''}')">
                    <div class="w-[108px] h-[108px] rounded-2xl bg-cover bg-center flex-shrink-0 relative border border-[var(--point-color)]" style="background-image: url('${partner.image}'); filter: grayscale(15%) sepia(20%);">
                        ${badgeHtml}
                    </div>
                    <div class="flex-1 py-1">
                        <h3 class="font-bold text-[16px] mb-0.5 tracking-tight" style="color: var(--text-main);">${partner.name}</h3>
                        <p class="text-[13px] mt-0.5" style="color: var(--text-sub);">${rndRegion}</p>
                        <div class="grid grid-cols-2 gap-1.5 mt-2.5">
                            <span class="text-[11px] px-2 py-1 border border-[var(--point-color)] bg-[var(--point-color)]/10 rounded-full font-medium text-white  flex items-center justify-center truncate tracking-tight shadow-sm">${rndRegion.split(' ')[0]}</span>
                            <span class="text-[11px] px-2 py-1 border border-[var(--point-color)] bg-transparent rounded-full font-medium text-white  flex items-center justify-center truncate tracking-tight shadow-sm">${rndMassage}</span>
                            <span class="text-[11px] px-2 py-1 border border-[var(--point-color)] bg-transparent rounded-full font-medium text-white  flex items-center justify-center truncate tracking-tight shadow-sm">${rndPlace}</span>
                            <span class="text-[11px] px-2 py-1 border border-[var(--point-color)] bg-transparent rounded-full font-medium text-white  flex items-center justify-center truncate tracking-tight shadow-sm">${rndAge}</span>
                        </div>

                    </div>
                </div>`;
                    }
                    listContent.innerHTML = html;
                }

                listSheet.classList.add('open');
                overlay.classList.add('show');
                document.body.style.overflow = 'hidden';
            }

            function openReviewSheet() {
                const reviewSheet = document.getElementById('review-sheet');
                const reviewContent = document.getElementById('review-content');

                window.partnerCustomReviews = window.partnerCustomReviews || {};
                const customReviews = window.partnerCustomReviews[currentPartner.id] || [];

                // 목업 리뷰 데이터 생성 (프리미엄 컨셉에 맞는 긍정적이고 구체적인 내용)
                const reviews = [
                    { name: "김*영", date: "2026.04.01", rating: 5, text: "요즘 업무 스트레스로 너무 힘들었는데 분위기부터 힐링 그 자체예요! 관리사님이 정말 섬세하게 케어해주셔서 받고 나서 몸이 한결 가벼워졌습니다." },
                    { name: "이지*", date: "2026.03.28", rating: 5, text: "처음 방문해봤는데 프라이빗하게 혼자 조용히 쉴 수 있어서 좋았습니다. 어메니티도 고급스럽고, 특히 은은한 아로마 향이 마음에 들었어요. 다음엔 120분 코스로 예약할게요." },
                    { name: "박*정", date: "2026.03.25", rating: 4.5, text: "전반적으로 매우 만족스러웠습니다. 압도 적당히 조절해주셨고 온도나 조명 세팅까지 꼼꼼히 신경써주시는 점이 인상깊었네요." },
                    { name: "최수*", date: "2026.03.20", rating: 5, text: "친구 추천으로 예약했는데 역대급이네요. 샤워실도 깨끗하고 무엇보다 마사지 스킬이 남다릅니다. 피로가 싹 풀렸어요! 완전 강추합니다." },
                    { name: "정*희", date: "2026.03.15", rating: 5, text: "매장 인테리어가 고급 부티크 호텔 같아요. 대접받는 느낌이 들어서 힐링하기 딱 좋았습니다. 주차도 편하고 접근성도 좋네요." },
                    { name: "강*윤", date: "2026.03.10", rating: 5, text: "최근에 받은 마사지 중에 최고였어요. 스웨디시 처음 받아봤는데 부드럽고 시원하게 뭉친 근육을 잘 풀어주시네요. 회원권 결제할까 고민중입니다." }
                ];

                let mockCount = window.currentProfileReviews || reviews.length;
                let originalRating = window.currentProfileRating || 4.9;

                let customTotal = 0;
                customReviews.forEach(r => customTotal += parseFloat(r.rating) || 0);

                let totalCount = mockCount + customReviews.length;
                let averageRating = parseFloat(originalRating) || 4.9;
                if (totalCount > 0) {
                    averageRating = ((parseFloat(originalRating) * mockCount) + customTotal) / totalCount;
                }
                let displayRating = averageRating.toFixed(1);

                let html = `<div class="flex items-center gap-3 mb-6"><div class="flex items-center gap-1 text-[var(--point-color)]"><svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg><span class="font-bold text-3xl" id="review-sheet-rating-display">${displayRating}</span></div><span class="text-[var(--text-sub)]">방문자 찐리뷰 <span class="font-bold" id="review-sheet-count-display">${totalCount}</span>개</span></div>`;

                // ------------------ 리뷰 작성 영역 추가 ------------------
                window.currentNewReviewRating = 5;
                const starPath = "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z";
                let starsHtml = '';
                for (let s = 1; s <= 5; s++) {
                    starsHtml += `<svg class="w-8 h-8 cursor-pointer star-icon text-[var(--point-color)] transition-opacity" data-value="${s}" fill="currentColor" viewBox="0 0 20 20" onclick="setReviewRating(${s})"><path d="${starPath}"></path></svg>`;
                }
                html += `
        <div class="bg-[var(--surface-color)] p-5 rounded-2xl border border-[var(--border-color)] mb-6 shadow-[0_4px_16px_rgba(0,0,0,0.15)]">
            <h4 class="font-bold text-[var(--text-main)] mb-3 text-[17px]">리뷰 작성하기</h4>
            <div class="flex items-center gap-1 mb-4" id="review-star-container">
                ${starsHtml}
            </div>
            <textarea id="review-text-input" class="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-4 text-[var(--text-main)] placeholder-[var(--text-sub)] focus:outline-none focus:border-[var(--point-color)] resize-none transition-colors" rows="3" placeholder="친절하고 상세한 방문 후기를 남겨주세요." style="font-size: 15px;"></textarea>
            <div class="flex justify-end mt-4">
                <button onclick="submitReview()" class="bg-[var(--point-color)] text-[#06110D] px-6 py-2.5 rounded-full font-bold text-[15px] hover:opacity-90 transition-opacity shadow-md">리뷰 등록</button>
            </div>
        </div>
        `;
                // --------------------------------------------------------

                html += `<div id="review-list-container">`; // 동적 추가를 위한 컨테이너 추가

                let uid = localStorage.getItem('dadok_username') || sessionStorage.getItem('dadok_username') || 'user';
                let maskedId = uid.length <= 2 ? uid[0] + '*' : uid.substring(0, 2) + '*'.repeat(uid.length > 5 ? 4 : uid.length - 2);

                customReviews.forEach((cr, index) => {
                    if (!cr.id) cr.id = 'custom_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
                    let author = cr.author || maskedId;
                    let date = cr.date || '방금 전';
                    let stars = '';
                    for (let k = 0; k < cr.rating; k++) {
                        stars += `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="${starPath}"></path></svg>`;
                    }
                    let replyHtml = '';
                    if (cr.reply) {
                        replyHtml = `
                <div class="review-reply-area mt-4 pt-4 border-t border-[var(--border-color)]" onclick="event.stopPropagation()">
                    <div class="flex items-start gap-3">
                        <div class="w-8 h-8 rounded-full bg-gradient-to-tl from-[var(--point-color)] to-[#F4D03F] flex-shrink-0 flex items-center justify-center text-[#06110D] font-bold text-xs tracking-tighter" style="padding-top:1px;">운영</div>
                        <div class="flex-1 bg-gradient-to-br from-[var(--surface-color)] to-[var(--bg-color)] rounded-xl p-4 border border-[var(--point-color)]/40 shadow-sm relative">
                            <div class="font-bold text-[var(--point-color)] text-[13.5px] mb-1.5">매장 답변</div>
                            <p class="text-[var(--text-main)] text-[14px] leading-relaxed">${cr.reply.replace(/\\n/g, '<br>')}</p>
                        </div>
                    </div>
                </div>`;
                    }
                    html += `
            <div data-review-id="${cr.id}" class="bg-[var(--surface-color)] p-5 rounded-2xl mb-4 border border-[var(--border-color)] cursor-pointer transition-colors hover:border-[var(--point-color)]" onclick="toggleReplyInput(this)">
                <div class="flex justify-between items-center mb-3">
                    <div class="flex items-center gap-2">
                        <span class="font-bold text-[var(--text-main)]">${author}</span>
                        <span class="text-sm text-[var(--text-sub)]">${date}</span>
                    </div>
                    <div class="flex text-[var(--point-color)] gap-0.5">
                        ${stars}
                    </div>
                </div>
                <p class="text-[var(--text-sub)] leading-relaxed font-normal">${cr.text}</p>
                ${replyHtml}
            </div>
            `;
                });

                // 동적 개수만큼 리뷰 생성 (목업 배열 반복 활용)
                // 동적 생성 목업 리뷰도 식별 가능하게 저장하여 답글이 유지되도록 캐싱
                window.partnerMockReviews = window.partnerMockReviews || {};
                let generatedReviews = window.partnerMockReviews[currentPartner.id];
                if (!generatedReviews || generatedReviews.length !== mockCount) {
                    generatedReviews = [];
                    for (let i = 0; i < mockCount; i++) {
                        let baseReview = reviews[i % reviews.length];
                        let randomDay = 30 - (i % 30);
                        let month = randomDay > 25 ? '04' : '03';
                        let day = randomDay.toString().padStart(2, '0');
                        generatedReviews.push({
                            id: 'mock_' + i,
                            ...baseReview,
                            date: `2026.${month}.${day}`
                        });
                    }
                    window.partnerMockReviews[currentPartner.id] = generatedReviews;
                }

                generatedReviews.forEach(review => {
                    let stars = '';
                    for (let k = 0; k < Math.floor(review.rating); k++) {
                        stars += `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="${starPath}"></path></svg>`;
                    }
                    if (review.rating % 1 !== 0) {
                        stars += `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="${starPath}" opacity="0.5"></path></svg>`;
                    }
                    let replyHtml = '';
                    if (review.reply) {
                        replyHtml = `
                <div class="review-reply-area mt-4 pt-4 border-t border-[var(--border-color)]" onclick="event.stopPropagation()">
                    <div class="flex items-start gap-3">
                        <div class="w-8 h-8 rounded-full bg-gradient-to-tl from-[var(--point-color)] to-[#F4D03F] flex-shrink-0 flex items-center justify-center text-[#06110D] font-bold text-xs tracking-tighter" style="padding-top:1px;">운영</div>
                        <div class="flex-1 bg-gradient-to-br from-[var(--surface-color)] to-[var(--bg-color)] rounded-xl p-4 border border-[var(--point-color)]/40 shadow-sm relative">
                            <div class="font-bold text-[var(--point-color)] text-[13.5px] mb-1.5">매장 답변</div>
                            <p class="text-[var(--text-main)] text-[14px] leading-relaxed">${review.reply.replace(/\\n/g, '<br>')}</p>
                        </div>
                    </div>
                </div>`;
                    }
                    html += `
            <div data-review-id="${review.id}" class="bg-[var(--surface-color)] p-5 rounded-2xl mb-4 border border-[var(--border-color)] cursor-pointer transition-colors hover:border-[var(--point-color)]" onclick="toggleReplyInput(this)">
                <div class="flex justify-between items-center mb-3">
                    <div class="flex items-center gap-2">
                        <span class="font-bold text-[var(--text-main)]">${review.name}</span>
                        <span class="text-sm text-[var(--text-sub)]">${review.date}</span>
                    </div>
                    <div class="flex text-[var(--point-color)] gap-0.5">
                        ${stars}
                    </div>
                </div>
                <p class="text-[var(--text-sub)] leading-relaxed font-normal">${review.text}</p>
                ${replyHtml}
            </div>
            `;
                });

                html += `</div>`; // 컨테이너 닫기

                reviewContent.innerHTML = html;
                reviewSheet.classList.add('open');
            }

            // 전역 함수 등록으로 별점 및 리뷰 등록 제어
            window.setReviewRating = function (rating) {
                window.currentNewReviewRating = rating;
                const container = document.getElementById('review-star-container');
                if (container) {
                    const stars = container.querySelectorAll('svg.star-icon');
                    stars.forEach(star => {
                        const val = parseInt(star.getAttribute('data-value'));
                        if (val <= rating) {
                            star.classList.remove('opacity-20');
                        } else {
                            star.classList.add('opacity-20');
                        }
                    });
                }
            };

            window.toggleReplyInput = function (reviewDiv) {
                let existingReply = reviewDiv.querySelector('.review-reply-area');
                if (existingReply) {
                    existingReply.classList.toggle('hidden');
                    return;
                }

                const replyArea = document.createElement('div');
                replyArea.className = 'review-reply-area mt-4 pt-4 border-t border-[var(--border-color)]';
                replyArea.onclick = function (e) { e.stopPropagation(); };
                replyArea.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-full bg-gradient-to-tl from-[var(--point-color)] to-[#F4D03F] flex-shrink-0 flex items-center justify-center text-[#06110D] font-bold text-xs tracking-tighter" style="padding-top:1px;">운영</div>
                <div class="flex-1 bg-[var(--bg-color)] rounded-xl border border-[var(--border-color)] overflow-hidden focus-within:border-[var(--point-color)] transition-colors">
                    <textarea class="w-full bg-transparent p-3 text-[var(--text-main)] focus:outline-none resize-none text-[14px]" rows="2" placeholder="리뷰에 답글을 달아보세요."></textarea>
                    <div class="flex justify-end p-2 bg-[var(--surface-color)] border-t border-[var(--border-color)]">
                        <button class="bg-gradient-to-r from-[#D4AF37] to-[#B38D1B] text-[#06110D] px-4 py-1.5 rounded-full font-bold text-[13px] shadow-sm hover:opacity-90" onclick="submitReply(this, event)">답글 등록</button>
                    </div>
                </div>
            </div>
        `;
                reviewDiv.appendChild(replyArea);

                // 포커스 이동
                setTimeout(() => { replyArea.querySelector('textarea').focus(); }, 50);
            };

            window.submitReply = function (btn, event) {
                event.stopPropagation();
                const replyArea = btn.closest('.review-reply-area');
                const textarea = replyArea.querySelector('textarea');
                const reviewDiv = btn.closest('[data-review-id]');
                const text = textarea.value.trim();
                if (!text) {
                    alert("답글 내용을 입력해주세요.");
                    textarea.focus();
                    return;
                }

                if (reviewDiv) {
                    const rId = reviewDiv.getAttribute('data-review-id');
                    let targetReview = null;
                    if (window.partnerCustomReviews && window.partnerCustomReviews[currentPartner.id]) {
                        targetReview = window.partnerCustomReviews[currentPartner.id].find(r => r.id === rId);
                    }
                    if (!targetReview && window.partnerMockReviews && window.partnerMockReviews[currentPartner.id]) {
                        targetReview = window.partnerMockReviews[currentPartner.id].find(r => r.id === rId);
                    }
                    if (targetReview) {
                        targetReview.reply = text;
                    }
                }

                replyArea.onclick = function (e) { e.stopPropagation(); };
                replyArea.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-full bg-gradient-to-tl from-[var(--point-color)] to-[#F4D03F] flex-shrink-0 flex items-center justify-center text-[#06110D] font-bold text-xs tracking-tighter" style="padding-top:1px;">운영</div>
                <div class="flex-1 bg-gradient-to-br from-[var(--surface-color)] to-[var(--bg-color)] rounded-xl p-4 border border-[var(--point-color)]/40 shadow-sm relative">
                    <div class="font-bold text-[var(--point-color)] text-[13.5px] mb-1.5">매장 답변</div>
                    <p class="text-[var(--text-main)] text-[14px] leading-relaxed">${text.replace(/\\n/g, '<br>')}</p>
                </div>
            </div>
        `;
            };

            window.submitReview = function () {
                const input = document.getElementById('review-text-input');
                if (!input || !input.value.trim()) {
                    alert("리뷰 내용을 입력해주세요.");
                    input && input.focus();
                    return;
                }

                const text = input.value.trim();
                const rating = window.currentNewReviewRating;

                const today = new Date();
                const dateStr = today.getFullYear() + '.' + String(today.getMonth() + 1).padStart(2, '0') + '.' + String(today.getDate()).padStart(2, '0');

                let uid = localStorage.getItem('dadok_username') || sessionStorage.getItem('dadok_username') || 'user';
                let maskedId = uid.length <= 2 ? uid[0] + '*' : uid.substring(0, 2) + '*'.repeat(uid.length > 5 ? 4 : uid.length - 2);

                window.partnerCustomReviews = window.partnerCustomReviews || {};
                if (!window.partnerCustomReviews[currentPartner.id]) {
                    window.partnerCustomReviews[currentPartner.id] = [];
                }
                let newRevId = 'custom_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
                window.partnerCustomReviews[currentPartner.id].unshift({
                    id: newRevId,
                    rating: rating,
                    text: text,
                    date: dateStr,
                    author: maskedId
                });

                persistPartnerReview(currentPartner?.id, rating, text, maskedId);

                const starPath = "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z";
                let starsHtml = '';
                for (let k = 0; k < rating; k++) {
                    starsHtml += `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="${starPath}"></path></svg>`;
                }

                const wrapper = document.createElement('div');
                wrapper.className = 'bg-[var(--surface-color)] p-5 rounded-2xl mb-4 border border-[var(--border-color)] cursor-pointer transition-colors hover:border-[var(--point-color)]';
                wrapper.setAttribute('onclick', 'toggleReplyInput(this)');
                wrapper.setAttribute('data-review-id', newRevId);
                wrapper.innerHTML = `
            <div class="flex justify-between items-center mb-3">
                <div class="flex items-center gap-2">
                    <span class="font-bold text-[var(--text-main)]">${maskedId}</span>
                    <span class="text-sm text-[var(--text-sub)]">${dateStr}</span>
                </div>
                <div class="flex text-[var(--point-color)] gap-0.5">
                    ${starsHtml}
                </div>
            </div>
            <p class="text-[var(--text-sub)] leading-relaxed font-normal">${text}</p>
        `;

                const listDiv = document.getElementById('review-list-container');
                if (listDiv) {
                    listDiv.prepend(wrapper);
                    // 리뷰 수 및 평균 별점 재계산
                    let mockCount = window.currentProfileReviews || 15;
                    let originalRating = window.currentProfileRating || 4.9;
                    let customArr = window.partnerCustomReviews[currentPartner.id] || [];
                    let cTotal = 0;
                    customArr.forEach(r => cTotal += parseFloat(r.rating) || 0);

                    let totCount = mockCount + customArr.length;
                    let avgRating = parseFloat(originalRating);
                    if (totCount > 0) {
                        avgRating = ((parseFloat(originalRating) * mockCount) + cTotal) / totCount;
                    }
                    let strRating = avgRating.toFixed(1);

                    // 리뷰 시트 화면 내 업데이트
                    let countSpan = document.getElementById('review-sheet-count-display');
                    if (countSpan) countSpan.innerText = totCount;

                    let ratingSpan = document.getElementById('review-sheet-rating-display');
                    if (ratingSpan) ratingSpan.innerText = strRating;

                    // 프로필 상세 페이지 화면 데이터 (숫자 및 별점) 동시 업데이트
                    const profileReviewDisplay = document.getElementById('profile-review-display');
                    if (profileReviewDisplay) {
                        profileReviewDisplay.innerText = `방문자 찐리뷰 ${totCount}개 확인하기`;
                    }
                    const profileRatingDisplay = document.getElementById('profile-rating-display');
                    if (profileRatingDisplay) {
                        profileRatingDisplay.innerText = strRating;
                    }

                    // 외부 리스트(최신 렌더링된 메인/리스트 파트너 카드) 동시 업데이트
                    const ratingBadges = document.querySelectorAll(`.partner-rating-badge[data-partner-id="${currentPartner.id}"]`);
                    ratingBadges.forEach(badge => {
                        badge.innerText = strRating;
                    });
                    const reviewsBadges = document.querySelectorAll(`.partner-reviews-badge[data-partner-id="${currentPartner.id}"]`);
                    reviewsBadges.forEach(badge => {
                        badge.innerText = totCount;
                    });
                }

                input.value = '';
                window.setReviewRating(5);
                document.getElementById('review-content').scrollTo({ top: 0, behavior: 'smooth' });
            };

            function closeProfileSheet() {
                const profileSheet = document.getElementById('profile-sheet');
                if (profileSheet) profileSheet.classList.remove('open');

                const ctaBtn = document.getElementById('cta-button');
                if (ctaBtn) {
                    ctaBtn.style.transform = 'translateX(-50%) translateY(100%)';
                    setTimeout(() => { ctaBtn.classList.add('pointer-events-none', 'opacity-0'); }, 300);
                }

                const listSheet = document.getElementById('list-sheet');
                const filterSheet = document.getElementById('filter-sheet');

                if (typeof profileOpenedFromFavorites !== 'undefined' && profileOpenedFromFavorites) {
                    profileOpenedFromFavorites = false;
                    document.getElementById('overlay').classList.remove('show');
                    setTimeout(() => {
                        profileSheet.style.zIndex = '';
                        document.getElementById('overlay').style.zIndex = '';
                        ctaBtn.classList.add('pointer-events-none', 'opacity-0');
                        ctaBtn.style.zIndex = '110';
                    }, 300);
                    return;
                }

                if (
                    typeof profileOpenedFromPartnerDashboard !== 'undefined' &&
                    profileOpenedFromPartnerDashboard
                ) {
                    profileOpenedFromPartnerDashboard = false;
                    const overlay = document.getElementById('overlay');
                    const ctaBtn = document.getElementById('cta-button');
                    // 파트너 대시보드 위 상세 닫기 시 배경 흐림 페이드 없이 즉시 제거
                    if (overlay) {
                        overlay.style.transition = 'none';
                        overlay.classList.remove('show');
                        // Reflow 후 transition 복원
                        void overlay.offsetWidth;
                        overlay.style.transition = '';
                        overlay.style.zIndex = '';
                    }
                    // 닫기 애니메이션이 끝난 뒤 레이어를 원복해야, 시트가 뒤로 깔리지 않고 앞에서 자연스럽게 사라진다.
                    setTimeout(() => {
                        if (profileSheet) profileSheet.style.zIndex = '';
                        if (ctaBtn) ctaBtn.style.zIndex = '110';
                    }, 320);
                    return;
                }

                // If another sheet is open behind it, do not close the overlay
                if ((listSheet && listSheet.classList.contains('open')) || (filterSheet && filterSheet.classList.contains('open'))) {
                    // Keep overlay open but revert zIndex
                    const overlay = document.getElementById('overlay');
                    if (overlay) overlay.style.zIndex = '';
                } else {
                    const overlay = document.getElementById('overlay');
                    if (overlay) {
                        overlay.style.zIndex = '';
                        overlay.classList.remove('show');
                    }
                    document.body.style.overflow = 'auto';
                }
            }

            function handleOverlayClick() {
                const chatSheet = document.getElementById('chat-sheet');
                const reviewSheet = document.getElementById('review-sheet');
                const profileSheet = document.getElementById('profile-sheet');

                if (chatSheet && chatSheet.classList.contains('open')) {
                    closeChatSheet();
                } else if (reviewSheet && reviewSheet.classList.contains('open')) {
                    closeReviewSheet();
                } else if (profileSheet && profileSheet.classList.contains('open')) {
                    closeProfileSheet();
                } else {
                    closeAllModals();
                }
            }

            function closeAllModals() {
                const chatSheet = document.getElementById('chat-sheet');
                if (typeof chatOpenedFromModal !== 'undefined' && chatOpenedFromModal) {
                    closeChatSheet();
                    return;
                }

                filterSheet.classList.remove('open');
                profileSheet.classList.remove('open');

                const listSheet = document.getElementById('list-sheet');
                if (listSheet) listSheet.classList.remove('open');

                const reviewSheet = document.getElementById('review-sheet');
                if (reviewSheet) reviewSheet.classList.remove('open');

                if (chatSheet) chatSheet.classList.remove('open');

                overlay.classList.remove('show');

                // 버튼 슬라이드 다운 애니메이션
                cta.style.transform = 'translateX(-50%) translateY(100%)';
                setTimeout(() => { cta.classList.add('pointer-events-none', 'opacity-0'); }, 300);

                document.body.style.overflow = 'auto';
            }

            function isAnyFilterActive() {
                return activeFilters.region.length > 0 || activeFilters.massage.length > 0 || activeFilters.place.length > 0 || activeFilters.age.length > 0;
            }

            function resetAllFiltersFast() {
                activeFilters = { region: [], massage: [], place: [], age: [] };
                document.getElementById('val-region').innerText = '지역 선택';
                document.getElementById('val-massage').innerText = '마사지 종류';
                document.getElementById('val-place').innerText = '공간 형태';
                document.getElementById('val-age').innerText = '관리사 연령';

                ['region', 'massage', 'place', 'age'].forEach(k => {
                    const span = document.getElementById(`val-${k}`);
                    if (span && span.parentElement) span.parentElement.classList.remove('active');
                });
                applyFiltersToData();
            }

            function executeMainSearch() {
                // 메인 화면에서 4개 카테고리 메뉴 닫기 처리
                const container = document.getElementById('filter-options-container');
                if (container) container.classList.add('hidden');
            }

            function executeFilterSearch() {
                // 모달창 내 검색하기 클릭 시 필터 임시 상태를 확정하고 창 닫기
                if (tempFilters && currentFilterKey) {
                    activeFilters[currentFilterKey] = [...tempFilters[currentFilterKey]];
                    updateChipText(currentFilterKey);
                    applyFiltersToData();
                }
                closeFilterSheet();
            }

            function closeFilterSheet() {
                document.getElementById('filter-sheet').classList.remove('open');
                // 모달창 닫을 때 4개 카테고리 메뉴창도 같이숨김
                executeMainSearch();

                // 오버레이 및 스크롤 정리
                if (!document.getElementById('profile-sheet').classList.contains('open') && !document.getElementById('chat-sheet')?.classList.contains('open') && !document.getElementById('review-sheet')?.classList.contains('open') && !document.getElementById('list-sheet')?.classList.contains('open')) {
                    document.getElementById('overlay').classList.remove('show');
                    document.body.style.overflow = 'auto';
                }
            }

            // 초기 데이터 렌더링 함수
            function initializeDynamicContent() {
                if (recommendInterval) clearInterval(recommendInterval);

                const sliderTrack = document.getElementById('slider-track');
                const recommendList = document.getElementById('recommend-list');
                const defaultView = document.getElementById('default-view');
                const filteredView = document.getElementById('filtered-view');

                if (isAnyFilterActive()) {
                    defaultView.classList.add('hidden');
                    filteredView.classList.remove('hidden');
                    document.getElementById('app-container').classList.add('scroll-active');

                    // 필터링 적용 시 초이스/추천 통합하여 보여줌
                    let combined = [...filteredChoiceDB, ...filteredRecDB];
                    // 중복제거 (동일 id)
                    combined = combined.filter((partner, index, self) => index === self.findIndex((t) => t.id === partner.id));

                    document.getElementById('filtered-count').innerText = `총 ${combined.length}곳`;

                    if (combined.length === 0) {
                        document.getElementById('filtered-results-list').innerHTML = `<div class="p-5 text-sm w-full flex items-center justify-center h-[200px]" style="color:var(--text-sub);">조건에 맞는 파트너가 없습니다.</div>`;
                    } else {
                        let html = '';
                        for (let partner of combined) {
                            let stats = getPartnerStats(partner);
                            let rndRegion = getRandomCondition(partner.regionList, partner.region);
                            let rndMassage = getRandomCondition(partner.massageList, partner.massage);
                            let rndPlace = getRandomCondition(partner.placeList, partner.place);
                            let rndAge = getRandomCondition(partner.ageList, partner.age);
                            html += `
                    <div class="card p-4 flex gap-4 mb-4 items-center transition-all duration-500 ease-in-out" onclick="openProfile('${partner.name}', '${rndRegion} · ${rndPlace}', '${partner.id}', ${partner.reviews || 0}, ${partner.rating || 0}, '${rndMassage}', '${rndPlace}', '${rndAge}', '${partner.image}', '${partner.ticketType || '일반 입점'}', '${partner.ticketExpiry || ''}')">
                        <div class="w-[108px] h-[108px] rounded-2xl bg-cover bg-center flex-shrink-0 relative border border-[var(--point-color)]" style="background-image: url('${partner.image}'); filter: grayscale(10%) sepia(10%);"></div>
                        <div class="flex-1 py-1">
                            <h3 class="font-bold text-[16px] mb-0.5 tracking-tight" style="color: var(--text-main);">${partner.name}</h3>
                            <p class="text-[13px] mt-0.5" style="color: var(--text-sub);">${rndRegion}</p>
                            <div class="grid grid-cols-2 gap-1.5 mt-2.5">
                                <span class="text-[11px] px-2 py-1 border border-[var(--point-color)] bg-[var(--point-color)]/10 rounded-full font-medium text-white  flex items-center justify-center truncate tracking-tight shadow-sm">${rndRegion.split(' ')[0]}</span>
                                <span class="text-[11px] px-2 py-1 border border-[var(--point-color)] bg-transparent rounded-full font-medium text-white  flex items-center justify-center truncate tracking-tight shadow-sm">${rndMassage}</span>
                                <span class="text-[11px] px-2 py-1 border border-[var(--point-color)] bg-transparent rounded-full font-medium text-white  flex items-center justify-center truncate tracking-tight shadow-sm">${rndPlace}</span>
                                <span class="text-[11px] px-2 py-1 border border-[var(--point-color)] bg-transparent rounded-full font-medium text-white  flex items-center justify-center truncate tracking-tight shadow-sm">${rndAge}</span>
                            </div>

                        </div>
                    </div>`;
                        }
                        document.getElementById('filtered-results-list').innerHTML = html;
                    }
                    return; // 필터링 모드일 땐 기본 화면 렌더링 스킵
                }

                // 기본 모드 (필터 없음)
                defaultView.classList.remove('hidden');
                filteredView.classList.add('hidden');
                document.getElementById('app-container').classList.remove('scroll-active');


                // 다독 초이스 노출 시 매번 랜덤 섞기
                const generateChoiceItems = () => {
                    let chunk = '';
                    let mixedChoice = [...filteredChoiceDB].sort(() => Math.random() - 0.5);
                    for (let partner of mixedChoice) {
                        let stats = getPartnerStats(partner);
                        let badgeHtml = '';
                        if (partner.tier === 'VIP') {
                            badgeHtml = `<div class="absolute top-3 left-3 z-10 bg-gradient-to-r from-[#D4AF37] to-[#B38D1B] text-[#06110D] text-[11px] font-extrabold px-2.5 py-1 rounded opacity-95 tracking-wide shadow-md">VIP</div>`;
                        } else if (partner.tier === 'Premium') {
                            badgeHtml = `<div class="absolute top-3 left-3 z-10 bg-[var(--surface-color)] text-[var(--point-color)] border border-[var(--point-color)] text-[11px] font-extrabold px-2.5 py-1 rounded opacity-95 tracking-wide shadow-md">Premium</div>`;
                        }

                        let rndRegion = getRandomCondition(partner.regionList, partner.region);
                        let rndMassage = getRandomCondition(partner.massageList, partner.massage);
                        let rndPlace = getRandomCondition(partner.placeList, partner.place);
                        let rndAge = getRandomCondition(partner.ageList, partner.age);
                        chunk += `
                <div class="card min-w-[280px] max-w-[280px]" onclick="openProfile('${partner.name}', '${rndRegion} · ${rndPlace}', '${partner.id}', ${partner.reviews || 0}, ${partner.rating || 0}, '${rndMassage}', '${rndPlace}', '${rndAge}', '${partner.image}', '${partner.ticketType || '일반 입점'}', '${partner.ticketExpiry || ''}')">
                    <div class="relative h-[180px] bg-cover bg-center rounded-t-2xl" style="background-image: url('${partner.image}'); filter: grayscale(15%) sepia(20%); border-bottom: 1px solid var(--accent-color);">
                        ${badgeHtml}
                        <div class="absolute inset-0 bg-gradient-to-t from-[var(--surface-color)] to-transparent"></div>
                    </div>
                    <div class="p-5 pt-0 mt-3">
                        <h3 class="font-bold text-lg">${partner.name}</h3>
                        <p class="text-sm mt-1.5" style="color: var(--text-sub);">${rndRegion}</p>
                        <div class="grid grid-cols-2 gap-2 mt-4 text-xs">
                            <span class="border border-[var(--point-color)] bg-[var(--point-color)]/10 px-2.5 py-1.5 rounded-full font-bold text-white  flex items-center justify-center truncate tracking-tight shadow-sm">${rndRegion.split(' ')[0]}</span>
                            <span class="border border-[var(--point-color)] bg-transparent px-2.5 py-1.5 rounded-full font-medium text-white  flex items-center justify-center truncate tracking-tight shadow-sm">${rndMassage}</span>
                            <span class="border border-[var(--point-color)] bg-transparent px-2.5 py-1.5 rounded-full font-medium text-white  flex items-center justify-center truncate tracking-tight shadow-sm">${rndPlace}</span>
                            <span class="border border-[var(--point-color)] bg-transparent px-2.5 py-1.5 rounded-full font-medium text-white  flex items-center justify-center truncate tracking-tight shadow-sm">${rndAge}</span>
                        </div>

                    </div>
                </div>`;
                    }
                    return chunk;
                };

                if (filteredChoiceDB.length === 0) {
                    sliderTrack.innerHTML = `<div class="p-5 text-sm w-full h-[180px] flex items-center justify-center" style="color:var(--text-sub);">조건에 맞는 업체가 없습니다.</div>`;
                } else {
                    sliderTrack.innerHTML = generateChoiceItems() + generateChoiceItems();
                }

                // 추천 파트너 랜덤 로테이션 렌더링 (5개씩 변경)
                const totalPartners = filteredRecDB.length;

                if (totalPartners === 0) {
                    recommendList.innerHTML = `<div class="p-5 text-sm w-full flex items-center justify-center h-[200px]" style="color:var(--text-sub);">조건에 맞는 추천 파트너가 없습니다.</div>`;
                    return;
                }

                let mixedRec = [...filteredRecDB].sort(() => Math.random() - 0.5);
                let currentPartnerIndex = 0;

                function renderRecommendedPartners() {
                    let recHtml = '';
                    for (let j = 0; j < Math.min(5, totalPartners); j++) {
                        let idx = (currentPartnerIndex + j) % totalPartners;
                        let partner = mixedRec[idx];
                        let stats = getPartnerStats(partner);
                        let badgeHtml = '';
                        if (partner.tier === 'VIP') {
                            badgeHtml = `<div class="absolute top-1 left-1 z-10 bg-gradient-to-r from-[#D4AF37] to-[#B38D1B] text-[#06110D] text-[9px] font-extrabold px-1.5 py-0.5 rounded opacity-95 tracking-wide shadow-md">VIP</div>`;
                        } else if (partner.tier === 'Premium') {
                            badgeHtml = `<div class="absolute top-1 left-1 z-10 bg-[var(--surface-color)] text-[var(--point-color)] border border-[var(--point-color)] text-[9px] font-extrabold px-1.5 py-0.5 rounded opacity-95 tracking-wide shadow-md">Premium</div>`;
                        }

                        let rndRegion = getRandomCondition(partner.regionList, partner.region);
                        let rndMassage = getRandomCondition(partner.massageList, partner.massage);
                        let rndPlace = getRandomCondition(partner.placeList, partner.place);
                        let rndAge = getRandomCondition(partner.ageList, partner.age);
                        recHtml += `
                <div class="card p-4 flex gap-4 mb-4 items-center transition-all duration-500 ease-in-out opacity-0 translate-y-2" style="animation: fadeInUp 0.5s ease forwards;" onclick="openProfile('${partner.name}', '${rndRegion} · ${rndPlace}', '${partner.id}', ${partner.reviews || 0}, ${partner.rating || 0}, '${rndMassage}', '${rndPlace}', '${rndAge}', '${partner.image}', '${partner.ticketType || '일반 입점'}', '${partner.ticketExpiry || ''}')">
                    <div class="w-[108px] h-[108px] rounded-2xl bg-cover bg-center flex-shrink-0 relative border border-[var(--point-color)]" style="background-image: url('${partner.image}'); filter: grayscale(10%) sepia(10%);">
                        ${badgeHtml}
                    </div>
                    <div class="flex-1 py-1">
                        <div class="flex justify-between items-start">
                            <h3 class="font-bold text-[16px] mb-0.5 tracking-tight" style="color: var(--text-main);">${partner.name}</h3>
                        </div>
                        <p class="text-[13px] mt-0.5" style="color: var(--text-sub);">${rndRegion}</p>
                        <div class="grid grid-cols-2 gap-1.5 mt-2.5">
                            <span class="text-[11px] px-2 py-1 border border-[var(--point-color)] bg-[var(--point-color)]/10 rounded-full font-medium text-white  flex items-center justify-center truncate tracking-tight shadow-sm">${rndRegion.split(' ')[0]}</span>
                            <span class="text-[11px] px-2 py-1 border border-[var(--point-color)] bg-transparent rounded-full font-medium text-white  flex items-center justify-center truncate tracking-tight shadow-sm">${rndMassage}</span>
                            <span class="text-[11px] px-2 py-1 border border-[var(--point-color)] bg-transparent rounded-full font-medium text-white  flex items-center justify-center truncate tracking-tight shadow-sm">${rndPlace}</span>
                            <span class="text-[11px] px-2 py-1 border border-[var(--point-color)] bg-transparent rounded-full font-medium text-white  flex items-center justify-center truncate tracking-tight shadow-sm">${rndAge}</span>
                        </div>

                    </div>
                </div>`;
                    }
                    recommendList.innerHTML = recHtml;
                }

                renderRecommendedPartners();

                if (totalPartners > 0) {
                    // 2초마다 5개씩 순차적으로 다음 업체로 로테이션
                    recommendInterval = setInterval(() => {
                        currentPartnerIndex = (currentPartnerIndex + 5) % totalPartners;

                        // 모든 파트너를 한 바퀴 다 돌면 다시 새로운 랜덤 순서로 셔플
                        if (currentPartnerIndex < 5) { // 5씩 증가하므로 5 미만이 될 수 있음
                            mixedRec.sort(() => Math.random() - 0.5);
                        }

                        renderRecommendedPartners();
                    }, 2000);
                }
            }

            // 앱 구동 시 렌더링
            initializeDynamicContent();

            // 관심업체 (하트) 및 채팅 기능
            function toggleFavorite() {
                if (!currentPartner) return;
                const heartIcon = document.getElementById('heart-icon');
                const existingIdx = userFavorites.findIndex(p => p.id === currentPartner.id);

                if (existingIdx !== -1) {
                    userFavorites.splice(existingIdx, 1);
                    isFavorite = false;
                    heartIcon.setAttribute('fill', 'none');
                    heartIcon.classList.remove('drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]', 'scale-110');
                } else {
                    userFavorites.push({ ...currentPartner });
                    isFavorite = true;
                    heartIcon.setAttribute('fill', 'currentColor');
                    heartIcon.classList.add('drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]', 'scale-110');
                }

                renderFavoritesList();
            }

            function recordChatProgress(message) {
                if (!currentPartner) return;
                const existing = userChats.find(c => c.id === currentPartner.id);
                if (existing) {
                    existing.lastMessage = message;
                    existing.time = '방금 전';
                } else {
                    userChats.unshift({
                        ...currentPartner,
                        lastMessage: message,
                        time: '방금 전'
                    });
                }
                renderChatList();
            }

            function openChatSheet() {
                const chatSheet = document.getElementById('chat-sheet');
                const chatName = document.getElementById('chat-profile-name');

                if (!chatName.dataset.resume) {
                    chatName.innerText = document.getElementById('profile-name').innerText;
                    if (currentPartner && currentPartner.image) {
                        document.getElementById('chat-header-img').style.backgroundImage = `url('${currentPartner.image}')`;
                        document.getElementById('chat-default-avatar').style.backgroundImage = `url('${currentPartner.image}')`;
                    }
                    document.getElementById('chat-messages-container').innerHTML = ''; // 초기화

                    setTimeout(() => {
                        appendBotMessage('안녕하세요, 예약 문의 도와드리겠습니다. 😊');
                    }, 500);
                } else {
                    delete chatName.dataset.resume;
                }
                if (typeof profileOpenedFromFavorites !== 'undefined' && profileOpenedFromFavorites) {
                    chatSheet.style.zIndex = '260';
                }

                document.getElementById('chat-input').value = '';
                chatSheet.classList.add('open');
                overlay.classList.add('show');
            }

            function closeChatSheet() {
                const chatSheet = document.getElementById('chat-sheet');
                chatSheet.classList.remove('open');

                if (typeof chatOpenedFromModal !== 'undefined' && chatOpenedFromModal) {
                    chatOpenedFromModal = false;
                    document.getElementById('overlay').classList.remove('show');
                    // 채팅목록 모달은 이미 켜져있는 상태이므로 오버레이 등 원상복구
                    setTimeout(() => {
                        chatSheet.style.zIndex = '';
                        document.getElementById('overlay').style.zIndex = '';
                    }, 300);
                } else if (typeof profileOpenedFromFavorites !== 'undefined' && profileOpenedFromFavorites) {
                    setTimeout(() => {
                        chatSheet.style.zIndex = '';
                    }, 300);
                } else {
                    // 메인 프로필 등에서 열었을 경우만 오버레이를 지운다
                }
            }

            function sendMockChatMessage(text) {
                appendUserMessage(text);
                recordChatProgress(text);
                setTimeout(() => {
                    appendBotMessage('예약 스케줄을 확인 후 잠시만 기다려주시면 안내해 드리겠습니다. 😊');
                }, 800);
            }

            function sendUserMessage() {
                const input = document.getElementById('chat-input');
                const text = input.value.trim();
                if (text) {
                    appendUserMessage(text);
                    recordChatProgress(text);
                    input.value = '';

                    setTimeout(() => {
                        appendBotMessage('제가 즉각적으로 답변해드리기 어려운 요청입니다. 잠시 기다려 주시면 직원이 상세히 답변해드리겠습니다.');
                    }, 1000);
                }
            }

            // 엔터키 입력 지원
            const chatInput = document.getElementById('chat-input');
            if (chatInput) {
                chatInput.addEventListener('keypress', function (e) {
                    if (e.key === 'Enter') sendUserMessage();
                });
            }

            function appendUserMessage(text) {
                const container = document.getElementById('chat-messages-container');
                const html = `
        <div class="flex justify-end mb-2">
            <div class="bg-[var(--point-color)] text-[#06110D] p-3 rounded-2xl rounded-tr-sm text-[15px] max-w-[80%] leading-relaxed shadow-sm font-medium">
                ${text}
            </div>
        </div>
        `;
                container.insertAdjacentHTML('beforeend', html);
                scrollToBottom(container);
            }

            function appendBotMessage(text) {
                const container = document.getElementById('chat-messages-container');
                const avatarUrl = currentPartner && currentPartner.image ? currentPartner.image : 'https://images.unsplash.com/photo-1544435253-f0ead49638fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80';
                const html = `
        <div class="flex gap-3 mb-2">
            <div class="w-8 h-8 rounded-full bg-cover bg-center border border-[var(--point-color)] shrink-0 shadow-sm" style="background-image: url('${avatarUrl}'); filter: grayscale(15%) sepia(20%);"></div>
            <div class="bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--text-main)] p-3 rounded-2xl rounded-tl-sm text-[15px] max-w-[80%] leading-relaxed shadow-sm">
                ${text}
            </div>
        </div>
        `;
                container.insertAdjacentHTML('beforeend', html);
                scrollToBottom(container);
            }

            function scrollToBottom(container) {
                const scrollArea = container.parentElement;
                scrollArea.scrollTop = scrollArea.scrollHeight;
            }

            // 계정 찾기 스크린 전환 및 탭 로직
            function openFindIdPwScreen() {
                const modal = document.getElementById('find-idpw-modal');
                modal.style.display = 'flex';
                void modal.offsetWidth;
                setTimeout(() => {
                    modal.classList.remove('translate-x-full');
                    modal.classList.add('translate-x-0');
                }, 10);
                switchFindTab('id'); // 기본값: 아이디 찾기
            }

            function closeFindIdPwScreen() {
                const modal = document.getElementById('find-idpw-modal');
                modal.classList.remove('translate-x-0');
                modal.classList.add('translate-x-full');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            }

            function switchFindTab(tab) {
                const idForm = document.getElementById('form-find-id');
                const pwForm = document.getElementById('form-find-pw');
                const idResult = document.getElementById('result-find-id');
                const pwResult = document.getElementById('result-find-pw');
                const idTabBtn = document.getElementById('tab-find-id');
                const pwTabBtn = document.getElementById('tab-find-pw');

                // 입력 폼 초기화
                document.getElementById('find-id-name').value = '';
                document.getElementById('find-id-phone').value = '';
                document.getElementById('find-pw-id').value = '';
                document.getElementById('find-pw-name').value = '';

                if (tab === 'id') {
                    idForm.style.display = 'flex';
                    pwForm.style.display = 'none';
                    idResult.style.display = 'none';
                    pwResult.style.display = 'none';
                    // 탭 스타일
                    idTabBtn.className = 'flex-1 py-4 text-center font-bold text-[var(--point-color)] border-b-2 border-[var(--point-color)] tracking-widest transition-colors scale-100';
                    pwTabBtn.className = 'flex-1 py-4 text-center font-medium text-[var(--text-sub)] border-b-2 border-transparent tracking-widest transition-colors hover:text-[var(--text-main)] scale-100';
                } else {
                    pwForm.style.display = 'flex';
                    idForm.style.display = 'none';
                    idResult.style.display = 'none';
                    pwResult.style.display = 'none';
                    // 탭 스타일
                    pwTabBtn.className = 'flex-1 py-4 text-center font-bold text-[var(--point-color)] border-b-2 border-[var(--point-color)] tracking-widest transition-colors scale-100';
                    idTabBtn.className = 'flex-1 py-4 text-center font-medium text-[var(--text-sub)] border-b-2 border-transparent tracking-widest transition-colors hover:text-[var(--text-main)] scale-100';
                }
            }

            function handleFindIdSubmit() {
                const name = document.getElementById('find-id-name').value.trim();
                const phone = document.getElementById('find-id-phone').value.trim();

                if (!name || !phone) {
                    alert('이름과 전화번호를 모두 입력해주세요.');
                    return;
                }

                const idForm = document.getElementById('form-find-id');
                const idResult = document.getElementById('result-find-id');

                idForm.style.display = 'none';
                idResult.style.display = 'flex';
            }

            function handleFindPwSubmit() {
                const id = document.getElementById('find-pw-id').value.trim();
                const name = document.getElementById('find-pw-name').value.trim();

                if (!id || !name) {
                    alert('아이디와 이름을 모두 입력해주세요.');
                    return;
                }

                const pwForm = document.getElementById('form-find-pw');
                const pwResult = document.getElementById('result-find-pw');

                pwForm.style.display = 'none';
                pwResult.style.display = 'flex';
            }

            // 로그인 스크린 열기/닫기 (App Page Transition)

            function openLoginModal() {
                if (typeof isPartnerLoggedIn !== 'undefined' && isPartnerLoggedIn) {
                    showCustomToast('일반고객 전용 로그인입니다.');
                    return;
                }
                const modal = document.getElementById('login-modal');
                modal.style.display = 'flex';
                // force reflow
                void modal.offsetWidth;
                setTimeout(() => {
                    modal.classList.remove('translate-x-full');
                    modal.classList.add('translate-x-0');
                }, 10);
            }

            function closeLoginModal() {
                const modal = document.getElementById('login-modal');
                modal.classList.remove('translate-x-0');
                modal.classList.add('translate-x-full');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            }

            // 아이디/비밀번호 로그인 폼 스크린 열기/닫기
            function openLoginFormModal() {
                const formModal = document.getElementById('login-form-modal');
                formModal.style.display = 'flex';
                void formModal.offsetWidth; // force reflow
                setTimeout(() => {
                    formModal.classList.remove('translate-x-full');
                    formModal.classList.add('translate-x-0');
                }, 10);
            }

            function closeLoginFormModal() {
                const formModal = document.getElementById('login-form-modal');
                formModal.classList.remove('translate-x-0');
                formModal.classList.add('translate-x-full');
                setTimeout(() => {
                    formModal.style.display = 'none';
                }, 300);
            }

            // 회원가입 모달 처리
            function openSignupModal() {
                console.log("openSignupModal trigger");
                try {
                    resetSignupForm();
                } catch (e) {
                    console.error("Input clearing failed", e);
                }

                const modal = document.getElementById('signup-modal');
                if (!modal) {
                    console.error("signup modal not found");
                    return;
                }

                modal.style.display = 'flex';

                // Force reflow
                void modal.offsetWidth;

                requestAnimationFrame(() => {
                    modal.classList.remove('translate-x-full');
                    modal.classList.add('translate-x-0');
                });
            }

            function closeSignupModal() {
                const modal = document.getElementById('signup-modal');
                modal.classList.remove('translate-x-0');
                modal.classList.add('translate-x-full');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            }

            const SIGNUP_ID_MIN_LENGTH = 4;
            let signupIdCheckTimer = null;
            let partnerSignupIdCheckTimer = null;
            let signupIdCheckToken = 0;
            let partnerSignupIdCheckToken = 0;
            let signupIdStatus = 'idle'; // idle | invalid | checking | duplicate | available | error
            let partnerSignupIdStatus = 'idle'; // idle | invalid | checking | duplicate | available | error

            function resetSignupForm() {
                const fields = ['signup-id', 'signup-pw', 'signup-pw-confirm', 'signup-name', 'signup-phone'];
                fields.forEach((fieldId) => {
                    const el = document.getElementById(fieldId);
                    if (el) el.value = '';
                });

                const agreeTerms = document.getElementById('signup-agree-terms');
                const agree = document.getElementById('signup-agree');
                if (agreeTerms) agreeTerms.checked = false;
                if (agree) agree.checked = false;

                const checkIconTerms = document.getElementById('signup-agree-terms-check');
                const checkIcon = document.getElementById('signup-agree-check');
                if (checkIconTerms) {
                    checkIconTerms.classList.add('opacity-0');
                    checkIconTerms.classList.remove('opacity-100');
                }
                if (checkIcon) {
                    checkIcon.classList.add('opacity-0');
                    checkIcon.classList.remove('opacity-100');
                }

                signupIdStatus = 'idle';
                setIdStatusMessage(document.getElementById('signup-id-status-msg'), 'idle', '');
                setIdStatusMessage(document.getElementById('signup-pw-status-msg'), 'idle', '');
                setIdStatusMessage(document.getElementById('signup-pw-confirm-status-msg'), 'idle', '');
                setIdStatusMessage(document.getElementById('signup-phone-status-msg'), 'idle', '');
                checkSignupValidity();
            }

            function setIdStatusMessage(el, status, message) {
                if (!el) return;
                if (!message) {
                    el.classList.add('hidden');
                    el.innerText = '';
                    return;
                }

                let cls = 'text-[#A7B2AE] text-[13px] font-bold ml-1';
                if (status === 'invalid' || status === 'duplicate' || status === 'error') {
                    cls = 'text-[#EF4444] text-[13px] font-bold ml-1';
                } else if (status === 'available') {
                    cls = 'text-[#22c55e] text-[13px] font-bold ml-1';
                }

                el.className = cls;
                el.innerText = message;
            }

            async function checkIdDuplicateAcrossUsersAndPartners(id) {
                const firestoreDb = firebase.firestore();
                const [userSnap, partnerSnap] = await Promise.all([
                    firestoreDb.collection('users').where('userId', '==', id).limit(1).get(),
                    firestoreDb.collection('partners').where('userId', '==', id).limit(1).get()
                ]);
                return !userSnap.empty || !partnerSnap.empty;
            }

            function scheduleSignupIdValidation() {
                const idInput = document.getElementById('signup-id');
                const msgEl = document.getElementById('signup-id-status-msg');
                if (!idInput) return;

                const id = idInput.value.trim();
                if (signupIdCheckTimer) {
                    clearTimeout(signupIdCheckTimer);
                    signupIdCheckTimer = null;
                }

                if (!id) {
                    signupIdStatus = 'idle';
                    setIdStatusMessage(msgEl, 'idle', '');
                    checkSignupValidity();
                    return;
                }

                if (id.length < SIGNUP_ID_MIN_LENGTH) {
                    signupIdStatus = 'invalid';
                    setIdStatusMessage(msgEl, 'invalid', '※ 아이디는 4자리 이상 입력해주세요.');
                    checkSignupValidity();
                    return;
                }

                signupIdStatus = 'checking';
                setIdStatusMessage(msgEl, 'checking', '※ 아이디 중복을 확인하고 있습니다...');
                checkSignupValidity();

                const token = ++signupIdCheckToken;
                signupIdCheckTimer = setTimeout(async () => {
                    if (typeof firebase === 'undefined') {
                        if (token !== signupIdCheckToken) return;
                        signupIdStatus = 'error';
                        setIdStatusMessage(msgEl, 'error', '※ 아이디 확인 중 오류가 발생했습니다.');
                        checkSignupValidity();
                        return;
                    }

                    try {
                        const isDuplicate = await checkIdDuplicateAcrossUsersAndPartners(id);
                        if (token !== signupIdCheckToken) return;
                        signupIdStatus = isDuplicate ? 'duplicate' : 'available';
                        setIdStatusMessage(
                            msgEl,
                            signupIdStatus,
                            isDuplicate ? '※ 이미 사용 중인 아이디입니다.' : '※ 사용 가능한 아이디입니다.'
                        );
                    } catch (e) {
                        if (token !== signupIdCheckToken) return;
                        signupIdStatus = 'error';
                        setIdStatusMessage(msgEl, 'error', '※ 아이디 확인 중 오류가 발생했습니다.');
                    }
                    checkSignupValidity();
                }, 400);
            }

            function schedulePartnerSignupIdValidation() {
                const idInput = document.getElementById('partner-signup-id');
                const msgEl = document.getElementById('partner-signup-id-status-msg');
                if (!idInput) return;

                const id = idInput.value.trim();
                if (partnerSignupIdCheckTimer) {
                    clearTimeout(partnerSignupIdCheckTimer);
                    partnerSignupIdCheckTimer = null;
                }

                if (!id) {
                    partnerSignupIdStatus = 'idle';
                    setIdStatusMessage(msgEl, 'idle', '');
                    checkPartnerSignupForm();
                    return;
                }

                if (id.length < SIGNUP_ID_MIN_LENGTH) {
                    partnerSignupIdStatus = 'invalid';
                    setIdStatusMessage(msgEl, 'invalid', '※ 아이디는 4자리 이상 입력해주세요.');
                    checkPartnerSignupForm();
                    return;
                }

                partnerSignupIdStatus = 'checking';
                setIdStatusMessage(msgEl, 'checking', '※ 아이디 중복을 확인하고 있습니다...');
                checkPartnerSignupForm();

                const token = ++partnerSignupIdCheckToken;
                partnerSignupIdCheckTimer = setTimeout(async () => {
                    if (typeof firebase === 'undefined') {
                        if (token !== partnerSignupIdCheckToken) return;
                        partnerSignupIdStatus = 'error';
                        setIdStatusMessage(msgEl, 'error', '※ 아이디 확인 중 오류가 발생했습니다.');
                        checkPartnerSignupForm();
                        return;
                    }

                    try {
                        const isDuplicate = await checkIdDuplicateAcrossUsersAndPartners(id);
                        if (token !== partnerSignupIdCheckToken) return;
                        partnerSignupIdStatus = isDuplicate ? 'duplicate' : 'available';
                        setIdStatusMessage(
                            msgEl,
                            partnerSignupIdStatus,
                            isDuplicate ? '※ 이미 사용 중인 아이디입니다.' : '※ 사용 가능한 아이디입니다.'
                        );
                    } catch (e) {
                        if (token !== partnerSignupIdCheckToken) return;
                        partnerSignupIdStatus = 'error';
                        setIdStatusMessage(msgEl, 'error', '※ 아이디 확인 중 오류가 발생했습니다.');
                    }
                    checkPartnerSignupForm();
                }, 400);
            }

            function checkSignupValidity() {
                const id = document.getElementById('signup-id').value.trim();
                const pw = document.getElementById('signup-pw').value.trim();
                const pwConfirm = document.getElementById('signup-pw-confirm').value.trim();
                const name = document.getElementById('signup-name').value.trim();
                const phone = document.getElementById('signup-phone').value.trim();
                const agreeTerms = document.getElementById('signup-agree-terms').checked;
                const checkIconTerms = document.getElementById('signup-agree-terms-check');
                const agree = document.getElementById('signup-agree').checked;
                const checkIcon = document.getElementById('signup-agree-check');
                const isPasswordValid = isValidPartnerSignupPassword(pw || '');
                const isIdAvailable = signupIdStatus === 'available';
                const isPhoneValid = isValidKoreanMobilePhone(phone || '');

                const pwStatusEl = document.getElementById('signup-pw-status-msg');
                if (pwStatusEl) {
                    if (!pw) {
                        pwStatusEl.classList.add('hidden');
                    } else if (isPasswordValid) {
                        pwStatusEl.className = 'text-[#22c55e] text-[13px] font-bold ml-1';
                        pwStatusEl.innerText = '※ 사용 가능한 비밀번호입니다.';
                    } else {
                        pwStatusEl.className = 'text-[#EF4444] text-[13px] font-bold ml-1';
                        pwStatusEl.innerText = '※ 비밀번호는 8자리 이상이며 영문/숫자/특수문자를 모두 포함해야 합니다.';
                    }
                }

                const pwConfirmStatusEl = document.getElementById('signup-pw-confirm-status-msg');
                if (pwConfirmStatusEl) {
                    if (!pwConfirm) {
                        pwConfirmStatusEl.classList.add('hidden');
                    } else if (pw !== pwConfirm) {
                        pwConfirmStatusEl.className = 'text-[#EF4444] text-[13px] font-bold ml-1';
                        pwConfirmStatusEl.innerText = '※ 비밀번호가 일치하지 않습니다.';
                    } else {
                        pwConfirmStatusEl.className = 'text-[#22c55e] text-[13px] font-bold ml-1';
                        pwConfirmStatusEl.innerText = '※ 비밀번호가 일치합니다.';
                    }
                }

                const phoneStatusEl = document.getElementById('signup-phone-status-msg');
                if (phoneStatusEl) {
                    if (!phone) {
                        phoneStatusEl.classList.add('hidden');
                    } else if (isPhoneValid) {
                        phoneStatusEl.className = 'text-[#22c55e] text-[13px] font-bold ml-1';
                        phoneStatusEl.innerText = '※ 사용 가능한 휴대폰번호입니다.';
                    } else {
                        phoneStatusEl.className = 'text-[#EF4444] text-[13px] font-bold ml-1';
                        phoneStatusEl.innerText = '※ 휴대폰번호 양식이 맞지 않습니다. (010으로 시작하는 11자리)';
                    }
                }

                // 체크박스 아이콘 토글 1
                if (agreeTerms) {
                    checkIconTerms.classList.remove('opacity-0');
                    checkIconTerms.classList.add('opacity-100');
                } else {
                    checkIconTerms.classList.remove('opacity-100');
                    checkIconTerms.classList.add('opacity-0');
                }

                // 체크박스 아이콘 토글 2
                if (agree) {
                    checkIcon.classList.remove('opacity-0');
                    checkIcon.classList.add('opacity-100');
                } else {
                    checkIcon.classList.remove('opacity-100');
                    checkIcon.classList.add('opacity-0');
                }

                const btn = document.getElementById('signup-submit-btn');

                // 모든 값 존재 여부 검증
                if (id && isIdAvailable && pw && isPasswordValid && pwConfirm && pw === pwConfirm && name && phone && isPhoneValid && agree && agreeTerms) {
                    btn.disabled = false;
                    btn.classList.remove('bg-[#0A1B13]', 'text-[#A7B2AE]', 'border-[#2A3731]', 'opacity-70');
                    btn.classList.add('bg-gradient-to-r', 'from-[var(--point-color)]', 'to-[#B59530]', 'text-[#06110D]', 'shadow-[0_8px_20px_rgba(212,175,55,0.25)]', 'border-[#D4AF37]', 'hover:brightness-110', 'active:scale-[0.98]');
                } else {
                    btn.disabled = true;
                    btn.classList.add('bg-[#0A1B13]', 'text-[#A7B2AE]', 'border-[#2A3731]', 'opacity-70');
                    btn.classList.remove('bg-gradient-to-r', 'from-[var(--point-color)]', 'to-[#B59530]', 'text-[#06110D]', 'shadow-[0_8px_20px_rgba(212,175,55,0.25)]', 'border-[#D4AF37]', 'hover:brightness-110', 'active:scale-[0.98]');
                }
            }

            function handleSignupSubmit() {
                const id = document.getElementById('signup-id').value.trim();
                const pw = document.getElementById('signup-pw').value.trim();
                const pwConfirm = document.getElementById('signup-pw-confirm').value.trim();
                const name = document.getElementById('signup-name').value.trim();
                const phone = document.getElementById('signup-phone').value.trim();
                const agreeTerms = document.getElementById('signup-agree-terms').checked;
                const agree = document.getElementById('signup-agree').checked;

                const selectedGender = document.querySelector('input[name="signup-gender"]:checked');
                const gender = selectedGender ? (selectedGender.value === 'male' ? '남성' : '여성') : '알수없음';

                if (!agreeTerms || !agree) {
                    alert('필수 확인 항목 및 약관에 동의해주세요.');
                    return;
                }

                if (id.length < SIGNUP_ID_MIN_LENGTH) {
                    alert('아이디는 4자리 이상 입력해주세요.');
                    return;
                }

                if (!isValidPartnerSignupPassword(pw)) {
                    alert('비밀번호는 8자리 이상이며 영문/숫자/특수문자를 모두 포함해야 합니다.');
                    return;
                }

                if (!isValidKoreanMobilePhone(phone)) {
                    alert('휴대폰번호 양식이 맞지 않습니다. (010으로 시작하는 11자리)');
                    return;
                }

                if (pw !== pwConfirm) {
                    alert('비밀번호가 일치하지 않습니다.');
                    return;
                }

                currentPassword = pw;

                // Firestore에 사용자 정보 저장
                if (typeof firebase === 'undefined') {
                    alert('데이터베이스 연결에 실패했습니다. 캐시 문제일 수 있으니 [Ctrl + F5]를 눌러 강력 새로고침 후 다시 시도해주세요.');
                    return;
                }

                const firestoreDb = firebase.firestore();
                const now = firebase.firestore.FieldValue.serverTimestamp();
                checkIdDuplicateAcrossUsersAndPartners(id).then((isDuplicate) => {
                    if (isDuplicate) {
                        alert('이미 사용 중인 아이디입니다.');
                        signupIdStatus = 'duplicate';
                        setIdStatusMessage(document.getElementById('signup-id-status-msg'), 'duplicate', '※ 이미 사용 중인 아이디입니다.');
                        checkSignupValidity();
                        return;
                    }

                    let docRef = firestoreDb.collection('users').doc(id);
                    docRef.set({
                    userId: id,
                    password: pw, // UI상 관리자 페이지에서는 제거되지만, 추후 진짜 auth 연동 전까지 데이터 유지
                    name: name,
                    phone: phone,
                    gender: gender,
                    createdAt: now,
                    lastLoginAt: now
                    }).then(() => {
                        completeSignup(name, id);
                    }).catch((error) => {
                        console.error('Firestore Error:', error);
                        alert('가입 처리 중 데이터베이스 오류가 발생했습니다: ' + error.message);
                    });
                }).catch((error) => {
                    console.error('ID duplicate check error:', error);
                    alert('아이디 중복 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
                });
            }

            function completeSignup(name, id) {
                alert(name + '님, 다독 회원이 되신 것을 환영합니다!');
                resetSignupForm();
                closeSignupModal();

                // 자동 로그인 처리
                isLoggedIn = true;

                // 백그라운드에 있을 수 있는 로그인 모달 닫기
                if (typeof closeLoginFormModal === 'function') closeLoginFormModal();
                if (typeof closeLoginModal === 'function') closeLoginModal();

                // 헤더 UI 상태 업데이트 (메인 화면)
                if (typeof updateHeaderToLoggedInState === 'function') {
                    updateHeaderToLoggedInState(id);
                }
            }

            // 모의 로그인 처리 로직
            let isLoggedIn = false;
            let isPartnerLoggedIn = false;
            let currentPassword = '1234';

            function validatePasswordChange() {
                const currPw = document.getElementById('curr-pw').value;
                const newPw = document.getElementById('new-pw').value;
                const confirmPw = document.getElementById('confirm-pw').value;

                const currPwMsg = document.getElementById('curr-pw-msg');
                const newPwMsg = document.getElementById('new-pw-msg');
                const confirmPwMsg = document.getElementById('confirm-pw-msg');

                const changeBtn = document.getElementById('pw-change-btn');

                let isCurrValid = false;
                let isNewValid = false;
                let isConfirmValid = false;

                // Current Password Validation
                if (currPw === '') {
                    currPwMsg.textContent = '';
                } else if (currPw !== currentPassword) {
                    currPwMsg.textContent = '현재 비밀번호가 일치하지 않습니다.';
                    currPwMsg.className = 'text-xs mt-2 text-red-500';
                } else {
                    currPwMsg.textContent = '현재 비밀번호가 일치합니다.';
                    currPwMsg.className = 'text-xs mt-2 text-[var(--point-color)]';
                    isCurrValid = true;
                }

                // New Password Validation
                if (newPw === '') {
                    newPwMsg.textContent = '';
                } else if (newPw === currentPassword) {
                    newPwMsg.textContent = '현재 비밀번호와 동일합니다. 다른 비밀번호를 입력해주세요.';
                    newPwMsg.className = 'text-xs mt-2 text-red-500';
                } else {
                    newPwMsg.textContent = '사용 가능한 변경할 비밀번호입니다.';
                    newPwMsg.className = 'text-xs mt-2 text-[var(--point-color)]';
                    isNewValid = true;
                }

                // Confirm Password Validation
                if (confirmPw === '') {
                    confirmPwMsg.textContent = '';
                } else if (newPw !== confirmPw) {
                    confirmPwMsg.textContent = '비밀번호가 일치하지 않습니다.';
                    confirmPwMsg.className = 'text-xs mt-2 text-red-500';
                } else {
                    confirmPwMsg.textContent = '비밀번호가 일치합니다.';
                    confirmPwMsg.className = 'text-xs mt-2 text-[var(--point-color)]';
                    isConfirmValid = true;
                }

                // Update button state
                if (isCurrValid && isNewValid && isConfirmValid && currPw !== '' && newPw !== '' && confirmPw !== '') {
                    changeBtn.disabled = false;
                    changeBtn.className = 'w-full py-4 mt-6 rounded-xl bg-gradient-to-r from-[var(--point-color)] to-[#B59530] text-[#06110D] font-bold shadow-[0_4px_15px_rgba(212,175,55,0.15)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer';
                } else {
                    changeBtn.disabled = true;
                    changeBtn.className = 'w-full py-4 mt-6 rounded-xl bg-[#06110D] text-[#A7B2AE]/50 border border-[var(--border-color)] font-bold transition-all cursor-not-allowed';
                }
            }

            function handleChangePassword() {
                const currPw = document.getElementById('curr-pw').value;
                const newPw = document.getElementById('new-pw').value;
                const confirmPw = document.getElementById('confirm-pw').value;

                // 추가적인 다중 보안 검증
                if (currPw !== currentPassword) {
                    alert('현재 비밀번호가 일치하지 않습니다.');
                    return;
                }
                if (newPw === '') {
                    alert('새 비밀번호를 입력해주세요.');
                    return;
                }
                if (newPw === currentPassword) {
                    alert('새 비밀번호가 현재 비밀번호와 동일합니다.');
                    return;
                }
                if (newPw !== confirmPw) {
                    alert('새 비밀번호와 확인이 일치하지 않습니다.');
                    return;
                }

                alert('비밀번호가 안전하게 변경되었습니다.');
                currentPassword = newPw;

                document.getElementById('curr-pw').value = '';
                document.getElementById('new-pw').value = '';
                document.getElementById('confirm-pw').value = '';
                validatePasswordChange();

                closeSecurityModal();
            }

            function openPartnerLoginScreen() {
                if (typeof isPartnerLoggedIn !== 'undefined' && isPartnerLoggedIn) {
                    openPartnerDashboard();
                    return;
                }
                const modal = document.getElementById('partner-login-modal');
                modal.style.display = 'flex';
                // 짧은 지연 후 애니메이션 클래스 추가
                setTimeout(() => {
                    modal.classList.remove('translate-x-full');
                }, 10);
            }

            function closePartnerLoginScreen() {
                const modal = document.getElementById('partner-login-modal');
                modal.classList.add('translate-x-full');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            }

            let partnerRecoveryResetPartnerDocId = '';
            let partnerRecoveryResetUserId = '';

            function resetPartnerRecoveryModal() {
                const fields = [
                    'partner-find-id-company',
                    'partner-find-id-phone',
                    'partner-find-pw-id',
                    'partner-find-pw-company',
                    'partner-recovery-new-pw',
                    'partner-recovery-new-pw-confirm'
                ];
                fields.forEach((id) => {
                    const el = document.getElementById(id);
                    if (el) el.value = '';
                });

                partnerRecoveryResetPartnerDocId = '';
                partnerRecoveryResetUserId = '';

                const resultEl = document.getElementById('partner-recovery-result');
                if (resultEl) {
                    resultEl.classList.add('hidden');
                    resultEl.innerText = '';
                }

                const resetForm = document.getElementById('partner-recovery-reset-form');
                if (resetForm) resetForm.classList.add('hidden');

                const newPwMsg = document.getElementById('partner-recovery-new-pw-msg');
                const confirmMsg = document.getElementById('partner-recovery-new-pw-confirm-msg');
                if (newPwMsg) newPwMsg.classList.add('hidden');
                if (confirmMsg) confirmMsg.classList.add('hidden');

                const submitBtn = document.getElementById('partner-recovery-reset-submit-btn');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.className = 'w-full py-[14px] mt-1 rounded-xl bg-[#1A2521] text-[#A7B2AE] border border-[#2A3731] font-bold text-[15px] tracking-wide transition-all duration-300 pointer-events-none';
                }

                switchPartnerRecoveryTab('id');
            }

            function openPartnerRecoveryModal(defaultTab = 'id') {
                const modal = document.getElementById('partner-recovery-modal');
                if (!modal) return;
                resetPartnerRecoveryModal();
                switchPartnerRecoveryTab(defaultTab);
                modal.style.display = 'flex';
                setTimeout(() => {
                    modal.classList.remove('translate-x-full');
                }, 10);
            }

            function closePartnerRecoveryModal() {
                const modal = document.getElementById('partner-recovery-modal');
                if (!modal) return;
                modal.classList.add('translate-x-full');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            }

            function switchPartnerRecoveryTab(tab) {
                const idBtn = document.getElementById('partner-recovery-tab-id-btn');
                const pwBtn = document.getElementById('partner-recovery-tab-pw-btn');
                const idForm = document.getElementById('partner-recovery-id-form');
                const pwForm = document.getElementById('partner-recovery-pw-form');
                const resetForm = document.getElementById('partner-recovery-reset-form');
                if (!idBtn || !pwBtn || !idForm || !pwForm) return;

                if (tab === 'pw') {
                    pwBtn.className = 'flex-1 py-3 text-center font-bold text-[var(--point-color)] border-b-2 border-[var(--point-color)] tracking-widest transition-colors';
                    idBtn.className = 'flex-1 py-3 text-center font-medium text-[var(--text-sub)] border-b-2 border-transparent tracking-widest transition-colors hover:text-[var(--text-main)]';
                    pwForm.classList.remove('hidden');
                    idForm.classList.add('hidden');
                } else {
                    idBtn.className = 'flex-1 py-3 text-center font-bold text-[var(--point-color)] border-b-2 border-[var(--point-color)] tracking-widest transition-colors';
                    pwBtn.className = 'flex-1 py-3 text-center font-medium text-[var(--text-sub)] border-b-2 border-transparent tracking-widest transition-colors hover:text-[var(--text-main)]';
                    idForm.classList.remove('hidden');
                    pwForm.classList.add('hidden');
                    partnerRecoveryResetPartnerDocId = '';
                    partnerRecoveryResetUserId = '';
                    if (resetForm) resetForm.classList.add('hidden');
                }
            }

            function setPartnerRecoveryResult(message, type = 'info') {
                const resultEl = document.getElementById('partner-recovery-result');
                if (!resultEl) return;
                const base = 'mt-5 p-4 rounded-2xl border text-[14px] leading-relaxed';
                if (type === 'success') {
                    resultEl.className = `${base} text-[#d9f99d] border-lime-500/40 bg-lime-900/15`;
                } else if (type === 'error') {
                    resultEl.className = `${base} text-[#fecaca] border-red-500/40 bg-red-900/15`;
                } else {
                    resultEl.className = `${base} text-[#A7B2AE] border-[#2A3731] bg-[#0A1B13]`;
                }
                resultEl.innerText = message;
                resultEl.classList.remove('hidden');
            }

            function validatePartnerRecoveryPasswordForm() {
                const pw = document.getElementById('partner-recovery-new-pw')?.value || '';
                const pwConfirm = document.getElementById('partner-recovery-new-pw-confirm')?.value || '';
                const pwMsg = document.getElementById('partner-recovery-new-pw-msg');
                const confirmMsg = document.getElementById('partner-recovery-new-pw-confirm-msg');
                const submitBtn = document.getElementById('partner-recovery-reset-submit-btn');

                const pwValid = isValidPartnerSignupPassword(pw);
                const confirmValid = !!pwConfirm && pw === pwConfirm;

                if (pwMsg) {
                    if (!pw) {
                        pwMsg.classList.add('hidden');
                    } else if (pwValid) {
                        pwMsg.className = 'text-[#22c55e] text-[12px] font-bold ml-1';
                        pwMsg.innerText = '※ 사용 가능한 비밀번호입니다.';
                    } else {
                        pwMsg.className = 'text-[#EF4444] text-[12px] font-bold ml-1';
                        pwMsg.innerText = '※ 8자리 이상 영문/숫자/특수문자 조합으로 입력해주세요.';
                    }
                }

                if (confirmMsg) {
                    if (!pwConfirm) {
                        confirmMsg.classList.add('hidden');
                    } else if (confirmValid) {
                        confirmMsg.className = 'text-[#22c55e] text-[12px] font-bold ml-1';
                        confirmMsg.innerText = '※ 비밀번호가 일치합니다.';
                    } else {
                        confirmMsg.className = 'text-[#EF4444] text-[12px] font-bold ml-1';
                        confirmMsg.innerText = '※ 비밀번호가 일치하지 않습니다.';
                    }
                }

                if (submitBtn) {
                    if (pwValid && confirmValid && partnerRecoveryResetPartnerDocId) {
                        submitBtn.disabled = false;
                        submitBtn.className = 'w-full py-[14px] mt-1 rounded-xl bg-gradient-to-r from-[var(--point-color)] to-[#B59530] text-[#06110D] border border-[#D4AF37] font-bold text-[15px] tracking-wide transition-all duration-300 hover:brightness-110 active:scale-[0.98]';
                    } else {
                        submitBtn.disabled = true;
                        submitBtn.className = 'w-full py-[14px] mt-1 rounded-xl bg-[#1A2521] text-[#A7B2AE] border border-[#2A3731] font-bold text-[15px] tracking-wide transition-all duration-300 pointer-events-none';
                    }
                }
            }

            async function submitPartnerPasswordReset() {
                if (!partnerRecoveryResetPartnerDocId) {
                    setPartnerRecoveryResult('먼저 비밀번호 찾기를 통해 본인확인을 진행해주세요.', 'error');
                    return;
                }

                const pw = document.getElementById('partner-recovery-new-pw')?.value || '';
                const pwConfirm = document.getElementById('partner-recovery-new-pw-confirm')?.value || '';
                if (!isValidPartnerSignupPassword(pw)) {
                    setPartnerRecoveryResult('비밀번호 형식이 올바르지 않습니다.', 'error');
                    return;
                }
                if (pw !== pwConfirm) {
                    setPartnerRecoveryResult('새 비밀번호와 확인 값이 일치하지 않습니다.', 'error');
                    return;
                }
                if (typeof firebase === 'undefined') {
                    setPartnerRecoveryResult('데이터베이스 연결에 실패했습니다. 잠시 후 다시 시도해주세요.', 'error');
                    return;
                }

                try {
                    await firebase.firestore().collection('partners').doc(partnerRecoveryResetPartnerDocId).update({
                        password: pw,
                        passwordResetStatus: 'completed',
                        passwordResetCompletedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        passwordResetCode: firebase.firestore.FieldValue.delete(),
                        passwordResetExpiresAt: firebase.firestore.FieldValue.delete(),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });

                    setPartnerRecoveryResult('비밀번호가 재설정되었습니다. 로그인 화면으로 이동합니다.', 'success');
                    setTimeout(() => {
                        closePartnerRecoveryModal();
                        openPartnerLoginScreen();
                        const idInput = document.getElementById('partner-login-id-input');
                        if (idInput && partnerRecoveryResetUserId) {
                            idInput.value = partnerRecoveryResetUserId;
                        }
                        const pwInput = document.getElementById('partner-login-password-input');
                        if (pwInput) pwInput.focus();
                    }, 600);
                } catch (e) {
                    console.error('파트너 비밀번호 재설정 오류:', e);
                    setPartnerRecoveryResult('비밀번호 재설정 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error');
                }
            }

            async function handlePartnerFindId() {
                const company = document.getElementById('partner-find-id-company')?.value?.trim();
                const phone = document.getElementById('partner-find-id-phone')?.value?.trim();

                if (!company || !phone) {
                    setPartnerRecoveryResult('업체명과 휴대폰 번호를 모두 입력해주세요.', 'error');
                    return;
                }
                if (!isValidKoreanMobilePhone(phone)) {
                    setPartnerRecoveryResult('휴대폰번호 양식이 맞지 않습니다. (010으로 시작하는 11자리)', 'error');
                    return;
                }
                if (typeof firebase === 'undefined') {
                    setPartnerRecoveryResult('데이터베이스 연결에 실패했습니다. 잠시 후 다시 시도해주세요.', 'error');
                    return;
                }

                try {
                    const phoneDigits = normalizePhoneDigits(phone);
                    const snap = await firebase.firestore().collection('partners').where('name', '==', company).get();
                    if (snap.empty) {
                        setPartnerRecoveryResult('일치하는 파트너 계정을 찾을 수 없습니다.', 'error');
                        return;
                    }

                    let matchedUserId = '';
                    snap.forEach((doc) => {
                        if (matchedUserId) return;
                        const data = doc.data() || {};
                        const candidatePhone = normalizePhoneDigits(String(data.phone || data.phoneNumber || ''));
                        if (candidatePhone === phoneDigits && data.userId) {
                            matchedUserId = String(data.userId);
                        }
                    });

                    if (!matchedUserId) {
                        setPartnerRecoveryResult('일치하는 파트너 계정을 찾을 수 없습니다.', 'error');
                        return;
                    }

                    setPartnerRecoveryResult(`확인된 파트너 아이디는 ${matchedUserId} 입니다.`, 'success');
                } catch (e) {
                    console.error('파트너 아이디 찾기 오류:', e);
                    setPartnerRecoveryResult('아이디 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error');
                }
            }

            async function handlePartnerPasswordResetRequest() {
                const userId = document.getElementById('partner-find-pw-id')?.value?.trim();
                const company = document.getElementById('partner-find-pw-company')?.value?.trim();

                if (!userId || !company) {
                    setPartnerRecoveryResult('아이디와 업체명을 모두 입력해주세요.', 'error');
                    return;
                }
                if (typeof firebase === 'undefined') {
                    setPartnerRecoveryResult('데이터베이스 연결에 실패했습니다. 잠시 후 다시 시도해주세요.', 'error');
                    return;
                }

                try {
                    const snap = await firebase.firestore().collection('partners').where('userId', '==', userId).limit(1).get();
                    if (snap.empty) {
                        setPartnerRecoveryResult('입력하신 정보와 일치하는 계정을 찾을 수 없습니다.', 'error');
                        return;
                    }

                    const doc = snap.docs[0];
                    const data = doc.data() || {};
                    if ((data.name || '').trim() !== company) {
                        setPartnerRecoveryResult('입력하신 정보와 일치하는 계정을 찾을 수 없습니다.', 'error');
                        return;
                    }

                    partnerRecoveryResetPartnerDocId = doc.id;
                    partnerRecoveryResetUserId = userId;
                    const resetForm = document.getElementById('partner-recovery-reset-form');
                    if (resetForm) resetForm.classList.remove('hidden');
                    validatePartnerRecoveryPasswordForm();
                    setPartnerRecoveryResult('본인확인이 완료되었습니다. 새 비밀번호를 입력한 뒤 재설정을 완료해주세요.', 'success');
                } catch (e) {
                    console.error('파트너 비밀번호 찾기 오류:', e);
                    setPartnerRecoveryResult('비밀번호 찾기 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error');
                }
            }

            let partnerActivePasses = [
                {
                    name: "[12개월 입점권] 다독 프리미엄 파트너스",
                    purchaseDate: new Date().toISOString(),
                    expirationDate: new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000).toISOString()
                },
                {
                    name: "[6개월 입점권] 다독 파트너스",
                    purchaseDate: new Date().toISOString(),
                    expirationDate: new Date(new Date().getTime() + 180 * 24 * 60 * 60 * 1000).toISOString()
                }
            ];

            async function renderPartnerBanners() {
                const container = document.getElementById('partner-active-banners');
                if (!container) return;

                if (window.partnerCountdownInterval) {
                    clearInterval(window.partnerCountdownInterval);
                }

                const renderEmptyBanner = () => {
                    container.innerHTML = `
                <div class="bg-gradient-to-br from-[#0A1B13] to-[#040C08] border border-[var(--point-color)]/30 border-dashed rounded-2xl p-6 text-center flex flex-col items-center justify-center min-h-[140px]">
                    <svg class="w-10 h-10 text-[var(--point-color)]/50 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    <p class="text-[var(--text-sub)] text-[14.5px] font-medium leading-relaxed">구매한 입점권 확인이 불가능하거나 승인대기중입니다.<br><span class="text-white/60">상품 구매 후 관리자 승인을 기달려주세요.</span></p>
                </div>
            `;
                };

                const partnerDocId = localStorage.getItem('dadok_loggedInPartnerDocId') || sessionStorage.getItem('dadok_loggedInPartnerDocId');
                
                if (!partnerDocId) {
                    renderEmptyBanner();
                    return;
                }
                
                try {
                    const doc = await firebase.firestore().collection('partners').doc(partnerDocId).get();
                    if (!doc.exists) {
                        renderEmptyBanner();
                        return;
                    }
                    const data = doc.data();
                    
                    if (!canExposePartnerBanner(data)) {
                        renderEmptyBanner();
                        return;
                    }

                    const formatDT = (d) => `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

                    let isVIP = data.ticketType === "VIP";
                    let combinedName = "다독 파트너스 입점권";

                    let purchaseDateObj = (data.ticketCreatedAt && typeof data.ticketCreatedAt.toDate === 'function') 
                        ? data.ticketCreatedAt.toDate() 
                        : (data.createdAt && typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : new Date());

                    const expiryMs = getPartnerTicketExpiryMs(data);
                    if (!expiryMs) {
                        renderEmptyBanner();
                        return;
                    }
                    let finalExpirationDate = new Date(expiryMs);

                    let badgeHtml = '';
                    if (isVIP) {
                        badgeHtml = `<span class="inline-block bg-gradient-to-r from-[#D4AF37] to-[#B38D1B] text-[#06110D] text-[10px] font-extrabold px-2 py-0.5 rounded shadow-sm tracking-wide ml-2 align-middle">VIP</span>`;
                    } else if(data.ticketType === "Premium") {
                        badgeHtml = `<span class="inline-block bg-gradient-to-r from-[#00d2ff] to-[#3a7bd5] text-white text-[10px] font-extrabold px-2 py-0.5 rounded shadow-sm tracking-wide ml-2 align-middle">Premium</span>`;
                    } else {
                        badgeHtml = `<span class="inline-block bg-[var(--surface-color)] text-[var(--point-color)] border border-[var(--point-color)] text-[10px] font-extrabold px-2 py-0.5 rounded shadow-sm tracking-wide ml-2 align-middle">${data.ticketType}</span>`;
                    }

                    let html = `
                <div class="bg-gradient-to-br from-[#0A1B13] to-[#040C08] border border-[#D4AF37]/30 rounded-2xl p-5 relative overflow-hidden shadow-[0_5px_15px_rgba(212,175,55,0.05)] mb-3">
                    <div class="absolute top-0 right-0 p-3 opacity-10 pointer-events-none"><svg class="w-20 h-20 text-[var(--point-color)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg></div>
                    <div class="flex flex-col relative z-10">
                        <span class="text-[17px] text-white font-bold tracking-wide mb-1 flex items-center">${combinedName}${badgeHtml}</span>
                        <div class="flex items-end gap-2 mt-2">
                            <span class="text-[34px] font-extrabold text-[var(--point-color)] leading-none text-transparent bg-clip-text bg-gradient-to-r from-[#F3E5AB] to-[#D4AF37]" id="pass-days-combined">-일</span>
                            <span class="text-[22px] font-bold text-[var(--point-color)] leading-none mb-[2px]" id="pass-time-combined">--:--:--</span>
                            <span class="text-[14px] text-[var(--text-sub)] font-medium pb-[3px] ml-1">남음</span>
                        </div>
                        <div class="mt-4 pt-4 border-t border-[#D4AF37]/20 flex flex-col gap-1 text-[13px] text-[#A7B2AE]">
                            <div><span class="inline-block w-20 text-[var(--text-sub)]">최초 구매일</span> <span class="text-[#E0E8E4]">${formatDT(purchaseDateObj)}</span></div>
                            <div><span class="inline-block w-20 text-[var(--text-sub)]">예상 만료일</span> <span class="text-[#E0E8E4] font-medium">${formatDT(finalExpirationDate)}</span> <span class="text-[11px] opacity-70 ml-1">(자동 삭제)</span></div>
                        </div>
                    </div>
                </div>
            `;

                    container.innerHTML = html;

                    // 초단위 업데이트
                    const updateCountdown = () => {
                        const currentTime = new Date().getTime();
                        const diffTime = finalExpirationDate.getTime() - currentTime;

                        const daysEl = document.getElementById('pass-days-combined');
                        const timeEl = document.getElementById('pass-time-combined');

                        if (daysEl && timeEl) {
                            if (diffTime <= 0) {
                                if (window.partnerCountdownInterval) {
                                    clearInterval(window.partnerCountdownInterval);
                                    window.partnerCountdownInterval = null;
                                }
                                renderEmptyBanner();
                            } else {
                                const d = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                                const h = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                const m = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
                                const s = Math.floor((diffTime % (1000 * 60)) / 1000);

                                daysEl.innerText = `${d}일`;
                                timeEl.innerText = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                            }
                        }
                    };

                    updateCountdown(); // 즉시 한 번 갱신
                    window.partnerCountdownInterval = setInterval(updateCountdown, 1000);

                } catch(e) {
                    console.error("입점권 불러오기 실패:", e);
                    renderEmptyBanner();
                }
            }

            function openPartnerDashboard() {
                populateDashboardFromPartner();
                loadPartnerDashboardStats();
                renderPartnerBanners();
                refreshNoticeUnreadBadges();
                const modal = document.getElementById('partner-dashboard-modal');
                if (modal) {
                    modal.style.display = 'flex';
                    modal.style.transform = '';
                    setTimeout(() => {
                        modal.classList.remove('translate-x-full');
                    }, 10);
                }
            }

            function closePartnerDashboardToLogin() {
                const loginModal = document.getElementById('partner-login-modal');
                if (loginModal) {
                    loginModal.style.display = 'flex';
                    loginModal.classList.remove('translate-x-full');
                }

                const modal = document.getElementById('partner-dashboard-modal');
                if (modal) {
                    modal.classList.add('translate-x-full');
                    setTimeout(() => {
                        modal.style.display = 'none';
                    }, 300);
                }
            }

            function logoutPartnerToLogin() {
                isPartnerLoggedIn = false;
                localStorage.removeItem('dadok_isPartnerLoggedIn');
                sessionStorage.removeItem('dadok_isPartnerLoggedIn');
                localStorage.removeItem('dadok_loggedInPartnerDocId');
                sessionStorage.removeItem('dadok_loggedInPartnerDocId');
                localStorage.removeItem('dadok_loggedInPartnerUserId');
                sessionStorage.removeItem('dadok_loggedInPartnerUserId');
                partnerActivePasses = []; // 필요한 경우 로그아웃 시 배열 초기화 (여기서는 예시이므로 둠)
                closePartnerDashboardToLogin();
            }

            function closePartnerDashboardToMain() {
                const modal = document.getElementById('partner-dashboard-modal');
                if (modal) {
                    modal.classList.add('translate-x-full');
                    setTimeout(() => {
                        modal.style.display = 'none';
                    }, 300);
                }
            }

            function goToPartnerEntryFromDashboard() {
                // 대시보드 위에 입점 안내 페이지를 띄움
                openPartnerEntryScreen();
            }

            async function handlePartnerMockLogin() {
                const idInput = document.getElementById('partner-login-id-input');
                const passwordInput = document.getElementById('partner-login-password-input');

                const idError = document.getElementById('partner-login-id-error');
                const pwError = document.getElementById('partner-login-password-error');
                const mismatchError = document.getElementById('partner-login-mismatch-error');

                // 에러 상태 초기화
                idError.classList.add('hidden');
                pwError.classList.add('hidden');
                mismatchError.classList.add('hidden');
                idInput.classList.remove('!border-[#ef4444]');
                passwordInput.classList.remove('!border-[#ef4444]');

                let hasError = false;

                if (!idInput.value.trim()) {
                    idError.classList.remove('hidden');
                    idInput.classList.add('!border-[#ef4444]');
                    hasError = true;
                }

                if (!passwordInput.value.trim()) {
                    pwError.classList.remove('hidden');
                    passwordInput.classList.add('!border-[#ef4444]');
                    hasError = true;
                }

                if (hasError) return;

                // -----------------------
                // 1. 초기화 및 에러 체크
                // -----------------------
                let loginSuccess = false;
                let loggedInPartnerDocId = null;
                const idValue = idInput.value.trim();
                const pwValue = passwordInput.value.trim();

                if ((idValue === 'partner' || idValue === 'test') && pwValue === '1234') {
                    loginSuccess = true;
                } else {
                    if (typeof firebase === 'undefined') {
                        alert('데이터베이스 연결에 실패했습니다. 캐시 문제일 수 있으니 [Ctrl + F5]를 눌러 강력 새로고침 후 다시 시도해주세요.');
                        return;
                    }
                    const firestoreDb = firebase.firestore();
                    try {
                        const partnerSnapshot = await firestoreDb.collection('partners').where('userId', '==', idValue).get();
                        
                        if (!partnerSnapshot.empty) {
                            const partnerDoc = partnerSnapshot.docs[0];
                            const partnerData = partnerDoc.data();
                            
                            if (partnerData.password === pwValue) {
                                if (partnerData.status === 'pending') {
                                    alert('입점 심사가 진행 중입니다. 승인 완료 후 로그인 가능합니다.');
                                    return;
                                }
                                
                                loginSuccess = true;
                                loggedInPartnerDocId = partnerDoc.id;
                                
                                await firestoreDb.collection('partners').doc(partnerDoc.id).update({
                                    lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
                                });
                            }
                        }
                    } catch (error) {
                        console.error('파트너 로그인 검증 실패:', error);
                    }
                }

                if (loginSuccess) {
                    const keepLogin = document.getElementById('partner-keep-login-checkbox').checked;
                    isPartnerLoggedIn = true;
                    if (loggedInPartnerDocId) {
                        if (keepLogin) {
                            localStorage.setItem('dadok_loggedInPartnerDocId', loggedInPartnerDocId);
                            sessionStorage.removeItem('dadok_loggedInPartnerDocId');
                        } else {
                            sessionStorage.setItem('dadok_loggedInPartnerDocId', loggedInPartnerDocId);
                            localStorage.removeItem('dadok_loggedInPartnerDocId');
                        }
                    } else {
                        localStorage.removeItem('dadok_loggedInPartnerDocId');
                        sessionStorage.removeItem('dadok_loggedInPartnerDocId');
                    }

                    if (keepLogin) {
                        localStorage.setItem('dadok_loggedInPartnerUserId', idValue);
                        sessionStorage.removeItem('dadok_loggedInPartnerUserId');
                    } else {
                        sessionStorage.setItem('dadok_loggedInPartnerUserId', idValue);
                        localStorage.removeItem('dadok_loggedInPartnerUserId');
                    }
                    
                    if (keepLogin) {
                        localStorage.setItem('dadok_isPartnerLoggedIn', 'true');
                        sessionStorage.removeItem('dadok_isPartnerLoggedIn');
                    } else {
                        sessionStorage.setItem('dadok_isPartnerLoggedIn', 'true');
                        localStorage.removeItem('dadok_isPartnerLoggedIn');
                    }
                    // 로그인창이 사라지며 생기는 빈 화면(갭) 없이, 대시보드를 즉시 위로 슬라이드 인
                    openPartnerDashboard();

                    // 애니메이션이 완료되는 300ms 이후 백그라운드에서 로그인창 무음 닫기 및 초기화
                    setTimeout(() => {
                        const loginModal = document.getElementById('partner-login-modal');
                        if (loginModal) {
                            loginModal.classList.add('translate-x-full');
                            loginModal.style.display = 'none';
                        }
                        idInput.value = '';
                        passwordInput.value = '';
                    }, 300);
                } else {
                    mismatchError.classList.remove('hidden');
                    idInput.classList.add('!border-[#ef4444]');
                    passwordInput.classList.add('!border-[#ef4444]');
                }
            }

            function openPartnerSignupModal() {
                const modal = document.getElementById('partner-signup-modal');
                if (modal) forcePartnerSignupTop();
                modal.style.display = 'flex';
                setTimeout(() => {
                    modal.classList.remove('translate-x-full');
                    forcePartnerSignupTop();
                }, 10);
            }

            function forcePartnerSignupTop() {
                const modal = document.getElementById('partner-signup-modal');
                if (!modal) return;
                const scrollable = modal.querySelector('.overflow-y-auto');

                modal.scrollTop = 0;
                if (scrollable) scrollable.scrollTop = 0;

                // 렌더/애니메이션 직후에도 상단 고정 유지
                requestAnimationFrame(() => {
                    modal.scrollTop = 0;
                    if (scrollable) scrollable.scrollTop = 0;
                });
            }

            function closePartnerSignupModal() {
                const modal = document.getElementById('partner-signup-modal');
                modal.classList.add('translate-x-full');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            }

            function openLegalModal(type) {
                const modal = document.getElementById('legal-modal');
                const titleEl = document.getElementById('legal-modal-title');
                const contentEl = document.getElementById('legal-modal-content');

                if (type === 'terms') {
                    titleEl.innerText = "서비스 이용약관";
                    contentEl.innerText = "제 1장 총칙\n\n제 1조 [목적]\n본 약관은 다독(이하 '회사')이 제공하는 위치기반 마사지 정보 제공 서비스 및 제반 서비스의 이용과 관련하여 회사와 파트너 회원의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.\n\n제 2조 [정의]\n1. '서비스'라 함은 단말기(PC, 휴대형단말기 등의 각종 유무선 장치를 포함)에 반영되는 회사가 제공하는 다독 서비스 일체를 의미합니다.\n\n제 3조 [약관의 명시와 개정]\n1. 회사는 이 약관의 내용을 회원이 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.\n\n(상세 내용은 실제 서비스 런칭 시 법률 검토를 거쳐 최종 내용이 기입됩니다.)";
                } else if (type === 'privacy') {
                    titleEl.innerText = "개인정보 수집 및 동의";
                    contentEl.innerText = "개인정보 수집 및 이용 동의\n\n1. 수집하는 개인정보 항목\n- 필수: 아이디, 비밀번호, 업체명, 대표자명, 휴대폰 번호, 사업자등록번호\n- 선택: 업체 사진, 영업 시간, 계좌번호 등\n\n2. 개인정보 수집 및 이용 목적\n- 파트너 회원 가입 및 본인 확인\n- 서비스 이용에 따른 정산 및 고지사항 전달\n- 플랫폼 운영 모니터링 및 부정 결제 방지\n\n3. 개인정보 보유 및 이용 기간\n원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. (관련 법령에 따라 보존할 필요가 있는 경우 해당 법령을 따름)\n\n(상세 내용은 실제 서비스 런칭 시 법률 검토를 거쳐 최종 내용이 기입됩니다.)";
                }

                modal.style.display = 'flex';
                setTimeout(() => {
                    modal.classList.remove('translate-x-full');
                }, 10);
            }

            function closeLegalModal() {
                const modal = document.getElementById('legal-modal');
                modal.classList.add('translate-x-full');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            }

            function isValidPartnerSignupPassword(password = '') {
                const pwRule = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
                return pwRule.test(password);
            }

            function normalizePhoneDigits(value = '') {
                return value.replace(/\D/g, '');
            }

            function isValidKoreanMobilePhone(value = '') {
                const digits = normalizePhoneDigits(value);
                return /^010\d{8}$/.test(digits);
            }

            function setPartnerAgreeCheckboxState(checkbox, checked) {
                if (!checkbox) return;
                checkbox.checked = checked;
                const icon = checkbox.nextElementSibling;
                if (icon) {
                    icon.classList.toggle('opacity-0', !checked);
                    icon.classList.toggle('opacity-100', checked);
                }
            }

            function syncPartnerSignupAgreeAll() {
                const allCheckbox = document.getElementById('partner-signup-agree-all');
                const reqBoxes = document.querySelectorAll('#partner-signup-modal .req-agree');
                if (!allCheckbox || reqBoxes.length === 0) return;

                const allChecked = Array.from(reqBoxes).every(box => box.checked);
                setPartnerAgreeCheckboxState(allCheckbox, allChecked);
                checkPartnerSignupForm();
            }

            function togglePartnerSignupAgreeAll(allCheckbox) {
                const reqBoxes = document.querySelectorAll('#partner-signup-modal .req-agree');
                reqBoxes.forEach(box => setPartnerAgreeCheckboxState(box, allCheckbox.checked));
                setPartnerAgreeCheckboxState(allCheckbox, allCheckbox.checked);
                checkPartnerSignupForm();
            }

            function resetPartnerSignupForm() {
                const fields = [
                    'partner-signup-id',
                    'partner-signup-pw',
                    'partner-signup-pw-confirm',
                    'partner-signup-company',
                    'partner-signup-name',
                    'partner-signup-phone',
                    'partner-signup-biz-no'
                ];
                fields.forEach((fieldId) => {
                    const el = document.getElementById(fieldId);
                    if (el) el.value = '';
                });

                const defaultBizType = document.querySelector('input[name="business_type"][value="개인사업자"]');
                if (defaultBizType) defaultBizType.checked = true;

                const fileInput = document.getElementById('partner-signup-file');
                if (fileInput) fileInput.value = '';
                const fileLabel = document.getElementById('partner-signup-file-label');
                if (fileLabel) fileLabel.innerHTML = '사업자등록증 또는 신분증 업로드';

                const reqBoxes = document.querySelectorAll('#partner-signup-modal .req-agree');
                reqBoxes.forEach((box) => setPartnerAgreeCheckboxState(box, false));
                setPartnerAgreeCheckboxState(document.getElementById('partner-signup-agree-all'), false);

                partnerSignupIdStatus = 'idle';
                setIdStatusMessage(document.getElementById('partner-signup-id-status-msg'), 'idle', '');
                setIdStatusMessage(document.getElementById('partner-signup-pw-status-msg'), 'idle', '');
                setIdStatusMessage(document.getElementById('partner-signup-pw-confirm-status-msg'), 'idle', '');
                setIdStatusMessage(document.getElementById('partner-signup-phone-status-msg'), 'idle', '');

                const btn = document.getElementById('partner-signup-submit-btn');
                if (btn) btn.innerText = '파트너 가입 제출하기';

                checkPartnerSignupForm();
            }


            function checkPartnerSignupForm() {
                const id = document.getElementById('partner-signup-id')?.value?.trim();
                const pw = document.getElementById('partner-signup-pw')?.value;
                const pwConfirm = document.getElementById('partner-signup-pw-confirm')?.value;
                const company = document.getElementById('partner-signup-company')?.value?.trim();
                const name = document.getElementById('partner-signup-name')?.value?.trim();
                const phone = document.getElementById('partner-signup-phone')?.value?.trim();
                const isPartnerIdAvailable = partnerSignupIdStatus === 'available';

                let valid = true;
                const isPasswordValid = isValidPartnerSignupPassword(pw || '');

                const pwStatusEl = document.getElementById('partner-signup-pw-status-msg');
                if (pwStatusEl) {
                    if (!pw) {
                        pwStatusEl.classList.add('hidden');
                    } else if (isPasswordValid) {
                        pwStatusEl.className = 'text-[#22c55e] text-[13px] font-bold ml-1';
                        pwStatusEl.innerText = '※ 사용 가능한 비밀번호입니다.';
                    } else {
                        pwStatusEl.className = 'text-[#EF4444] text-[13px] font-bold ml-1';
                        pwStatusEl.innerText = '※ 비밀번호는 8자리 이상이며 영문/숫자/특수문자를 모두 포함해야 합니다.';
                    }
                }

                const pwConfirmStatusEl = document.getElementById('partner-signup-pw-confirm-status-msg');
                if (pwConfirmStatusEl) {
                    if (!pwConfirm) {
                        pwConfirmStatusEl.classList.add('hidden');
                    } else if (pw !== pwConfirm) {
                        pwConfirmStatusEl.className = 'text-[#EF4444] text-[13px] font-bold ml-1';
                        pwConfirmStatusEl.innerText = '※ 비밀번호가 일치하지 않습니다.';
                    } else {
                        pwConfirmStatusEl.className = 'text-[#22c55e] text-[13px] font-bold ml-1';
                        pwConfirmStatusEl.innerText = '※ 비밀번호가 일치합니다.';
                    }
                }

                const phoneStatusEl = document.getElementById('partner-signup-phone-status-msg');
                if (phoneStatusEl) {
                    if (!phone) {
                        phoneStatusEl.classList.add('hidden');
                    } else if (isValidKoreanMobilePhone(phone)) {
                        phoneStatusEl.className = 'text-[#22c55e] text-[13px] font-bold ml-1';
                        phoneStatusEl.innerText = '※ 사용 가능한 휴대폰번호입니다.';
                    } else {
                        phoneStatusEl.className = 'text-[#EF4444] text-[13px] font-bold ml-1';
                        phoneStatusEl.innerText = '※ 휴대폰번호 양식이 맞지 않습니다. (010으로 시작하는 11자리)';
                    }
                }

                if (!id || !isPartnerIdAvailable || !pw || !isPasswordValid || !pwConfirm || pw !== pwConfirm || !company || !name || !phone || !isValidKoreanMobilePhone(phone)) {
                    valid = false;
                }

                const checkedRadio = document.querySelector('input[name="business_type"]:checked');
                let bizType = checkedRadio ? checkedRadio.value : '개인사업자';

                if (bizType === '개인사업자' || bizType === '법인사업자') {
                    const bizNo = document.getElementById('partner-signup-biz-no')?.value?.trim();
                    if (!bizNo) valid = false;
                }

                const fileInput = document.getElementById('partner-signup-file');
                if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
                    valid = false;
                }

                const checkboxes = document.querySelectorAll('#partner-signup-modal .req-agree');
                for (let box of checkboxes) {
                    if (!box.checked) {
                        valid = false;
                        break;
                    }
                }

                const btn = document.getElementById('partner-signup-submit-btn');
                if (!btn) return;

                if (valid) {
                    btn.className = "group relative flex items-center justify-center w-full py-[18px] mt-2 rounded-2xl bg-gradient-to-r from-[var(--point-color)] to-[#B59530] text-[#06110D] font-bold text-[18px] tracking-[0.1em] transition-all duration-300 shadow-[0_8px_20px_rgba(212,175,55,0.25)] hover:brightness-110 active:scale-[0.98] cursor-pointer";
                    btn.disabled = false;
                } else {
                    btn.className = "flex items-center justify-center w-full py-[18px] mt-2 rounded-2xl bg-[#1A2521] text-[#A7B2AE] font-bold text-[18px] tracking-[0.1em] transition-all duration-300 pointer-events-none";
                    btn.disabled = true;
                }
            }

            async function handlePartnerSignupSubmit() {
                const id = document.getElementById('partner-signup-id').value.trim();
                const pw = document.getElementById('partner-signup-pw').value;
                const pwConfirm = document.getElementById('partner-signup-pw-confirm').value;
                const company = document.getElementById('partner-signup-company').value.trim();
                const ownerName = document.getElementById('partner-signup-name').value.trim();
                const phone = document.getElementById('partner-signup-phone').value.trim();
                const bizNo = document.getElementById('partner-signup-biz-no').value.trim();

                const checkedRadio = document.querySelector('input[name="business_type"]:checked');
                let bizType = checkedRadio ? checkedRadio.value : '개인사업자';
                
                if (id.length < SIGNUP_ID_MIN_LENGTH) {
                    alert('아이디는 4자리 이상 입력해주세요.');
                    return;
                }

                if (!isValidPartnerSignupPassword(pw)) {
                    alert('비밀번호는 8자리 이상이며 영문/숫자/특수문자를 모두 포함해야 합니다.');
                    return;
                }

                if (!isValidKoreanMobilePhone(phone)) {
                    alert('휴대폰번호 양식이 맞지 않습니다. (010으로 시작하는 11자리)');
                    return;
                }

                if (pw && pw !== pwConfirm) {
                    alert('입력하신 두 비밀번호가 일치하지 않습니다.');
                    return;
                }

                const checkboxes = document.querySelectorAll('#partner-signup-modal .req-agree');
                for (let box of checkboxes) {
                    if (!box.checked) {
                        alert('모든 필수 약관 및 확약 내용에 동의해 주셔야 가입이 가능합니다.');
                        return;
                    }
                }

                if (typeof firebase === 'undefined') {
                    alert('데이터베이스 연결에 실패했습니다. 캐시 문제일 수 있으니 [Ctrl + F5]를 눌러 강력 새로고침 후 다시 시도해주세요.');
                    return;
                }

                const firestoreDb = firebase.firestore();
                
                try {
                    const isDuplicate = await checkIdDuplicateAcrossUsersAndPartners(id);
                    if (isDuplicate) {
                        alert('이미 사용중인 파트너 아이디입니다.');
                        partnerSignupIdStatus = 'duplicate';
                        setIdStatusMessage(document.getElementById('partner-signup-id-status-msg'), 'duplicate', '※ 이미 사용 중인 아이디입니다.');
                        checkPartnerSignupForm();
                        return;
                    }

                    const now = firebase.firestore.FieldValue.serverTimestamp();
                    
                    const btn = document.getElementById('partner-signup-submit-btn');
                    if (btn) btn.innerText = '서류 업로드 중...';

                    let bizDocUrl = '';
                    const fileInput = document.getElementById('partner-signup-file');
                    if (fileInput && fileInput.files && fileInput.files[0]) {
                        const file = fileInput.files[0];
                        try {
                            const storageRef = firebase.storage().ref();
                            const fileRef = storageRef.child('partners_biz/' + Date.now() + '_' + file.name);
                            const snapshot = await fileRef.put(file);
                            bizDocUrl = await snapshot.ref.getDownloadURL();
                        } catch (uploadObjError) {
                            console.error('이미지 업로드 중 실패:', uploadObjError);
                            alert('증빙 서류 업로드에 실패했습니다. 관리자에게 문의바랍니다.');
                            if (btn) btn.innerText = '파트너 가입 완료하기';
                            return;
                        }
                    }

                    if (btn) btn.innerText = '데이터 저장 중...';

                    // 파트너 컬렉션에 새 문서 저장
                    await firestoreDb.collection('partners').add({
                        userId: id,
                        password: pw, // 향후 암호화 적용 권장
                        name: company,
                        ownerName: ownerName,
                        phone: phone,
                        bizType: bizType,
                        bizNo: bizNo,
                        bizDocUrl: bizDocUrl,
                        status: 'pending', // 대기 상태
                        createdAt: now,
                        updatedAt: now
                    });
                    
                    if (btn) btn.innerText = '파트너 가입 완료하기';
                } catch (error) {
                    console.error('파트너 등록 중 오류 발생:', error);
                    alert('가입 처리 중 문제가 발생했습니다. 관리자에게 문의하세요.');
                    return;
                }

                // 모달 전환 로직
                resetPartnerSignupForm();
                closePartnerSignupModal();
                const successModal = document.getElementById('partner-signup-success-modal');
                successModal.style.display = 'flex';
                setTimeout(() => {
                    successModal.classList.remove('opacity-0');
                }, 10);
            }

            // 성공화면에서 버튼 클릭 시 로그인 화면으로 전환
            function goToPartnerLoginFromSuccess() {
                // 1. 성공 모달 닫기
                const successModal = document.getElementById('partner-signup-success-modal');
                successModal.classList.add('opacity-0');
                setTimeout(() => {
                    successModal.style.display = 'none';
                }, 300);

                // 2. 파트너 로그인 화면 열기
                openPartnerLoginScreen();
            }

            // 파트너 입점 관련 자바스크립트
            function openPartnerApplication(months, priceStr, title) {
                if (typeof isPartnerLoggedIn === 'undefined' || !isPartnerLoggedIn) {
                    showCustomToast('파트너 가입 후 이용 가능합니다.');
                    openPartnerSignupModal();
                    return;
                }

                document.getElementById('app-months').value = months;
                document.getElementById('app-package-title').innerText = title;
                document.getElementById('app-package-price').innerText = '₩' + priceStr;

                const appModal = document.getElementById('partner-application-modal');
                appModal.style.display = 'flex';
                setTimeout(() => {
                    appModal.classList.remove('translate-x-full');
                }, 10);
            }

            function closePartnerApplication() {
                const appModal = document.getElementById('partner-application-modal');
                appModal.classList.add('translate-x-full');
                setTimeout(() => {
                    appModal.style.display = 'none';
                    // 리셋
                    document.getElementById('app-company-name').value = '';
                    document.getElementById('app-depositor-name').value = '';
                    document.getElementById('app-contact').value = '';

                    // 에러 상태 리셋
                    document.getElementById('app-company-name-error').classList.add('hidden');
                    document.getElementById('app-depositor-name-error').classList.add('hidden');
                    document.getElementById('app-contact-error').classList.add('hidden');
                    document.getElementById('app-company-name').classList.remove('!border-[#ef4444]');
                    document.getElementById('app-depositor-name').classList.remove('!border-[#ef4444]');
                    document.getElementById('app-contact').classList.remove('!border-[#ef4444]');
                }, 300);
            }

            async function submitPartnerApplication() {
                const companyInput = document.getElementById('app-company-name');
                const depositorInput = document.getElementById('app-depositor-name');
                const contactInput = document.getElementById('app-contact');
                const submitBtn = document.querySelector('#partner-application-modal button[onclick="submitPartnerApplication()"]');

                const company = companyInput.value.trim();
                const depositor = depositorInput.value.trim();
                const contact = contactInput.value.trim();
                const title = document.getElementById('app-package-title').innerText;
                const months = Number(document.getElementById('app-months')?.value || 0);
                const amountText = document.getElementById('app-package-price')?.innerText || '';
                const amount = Number(String(amountText).replace(/[^0-9]/g, '')) || 0;

                let isValid = true;

                if (!company) {
                    document.getElementById('app-company-name-error').classList.remove('hidden');
                    companyInput.classList.add('!border-[#ef4444]');
                    isValid = false;
                } else {
                    document.getElementById('app-company-name-error').classList.add('hidden');
                    companyInput.classList.remove('!border-[#ef4444]');
                }

                if (!depositor) {
                    document.getElementById('app-depositor-name-error').classList.remove('hidden');
                    depositorInput.classList.add('!border-[#ef4444]');
                    isValid = false;
                } else {
                    document.getElementById('app-depositor-name-error').classList.add('hidden');
                    depositorInput.classList.remove('!border-[#ef4444]');
                }

                if (!contact) {
                    document.getElementById('app-contact-error').classList.remove('hidden');
                    contactInput.classList.add('!border-[#ef4444]');
                    isValid = false;
                } else {
                    document.getElementById('app-contact-error').classList.add('hidden');
                    contactInput.classList.remove('!border-[#ef4444]');
                }

                if (!isValid) {
                    return;
                }

                if (!isValidKoreanMobilePhone(contact)) {
                    alert('연락처 양식이 맞지 않습니다. (010으로 시작하는 11자리)');
                    return;
                }

                if (typeof firebase === 'undefined') {
                    alert('데이터베이스 연결에 실패했습니다. 잠시 후 다시 시도해주세요.');
                    return;
                }

                const partnerDocId = localStorage.getItem('dadok_loggedInPartnerDocId') || sessionStorage.getItem('dadok_loggedInPartnerDocId');
                if (!partnerDocId) {
                    alert('로그인 정보가 만료되었습니다. 다시 로그인 후 신청해주세요.');
                    openPartnerLoginScreen();
                    return;
                }

                try {
                    if (submitBtn) {
                        submitBtn.disabled = true;
                        submitBtn.innerText = '신청 접수 중...';
                    }
                    await firebase.firestore().collection('subscription_requests').add({
                        partnerId: partnerDocId,
                        companyName: company,
                        depositorName: depositor,
                        contact: normalizePhoneDigits(contact),
                        months: months || 0,
                        amount: amount || 0,
                        ticketTitle: title || '',
                        status: 'pending',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                } catch (e) {
                    console.error('입점권 신청 저장 실패:', e);
                    alert('입점권 신청 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerText = '신청서 제출하기';
                    }
                    return;
                } finally {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerText = '신청서 제출하기';
                    }
                }

                // alert 대신 성공 모달 표시 (디자인 고도화)
                const successHTML = `
            <div class="mb-4 text-center">
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--point-color)]/15 border border-[var(--point-color)]/35 mb-3">
                    <span class="text-[var(--point-color)] text-[12px] font-bold tracking-widest">입점 신청 접수 완료</span>
                </div>
                <div class="leading-relaxed">
                    <span class="text-[var(--point-color)] font-extrabold text-[22px] tracking-wide">[${company}]</span>
                    <span class="text-white font-bold text-[20px]"> 대표님</span>
                    <span class="text-white/80 font-medium text-[18px]">,</span><br>
                    <span class="text-[#F6DC7A] font-extrabold text-[19px] tracking-wide">[${title}]</span>
                    <span class="text-white font-semibold text-[18px]"> 신청이 접수되었습니다.</span>
                </div>
            </div>

            <div class="bg-gradient-to-br from-[#111F18] to-[#070E0B] rounded-2xl p-4 border-2 border-[var(--point-color)]/70 mb-4 shadow-[0_14px_30px_rgba(212,175,55,0.22),0_10px_28px_rgba(0,0,0,0.35)]">
                <div class="flex items-center gap-2 mb-3">
                    <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--point-color)] text-[#06110D] font-black text-[13px]">!</span>
                    <span class="text-[#F5E7AA] text-[13px] font-bold tracking-wide">입금 정보 안내</span>
                </div>
                <div class="bg-[#F4C63D] rounded-xl px-4 py-3 border border-[#C99F27]">
                    <div class="grid grid-cols-[72px_1fr] gap-y-1.5 items-start text-[15px] leading-[1.7] tracking-wide text-left">
                        <span class="text-[#121212]/80 font-semibold">입금 계좌</span>
                        <span class="text-[#06110D] font-extrabold">카카오뱅크 3333-37-0613731</span>
                        <span class="text-[#121212]/80 font-semibold">예금주</span>
                        <span class="text-[#06110D] font-extrabold">다독(DA:DOK)</span>
                        <span class="text-[#121212]/80 font-semibold">확인 안내</span>
                        <span class="text-[#06110D] font-bold">입금 확인 후 즉시 파트너 권한 부여</span>
                    </div>
                </div>
            </div>

            <div class="text-center bg-[#0A1310] border border-[#22312B] rounded-xl px-4 py-3">
                <p class="text-[#9EA9A5] text-[13px] leading-relaxed tracking-wide">
                    승인 관련 문의는 <strong class="text-white font-semibold">다독 신고센터 / 문의</strong>로<br>연락주시기 바랍니다.
                </p>
            </div>
        `;
                document.getElementById('app-success-message').innerHTML = successHTML;

                const successModal = document.getElementById('partner-application-success-modal');
                successModal.style.display = 'flex';
                setTimeout(() => {
                    successModal.classList.remove('translate-x-full');
                }, 10);
            }

            function finishPartnerApplication() {
                const successModal = document.getElementById('partner-application-success-modal');
                const appModal = document.getElementById('partner-application-modal');
                const entryModal = document.getElementById('partner-entry-modal');
                const loginModal = document.getElementById('partner-login-modal');
                const dashboardModal = document.getElementById('partner-dashboard-modal');

                // 중간 화면들 즉시 숨김 처리하여 번쩍임 방지
                if (appModal) {
                    appModal.style.display = 'none';
                    appModal.classList.add('translate-x-full');
                }
                if (entryModal) {
                    entryModal.style.display = 'none';
                    entryModal.classList.add('translate-x-full');
                }

                // 메인화면 이동: 로그인 모달이 떠 있다면 닫아둠
                if (loginModal) {
                    loginModal.classList.add('translate-x-full');
                    loginModal.style.display = 'none';
                }
                if (dashboardModal) {
                    dashboardModal.classList.add('translate-x-full');
                    dashboardModal.style.display = 'none';
                }

                // 성공 모달 슬라이드 아웃
                successModal.classList.add('translate-x-full');

                setTimeout(() => {
                    successModal.style.display = 'none';

                    // 백그라운드에서 신청 폼 데이터 깔끔하게 리셋
                    document.getElementById('app-company-name').value = '';
                    document.getElementById('app-depositor-name').value = '';
                    document.getElementById('app-contact').value = '';
                    document.getElementById('app-company-name-error').classList.add('hidden');
                    document.getElementById('app-depositor-name-error').classList.add('hidden');
                    document.getElementById('app-contact-error').classList.add('hidden');
                    document.getElementById('app-company-name').classList.remove('!border-[#ef4444]');
                    document.getElementById('app-depositor-name').classList.remove('!border-[#ef4444]');
                    document.getElementById('app-contact').classList.remove('!border-[#ef4444]');

                    if (typeof goHome === 'function') {
                        goHome();
                    } else {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                }, 300);
            }

            function closeSuccessAndReturnToEntry() {
                const successModal = document.getElementById('partner-application-success-modal');
                successModal.classList.add('translate-x-full');
                setTimeout(() => {
                    successModal.style.display = 'none';
                }, 300);

                closePartnerApplication();
            }

            function openPartnerEntryScreen() {
                const modal = document.getElementById('partner-entry-modal');
                modal.style.display = 'flex';
                setTimeout(() => {
                    modal.classList.remove('translate-x-full');
                }, 10);
            }

            function closePartnerEntryScreen() {
                const modal = document.getElementById('partner-entry-modal');
                modal.classList.add('translate-x-full');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            }

            async function handleMockLogin() {
                const idInput = document.getElementById('login-id-input');
                const passwordInput = document.getElementById('login-password-input');
                const idValue = idInput.value.trim();
                const pwValue = passwordInput.value.trim();

                if (!idValue || !pwValue) {
                    alert('아이디와 비밀번호를 입력해주세요.');
                    return;
                }

                if (typeof firebase === 'undefined') {
                    alert('서버 연결 실패. 페이지를 강력 새로고침(Ctrl + F5) 후 다시 시도해주세요.');
                    return;
                }

                const firestoreDb = firebase.firestore();
                try {
                    const userSnapshot = await firestoreDb.collection('users').where('userId', '==', idValue).get();
                    
                    if (!userSnapshot.empty) {
                        const userDoc = userSnapshot.docs[0];
                        const userData = userDoc.data();
                        
                        // 과거 데이터라서 비밀번호가 없으면 1234로 통과시키거나 저장된 비밀번호 비교
                        if ((!userData.password && pwValue === '1234') || (userData.password && userData.password === pwValue)) {
                            
                            // 최근 접속일시 갱신
                            await firestoreDb.collection('users').doc(userDoc.id).update({
                                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
                            });

                            completeLoginProcess(idValue);
                            return;
                        }
                    }
                    
                    // ID 없거나 비밀번호 불일치
                    alert('아이디 또는 비밀번호가 일치하지 않습니다.');
                } catch (error) {
                    console.error("Login Error: ", error);
                    alert("로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
                }
            }

            function completeLoginProcess(username) {
                isLoggedIn = true;
                const idInput = document.getElementById('login-id-input');
                const passwordInput = document.getElementById('login-password-input');
                if(idInput) idInput.value = '';
                if(passwordInput) passwordInput.value = '';

                closeLoginFormModal();
                closeLoginModal();
                updateHeaderToLoggedInState(username);

                const keepLoginBox = document.getElementById('keep-login-checkbox');
                const keepLogin = keepLoginBox ? keepLoginBox.checked : false;
                if (keepLogin) {
                    localStorage.setItem('dadok_isLoggedIn', 'true');
                    localStorage.setItem('dadok_username', username);
                } else {
                    sessionStorage.setItem('dadok_isLoggedIn', 'true');
                    sessionStorage.setItem('dadok_username', username);
                }
            }

            function updateHeaderToLoggedInState(name) {
                const selectedGender = document.querySelector('input[name="signup-gender"]:checked');
                const genderVal = selectedGender ? selectedGender.value : 'female';
                const avatarFileName = genderVal === 'male' ? 'cute_asian_male_avatar.png' : 'cute_asian_female_avatar.png';

                const headerProfileBtn = document.getElementById('header-profile-btn');
                if (headerProfileBtn) {
                    headerProfileBtn.setAttribute('onclick', "openMyPageModal()");
                    headerProfileBtn.innerHTML = `
                <div class="w-[36px] h-[36px] rounded-full bg-cover bg-center border-[1.5px] border-[var(--point-color)] shadow-sm overflow-hidden" style="background-image: url('./assets/${avatarFileName}');"></div>
            `;
                }

                const myPageProfileImg = document.getElementById('mypage-profile-img');
                if (myPageProfileImg) {
                    myPageProfileImg.style.backgroundImage = `url('./assets/${avatarFileName}')`;
                }

                const mypageName = document.getElementById('mypage-user-name');
                if (mypageName && name) {
                    mypageName.textContent = name;
                }
            }

            // 마이페이지 모달 처리 
            function openMyPageModal() {
                const myPageModal = document.getElementById('mypage-modal');
                myPageModal.style.display = 'flex';
                refreshNoticeUnreadBadges();
                void myPageModal.offsetWidth; // force reflow
                setTimeout(() => {
                    myPageModal.classList.remove('translate-x-full');
                    myPageModal.classList.add('translate-x-0');
                }, 10);
            }

            function closeMyPageModal() {
                const myPageModal = document.getElementById('mypage-modal');
                myPageModal.classList.remove('translate-x-0');
                myPageModal.classList.add('translate-x-full');
                setTimeout(() => {
                    myPageModal.style.display = 'none';
                }, 300);
            }

            // 마이페이지 서브 모달 처리 로직
            function openChatListModal() {
                const modal = document.getElementById('chat-list-modal');
                modal.style.display = 'flex';
                void modal.offsetWidth;
                setTimeout(() => {
                    modal.classList.remove('translate-x-full');
                    modal.classList.add('translate-x-0');
                }, 10);
                renderChatList();
            }

            function closeChatListModal() {
                const modal = document.getElementById('chat-list-modal');
                modal.classList.remove('translate-x-0');
                modal.classList.add('translate-x-full');
                setTimeout(() => {
                    modal.style.display = 'none';
                    modal.classList.remove('z-[240]');
                    modal.classList.add('z-[220]');
                }, 300);
            }

            function renderChatList() {
                const container = document.getElementById('chat-list-container');
                if (userChats.length === 0) {
                    container.innerHTML = `<div class="p-10 text-sm text-center w-full" style="color:var(--text-sub);">채팅 내역이 없습니다.<br>원하는 업체와 대화를 시작해보세요.</div>`;
                    return;
                }
                let html = '<div class="space-y-4">';
                userChats.forEach(chat => {
                    html += `
                <div class="bg-[var(--surface-color)] p-4 rounded-xl border border-[var(--border-color)] flex items-center gap-4 cursor-pointer hover:bg-[var(--point-color)]/10 transition-colors" onclick="resumeChat('${chat.id}')">
                    <div class="w-12 h-12 rounded-full bg-cover bg-center shrink-0 border border-[var(--point-color)]/50" style="background-image: url('${chat.image}')"></div>
                    <div class="flex-1 overflow-hidden">
                        <div class="flex justify-between items-center mb-1">
                            <h4 class="text-white font-bold text-[15px]">${chat.name}</h4>
                            <span class="text-[11px] text-[var(--text-sub)]">${chat.time}</span>
                        </div>
                        <p class="text-[13px] text-[var(--text-sub)] truncate">${chat.lastMessage}</p>
                    </div>
                </div>
            `;
                });
                html += '</div>';
                container.innerHTML = html;
            }

            function openFavoritesModal() {
                const modal = document.getElementById('favorites-modal');
                modal.style.display = 'flex';
                void modal.offsetWidth;
                setTimeout(() => {
                    modal.classList.remove('translate-x-full');
                    modal.classList.add('translate-x-0');
                }, 10);
                renderFavoritesList();
            }

            function closeFavoritesModal() {
                const modal = document.getElementById('favorites-modal');
                modal.classList.remove('translate-x-0');
                modal.classList.add('translate-x-full');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            }

            function renderFavoritesList() {
                const container = document.getElementById('favorites-list-container');
                if (userFavorites.length === 0) {
                    container.innerHTML = `<div class="p-10 text-sm text-center w-full" style="color:var(--text-sub);">찜한 업체가 없습니다.<br>마음에 드는 업체를 하트로 찜해보세요.</div>`;
                    return;
                }
                let html = '<div class="space-y-4">';
                userFavorites.forEach(partner => {
                    let region = partner.desc ? partner.desc.split(' · ')[0] : (partner.region || '');
                    html += `
                <div class="bg-[var(--surface-color)] p-4 rounded-xl border border-[var(--border-color)] flex gap-4 cursor-pointer hover:border-[var(--point-color)]/50 transition-colors" onclick="openProfileFromFavorites('${partner.name}', '${partner.desc}', '${partner.id}', ${partner.reviews || 0}, ${partner.rating || 0}, '${partner.massage}', '${partner.place}', '${partner.age}', '${partner.image}', '${partner.ticketType || '일반 입점'}', '${partner.ticketExpiry || ''}')">
                    <div class="w-[80px] h-[80px] rounded-lg bg-cover bg-center shrink-0 shadow-sm" style="background-image: url('${partner.image}')"></div>
                    <div class="flex-1 flex flex-col justify-center overflow-hidden">
                        <div class="flex justify-between items-start mb-1.5">
                            <h4 class="text-white font-bold text-lg leading-tight truncate mr-2">${partner.name}</h4>
                            <svg class="w-5 h-5 text-[var(--point-color)] shrink-0 drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]" fill="currentColor" viewBox="0 0 24 24" onclick="event.stopPropagation(); removeFavorite('${partner.id}')"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                        </div>
                        <p class="text-[13px] text-[var(--point-color)] font-medium mb-1 truncate">${partner.massage}</p>
                        <p class="text-[12px] text-[var(--text-sub)] truncate">${region}</p>
                    </div>
                </div>
            `;
                });
                html += '</div>';
                container.innerHTML = html;
            }

            function escapeNoticeText(value = '') {
                return String(value || '')
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');
            }

            function formatNoticeDate(value) {
                if (!value) return '-';
                let d = null;
                if (typeof value.toDate === 'function') d = value.toDate();
                else if (typeof value.toMillis === 'function') d = new Date(value.toMillis());
                else d = new Date(value);
                if (!d || Number.isNaN(d.getTime())) return '-';
                return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
            }

            let currentNoticeAudience = 'user';
            let currentNoticeRecipient = { type: '', docId: '' };
            let currentNoticeRows = [];

            async function resolveNotificationRecipient(audience) {
                if (audience === 'partner') {
                    const partnerDocId = localStorage.getItem('dadok_loggedInPartnerDocId') || sessionStorage.getItem('dadok_loggedInPartnerDocId');
                    return { type: 'partner', docId: partnerDocId || '' };
                }

                const userId = localStorage.getItem('dadok_username') || sessionStorage.getItem('dadok_username') || '';
                if (!userId || typeof firebase === 'undefined') {
                    return { type: 'user', docId: '' };
                }
                const snap = await firebase.firestore().collection('users').where('userId', '==', userId).limit(1).get();
                if (snap.empty) return { type: 'user', docId: '' };
                return { type: 'user', docId: snap.docs[0].id };
            }

            async function renderNoticeList(audience) {
                const container = document.getElementById('notice-list-container');
                if (!container) return;
                container.innerHTML = '<div class="text-[var(--text-sub)] text-sm">알림을 불러오는 중입니다...</div>';

                if (typeof firebase === 'undefined') {
                    container.innerHTML = '<div class="text-[#F87171] text-sm">데이터베이스 연결에 실패했습니다.</div>';
                    return;
                }

                try {
                    const target = await resolveNotificationRecipient(audience);
                    currentNoticeAudience = audience;
                    currentNoticeRecipient = target;
                    if (!target.docId) {
                        container.innerHTML = '<div class="text-[var(--text-sub)] text-sm">수신자 정보를 찾을 수 없습니다.</div>';
                        return;
                    }

                    const snap = await firebase.firestore().collection('user_notifications')
                        .where('recipientType', '==', target.type)
                        .where('recipientDocId', '==', target.docId)
                        .get();

                    const rows = [];
                    snap.forEach((doc) => rows.push({ id: doc.id, ...doc.data() }));
                    rows.sort((a, b) => {
                        const getTs = (x) => {
                            if (x?.createdAt && typeof x.createdAt.toMillis === 'function') return x.createdAt.toMillis();
                            return 0;
                        };
                        return getTs(b) - getTs(a);
                    });

                    if (!rows.length) {
                        currentNoticeRows = [];
                        refreshNoticeUnreadBadges();
                        container.innerHTML = '<div class="text-[var(--text-sub)] text-sm p-4">도착한 관리자 알림이 없습니다.</div>';
                        return;
                    }

                    currentNoticeRows = rows;
                    refreshNoticeUnreadBadges();

                    let html = '<div class="space-y-3">';
                    rows.forEach((row) => {
                        const priorityBadge = row.priority === 'important'
                            ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">중요</span>'
                            : '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#11291D] text-[var(--point-color)] border border-[#2A3731]">일반</span>';
                        const unreadDot = row.isRead ? '' : '<span class="inline-flex w-2.5 h-2.5 rounded-full bg-red-400"></span>';
                        const linkBtn = row.linkType && row.linkType !== 'none'
                            ? `<button onclick="openNoticeLinkedScreen('${row.id}', '${row.linkType}')" class="px-2 py-1 text-[10px] font-bold rounded-lg border border-[#2A3731] text-white hover:border-[var(--point-color)] hover:text-[var(--point-color)] transition-colors">관련 화면 이동</button>`
                            : '';
                        const readBtn = row.isRead
                            ? '<span class="text-[10px] text-[#6C7A74]">읽음</span>'
                            : `<button onclick="markNoticeAsRead('${row.id}')" class="px-2 py-1 text-[10px] font-bold rounded-lg border border-[var(--point-color)]/40 text-[var(--point-color)] hover:bg-[var(--point-color)]/15 transition-colors">읽음 처리</button>`;
                        html += `
                            <div class="bg-[#0A1B13] border ${row.isRead ? 'border-[#2A3731]' : 'border-[var(--point-color)]/35'} rounded-2xl p-4">
                                <div class="flex items-start justify-between gap-2 mb-2">
                                    <div class="flex items-center gap-2 text-white font-bold text-[15px]">${unreadDot}${escapeNoticeText(row.title || '(제목 없음)')}</div>
                                    <div class="flex items-center gap-2">${priorityBadge}${readBtn}${linkBtn}</div>
                                </div>
                                <div class="text-[11px] text-[var(--text-sub)] mb-2">${escapeNoticeText(row.category || 'notice')} · ${formatNoticeDate(row.createdAt)} · ${escapeNoticeText(row.linkLabel || '이동 없음')}</div>
                                <p class="text-[13px] text-white/85 leading-relaxed whitespace-pre-wrap">${escapeNoticeText(row.body || '')}</p>
                            </div>
                        `;
                    });
                    html += '</div>';
                    container.innerHTML = html;
                } catch (e) {
                    console.error('알림함 로드 실패:', e);
                    container.innerHTML = `<div class="text-[#F87171] text-sm p-4">알림 로드 실패: ${escapeNoticeText(e.message || 'Unknown error')}</div>`;
                }
            }

            async function refreshNoticeUnreadBadges() {
                const userBadge = document.getElementById('user-notice-unread-badge');
                const partnerBadge = document.getElementById('partner-notice-unread-badge');

                if (currentNoticeRows.length > 0 && currentNoticeAudience) {
                    const unread = currentNoticeRows.filter((r) => !r.isRead).length;
                    const targetBadge = currentNoticeAudience === 'partner' ? partnerBadge : userBadge;
                    if (targetBadge) {
                        targetBadge.innerText = String(unread);
                        targetBadge.classList.toggle('hidden', unread === 0);
                    }
                }

                if (typeof firebase === 'undefined') return;
                try {
                    const [userTarget, partnerTarget] = await Promise.all([
                        resolveNotificationRecipient('user'),
                        resolveNotificationRecipient('partner')
                    ]);
                    const loadUnread = async (target) => {
                        if (!target?.docId) return 0;
                        const snap = await firebase.firestore().collection('user_notifications')
                            .where('recipientType', '==', target.type)
                            .where('recipientDocId', '==', target.docId)
                            .get();
                        let unread = 0;
                        snap.forEach((doc) => {
                            if (!doc.data()?.isRead) unread++;
                        });
                        return unread;
                    };
                    const [userUnread, partnerUnread] = await Promise.all([loadUnread(userTarget), loadUnread(partnerTarget)]);
                    if (userBadge) {
                        userBadge.innerText = String(userUnread);
                        userBadge.classList.toggle('hidden', userUnread === 0);
                    }
                    if (partnerBadge) {
                        partnerBadge.innerText = String(partnerUnread);
                        partnerBadge.classList.toggle('hidden', partnerUnread === 0);
                    }
                } catch (e) {
                    console.error('알림 뱃지 갱신 실패:', e);
                }
            }

            async function markNoticeAsRead(notificationId) {
                if (!notificationId || typeof firebase === 'undefined') return;
                try {
                    await firebase.firestore().collection('user_notifications').doc(notificationId).update({
                        isRead: true,
                        readAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    await renderNoticeList(currentNoticeAudience);
                } catch (e) {
                    console.error('읽음 처리 실패:', e);
                }
            }

            async function openNoticeLinkedScreen(notificationId, linkType = 'none') {
                await markNoticeAsRead(notificationId);
                closeNoticeModal();

                if (!linkType || linkType === 'none') return;
                if (linkType === 'partner_dashboard') {
                    if (typeof openPartnerDashboard === 'function') openPartnerDashboard();
                    return;
                }
                if (linkType === 'partner_entry') {
                    if (typeof openPartnerEntryScreen === 'function') openPartnerEntryScreen();
                    return;
                }
                if (linkType === 'partner_login') {
                    if (typeof openPartnerLoginScreen === 'function') openPartnerLoginScreen();
                    return;
                }
                if (linkType === 'user_mypage') {
                    if (typeof openMyPageModal === 'function') openMyPageModal();
                    return;
                }
                if (linkType === 'user_security') {
                    if (typeof openMyPageModal === 'function') openMyPageModal();
                    setTimeout(() => {
                        if (typeof openSecurityModal === 'function') openSecurityModal();
                    }, 250);
                    return;
                }
                if (linkType === 'support_center') {
                    if (typeof openSupportScreen === 'function') openSupportScreen();
                    return;
                }
                if (linkType === 'login') {
                    if (typeof openLoginModal === 'function') openLoginModal();
                }
            }

            async function markAllNoticesAsRead() {
                if (!currentNoticeRecipient?.docId || typeof firebase === 'undefined') return;
                try {
                    const snap = await firebase.firestore().collection('user_notifications')
                        .where('recipientType', '==', currentNoticeRecipient.type)
                        .where('recipientDocId', '==', currentNoticeRecipient.docId)
                        .where('isRead', '==', false)
                        .get();
                    if (snap.empty) return;
                    const batch = firebase.firestore().batch();
                    snap.forEach((doc) => {
                        batch.update(doc.ref, {
                            isRead: true,
                            readAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    });
                    await batch.commit();
                    await renderNoticeList(currentNoticeAudience);
                } catch (e) {
                    console.error('전체 읽음 처리 실패:', e);
                }
            }

            function openNoticeModal(audience = 'user') {
                const modal = document.getElementById('notice-modal');
                const titleEl = document.getElementById('notice-modal-title');
                if (!modal) return;
                if (titleEl) titleEl.innerText = audience === 'partner' ? '업체 관리자 알림함' : '회원 관리자 알림함';
                modal.style.display = 'flex';
                void modal.offsetWidth;
                setTimeout(() => {
                    modal.classList.remove('translate-x-full');
                    modal.classList.add('translate-x-0');
                }, 10);
                renderNoticeList(audience);
            }

            function closeNoticeModal() {
                const modal = document.getElementById('notice-modal');
                if (!modal) return;
                modal.classList.remove('translate-x-0');
                modal.classList.add('translate-x-full');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            }

            function openSecurityModal() {
                const modal = document.getElementById('security-modal');
                modal.style.display = 'flex';
                void modal.offsetWidth;
                setTimeout(() => {
                    modal.classList.remove('translate-x-full');
                    modal.classList.add('translate-x-0');
                }, 10);
            }

            function closeSecurityModal() {
                const modal = document.getElementById('security-modal');
                modal.classList.remove('translate-x-0');
                modal.classList.add('translate-x-full');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            }

            // 로그아웃 처리
            function logout() {
                isLoggedIn = false;
                const headerProfileBtn = document.getElementById('header-profile-btn');
                if (headerProfileBtn) {
                    headerProfileBtn.setAttribute('onclick', "openLoginModal()");
                    headerProfileBtn.innerHTML = `
                <svg class="w-[36px] h-[36px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
            `;
                }

                closeMyPageModal();

                // 로그인 상태 초기화
                localStorage.removeItem('dadok_isLoggedIn');
                localStorage.removeItem('dadok_username');
                sessionStorage.removeItem('dadok_isLoggedIn');
                sessionStorage.removeItem('dadok_username');
            }

            function goHome() {
                // 모달 추적 변수 초기화로 뒤로가기 방지 무시
                if (typeof chatOpenedFromModal !== 'undefined') chatOpenedFromModal = false;
                if (typeof profileOpenedFromFavorites !== 'undefined') profileOpenedFromFavorites = false;
                if (typeof profileOpenedFromPartnerDashboard !== 'undefined') profileOpenedFromPartnerDashboard = false;

                // 하단 시트 닫기
                closeAllModals();

                // 전체 화면 모달 강제 닫기 (존재하는 함수만 호출)
                if (typeof closeMyPageModal === 'function') closeMyPageModal();
                if (typeof closeFavoritesModal === 'function') closeFavoritesModal();
                if (typeof closeChatListModal === 'function') closeChatListModal();
                if (typeof closeNoticeModal === 'function') closeNoticeModal();
                if (typeof closeLoginModal === 'function') closeLoginModal();
                if (typeof closeLoginFormModal === 'function') closeLoginFormModal();
                if (typeof closeFindIdPwScreen === 'function') closeFindIdPwScreen();
                if (typeof closeSignupModal === 'function') closeSignupModal();

                document.getElementById('overlay').classList.remove('show');
                document.body.style.overflow = 'auto'; // 스크롤 활성화

                // 모든 검색 조건 및 필터 초기화
                if (typeof resetAllFiltersFast === 'function') resetAllFiltersFast();
                document.getElementById('filter-options-container').classList.add('hidden');

                // 메인 화면 최상단 고정
                window.scrollTo({ top: 0, behavior: 'auto' });
                document.documentElement.scrollTop = 0;
                document.body.scrollTop = 0;
                const appContainer = document.getElementById('app-container');
                if (appContainer) appContainer.scrollTop = 0;
            }

            // 페이지 로드 시 로그인 상태 복원
            function checkLoginState() {
                if (localStorage.getItem('dadok_isPartnerLoggedIn') === 'true' || sessionStorage.getItem('dadok_isPartnerLoggedIn') === 'true') {
                    isPartnerLoggedIn = true;
                }
                if (localStorage.getItem('dadok_isLoggedIn') === 'true') {
                    isLoggedIn = true;
                    updateHeaderToLoggedInState(localStorage.getItem('dadok_username') || 'test');
                } else if (sessionStorage.getItem('dadok_isLoggedIn') === 'true') {
                    isLoggedIn = true;
                    updateHeaderToLoggedInState(sessionStorage.getItem('dadok_username') || 'test');
                }
            }

            function showCustomToast(text) {
                const toast = document.getElementById('global-custom-toast');
                const toastText = document.getElementById('global-toast-text');
                if (toast && toastText) {
                    toastText.innerHTML = text;
                    toast.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
                    toast.classList.add('opacity-100', 'scale-100');
                    setTimeout(() => {
                        toast.classList.remove('opacity-100', 'scale-100');
                        toast.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
                    }, 2500);
                } else {
                    alert(text);
                }
            }

            function showSuccessToast(text) {
                const toast = document.getElementById('success-toast');
                const toastText = document.getElementById('success-toast-text');
                if (toast && toastText) {
                    toastText.innerHTML = text;
                    toast.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
                    toast.classList.add('opacity-100', 'scale-100');
                    setTimeout(() => {
                        toast.classList.remove('opacity-100', 'scale-100');
                        toast.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
                    }, 2500);
                } else {
                    alert(text);
                }
            }

            function addMenuItem() {
                const container = document.getElementById('menu-list-container');
                if (!container) return;

                const itemHtml = `
            <div class="menu-item relative bg-[#06110D] border border-[#2A3731] rounded-xl p-5 transition-all duration-300 group hover:border-[var(--point-color)]/50 opacity-0">
                <button class="absolute top-4 right-4 text-[var(--text-sub)] hover:text-[#E91E63] p-1.5 flex items-center justify-center transition-colors bg-[#0A1B13] rounded-full z-10" onclick="this.closest('.menu-item').remove()">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                
                <div class="flex flex-col gap-4">
                    <div class="flex gap-4 pr-10">
                        <div class="flex-1 flex flex-col gap-1.5">
                            <label class="text-[var(--text-sub)] text-[12px] font-bold tracking-widest ml-1">코스 이름</label>
                            <input type="text" value="" class="menu-name-input w-full bg-[#0A1B13] border border-[#2A3731] rounded-xl px-4 py-3 text-[var(--text-main)] font-medium text-[15px] focus:outline-none focus:border-[var(--point-color)] transition-all" placeholder="예: A 코스">
                        </div>
                        <div class="w-[120px] shrink-0 flex flex-col gap-1.5">
                            <label class="text-[var(--text-sub)] text-[12px] font-bold tracking-widest ml-1">가격</label>
                            <div class="flex items-center gap-2">
                                <input type="text" value="" class="menu-price-input w-full bg-[#0A1B13] border border-[#2A3731] rounded-xl px-4 py-3 text-[var(--text-main)] font-medium text-[15px] text-right focus:outline-none focus:border-[var(--point-color)] transition-all" placeholder="가격">
                                <span class="text-[var(--text-sub)] text-[13px] font-bold shrink-0">원</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex flex-col gap-1.5">
                        <label class="text-[var(--text-sub)] text-[12px] font-bold tracking-widest ml-1">마사지 테마 / 종류</label>
                        <input type="text" value="" class="menu-theme-input w-full bg-[#0A1B13] border border-[#2A3731] rounded-xl px-4 py-3 text-[var(--text-main)] font-medium text-[15px] focus:outline-none focus:border-[var(--point-color)] transition-all" placeholder="예: 스웨디시 & 스포츠 케어">
                    </div>
                    
                    <div class="flex flex-col gap-1.5">
                        <label class="text-[var(--text-sub)] text-[12px] font-bold tracking-widest ml-1">상세 내용 및 시간</label>
                        <input type="text" value="" class="menu-desc-input w-full bg-[#0A1B13] border border-[#2A3731] rounded-xl px-4 py-3 text-[var(--text-main)] font-medium text-[15px] focus:outline-none focus:border-[var(--point-color)] transition-all" placeholder="예: 건식 및 소프트 아로마 60분">
                    </div>
                </div>
            </div>
        `;

                container.insertAdjacentHTML('beforeend', itemHtml);

                // 애니메이션 효과
                const newItems = container.querySelectorAll('.menu-item');
                const lastItem = newItems[newItems.length - 1];

                // 브라우저 렌더링 틱 후 opacity 변경으로 페이드인
                setTimeout(() => {
                    lastItem.classList.remove('opacity-0');
                }, 10);
            }

            // 초기 실행
            document.addEventListener('DOMContentLoaded', () => {
                checkLoginState();
                initSliderDrag();
            });

            // 다독 초이스 무한 자동 스크롤 & 마우스 드래그 기능
            function initSliderDrag() {
                const sliderWrapper = document.querySelector('.slider-wrapper');
                const sliderTrack = document.getElementById('slider-track');
                if (!sliderWrapper || !sliderTrack) return;

                let isDown = false;
                let startX;
                let scrollLeftPos;
                let isHovering = false;
                let currentScroll = 0;
                let isDraggingCard = false;

                function smoothScroll() {
                    if (!isHovering && !isDown && sliderTrack.scrollWidth > sliderWrapper.clientWidth) {
                        currentScroll += 0.5; // 슬라이드 속도
                        // 절반(1세트)를 넘어섰으면 다시 0으로 리셋하여 무한 효과
                        if (currentScroll >= sliderTrack.scrollWidth / 2) {
                            currentScroll = 0;
                        }
                        sliderWrapper.scrollLeft = currentScroll;
                    } else {
                        currentScroll = sliderWrapper.scrollLeft;
                    }
                    requestAnimationFrame(smoothScroll);
                }

                sliderWrapper.addEventListener('mouseenter', () => { isHovering = true; });
                sliderWrapper.addEventListener('mouseleave', () => {
                    isHovering = false;
                    isDown = false;
                });

                sliderWrapper.addEventListener('mousedown', (e) => {
                    isDown = true;
                    isDraggingCard = false;
                    startX = e.pageX - sliderWrapper.offsetLeft;
                    scrollLeftPos = sliderWrapper.scrollLeft;
                });

                sliderWrapper.addEventListener('mouseup', () => {
                    isDown = false;
                });

                sliderWrapper.addEventListener('mousemove', (e) => {
                    if (!isDown) return;
                    e.preventDefault();
                    const x = e.pageX - sliderWrapper.offsetLeft;
                    const walk = (x - startX) * 1.5; // 스크롤 민감도
                    if (Math.abs(walk) > 5) isDraggingCard = true; // 일정 이상 드래그하면 클릭 무시
                    sliderWrapper.scrollLeft = scrollLeftPos - walk;
                    currentScroll = sliderWrapper.scrollLeft;
                });

                // 드래그 중 실수로 카드 클릭되는 것 방지
                sliderWrapper.addEventListener('click', (e) => {
                    if (isDraggingCard) {
                        e.preventDefault();
                        e.stopPropagation();
                        isDraggingCard = false;
                    }
                }, true);

                // 터치 기기 충돌 방지
                sliderWrapper.addEventListener('touchstart', () => { isDown = true; isHovering = true; }, { passive: true });
                sliderWrapper.addEventListener('touchend', () => { isDown = false; isHovering = false; });
                sliderWrapper.addEventListener('touchmove', () => { currentScroll = sliderWrapper.scrollLeft; }, { passive: true });

                // 애니메이션 루프 시작
                requestAnimationFrame(smoothScroll);
            }

            async function ensureCurrentPartnerForBanner() {
                if (currentPartner && (currentPartner.id || currentPartner.name)) {
                    return currentPartner;
                }

                if (typeof populateDashboardFromPartner === 'function') {
                    await populateDashboardFromPartner();
                }
                if (currentPartner && (currentPartner.id || currentPartner.name)) {
                    return currentPartner;
                }

                try {
                    const savedProfile = localStorage.getItem('myPartnerProfile');
                    if (savedProfile) {
                        const parsed = JSON.parse(savedProfile);
                        if (parsed && typeof parsed === 'object') {
                            currentPartner = {
                                id: parsed.id || 'my-partner',
                                ...parsed
                            };
                            return currentPartner;
                        }
                    }
                } catch (e) {
                    console.warn('로컬 파트너 프로필 파싱 실패:', e);
                }

                if (typeof firebase !== 'undefined') {
                    const partnerDocId = localStorage.getItem('dadok_loggedInPartnerDocId') || sessionStorage.getItem('dadok_loggedInPartnerDocId');
                    if (partnerDocId) {
                        try {
                            const doc = await firebase.firestore().collection('partners').doc(partnerDocId).get();
                            if (doc.exists) {
                                currentPartner = { id: doc.id, ...doc.data() };
                                return currentPartner;
                            }
                        } catch (e) {
                            console.error('파트너 배너용 문서 조회 실패:', e);
                        }
                    }

                    const partnerUserId = localStorage.getItem('dadok_loggedInPartnerUserId') || sessionStorage.getItem('dadok_loggedInPartnerUserId');
                    if (partnerUserId) {
                        try {
                            const snap = await firebase
                                .firestore()
                                .collection('partners')
                                .where('userId', '==', partnerUserId)
                                .limit(1)
                                .get();
                            if (!snap.empty) {
                                const doc = snap.docs[0];
                                currentPartner = { id: doc.id, ...doc.data() };
                                sessionStorage.setItem('dadok_loggedInPartnerDocId', doc.id);
                                return currentPartner;
                            }
                        } catch (e) {
                            console.error('파트너 userId 기반 조회 실패:', e);
                        }
                    }
                }

                return null;
            }

            async function openMyBanner() {
                await ensureCurrentPartnerForBanner();
                if (!currentPartner) {
                    showCustomToast("파트너 정보가 없습니다.");
                    return;
                }
                profileOpenedFromPartnerDashboard = true;
                const profileSheet = document.getElementById('profile-sheet');
                const overlay = document.getElementById('overlay');
                const ctaBtn = document.getElementById('cta-button');
                if (profileSheet) profileSheet.style.zIndex = '250';
                if (overlay) overlay.style.zIndex = '240';
                if (ctaBtn) ctaBtn.style.zIndex = '260';

                // 대시보드는 유지한 채 상세 시트만 상단에 오버레이로 표시
                openProfile(
                    currentPartner.name,
                    currentPartner.desc || '다독 인증 프리미엄 케어',
                    'my-partner',
                    window.partnerDashboardStats.totalReviews.toString(),
                    '5.0',
                    currentPartner.massage || '스웨디시,건식',
                    currentPartner.region ? ('서울 ' + currentPartner.region) : '서울 강남/서초',
                    currentPartner.age || '전연령',
                    currentPartner.image || ''
                );
            }

            function openChatWithUser(userName) {
                showCustomToast(userName + "과(와)의 채팅방을 엽니다.");
                // 실제 구현에서는 채팅 화면을 여는 함수인 openChatSheet 등을 활용하여 상태 연동
            }

            function openChatTabFromDashboard() {
                // 기존에 대시보드를 숨기기 위해 적용된 inline style 초기화 (메인화면에서 재진입시 오류 방지)
                const partnerModal = document.getElementById('partner-dashboard-modal');
                if (partnerModal) partnerModal.style.transform = '';

                // 메인 화면으로 이동하지 않고 파트너 대시보드 위에 채팅 목록 모달 띄우기
                const chatModal = document.getElementById('chat-list-modal');
                if (chatModal) {
                    chatModal.classList.remove('z-[220]');
                    chatModal.classList.add('z-[240]'); // 파트너 대시보드(z-[230]) 위로 설정

                    chatModal.style.display = 'flex';
                    void chatModal.offsetWidth;
                    setTimeout(() => {
                        chatModal.classList.remove('translate-x-full');
                        chatModal.classList.add('translate-x-0');
                    }, 10);

                    if (typeof renderChatList === 'function') {
                        renderChatList();
                    }
                }
            }

            const DEFAULT_PARTNER_DASHBOARD_STATS = {
                totalVisitors: 0,
                todayVisitors: 0,
                totalReviews: 0,
                todayReviews: 0
            };

            // [추가] 글로벌 파트너 대시보드 스탯 연동
            window.partnerDashboardStats = JSON.parse(
                localStorage.getItem('partnerDashboardStats') || JSON.stringify(DEFAULT_PARTNER_DASHBOARD_STATS)
            );
            window.partnerDashboardStatsDate = localStorage.getItem('partnerDashboardStatsDate') || '';

            function getTodayDateKey() {
                // KST(Asia/Seoul) fixed day key for daily reset consistency.
                const kstDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
                return `${kstDate.getFullYear()}-${String(kstDate.getMonth() + 1).padStart(2, '0')}-${String(kstDate.getDate()).padStart(2, '0')}`;
            }

            function saveDashboardStats() {
                localStorage.setItem('partnerDashboardStats', JSON.stringify(window.partnerDashboardStats));
                localStorage.setItem('partnerDashboardStatsDate', window.partnerDashboardStatsDate || getTodayDateKey());
            }

            function getLoggedInPartnerDocId() {
                return localStorage.getItem('dadok_loggedInPartnerDocId') || sessionStorage.getItem('dadok_loggedInPartnerDocId');
            }

            function normalizeDashboardStats(rawStats = {}) {
                return {
                    totalVisitors: Number(rawStats.totalVisitors || 0),
                    todayVisitors: Number(rawStats.todayVisitors || 0),
                    totalReviews: Number(rawStats.totalReviews || 0),
                    todayReviews: Number(rawStats.todayReviews || 0)
                };
            }

            function getCurrentViewerId() {
                return (
                    localStorage.getItem('dadok_loggedInUserDocId') ||
                    sessionStorage.getItem('dadok_loggedInUserDocId') ||
                    localStorage.getItem('dadok_username') ||
                    sessionStorage.getItem('dadok_username') ||
                    'anonymous'
                );
            }

            let partnerStatsRefreshTimer = null;

            function queueRefreshPartnerDashboardStats(delayMs = 250) {
                if (partnerStatsRefreshTimer) clearTimeout(partnerStatsRefreshTimer);
                partnerStatsRefreshTimer = setTimeout(() => {
                    refreshPartnerDashboardStatsFromSource();
                }, delayMs);
            }

            async function trackPartnerProfileView(partnerId) {
                const cleanPartnerId = String(partnerId || '').trim();
                if (!cleanPartnerId || cleanPartnerId === 'my-partner' || typeof firebase === 'undefined') return;
                const loggedInPartnerId = getLoggedInPartnerDocId();
                if (loggedInPartnerId && loggedInPartnerId === cleanPartnerId) return;

                try {
                    await firebase.firestore().collection('partner_profile_views').add({
                        partnerId: cleanPartnerId,
                        viewerId: getCurrentViewerId(),
                        dayKey: getTodayDateKey(),
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    if (loggedInPartnerId && loggedInPartnerId === cleanPartnerId) {
                        queueRefreshPartnerDashboardStats();
                    }
                } catch (e) {
                    console.error('방문자 로그 저장 실패', e);
                }
            }

            async function persistPartnerReview(partnerId, rating, text, authorMaskedId) {
                const cleanPartnerId = String(partnerId || '').trim();
                if (!cleanPartnerId || cleanPartnerId === 'my-partner' || typeof firebase === 'undefined') return;
                try {
                    await firebase.firestore().collection('partner_reviews').add({
                        partnerId: cleanPartnerId,
                        viewerId: getCurrentViewerId(),
                        author: authorMaskedId || 'user',
                        rating: Number(rating || 0),
                        content: String(text || '').trim(),
                        dayKey: getTodayDateKey(),
                        status: 'published',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });

                    const loggedInPartnerId = getLoggedInPartnerDocId();
                    if (loggedInPartnerId && loggedInPartnerId === cleanPartnerId) {
                        queueRefreshPartnerDashboardStats();
                    }
                } catch (e) {
                    console.error('리뷰 저장 실패', e);
                }
            }

            async function syncDashboardStatsToFirestore() {
                const partnerDocId = getLoggedInPartnerDocId();
                if (!partnerDocId || typeof firebase === 'undefined') return;

                try {
                    window.partnerDashboardStatsDate = getTodayDateKey();
                    await firebase.firestore().collection('partners').doc(partnerDocId).set({
                        stats: normalizeDashboardStats(window.partnerDashboardStats),
                        statsDate: window.partnerDashboardStatsDate,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                } catch (e) {
                    console.error('대시보드 통계 동기화 실패', e);
                }
            }

            async function refreshPartnerDashboardStatsFromSource() {
                const partnerDocId = getLoggedInPartnerDocId();
                const todayKey = getTodayDateKey();
                if (!partnerDocId || typeof firebase === 'undefined') {
                    window.partnerDashboardStats = normalizeDashboardStats(window.partnerDashboardStats || DEFAULT_PARTNER_DASHBOARD_STATS);
                    window.partnerDashboardStatsDate = todayKey;
                    saveDashboardStats();
                    updateDashboardDOM();
                    return;
                }

                try {
                    const db = firebase.firestore();
                    const [allViewsSnap, allReviewsSnap] = await Promise.all([
                        db.collection('partner_profile_views')
                            .where('partnerId', '==', partnerDocId)
                            .get(),
                        db.collection('partner_reviews')
                            .where('partnerId', '==', partnerDocId)
                            .get()
                    ]);

                    let todayVisitors = 0;
                    allViewsSnap.forEach((doc) => {
                        const data = doc.data() || {};
                        if ((data.dayKey || '') === todayKey) todayVisitors++;
                    });

                    let totalReviews = 0;
                    let todayReviews = 0;
                    allReviewsSnap.forEach((doc) => {
                        const data = doc.data() || {};
                        if ((data.status || 'published') !== 'published') return;
                        totalReviews++;
                        if ((data.dayKey || '') === todayKey) todayReviews++;
                    });

                    window.partnerDashboardStats = normalizeDashboardStats({
                        totalVisitors: allViewsSnap.size,
                        todayVisitors: todayVisitors,
                        totalReviews: totalReviews,
                        todayReviews: todayReviews
                    });
                    window.partnerDashboardStatsDate = todayKey;

                    saveDashboardStats();
                    updateDashboardDOM();
                    await syncDashboardStatsToFirestore();
                } catch (e) {
                    console.error('실데이터 대시보드 집계 실패', e);
                    window.partnerDashboardStats = normalizeDashboardStats(window.partnerDashboardStats || DEFAULT_PARTNER_DASHBOARD_STATS);
                    window.partnerDashboardStatsDate = todayKey;
                    saveDashboardStats();
                    updateDashboardDOM();
                }
            }

            async function loadPartnerDashboardStats() {
                await refreshPartnerDashboardStatsFromSource();
            }

            function updateDashboardDOM() {
                const el1 = document.getElementById('status-total-visitors');
                const el2 = document.getElementById('status-today-visitors');
                const el3 = document.getElementById('status-total-reviews');
                const el4 = document.getElementById('status-today-reviews');

                if (el1) el1.innerHTML = window.partnerDashboardStats.totalVisitors.toLocaleString() + '<span class="text-[12px] text-[var(--text-sub)] font-normal ml-0.5">명</span>';
                if (el2) el2.innerHTML = window.partnerDashboardStats.todayVisitors.toLocaleString() + '<span class="text-[12px] text-[var(--point-color)]/80 font-normal ml-0.5">명</span>';
                if (el3) el3.innerHTML = window.partnerDashboardStats.totalReviews.toLocaleString() + '<span class="text-[12px] text-[var(--text-sub)] font-normal ml-0.5">개</span>';
                if (el4) el4.innerHTML = window.partnerDashboardStats.todayReviews.toLocaleString() + '<span class="text-[12px] text-[var(--point-color)]/80 font-normal ml-0.5">개</span>';
            }

            // 초기 DOM 로드 시 스탯 렌더링
            document.addEventListener('DOMContentLoaded', () => {
                updateDashboardDOM();
                loadPartnerDashboardStats();
                populateDashboardFromPartner();
            });

            // [추가] currentPartner 상태를 대시보드 UI에 채우기
            async function populateDashboardFromPartner() {
                const partnerDocId = localStorage.getItem('dadok_loggedInPartnerDocId') || sessionStorage.getItem('dadok_loggedInPartnerDocId');
                if (partnerDocId && typeof firebase !== 'undefined') {
                    try {
                        const doc = await firebase.firestore().collection('partners').doc(partnerDocId).get();
                        if (doc.exists) {
                            currentPartner = { id: doc.id, ...doc.data() };
                            // ticketType fallback string support
                            if (currentPartner.ticketType && currentPartner.status === 'active') { // check basic pass presence inside component
                            }
                        }
                    } catch(e){
                        console.error("데이터 통신 중 오류 발생", e);
                    }
                }

                if (!currentPartner) return;

                const nameInput = document.getElementById('partner-input-name');
                const contactInput = document.getElementById('partner-input-contact');
                const addressInput = document.getElementById('partner-input-address');
                const descInput = document.getElementById('partner-input-desc');

                if (nameInput) nameInput.value = currentPartner.name || '';
                if (contactInput) contactInput.value = currentPartner.contact || currentPartner.phoneNumber || '';
                if (addressInput) addressInput.value = currentPartner.address || currentPartner.location || '';
                if (descInput) descInput.value = currentPartner.desc || currentPartner.catchphrase || '';

                // 메뉴 채우기
                const menuContainer = document.getElementById('menu-list-container');
                if (menuContainer && currentPartner.menus) {
                    menuContainer.innerHTML = '';
                    currentPartner.menus.forEach(menu => {
                        const itemHtml = `
            <div class="menu-item relative bg-[#06110D] border border-[#2A3731] rounded-xl p-5 transition-all duration-300 group hover:border-[var(--point-color)]/50 opacity-100">
                <button class="absolute top-4 right-4 text-[var(--text-sub)] hover:text-[#E91E63] p-1.5 flex items-center justify-center transition-colors bg-[#0A1B13] rounded-full z-10" onclick="this.closest('.menu-item').remove()">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                
                <div class="flex flex-col gap-4">
                    <div class="flex gap-4 pr-10">
                        <div class="flex-1 flex flex-col gap-1.5">
                            <label class="text-[var(--text-sub)] text-[12px] font-bold tracking-widest ml-1">코스 이름</label>
                            <input type="text" value="${menu.name || ''}" class="menu-name-input w-full bg-[#0A1B13] border border-[#2A3731] rounded-xl px-4 py-3 text-[var(--text-main)] font-medium text-[15px] focus:outline-none focus:border-[var(--point-color)] transition-all" placeholder="예: A 코스">
                        </div>
                        <div class="w-[120px] shrink-0 flex flex-col gap-1.5">
                            <label class="text-[var(--text-sub)] text-[12px] font-bold tracking-widest ml-1">가격</label>
                            <div class="flex items-center gap-2">
                                <input type="text" value="${(menu.price || '').toString().replace(/[^0-9]/g, '')}" class="menu-price-input w-full bg-[#0A1B13] border border-[#2A3731] rounded-xl px-4 py-3 text-[var(--text-main)] font-medium text-[15px] text-right focus:outline-none focus:border-[var(--point-color)] transition-all" placeholder="가격">
                                <span class="text-[var(--text-sub)] text-[13px] font-bold shrink-0">원</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex flex-col gap-1.5">
                        <label class="text-[var(--text-sub)] text-[12px] font-bold tracking-widest ml-1">마사지 테마 / 종류</label>
                        <input type="text" value="${menu.theme || ''}" class="menu-theme-input w-full bg-[#0A1B13] border border-[#2A3731] rounded-xl px-4 py-3 text-[var(--text-main)] font-medium text-[15px] focus:outline-none focus:border-[var(--point-color)] transition-all" placeholder="예: 스웨디시 & 스포츠 케어">
                    </div>
                    
                    <div class="flex flex-col gap-1.5">
                        <label class="text-[var(--text-sub)] text-[12px] font-bold tracking-widest ml-1">상세 내용 및 시간</label>
                        <input type="text" value="${menu.desc || ''}" class="menu-desc-input w-full bg-[#0A1B13] border border-[#2A3731] rounded-xl px-4 py-3 text-[var(--text-main)] font-medium text-[15px] focus:outline-none focus:border-[var(--point-color)] transition-all" placeholder="예: 건식 및 소프트 아로마 60분">
                    </div>
                </div>
            </div>`;
                        menuContainer.insertAdjacentHTML('beforeend', itemHtml);
                    });
                }
            }

            // [추가] 대시보드에서 설정 저장 시 currentPartner 에 반영
            async function saveDashboardSettings() {
                const partnerDocId = localStorage.getItem('dadok_loggedInPartnerDocId') || sessionStorage.getItem('dadok_loggedInPartnerDocId');
                if (!partnerDocId || typeof firebase === 'undefined') {
                    alert('로그인이 만료되었거나 데이터베이스 연결에 실패했습니다.');
                    return;
                }
                
                try {
                    const doc = await firebase.firestore().collection('partners').doc(partnerDocId).get();
                    if (!doc.exists) {
                        alert('파트너 정보를 찾을 수 없습니다.');
                        return;
                    }
                    const data = doc.data();
                    
                    if (!isPartnerApproved(data)) {
                        alert('관리자 승인 완료된 파트너만 업체정보를 수정할 수 있습니다.');
                        return;
                    }

                    if (!currentPartner || currentPartner.id !== partnerDocId) {
                        currentPartner = { id: partnerDocId, ...data };
                    }

                    const nameInput = document.getElementById('partner-input-name');
                    const contactInput = document.getElementById('partner-input-contact');
                    const addressInput = document.getElementById('partner-input-address');
                    const descInput = document.getElementById('partner-input-desc');

                    if (nameInput) currentPartner.name = nameInput.value;
                    if (contactInput) currentPartner.contact = contactInput.value;
                    if (addressInput) currentPartner.address = addressInput.value;
                    if (descInput) currentPartner.desc = descInput.value;

                    // 카테고리 태그 정리
                    const selectedRegions = Array.from(document.querySelectorAll('#selected-regions-container button')).map(b => b.innerText.trim());
                    const selectedMassages = Array.from(document.querySelectorAll('#selected-massage-container button')).map(b => b.innerText.trim());
                    const selectedSpaces = Array.from(document.querySelectorAll('#selected-space-container button')).map(b => b.innerText.trim());
                    const selectedAges = Array.from(document.querySelectorAll('#selected-age-container button')).map(b => b.innerText.trim());

                    currentPartner.tags = [...selectedMassages, ...selectedSpaces, ...selectedAges].filter(Boolean);
                    currentPartner.massage = selectedMassages.join(', ');
                    currentPartner.region = selectedRegions.length > 0 ? selectedRegions[0] : '강남/서초';
                    currentPartner.place = selectedSpaces.length > 0 ? selectedSpaces[0] : '방문 (홈케어/출장)';
                    currentPartner.age = selectedAges.length > 0 ? selectedAges[0] : '연령 무관';

                    // 메뉴 파싱
                    const menuItems = Array.from(document.querySelectorAll('#menu-list-container .menu-item'));
                    currentPartner.menus = menuItems.map(item => {
                        const mName = item.querySelector('.menu-name-input')?.value || '';
                        const mPrice = item.querySelector('.menu-price-input')?.value || '';
                        const mTheme = item.querySelector('.menu-theme-input')?.value || '';
                        const mDesc = item.querySelector('.menu-desc-input')?.value || '';
                        return { name: mName, price: mPrice, theme: mTheme, desc: mDesc };
                    }).filter(m => m.name || m.price);

                    await firebase.firestore().collection('partners').doc(partnerDocId).update({
                        name: currentPartner.name,
                        phoneNumber: currentPartner.contact,
                        location: currentPartner.address,
                        catchphrase: currentPartner.desc,
                        tags: currentPartner.tags,
                        massage: currentPartner.massage,
                        region: currentPartner.region,
                        place: currentPartner.place,
                        age: currentPartner.age,
                        menus: currentPartner.menus,
                        stats: normalizeDashboardStats(window.partnerDashboardStats),
                        statsDate: window.partnerDashboardStatsDate || getTodayDateKey(),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });

                    // 메인 화면 배너 리스트(DB_CHOICE)에도 실시간 연동 (Mock 반영용)
                    // 앱 공개 배너 배열은 조건 충족 업체만 유지
                    if (canExposePartnerBanner(data)) {
                        let existingIndex = DB_CHOICE.findIndex(p => p.id === partnerDocId);
                        let myPartnerMock = {
                            id: partnerDocId,
                            name: currentPartner.name,
                            region: currentPartner.region,
                            massage: currentPartner.massage,
                            place: currentPartner.place,
                            age: currentPartner.age,
                            rating: currentPartner.rating || 5.0,
                            reviews: currentPartner.reviews || 0,
                            tier: data.ticketType || 'Premium',
                            image: currentPartner.image || 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
                        };

                        if (existingIndex > -1) {
                            DB_CHOICE[existingIndex] = myPartnerMock;
                        } else {
                            DB_CHOICE.unshift(myPartnerMock);
                        }
                    } else {
                        DB_CHOICE = DB_CHOICE.filter(p => p.id !== partnerDocId);
                        DB_RECOMMEND = DB_RECOMMEND.filter(p => p.id !== partnerDocId);
                    }

                    // 필터 및 메인 뷰 재렌더링
                    if (typeof applyFiltersToData === 'function') applyFiltersToData();
                    if (typeof initializeDynamicContent === 'function') initializeDynamicContent();

                    showCustomToast("설정이 실시간으로 연동/저장되었습니다.");

                    // 만약 상세 배너가 열려있다면 즉시 재렌더링
                    const profileSheet = document.getElementById('profile-sheet');
                    if (profileSheet && profileSheet.classList.contains('open') && document.getElementById('profile-name').innerText === currentPartner.name) {
                        // Re-render (Assuming openMyBanner checks currentPartner logic or we need to pass doc ID)
                        openMyBanner();
                    }
                } catch(e) {
                    console.error("저장 중 오류 발생", e);
                    alert("정보 저장 중 오류가 발생했습니다: " + e.message);
                }
            }

            // [고객센터] 신고/문의 화면 관련
            const supportTypeFallbacks = {
                report: ['불법 성매매 제안/요구', '욕설 및 비매너 행위', '사기 / 금전 요구', '기타 신고'],
                inquiry: ['이용 방법 문의', '파트너 권한/승인 문의', '앱 오류 / 버그 제보', '기타 문의']
            };

            function getSupportFilterDocKey(tab) {
                return tab === 'report' ? 'customer_report_reason' : 'customer_inquiry_type';
            }

            async function loadSupportTypeOptions(tab) {
                const select = document.getElementById('support-type');
                if (!select) return;

                const fallback = supportTypeFallbacks[tab] || [];
                const renderOptions = (options) => {
                    select.innerHTML = options
                        .map(label => `<option value="${label}">${label}</option>`)
                        .join('');
                };

                // 네트워크/권한 이슈가 있어도 빈 드롭다운이 되지 않도록 기본값을 즉시 표시
                renderOptions(fallback);

                if (typeof firebase !== 'undefined') {
                    try {
                        const docKey = getSupportFilterDocKey(tab);
                        const doc = await firebase.firestore().collection('app_filters').doc(docKey).get();
                        if (doc.exists) {
                            const dbOptions = Array.isArray(doc.data()?.options) ? doc.data().options : [];
                            const sanitized = dbOptions
                                .map(v => (typeof v === 'string' ? v.trim() : ''))
                                .filter(Boolean);
                            if (sanitized.length > 0) {
                                renderOptions(sanitized);
                            }
                        }
                    } catch (e) {
                        console.error('신고/문의 유형 로드 실패:', e);
                    }
                }
            }

            function openSupportScreen() {
                const supportModal = document.getElementById('support-modal');
                supportModal.style.display = 'flex';
                changeSupportTab('report'); // Default to Report

                // 입력 필드 초기화
                document.getElementById('support-content').value = '';
                document.getElementById('support-file-input').value = '';
                document.getElementById('support-file-name').innerText = '터치하여 이미지 첨부';

                setTimeout(() => {
                    supportModal.classList.remove('translate-x-full');
                }, 10);
            }

            function closeSupportScreen() {
                const supportModal = document.getElementById('support-modal');
                supportModal.classList.add('translate-x-full');
                setTimeout(() => {
                    supportModal.style.display = 'none';
                }, 300);
            }

            function changeSupportTab(tab) {
                const tabBg = document.getElementById('support-tab-bg');
                const tabReport = document.getElementById('tab-report');
                const tabInquiry = document.getElementById('tab-inquiry');
                const desc = document.getElementById('support-desc');
                const select = document.getElementById('support-type');

                if (tab === 'report') {
                    tabBg.style.transform = 'translateX(0)';
                    tabReport.classList.add('text-[var(--point-color)]');
                    tabReport.classList.remove('text-[var(--text-sub)]');
                    tabInquiry.classList.add('text-[var(--text-sub)]');
                    tabInquiry.classList.remove('text-[var(--point-color)]');
                    desc.innerHTML = '건강하고 클린한 환경을 위해<br>불법·불쾌 행위 제보를 받습니다.';
                } else {
                    tabBg.style.transform = 'translateX(100%)';
                    tabInquiry.classList.add('text-[var(--point-color)]');
                    tabInquiry.classList.remove('text-[var(--text-sub)]');
                    tabReport.classList.add('text-[var(--text-sub)]');
                    tabReport.classList.remove('text-[var(--point-color)]');
                    desc.innerHTML = '다독 이용 중 궁금하신 점이나<br>불편 사항을 남겨주시면 답변해 드립니다.';
                }
                loadSupportTypeOptions(tab);
            }

            async function submitSupportForm() {
                const content = document.getElementById('support-content');
                if (!content.value.trim()) {
                    showCustomToast("상세 내용을 입력해주세요.");
                    content.focus();
                    return;
                }

                if (typeof firebase === 'undefined') {
                    showCustomToast("현재 접수 시스템 연결에 실패했습니다. 잠시 후 다시 시도해주세요.");
                    return;
                }

                const isReportTab = document.getElementById('tab-report')?.classList.contains('text-[var(--point-color)]');
                const type = isReportTab ? 'customer_report' : 'customer_inquiry';
                const supportTypeSelect = document.getElementById('support-type');
                const selectedCategory = supportTypeSelect?.value || '';
                const selectedCategoryText = supportTypeSelect?.selectedOptions?.[0]?.textContent || selectedCategory || '일반';
                const rawContent = content.value.trim();
                const title = `[${selectedCategoryText}] ${rawContent.slice(0, 30)}${rawContent.length > 30 ? '...' : ''}`;
                const userId = localStorage.getItem('dadok_username') || sessionStorage.getItem('dadok_username') || 'anonymous';

                try {
                    await firebase.firestore().collection('cs_tickets').add({
                        type: type,
                        status: 'pending',
                        title: title,
                        content: rawContent,
                        author: userId,
                        category: selectedCategory,
                        categoryLabel: selectedCategoryText,
                        source: 'app_user_support',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });

                    showCustomToast("정상적으로 접수되었습니다. 최대한 빠르게 답변드리겠습니다.");
                    setTimeout(() => {
                        closeSupportScreen();
                    }, 1500);
                } catch (e) {
                    console.error('신고/문의 접수 실패:', e);
                    showCustomToast("접수 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
                }
            }
            // [모바일 뒤로가기 방어 로직 - Stack 기반 구조 개선]
            // 모달을 열 때마다 스택에 추가하고, 기기 뒤로가기 시 최상단 요소부터 순차적으로 하나씩 닫습니다.
            let appModalStack = [];
            let isClickClosing = false; // UI 닫기 버튼 터치로 인한 루프 방지 플래그

            // 열기 함수와 1:1로 매칭되는 닫기 함수 맵
            function getCloseFunctionFor(openFunc) {
                const map = {
                    'openProfile': 'closeProfileSheet',
                    'openProfileFromFavorites': 'closeProfileSheet',
                    'openFilter': 'closeFilterSheet',
                    'openReviewSheet': 'closeReviewSheet',
                    'openChatSheet': 'closeChatSheet',
                    'openChatWithUser': 'closeChatSheet',
                    'openFindIdPwScreen': 'closeFindIdPwScreen',
                    'openLoginModal': 'closeLoginModal',
                    'openLoginFormModal': 'closeLoginFormModal',
                    'openSignupModal': 'closeSignupModal',
                    'openPartnerLoginScreen': 'closePartnerLoginScreen',
                    'openPartnerRecoveryModal': 'closePartnerRecoveryModal',
                    'openPartnerDashboard': 'closePartnerDashboardToMain',
                    'openPartnerSignupModal': 'closePartnerSignupModal',
                    'openLegalModal': 'closeLegalModal',
                    'openPartnerApplication': 'closePartnerApplication',
                    'openPartnerEntryScreen': 'closePartnerEntryScreen',
                    'openMyPageModal': 'closeMyPageModal',
                    'openChatListModal': 'closeChatListModal',
                    'openFavoritesModal': 'closeFavoritesModal',
                    'openSecurityModal': 'closeSecurityModal',
                    'openSupportScreen': 'closeSupportScreen',
                    'openListView': 'closeAllModals',
                    'openMyBanner': 'closeAllModals'
                };
                return map[openFunc] || null;
            }

            document.addEventListener('click', function (e) {
                const target = e.target.closest('[onclick]');
                if (!target) return;

                const clickStr = target.getAttribute('onclick') || '';

                // 1. 모달 여는 액션
                if (clickStr.startsWith('open')) {
                    const match = clickStr.match(/^(open[A-Za-z0-9_]+)/);
                    if (match) {
                        const openFuncName = match[1];
                        let closeFuncName = getCloseFunctionFor(openFuncName);

                        if (!closeFuncName) {
                            closeFuncName = 'closeAllModals'; // 매핑에 없으면 안전빵
                        }

                        appModalStack.push(closeFuncName);
                        history.pushState({ modalOpen: true, stackDepth: appModalStack.length }, '', location.href);
                    }
                }
                // 2. 전체 초기화성 닫기 액션 (메인으로 돌아가기, 오버레이 클리어 등)
                else if (
                    clickStr.includes('handleOverlayClick') ||
                    clickStr.includes('closeAllModals') ||
                    clickStr.includes('closePartnerDashboardToMain') ||
                    clickStr.includes('closeSuccessAndReturnToEntry')
                ) {
                    if (appModalStack.length > 0) {
                        isClickClosing = true;
                        const dropCount = appModalStack.length; // 몇 단계나 되돌아갈지
                        appModalStack = []; // 스택 초기화

                        setTimeout(() => {
                            history.go(-dropCount); // 쌓인 가짜 History 일괄 삭제
                            setTimeout(() => { isClickClosing = false; }, 50);
                        }, 10);
                    }
                }
                // 3. 단일 모달 닫기 액션 (x버튼, 'close' 함수 등)
                else if (
                    clickStr.startsWith('close') ||
                    clickStr.includes("remove('open')") ||
                    clickStr.includes("add('hidden')")
                ) {
                    if (appModalStack.length > 0) {
                        isClickClosing = true;
                        appModalStack.pop(); // 가장 최신꺼 하나 뺌

                        setTimeout(() => {
                            if (history.state && history.state.modalOpen) {
                                history.back(); // History 하나만 pop
                            }
                            setTimeout(() => { isClickClosing = false; }, 50);
                        }, 10);
                    }
                }
            }, true);

            // 4. 사용자가 핸드폰 기기의 '뒤로가기' 버튼을 눌렀을 때
            window.addEventListener('popstate', function (e) {
                // UI 조작이 아닌 순수 하드웨어 뒤로가기로 발생한 경우
                if (!isClickClosing && appModalStack.length > 0) {
                    const closeFuncToRun = appModalStack.pop();

                    if (typeof window[closeFuncToRun] === 'function') {
                        try { window[closeFuncToRun](); } catch (err) { }
                    } else if (closeFuncToRun === 'closeReviewSheet') {
                        // 수동 예외: closeReviewSheet 함수가 선언부에 없을 경우 직접 클래스 조작
                        const rSheet = document.getElementById('review-sheet');
                        if (rSheet) rSheet.classList.remove('open');

                        // 해당 모달과 엮인 오버레이 닫기
                        const overlay = document.getElementById('main-overlay');
                        if (overlay) {
                            overlay.style.zIndex = '';
                            overlay.classList.remove('show');
                        }
                    } else {
                        if (typeof closeAllModals === 'function') { try { closeAllModals(); } catch (err) { } }
                    }
                }
                // 스택이 이미 비어있는데 뒤로가기가 발생했다면 (기본 방어)
                else if (!isClickClosing && appModalStack.length === 0) {
                    if (typeof handleOverlayClick === 'function') { try { handleOverlayClick(); } catch (err) { } }
                    if (typeof closeAllModals === 'function') { try { closeAllModals(); } catch (err) { } }
                }
            });
// removed end wrapper