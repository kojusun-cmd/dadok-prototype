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

                                const partnerDashboardRegionSet = new Set(['서울 강남/서초']);
                                window.partnerDashboardRegionSet = partnerDashboardRegionSet;
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
                                        const isSelected = partnerDashboardRegionSet.has(fullRegionName);

                                        const btn = document.createElement('button');
                                        btn.className = isSelected
                                            ? 'py-2.5 text-[13px] text-center rounded-lg border border-[var(--point-color)] bg-[#D4AF37]/10 text-[var(--point-color)] font-medium transition-all'
                                            : 'py-2.5 text-[13px] text-center rounded-lg border border-[#2A3731] text-[var(--text-sub)] hover:border-[var(--point-color)] hover:text-white transition-all';
                                        btn.innerText = district;

                                        btn.onclick = () => {
                                            if (partnerDashboardRegionSet.has(fullRegionName)) {
                                                partnerDashboardRegionSet.delete(fullRegionName);
                                            } else {
                                                partnerDashboardRegionSet.add(fullRegionName);
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
                                    selectedRegionsCount.innerText = `${partnerDashboardRegionSet.size}개 선택됨`;

                                    partnerDashboardRegionSet.forEach(region => {
                                        const btn = document.createElement('button');
                                        btn.className = 'px-4 py-2 rounded-full border border-[var(--point-color)] bg-[#D4AF37]/10 text-white  text-[13px] font-medium transition-all flex items-center gap-1';

                                        const parts = region.split(' ');
                                        const dist = parts.slice(1).join(' ');
                                        const displayText = (dist === '전체' || dist === '기타') ? region : dist;

                                        btn.innerHTML = `${displayText} <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
                                        btn.onclick = () => {
                                            partnerDashboardRegionSet.delete(region);
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

                                // --- 파트너 대시보드 카테고리 피커 (Firestore 값 복원) ---
                                const PARTNER_DASHBOARD_MASSAGE_OPTIONS = ['상관없음(전체)', '스웨디시', '스포츠 마사지', '타이 마사지', '커플마사지'];
                                const PARTNER_DASHBOARD_SPACE_OPTIONS = ['상관없음(전체)', '방문 (홈케어/출장)', '1인샵 (매장 방문)', '다인샵 (일반 매장)'];
                                const PARTNER_DASHBOARD_AGE_OPTIONS = ['연령 무관 (전체)', '20대 초반', '20대 중후반', '30대 초반', '30대 중후반', '40대 초반', '40대 중후반'];

                                function validatePartnerDashboardFullRegionKey(key) {
                                    const parts = String(key || '').trim().split(/\s+/);
                                    if (parts.length < 2) return false;
                                    const prov = parts[0];
                                    const dist = parts.slice(1).join(' ');
                                    return Array.isArray(regionData[prov]) && regionData[prov].includes(dist);
                                }

                                function expandPartnerDashboardSavedRegionToFullKeys(regionVal) {
                                    if (regionVal == null || regionVal === '') return [];
                                    if (Array.isArray(regionVal)) {
                                        return regionVal.flatMap((v) => expandPartnerDashboardSavedRegionToFullKeys(v));
                                    }
                                    const s = String(regionVal).trim();
                                    if (!s) return [];
                                    if (s.includes(' ')) {
                                        return validatePartnerDashboardFullRegionKey(s) ? [s] : [];
                                    }
                                    const out = [];
                                    Object.keys(regionData).forEach((prov) => {
                                        (regionData[prov] || []).forEach((dist) => {
                                            if (dist === s) out.push(`${prov} ${dist}`);
                                        });
                                    });
                                    return out;
                                }

                                function splitPartnerTagsByCategory(tags) {
                                    const m = [];
                                    const s = [];
                                    const a = [];
                                    (tags || []).forEach((t) => {
                                        if (PARTNER_DASHBOARD_MASSAGE_OPTIONS.includes(t)) m.push(t);
                                        else if (PARTNER_DASHBOARD_SPACE_OPTIONS.includes(t)) s.push(t);
                                        else if (PARTNER_DASHBOARD_AGE_OPTIONS.includes(t)) a.push(t);
                                    });
                                    return { m, s, a };
                                }

                                function setupPartnerDashboardCategoryPicker(idPrefix, data, defaultSelected) {
                                    const selected = new Set();
                                    const countEl = document.getElementById(`selected-${idPrefix}-count`);
                                    const containerEl = document.getElementById(`selected-${idPrefix}-container`);
                                    const boxEl = document.getElementById(`${idPrefix}-selector-box`);

                                    if (!boxEl || !containerEl || !countEl) {
                                        return {
                                            setSelections: () => {},
                                            getSelections: () => [],
                                            getOptionData: () => data,
                                        };
                                    }

                                    const renderOptions = () => {
                                        boxEl.innerHTML = '';
                                        data.forEach((item) => {
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
                                        selected.forEach((item) => {
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

                                    function setSelections(items) {
                                        selected.clear();
                                        const use = Array.isArray(items) && items.length ? items : defaultSelected;
                                        use.forEach((item) => {
                                            if (data.includes(item)) selected.add(item);
                                        });
                                        renderOptions();
                                        renderSelected();
                                    }

                                    setSelections(null);

                                    return {
                                        setSelections,
                                        getSelections: () => Array.from(selected),
                                        getOptionData: () => data,
                                    };
                                }

                                window.partnerDashboardCategoryPickers = {
                                    massage: setupPartnerDashboardCategoryPicker(
                                        'massage',
                                        PARTNER_DASHBOARD_MASSAGE_OPTIONS,
                                        [],
                                    ),
                                    space: setupPartnerDashboardCategoryPicker(
                                        'space',
                                        PARTNER_DASHBOARD_SPACE_OPTIONS,
                                        [],
                                    ),
                                    age: setupPartnerDashboardCategoryPicker('age', PARTNER_DASHBOARD_AGE_OPTIONS, []),
                                };

                                window.applyPartnerDashboardCategoriesFromPartner = function (partner) {
                                    if (!partner) return;
                                    const pick = window.partnerDashboardCategoryPickers;
                                    if (!pick || !pick.massage) return;

                                    const rSet = window.partnerDashboardRegionSet;
                                    if (rSet && typeof window.renderRegionSubOptions === 'function') {
                                        rSet.clear();
                                        if (Array.isArray(partner.regionList) && partner.regionList.length) {
                                            partner.regionList.forEach((k) => {
                                                const t = String(k || '').trim();
                                                if (t && validatePartnerDashboardFullRegionKey(t)) rSet.add(t);
                                            });
                                        }
                                        if (!rSet.size) {
                                            expandPartnerDashboardSavedRegionToFullKeys(partner.region).forEach((rk) =>
                                                rSet.add(rk),
                                            );
                                        }
                                        const first = Array.from(rSet)[0];
                                        if (first) {
                                            const prov = first.split(' ')[0];
                                            if (prov && regionData[prov]) currentActiveTab = prov;
                                        }
                                        window.renderRegionTabs();
                                        window.renderRegionSubOptions();
                                        window.renderSelectedRegions();
                                    }

                                    const tags = Array.isArray(partner.tags) ? partner.tags : [];
                                    const { m: tagsM, s: tagsS, a: tagsA } = splitPartnerTagsByCategory(tags);

                                    let mSel = [...tagsM];
                                    if (!mSel.length && partner.massage) {
                                        mSel = String(partner.massage)
                                            .split(',')
                                            .map((x) => x.trim())
                                            .filter((x) => PARTNER_DASHBOARD_MASSAGE_OPTIONS.includes(x));
                                    }
                                    let sSel = [...tagsS];
                                    if (!sSel.length && partner.place) {
                                        sSel = String(partner.place)
                                            .split(',')
                                            .map((x) => x.trim())
                                            .filter((x) => PARTNER_DASHBOARD_SPACE_OPTIONS.includes(x));
                                    }
                                    let aSel = [...tagsA];
                                    if (!aSel.length && partner.age) {
                                        aSel = String(partner.age)
                                            .split(',')
                                            .map((x) => x.trim())
                                            .filter((x) => PARTNER_DASHBOARD_AGE_OPTIONS.includes(x));
                                    }
                                    pick.massage.setSelections(mSel);
                                    pick.space.setSelections(sSel);
                                    pick.age.setSelections(aSel);
                                };

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
            let activeChatThreadId = null;
            let activeChatThreadMeta = null;
            let activeChatActor = { role: 'user', docId: '', userId: '' };
            let unsubscribeChatThreadMessages = null;
            let unsubscribeChatList = null;
            let unsubscribeUserChatUnread = null;
            let userChatUnreadTargetDocId = '';
            let unsubscribePartnerChatBadge = null;
            let unsubscribeChatHeaderLive = null;
            let unsubscribePartnerDashboardLive = null;
            let lastChatThreadMessages = [];
            let chatListRows = [];
            let pendingChatAttachmentFiles = [];
            let chatAttachmentPreviewUrls = [];
            let pendingChatAttachmentUploadPromise = null;
            let pendingChatUploadedAttachments = [];
            let pendingChatAttachmentUploadState = 'idle'; // idle | uploading | done | error
            let pendingChatAttachmentUploadError = '';
            let pendingChatAttachmentUploadToken = 0;
            let isChatSending = false;
            let chatAttachmentPreviewHistoryPushed = false;
            const USER_FAVORITES_STORAGE_KEY = 'dadok_user_favorites_v1';
            const CHAT_ATTACHMENT_MAX_COUNT = 3;
            const CHAT_ATTACHMENT_MAX_SIZE = 10 * 1024 * 1024;
            const CHAT_ATTACHMENT_ALLOWED_EXT = [
                'jpg', 'jpeg', 'png', 'webp', 'gif', 'jfif', 'heic', 'heif', 'avif',
                'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
                'txt', 'zip', 'hwp', 'hwpx'
            ];
            const DADOK_FCM_VAPID_KEY =
                (window.DADOK_FCM_VAPID_KEY && String(window.DADOK_FCM_VAPID_KEY).trim()) ||
                (localStorage.getItem('dadok_fcm_vapid_key') || '').trim() ||
                (sessionStorage.getItem('dadok_fcm_vapid_key') || '').trim();
            const DEFAULT_NOTIFICATION_SETTINGS = {
                inApp: { chat: true, notice: true },
                push: { enabled: false, chat: true, notice: true, preview: true },
                chatAlertMode: 'sound_vibrate', // sound_vibrate | vibrate_only | silent
                noticePreview: true,
            };
            let currentNotificationSettingsAudience = 'user';
            const notificationSettingsCache = { user: null, partner: null };
            const unreadSnapshotTracker = { chat: { user: null, partner: null }, notice: { user: null, partner: null } };
            let fcmMessagingInstance = null;
            let fcmForegroundBound = false;
            let lastForegroundMessageId = '';

            function getAuthInstance() {
                if (typeof firebase === 'undefined' || !firebase.auth) return null;
                try {
                    return firebase.auth();
                } catch (e) {
                    console.error('Firebase Auth 초기화 실패:', e);
                    return null;
                }
            }

            function normalizeAuthEmail(rawEmail = '') {
                return String(rawEmail || '').trim().toLowerCase();
            }

            function isValidEmailFormat(rawEmail = '') {
                const email = normalizeAuthEmail(rawEmail);
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            }

            function buildAuthEmailByRole(rawId = '', role = 'user') {
                // role 파라미터는 기존 호출부 호환용으로 유지
                void role;
                return normalizeAuthEmail(rawId);
            }

            async function applyAuthPersistenceByKeepLogin(keepLogin = false) {
                const auth = getAuthInstance();
                if (!auth || !firebase.auth.Auth) return;
                try {
                    const persistence = keepLogin
                        ? firebase.auth.Auth.Persistence.LOCAL
                        : firebase.auth.Auth.Persistence.SESSION;
                    await auth.setPersistence(persistence);
                } catch (e) {
                    console.error('Auth persistence 설정 실패:', e);
                }
            }

            function normalizeNotificationSettings(raw = {}) {
                const inAppRaw = raw?.inApp || {};
                const pushRaw = raw?.push || {};
                const chatAlertModeRaw = String(raw?.chatAlertMode || '').trim();
                const chatAlertMode = ['sound_vibrate', 'vibrate_only', 'silent'].includes(chatAlertModeRaw)
                    ? chatAlertModeRaw
                    : 'sound_vibrate';
                return {
                    inApp: {
                        chat: inAppRaw.chat !== false,
                        notice: inAppRaw.notice !== false,
                    },
                    push: {
                        enabled: pushRaw.enabled === true,
                        chat: pushRaw.chat !== false,
                        notice: pushRaw.notice !== false,
                        preview: pushRaw.preview !== false,
                    },
                    chatAlertMode,
                    noticePreview: raw?.noticePreview !== false,
                };
            }

            function getNotificationSettings(audience = 'user') {
                return notificationSettingsCache[audience] || normalizeNotificationSettings(DEFAULT_NOTIFICATION_SETTINGS);
            }

            function isInAppChatEnabled(audience = 'user') {
                return getNotificationSettings(audience).inApp.chat !== false;
            }

            function isInAppNoticeEnabled(audience = 'user') {
                return getNotificationSettings(audience).inApp.notice !== false;
            }

            function getChatAlertMode(audience = 'user') {
                return getNotificationSettings(audience).chatAlertMode || 'sound_vibrate';
            }

            function maybeTriggerChatVibration(audience = 'user') {
                const mode = getChatAlertMode(audience);
                if (mode !== 'sound_vibrate' && mode !== 'vibrate_only') return;
                if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
                try {
                    navigator.vibrate(200);
                } catch (_) {
                    // ignore vibration errors
                }
            }

            async function getNotificationRecipientRef(audience = 'user') {
                if (typeof firebase === 'undefined') return null;
                if (audience === 'partner') {
                    const partnerDocId = getLoggedInPartnerDocId();
                    if (!partnerDocId) return null;
                    return firebase.firestore().collection('partners').doc(partnerDocId);
                }
                const userDocId = await ensureLoggedInUserDocId();
                if (!userDocId) return null;
                return firebase.firestore().collection('users').doc(userDocId);
            }

            async function loadNotificationSettings(audience = 'user', forceRefresh = false) {
                if (!forceRefresh && notificationSettingsCache[audience]) {
                    return notificationSettingsCache[audience];
                }
                const ref = await getNotificationRecipientRef(audience);
                if (!ref) {
                    const fallback = normalizeNotificationSettings(DEFAULT_NOTIFICATION_SETTINGS);
                    notificationSettingsCache[audience] = fallback;
                    return fallback;
                }
                try {
                    const snap = await ref.get();
                    const data = snap.exists ? snap.data() || {} : {};
                    const settings = normalizeNotificationSettings(data.notificationSettings || {});
                    notificationSettingsCache[audience] = settings;
                    return settings;
                } catch (e) {
                    console.error('알림 설정 불러오기 실패:', e);
                    const fallback = normalizeNotificationSettings(DEFAULT_NOTIFICATION_SETTINGS);
                    notificationSettingsCache[audience] = fallback;
                    return fallback;
                }
            }

            function setPushStatusText(text = '', isError = false) {
                const statusEl = document.getElementById('notif-push-status');
                if (!statusEl) return;
                statusEl.textContent = text;
                statusEl.className = isError
                    ? 'mt-2 text-[11px] text-[#F87171]'
                    : 'mt-2 text-[11px] text-[var(--text-sub)]';
            }

            async function withTimeout(promise, ms = 12000, timeoutMessage = '요청 시간이 초과되었습니다.') {
                let timerId = null;
                try {
                    return await Promise.race([
                        promise,
                        new Promise((_, reject) => {
                            timerId = setTimeout(() => reject(new Error(timeoutMessage)), ms);
                        }),
                    ]);
                } finally {
                    if (timerId) clearTimeout(timerId);
                }
            }

            async function isMessagingSupported() {
                try {
                    if (typeof firebase === 'undefined' || !firebase.messaging) return false;
                    if (typeof firebase.messaging.isSupported === 'function') {
                        const v = firebase.messaging.isSupported();
                        return typeof v?.then === 'function' ? Boolean(await v) : Boolean(v);
                    }
                    return true;
                } catch (e) {
                    return false;
                }
            }

            async function getMessagingInstance() {
                if (fcmMessagingInstance) return fcmMessagingInstance;
                const supported = await isMessagingSupported();
                if (!supported) return null;
                try {
                    fcmMessagingInstance = firebase.messaging();
                    return fcmMessagingInstance;
                } catch (e) {
                    console.error('FCM 인스턴스 초기화 실패:', e);
                    return null;
                }
            }

            async function registerFcmTokenForAudience(audience = 'user') {
                const settings = getNotificationSettings(audience);
                if (!settings.push.enabled) return null;
                const messaging = await getMessagingInstance();
                if (!messaging) {
                    setPushStatusText('현재 브라우저에서는 휴대폰 알림이 지원되지 않습니다.', true);
                    return null;
                }
                if (!('serviceWorker' in navigator)) {
                    setPushStatusText('현재 환경에서는 휴대폰 알림 연결이 어렵습니다.', true);
                    return null;
                }
                try {
                    const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                    if (typeof messaging.useServiceWorker === 'function') {
                        messaging.useServiceWorker(swReg);
                    }
                    const tokenOptions = { serviceWorkerRegistration: swReg };
                    if (DADOK_FCM_VAPID_KEY) tokenOptions.vapidKey = DADOK_FCM_VAPID_KEY;
                    const token = await messaging.getToken(tokenOptions);
                    if (!token) {
                        setPushStatusText('알림 연결에 실패했습니다. 권한 상태를 확인해주세요.', true);
                        return null;
                    }
                    const ref = await getNotificationRecipientRef(audience);
                    if (!ref) {
                        setPushStatusText('로그인 정보가 없어 휴대폰 알림을 저장할 수 없습니다. 다시 로그인 후 시도해주세요.', true);
                        return null;
                    }
                    const tokenId = token.replace(/[^a-zA-Z0-9]/g, '').slice(-80) || `token_${Date.now()}`;
                    await ref.collection('fcm_tokens').doc(tokenId).set(
                        {
                            token,
                            enabled: true,
                            platform: /android/i.test(navigator.userAgent)
                                ? 'android'
                                : /iphone|ipad|ipod/i.test(navigator.userAgent)
                                    ? 'ios'
                                    : 'web',
                            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        },
                        { merge: true },
                    );
                    setPushStatusText('휴대폰 알림 수신이 설정되었습니다.');
                    return token;
                } catch (e) {
                    console.error('FCM 토큰 등록 실패:', e);
                    setPushStatusText(`휴대폰 알림 연결 실패: ${e?.message || 'unknown'}`, true);
                    return null;
                }
            }

            async function bindForegroundPushListener() {
                if (fcmForegroundBound) return;
                const messaging = await getMessagingInstance();
                if (!messaging) return;
                try {
                    messaging.onMessage((payload) => {
                        const messageId = String(payload?.messageId || payload?.data?.messageId || '');
                        if (messageId && messageId === lastForegroundMessageId) return;
                        if (messageId) lastForegroundMessageId = messageId;
                        const title = String(payload?.notification?.title || payload?.data?.title || '새 알림');
                        const body = String(payload?.notification?.body || payload?.data?.body || '');
                        showCustomToast(`${escapeChatHtml(title)}<br><span class="text-[13px] text-[var(--text-sub)]">${escapeChatHtml(body)}</span>`);
                    });
                    fcmForegroundBound = true;
                } catch (e) {
                    console.error('FCM foreground listener 등록 실패:', e);
                }
            }

            function getChatAlertModeLabel(mode = 'sound_vibrate') {
                if (mode === 'vibrate_only') return '진동만';
                if (mode === 'silent') return '무음';
                return '소리';
            }

            function refreshChatAlertModeTriggerText() {
                const modeInput = document.getElementById('notif-chat-alert-mode');
                const triggerText = document.getElementById('notif-chat-alert-trigger-text');
                if (!modeInput || !triggerText) return;
                const mode = String(modeInput.value || 'sound_vibrate');
                triggerText.textContent = getChatAlertModeLabel(mode);
            }

            function closeChatAlertModeMenu() {
                const menu = document.getElementById('notif-chat-alert-menu');
                if (!menu) return;
                menu.classList.add('hidden');
            }

            function toggleChatAlertModeMenu() {
                const menu = document.getElementById('notif-chat-alert-menu');
                const trigger = document.getElementById('notif-chat-alert-trigger');
                if (!menu || !trigger || trigger.disabled) return;
                menu.classList.toggle('hidden');
            }

            function selectChatAlertMode(mode = 'sound_vibrate') {
                const modeInput = document.getElementById('notif-chat-alert-mode');
                if (!modeInput) return;
                const safeMode = ['sound_vibrate', 'vibrate_only', 'silent'].includes(mode)
                    ? mode
                    : 'sound_vibrate';
                modeInput.value = safeMode;
                refreshChatAlertModeTriggerText();
                closeChatAlertModeMenu();
            }
            window.toggleChatAlertModeMenu = toggleChatAlertModeMenu;
            window.selectChatAlertMode = selectChatAlertMode;
            document.addEventListener('click', (e) => {
                const target = e.target;
                if (!(target instanceof Element)) return;
                if (
                    target.closest('#notif-chat-alert-menu') ||
                    target.closest('#notif-chat-alert-trigger')
                ) {
                    return;
                }
                closeChatAlertModeMenu();
            });

            function applyNotificationSettingsToForm(settings) {
                const chatEnabled = document.getElementById('notif-chat-enabled');
                const chatMode = document.getElementById('notif-chat-alert-mode');
                const previewEnabled = document.getElementById('notif-preview-enabled');
                const noticeEnabled = document.getElementById('notif-notice-enabled');
                const noticePreview = document.getElementById('notif-notice-preview');
                const isChatOn = settings.inApp.chat !== false || settings.push.chat !== false;
                const isNoticeOn = settings.inApp.notice !== false || settings.push.notice !== false;
                if (chatEnabled) chatEnabled.checked = isChatOn;
                if (chatMode) chatMode.value = settings.chatAlertMode || 'sound_vibrate';
                if (previewEnabled) previewEnabled.checked = settings.push.preview !== false;
                if (noticeEnabled) noticeEnabled.checked = isNoticeOn;
                if (noticePreview) noticePreview.checked = settings.noticePreview !== false;
                refreshChatAlertModeTriggerText();
                closeChatAlertModeMenu();
                updateNotificationSettingsFormState();
            }

            function collectNotificationSettingsFromForm() {
                const chatEnabled = Boolean(document.getElementById('notif-chat-enabled')?.checked);
                const noticeEnabled = Boolean(document.getElementById('notif-notice-enabled')?.checked);
                const chatAlertMode = String(document.getElementById('notif-chat-alert-mode')?.value || 'sound_vibrate');
                const previewEnabled = Boolean(document.getElementById('notif-preview-enabled')?.checked);
                const noticePreviewEnabled = Boolean(document.getElementById('notif-notice-preview')?.checked);
                return normalizeNotificationSettings({
                    inApp: {
                        chat: chatEnabled,
                        notice: noticeEnabled,
                    },
                    push: {
                        enabled: chatEnabled || noticeEnabled,
                        chat: chatEnabled,
                        notice: noticeEnabled,
                        preview: previewEnabled || noticePreviewEnabled,
                    },
                    chatAlertMode,
                    noticePreview: noticePreviewEnabled,
                });
            }

            function updateNotificationSettingsFormState() {
                const chatEnabled = Boolean(document.getElementById('notif-chat-enabled')?.checked);
                const noticeEnabled = Boolean(document.getElementById('notif-notice-enabled')?.checked);
                const chatModeTrigger = document.getElementById('notif-chat-alert-trigger');
                const preview = document.getElementById('notif-preview-enabled');
                const noticePreview = document.getElementById('notif-notice-preview');
                if (chatModeTrigger) chatModeTrigger.disabled = !chatEnabled;
                if (preview) preview.disabled = !chatEnabled;
                if (noticePreview) noticePreview.disabled = !noticeEnabled;
                if (!chatEnabled) closeChatAlertModeMenu();
            }
            window.updateNotificationSettingsFormState = updateNotificationSettingsFormState;

            function resetUnreadTrackers(audience = 'user') {
                unreadSnapshotTracker.chat[audience] = null;
                unreadSnapshotTracker.notice[audience] = null;
            }

            function maybeShowIncomingChatToastFromRows(rows = [], audience = 'user') {
                const totalUnread = rows.reduce((sum, row) => sum + getThreadUnreadCountForActor(row, audience), 0);
                const prev = unreadSnapshotTracker.chat[audience];
                unreadSnapshotTracker.chat[audience] = totalUnread;
                if (prev == null || totalUnread <= prev) return;
                if (!isInAppChatEnabled(audience)) return;
                const chatMode = getChatAlertMode(audience);
                if (chatMode === 'silent') return;
                const incoming = rows.find((row) => {
                    const unread = getThreadUnreadCountForActor(row, audience);
                    return unread > 0 && String(row.id || '') !== String(activeChatThreadId || '');
                });
                if (!incoming) return;
                const sender = getThreadDisplayName(incoming, audience);
                const preview = String(incoming.lastMessage || '새 메시지가 도착했습니다.');
                maybeTriggerChatVibration(audience);
                showCustomToast(
                    `${escapeChatHtml(sender)}<br><span class="text-[13px] text-[var(--text-sub)]">${escapeChatHtml(preview)}</span>`,
                );
            }

            function maybeShowIncomingNoticeToast(rows = [], audience = 'user') {
                const unread = rows.filter((row) => !row.isRead).length;
                const prev = unreadSnapshotTracker.notice[audience];
                unreadSnapshotTracker.notice[audience] = unread;
                if (prev == null || unread <= prev) return;
                if (!isInAppNoticeEnabled(audience)) return;
                const newest = rows.find((row) => !row.isRead);
                if (!newest) return;
                const settings = getNotificationSettings(audience);
                const showPreview = settings.noticePreview !== false;
                const previewText = showPreview ? newest.title || '관리자 알림' : '새로운 공지가 도착했습니다.';
                showCustomToast(
                    `새 공지 도착<br><span class="text-[13px] text-[var(--text-sub)]">${escapeChatHtml(previewText)}</span>`,
                );
            }

            function escapeChatHtml(value = '') {
                return String(value || '')
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');
            }

            function getFavoritesOwnerKey() {
                const userDocId =
                    localStorage.getItem('dadok_loggedInUserDocId') ||
                    sessionStorage.getItem('dadok_loggedInUserDocId') ||
                    '';
                const username =
                    localStorage.getItem('dadok_username') ||
                    sessionStorage.getItem('dadok_username') ||
                    '';
                if (userDocId) return `doc:${userDocId}`;
                if (username) return `id:${username}`;
                return 'guest';
            }

            function normalizeFavoriteEntry(raw = {}) {
                const data = raw || {};
                const id = String(data.id || '').trim();
                if (!id) return null;
                const regionList = (() => {
                    if (Array.isArray(data.regionList)) {
                        return data.regionList
                            .map((v) => String(v || '').trim())
                            .filter(Boolean);
                    }
                    if (typeof data.regionList === 'string' && data.regionList.trim()) {
                        return data.regionList
                            .split(',')
                            .map((v) => String(v || '').trim())
                            .filter(Boolean);
                    }
                    if (typeof data.region === 'string' && data.region.trim()) {
                        return data.region
                            .split(',')
                            .map((v) => String(v || '').trim())
                            .filter(Boolean);
                    }
                    return [];
                })();
                return {
                    id,
                    name: String(data.name || '').trim(),
                    desc: String(data.desc || '').trim(),
                    region: String(data.region || '').trim(),
                    regionList,
                    massage: String(data.massage || '').trim(),
                    place: String(data.place || '').trim(),
                    age: String(data.age || '').trim(),
                    image: String(data.image || '').trim(),
                    ticketType: String(data.ticketType || '').trim(),
                    ticketExpiry: String(data.ticketExpiry || '').trim(),
                    rating: Number(data.rating || 0),
                    reviews: Number(data.reviews || 0),
                };
            }

            function persistUserFavorites() {
                try {
                    const owner = getFavoritesOwnerKey();
                    const raw = localStorage.getItem(USER_FAVORITES_STORAGE_KEY);
                    const all = raw ? JSON.parse(raw) : {};
                    if (!all || typeof all !== 'object') return;
                    const normalized = userFavorites
                        .map((item) => normalizeFavoriteEntry(item))
                        .filter(Boolean);
                    all[owner] = normalized;
                    localStorage.setItem(USER_FAVORITES_STORAGE_KEY, JSON.stringify(all));
                } catch (e) {
                    console.warn('찜 목록 저장 실패:', e);
                }
            }

            function loadUserFavorites() {
                try {
                    const owner = getFavoritesOwnerKey();
                    const raw = localStorage.getItem(USER_FAVORITES_STORAGE_KEY);
                    const legacyRaw = localStorage.getItem('dadok_user_favorites');
                    const all = raw ? JSON.parse(raw) : {};
                    if (all && typeof all === 'object' && Array.isArray(all[owner])) {
                        userFavorites = all[owner]
                            .map((item) => normalizeFavoriteEntry(item))
                            .filter(Boolean);
                    } else if (legacyRaw) {
                        const legacyArr = JSON.parse(legacyRaw);
                        userFavorites = Array.isArray(legacyArr)
                            ? legacyArr.map((item) => normalizeFavoriteEntry(item)).filter(Boolean)
                            : [];
                        persistUserFavorites();
                    } else {
                        userFavorites = [];
                    }
                } catch (e) {
                    console.warn('찜 목록 불러오기 실패:', e);
                    userFavorites = [];
                }
            }

            function getChatAttachmentExt(att = {}) {
                const byName = String(att?.name || '').toLowerCase();
                const byUrl = String(att?.url || '').toLowerCase();
                const source = byName || byUrl;
                const match = source.match(/\.([a-z0-9]+)(?:$|\?)/i);
                return match ? match[1].toLowerCase() : '';
            }

            function renderChatAttachmentInline(att = {}, idx = 0) {
                const fileName = escapeChatHtml(att?.name || `첨부파일 ${idx + 1}`);
                const fileUrlRaw = String(att?.url || '').trim();
                const fileUrl = escapeChatHtml(fileUrlRaw || '#');
                const ext = getChatAttachmentExt(att);
                const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
                if (isImage) {
                    return `
                        <a href="${fileUrl}" target="_blank" rel="noopener" class="mt-2 block rounded-xl border border-[#2A3731] bg-[#06110D] overflow-hidden hover:border-[var(--point-color)]/50 transition-colors">
                            <img src="${fileUrl}" alt="${fileName}" class="w-full h-auto max-h-[260px] object-contain bg-[#020806]">
                        </a>
                    `;
                }
                if (ext === 'pdf') {
                    return `
                        <div class="mt-2 rounded-xl border border-[#2A3731] bg-[#06110D] overflow-hidden">
                            <iframe src="${fileUrl}" class="w-full h-[300px] bg-white" loading="lazy"></iframe>
                            <div class="px-3 py-2 text-[11px] text-[#A7B2AE] truncate">${fileName}</div>
                        </div>
                    `;
                }
                return `
                    <div class="mt-2 px-3 py-2 rounded-lg border border-[#2A3731] bg-[#06110D] text-[11px] text-[#C8D1CD] truncate">
                        첨부파일: ${fileName}
                    </div>
                `;
            }

            function getChatAttachmentExtByName(name = '') {
                const base = String(name || '').toLowerCase();
                const m = base.match(/\.([a-z0-9]+)$/i);
                return m ? m[1].toLowerCase() : '';
            }

            function validateChatAttachmentFiles(files = []) {
                if (!Array.isArray(files) || files.length === 0) {
                    return { ok: true };
                }
                if (files.length > CHAT_ATTACHMENT_MAX_COUNT) {
                    return {
                        ok: false,
                        message: `첨부파일은 최대 ${CHAT_ATTACHMENT_MAX_COUNT}개까지 가능합니다.`,
                    };
                }
                for (const file of files) {
                    const ext = getChatAttachmentExtByName(file?.name || '');
                    const mime = String(file?.type || '').toLowerCase();
                    const isImageMime = mime.startsWith('image/');
                    if (!isImageMime && (!ext || !CHAT_ATTACHMENT_ALLOWED_EXT.includes(ext))) {
                        return {
                            ok: false,
                            message: '지원하지 않는 파일 형식이 포함되어 있습니다.',
                        };
                    }
                    const isImage = isImageMime || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'jfif', 'heic', 'heif', 'avif'].includes(ext);
                    // 요청사항: 사진 첨부는 용량 제한 없음. (문서류는 기존 제한 유지)
                    if (!isImage && Number(file?.size || 0) > CHAT_ATTACHMENT_MAX_SIZE) {
                        return {
                            ok: false,
                            message: '문서 파일은 1개당 최대 10MB까지 첨부할 수 있습니다.',
                        };
                    }
                }
                return { ok: true };
            }

            function renderChatAttachmentPreview() {
                const preview = document.getElementById('chat-attachment-preview');
                if (!preview) return;
                if (!pendingChatAttachmentFiles.length) {
                    preview.classList.add('hidden');
                    preview.textContent = '';
                    return;
                }
                const labels = pendingChatAttachmentFiles.map((f) => String(f?.name || 'file'));
                if (pendingChatAttachmentUploadState === 'uploading') {
                    preview.textContent = `첨부 업로드 준비 중... (${labels.length}개)`;
                } else if (pendingChatAttachmentUploadState === 'done') {
                    preview.textContent = `첨부 업로드 완료 (${labels.length}개) - 전송 버튼만 누르면 됩니다.`;
                } else if (pendingChatAttachmentUploadState === 'error') {
                    preview.textContent = `첨부 업로드 실패 - 다시 선택해주세요.`;
                } else {
                    preview.textContent = `첨부 예정 (${labels.length}개): ${labels.join(', ')}`;
                }
                preview.classList.remove('hidden');
            }

            function releaseChatAttachmentPreviewUrls() {
                chatAttachmentPreviewUrls.forEach((url) => {
                    try {
                        URL.revokeObjectURL(url);
                    } catch (_) {
                        // no-op
                    }
                });
                chatAttachmentPreviewUrls = [];
            }

            function formatChatAttachmentSize(size = 0) {
                const n = Number(size || 0);
                if (!Number.isFinite(n) || n <= 0) return '0 B';
                if (n < 1024) return `${n} B`;
                if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
                return `${(n / (1024 * 1024)).toFixed(1)} MB`;
            }

            function renderChatAttachmentScreen() {
                const list = document.getElementById('chat-attachment-screen-list');
                if (!list) return;
                releaseChatAttachmentPreviewUrls();
                if (!pendingChatAttachmentFiles.length) {
                    list.innerHTML = '<div class="text-[13px] text-[var(--text-sub)]">첨부파일이 선택되지 않았습니다.</div>';
                    return;
                }
                const html = pendingChatAttachmentFiles
                    .map((file, idx) => {
                        const name = escapeChatHtml(file?.name || `첨부파일 ${idx + 1}`);
                        const ext = getChatAttachmentExtByName(file?.name || '');
                        const sizeText = formatChatAttachmentSize(file?.size || 0);
                        const typeText = ext ? ext.toUpperCase() : 'FILE';
                        const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
                        if (isImage) {
                            const objectUrl = URL.createObjectURL(file);
                            chatAttachmentPreviewUrls.push(objectUrl);
                            return `
                                <div class="rounded-xl border border-[#2A3731] bg-[#06110D] overflow-hidden">
                                    <img src="${objectUrl}" alt="${name}" class="w-full h-auto max-h-[72vh] object-contain bg-[#020806]">
                                </div>
                            `;
                        }
                        return `
                            <div class="rounded-xl border border-[#2A3731] bg-[#06110D] px-3 py-3">
                                <div class="text-[12px] text-white truncate">${name}</div>
                                <div class="text-[11px] text-[var(--text-sub)] mt-1">${typeText} · ${sizeText}</div>
                            </div>
                        `;
                    })
                    .join('');
                list.innerHTML = html;
            }

            function openChatAttachmentPreviewScreen() {
                const screen = document.getElementById('chat-attachment-screen');
                if (!screen) return;
                const wasHidden = screen.classList.contains('hidden');
                renderChatAttachmentScreen();
                screen.classList.remove('hidden');
                if (wasHidden && !chatAttachmentPreviewHistoryPushed) {
                    if (typeof appModalStack !== 'undefined' && Array.isArray(appModalStack)) {
                        appModalStack.push('closeChatAttachmentPreviewStep');
                        chatAttachmentPreviewHistoryPushed = true;
                        history.pushState(
                            { modalOpen: true, stackDepth: appModalStack.length, chatAttachmentPreview: true },
                            '',
                            location.href,
                        );
                    }
                }
            }

            function closeChatAttachmentPreviewScreen(clearFiles = false, fromPopstate = false) {
                const screen = document.getElementById('chat-attachment-screen');
                if (screen) screen.classList.add('hidden');
                releaseChatAttachmentPreviewUrls();
                if (chatAttachmentPreviewHistoryPushed) {
                    if (fromPopstate) {
                        chatAttachmentPreviewHistoryPushed = false;
                    } else {
                        chatAttachmentPreviewHistoryPushed = false;
                        if (typeof appModalStack !== 'undefined' && Array.isArray(appModalStack) && appModalStack.length > 0) {
                            appModalStack.pop();
                        }
                        if (typeof isClickClosing !== 'undefined') {
                            isClickClosing = true;
                            setTimeout(() => {
                                if (history.state && history.state.modalOpen) history.back();
                                setTimeout(() => {
                                    isClickClosing = false;
                                }, 50);
                            }, 10);
                        } else if (history.state && history.state.modalOpen) {
                            history.back();
                        }
                    }
                }
                if (clearFiles) {
                    resetChatAttachmentInput();
                }
            }

            window.closeChatAttachmentPreviewStep = function () {
                closeChatAttachmentPreviewScreen(false, true);
            };

            function setChatSendingState(isSending, message = '전송 중...') {
                isChatSending = !!isSending;
                const statusEl = document.getElementById('chat-send-status');
                const sendBtn = document.getElementById('chat-send-btn');
                const attachBtn = document.getElementById('chat-attach-btn');
                const inputEl = document.getElementById('chat-input');
                const previewSendBtn = document.getElementById('chat-attachment-send-btn');
                if (statusEl) {
                    statusEl.textContent = message;
                    statusEl.classList.toggle('hidden', !isSending);
                }
                if (sendBtn) sendBtn.disabled = !!isSending;
                if (attachBtn) attachBtn.disabled = !!isSending;
                if (inputEl) inputEl.disabled = !!isSending;
                if (previewSendBtn) previewSendBtn.disabled = !!isSending;
            }

            function setChatUploadLoadingState(mode = 'idle') {
                if (isChatSending) return;
                const statusEl = document.getElementById('chat-send-status');
                const previewSendBtn = document.getElementById('chat-attachment-send-btn');
                if (!statusEl) return;
                if (mode === 'uploading') {
                    statusEl.textContent = '첨부파일 로딩중...';
                    statusEl.classList.remove('hidden');
                    if (previewSendBtn) previewSendBtn.disabled = true;
                    return;
                }
                if (mode === 'done') {
                    statusEl.textContent = '첨부파일 준비 완료';
                    statusEl.classList.remove('hidden');
                    if (previewSendBtn) previewSendBtn.disabled = false;
                    return;
                }
                if (mode === 'error') {
                    statusEl.textContent = '첨부파일 로딩 실패. 다시 선택해주세요.';
                    statusEl.classList.remove('hidden');
                    if (previewSendBtn) previewSendBtn.disabled = false;
                    return;
                }
                statusEl.textContent = '전송 중...';
                statusEl.classList.add('hidden');
                if (previewSendBtn) previewSendBtn.disabled = false;
            }

            function resetChatAttachmentInput() {
                pendingChatAttachmentFiles = [];
                pendingChatAttachmentUploadPromise = null;
                pendingChatUploadedAttachments = [];
                pendingChatAttachmentUploadState = 'idle';
                pendingChatAttachmentUploadError = '';
                pendingChatAttachmentUploadToken = 0;
                const input = document.getElementById('chat-attachment-input');
                if (input) input.value = '';
                renderChatAttachmentPreview();
                setChatUploadLoadingState('idle');
            }

            function beginChatAttachmentPreupload() {
                if (!pendingChatAttachmentFiles.length) return;
                const files = [...pendingChatAttachmentFiles];
                const token = ++pendingChatAttachmentUploadToken;
                pendingChatUploadedAttachments = [];
                pendingChatAttachmentUploadError = '';
                pendingChatAttachmentUploadState = 'uploading';
                renderChatAttachmentPreview();
                setChatUploadLoadingState('uploading');
                const uploadThreadId =
                    activeChatThreadId || `chat_pre_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
                pendingChatAttachmentUploadPromise = uploadChatAttachments(uploadThreadId, files)
                    .then((rows) => {
                        if (token !== pendingChatAttachmentUploadToken) return rows;
                        pendingChatUploadedAttachments = Array.isArray(rows) ? rows : [];
                        pendingChatAttachmentUploadState = 'done';
                        renderChatAttachmentPreview();
                        setChatUploadLoadingState('done');
                        return rows;
                    })
                    .catch((err) => {
                        if (token !== pendingChatAttachmentUploadToken) throw err;
                        pendingChatAttachmentUploadState = 'error';
                        pendingChatAttachmentUploadError = err?.message || 'upload_failed';
                        renderChatAttachmentPreview();
                        setChatUploadLoadingState('error');
                        throw err;
                    });
            }

            window.triggerChatAttachmentPicker = function () {
                const input = document.getElementById('chat-attachment-input');
                if (input) input.click();
            };

            window.handleChatAttachmentInput = function (inputEl) {
                const files = Array.from(inputEl?.files || []);
                const validation = validateChatAttachmentFiles(files);
                if (!validation.ok) {
                    showCustomToast(validation.message);
                    pendingChatAttachmentFiles = [];
                    if (inputEl) inputEl.value = '';
                    renderChatAttachmentPreview();
                    setChatUploadLoadingState('idle');
                    return;
                }
                pendingChatAttachmentFiles = files;
                pendingChatAttachmentUploadPromise = null;
                pendingChatUploadedAttachments = [];
                pendingChatAttachmentUploadState = 'idle';
                pendingChatAttachmentUploadError = '';
                renderChatAttachmentPreview();
                openChatAttachmentPreviewScreen();
                beginChatAttachmentPreupload();
            };

            window.cancelChatAttachmentPreview = function () {
                closeChatAttachmentPreviewScreen(true);
            };

            window.sendChatAttachmentFromPreview = async function () {
                await sendUserMessage();
            };

            async function uploadChatAttachments(threadId = '', files = []) {
                if (!Array.isArray(files) || files.length === 0) return [];
                if (typeof firebase === 'undefined' || typeof firebase.storage !== 'function') {
                    throw new Error('Firebase Storage를 사용할 수 없습니다.');
                }
                const mimeToExt = (mime = '') => {
                    const m = String(mime || '').toLowerCase();
                    if (m === 'image/jpeg') return 'jpg';
                    if (m === 'image/png') return 'png';
                    if (m === 'image/webp') return 'webp';
                    if (m === 'image/gif') return 'gif';
                    if (m === 'image/heic') return 'heic';
                    if (m === 'image/heif') return 'heif';
                    if (m === 'image/avif') return 'avif';
                    if (m === 'application/pdf') return 'pdf';
                    return '';
                };

                const readFileAsDataUrl = (file) =>
                    new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(String(reader.result || ''));
                        reader.onerror = () => reject(new Error('파일 읽기에 실패했습니다.'));
                        reader.readAsDataURL(file);
                    });

                const loadImageElement = (dataUrl) =>
                    new Promise((resolve, reject) => {
                        const img = new Image();
                        img.onload = () => resolve(img);
                        img.onerror = () => reject(new Error('이미지 로드에 실패했습니다.'));
                        img.src = dataUrl;
                    });

                const compressChatImageFile = async (file) => {
                    const ext = getChatAttachmentExtByName(file?.name || '');
                    const type = String(file?.type || '').toLowerCase();
                    const isGif = ext === 'gif' || type === 'image/gif';
                    const canDecodeOnCanvas =
                        ['image/jpeg', 'image/png', 'image/webp'].includes(type) ||
                        ['jpg', 'jpeg', 'png', 'webp', 'jfif'].includes(ext);
                    const isCompressibleImage = canDecodeOnCanvas && !isGif;
                    if (!isCompressibleImage) return file;

                    const dataUrl = await readFileAsDataUrl(file);
                    const img = await loadImageElement(dataUrl);
                    const maxSide = 1080;
                    const srcW = Number(img.naturalWidth || img.width || 0) || 1;
                    const srcH = Number(img.naturalHeight || img.height || 0) || 1;
                    const scale = Math.min(1, maxSide / Math.max(srcW, srcH));
                    const targetW = Math.max(1, Math.round(srcW * scale));
                    const targetH = Math.max(1, Math.round(srcH * scale));

                    const canvas = document.createElement('canvas');
                    canvas.width = targetW;
                    canvas.height = targetH;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return file;
                    ctx.drawImage(img, 0, 0, targetW, targetH);

                    const outputMime = 'image/webp';
                    const outputQuality = 0.68;
                    const blob = await new Promise((resolve) =>
                        canvas.toBlob(resolve, outputMime, outputQuality),
                    );
                    if (!blob) return file;
                    if (blob.size >= Number(file?.size || 0)) return file;

                    const originalBaseName = String(file?.name || 'image').replace(/\.[^.]+$/, '');
                    const optimizedName = `${originalBaseName || 'image'}_opt.webp`;
                    return new File([blob], optimizedName, {
                        type: outputMime,
                        lastModified: Date.now(),
                    });
                };

                const storageRoot = firebase.storage().ref();
                const baseThreadId = String(threadId || 'thread').replace(/[^\w\-]/g, '_');
                const uploadId = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
                const uploadTasks = files.map(async (rawFile, i) => {
                    let optimizedFile = rawFile;
                    try {
                        optimizedFile = await compressChatImageFile(rawFile);
                    } catch (compressErr) {
                        // 압축 불가 포맷(예: 일부 기기 HEIC)은 원본 그대로 업로드
                        optimizedFile = rawFile;
                    }
                    let safeName = String(optimizedFile?.name || `attachment-${i + 1}`)
                        .replace(/[^\w.\-]/g, '_')
                        .slice(-120);
                    if (!getChatAttachmentExtByName(safeName)) {
                        const extByMime = mimeToExt(optimizedFile?.type || rawFile?.type || '');
                        if (extByMime) safeName = `${safeName}.${extByMime}`;
                    }
                    const ext = getChatAttachmentExtByName(safeName);
                    const filePath = `chat_attachments/${baseThreadId}/${uploadId}_${i + 1}_${safeName}`;
                    let snap = null;
                    try {
                        snap = await storageRoot.child(filePath).put(optimizedFile, {
                            contentType: optimizedFile?.type || 'application/octet-stream',
                        });
                    } catch (uploadErr) {
                        const canRetryWithRaw = optimizedFile !== rawFile;
                        if (!canRetryWithRaw) throw uploadErr;
                        snap = await storageRoot.child(filePath).put(rawFile, {
                            contentType: rawFile?.type || 'application/octet-stream',
                        });
                    }
                    const url = await snap.ref.getDownloadURL();
                    return {
                        name: safeName,
                        url,
                        size: Number(optimizedFile?.size || 0),
                        ext,
                        contentType: String(optimizedFile?.type || ''),
                    };
                });
                return Promise.all(uploadTasks);
            }

            function formatChatTimestamp(value) {
                if (!value) return '';
                let date = null;
                if (typeof value.toDate === 'function') date = value.toDate();
                else if (typeof value.toMillis === 'function') date = new Date(value.toMillis());
                else if (value instanceof Date) date = value;
                else {
                    const parsed = new Date(value);
                    if (!Number.isNaN(parsed.getTime())) date = parsed;
                }
                if (!date) return '';
                return date.toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });
            }

            function formatChatRelativeTime(value) {
                if (!value) return '-';
                let date = null;
                if (typeof value.toDate === 'function') date = value.toDate();
                else if (value instanceof Date) date = value;
                else {
                    const parsed = new Date(value);
                    if (!Number.isNaN(parsed.getTime())) date = parsed;
                }
                if (!date) return '-';
                const diffMs = Date.now() - date.getTime();
                const diffMin = Math.floor(diffMs / 60000);
                if (diffMin < 1) return '방금 전';
                if (diffMin < 60) return `${diffMin}분 전`;
                const diffHour = Math.floor(diffMin / 60);
                if (diffHour < 24) return `${diffHour}시간 전`;
                const diffDay = Math.floor(diffHour / 24);
                if (diffDay < 7) return `${diffDay}일 전`;
                return date.toLocaleDateString('ko-KR');
            }

            async function ensureLoggedInUserDocId() {
                let docId =
                    localStorage.getItem('dadok_loggedInUserDocId') ||
                    sessionStorage.getItem('dadok_loggedInUserDocId') ||
                    '';
                if (docId || typeof firebase === 'undefined') return docId;

                const username =
                    localStorage.getItem('dadok_username') ||
                    sessionStorage.getItem('dadok_username') ||
                    '';
                if (!username) return '';

                try {
                    const snap = await firebase
                        .firestore()
                        .collection('users')
                        .where('userId', '==', username)
                        .limit(1)
                        .get();
                    if (!snap.empty) {
                        docId = snap.docs[0].id;
                        if (localStorage.getItem('dadok_isLoggedIn') === 'true') {
                            localStorage.setItem('dadok_loggedInUserDocId', docId);
                        } else {
                            sessionStorage.setItem('dadok_loggedInUserDocId', docId);
                        }
                    }
                } catch (e) {
                    console.error('사용자 문서 ID 조회 실패:', e);
                }
                return docId;
            }

            async function getCurrentChatActor() {
                const partnerDocId = getLoggedInPartnerDocId();
                const partnerSessionActive =
                    localStorage.getItem('dadok_isPartnerLoggedIn') === 'true' ||
                    sessionStorage.getItem('dadok_isPartnerLoggedIn') === 'true';
                if (partnerDocId && partnerSessionActive) {
                    return {
                        role: 'partner',
                        docId: partnerDocId,
                        userId:
                            localStorage.getItem('dadok_loggedInPartnerUserId') ||
                            sessionStorage.getItem('dadok_loggedInPartnerUserId') ||
                            '',
                        name:
                            (currentPartner && currentPartner.name) ||
                            localStorage.getItem('dadok_loggedInPartnerUserId') ||
                            '파트너'
                    };
                }

                const userDocId = await ensureLoggedInUserDocId();
                const userId =
                    localStorage.getItem('dadok_username') ||
                    sessionStorage.getItem('dadok_username') ||
                    '';
                return {
                    role: 'user',
                    docId: userDocId,
                    userId,
                    name: userId || '고객'
                };
            }

            function buildChatThreadId(userDocId, partnerDocId) {
                if (!userDocId || !partnerDocId) return '';
                return `u_${userDocId}__p_${partnerDocId}`;
            }

            function getThreadUnreadCountForActor(thread = {}, actorRole = '') {
                if (actorRole === 'partner') return Number(thread.unreadForPartner || 0);
                if (actorRole === 'user') return Number(thread.unreadForUser || 0);
                return 0;
            }

            /** 채팅 UI에서는 GIF 썸네일 대신 동일 경로의 JPG를 사용(Storage에 함께 올린 정적 JPG 가정). */
            function normalizePartnerThumbnailForChat(url = '') {
                const s = String(url || '').trim();
                if (!s) return '';
                return s.replace(/\.gif(?=$|[?#])/i, '.jpg');
            }

            function getThreadDisplayName(thread = {}, actorRole = '') {
                const tid = String(thread.id || '');
                if (actorRole === 'partner') {
                    if (tid.startsWith('admin__p_')) {
                        return thread.userName || '다독 관리자';
                    }
                    return thread.userName || thread.userId || '고객';
                }
                if (tid.startsWith('admin__u_')) {
                    return thread.partnerName || '다독 관리자';
                }
                return thread.partnerName || thread.partnerUserId || '업체';
            }

            function getThreadDisplayImage(thread = {}, actorRole = '') {
                const tid = String(thread.id || '');
                const defaultAvatar =
                    'https://images.unsplash.com/photo-1544435253-f0ead49638fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80';
                const partnerImgForUser = (raw) => {
                    const n = normalizePartnerThumbnailForChat(String(raw || '').trim());
                    return n || defaultAvatar;
                };
                if (actorRole === 'partner') {
                    if (tid.startsWith('admin__p_')) {
                        return thread.userImage || defaultAvatar;
                    }
                    return thread.userImage || defaultAvatar;
                }
                if (tid.startsWith('admin__u_')) {
                    return partnerImgForUser(thread.partnerImage);
                }
                return partnerImgForUser(thread.partnerImage);
            }

            function applyChatSheetHeader(actorRole = 'user') {
                const chatName = document.getElementById('chat-profile-name');
                const headerImg = document.getElementById('chat-header-img');
                const defaultAvatar = document.getElementById('chat-default-avatar');
                const meta = activeChatThreadMeta || {};
                const imageUrl = getThreadDisplayImage(meta, actorRole);
                if (chatName) chatName.innerText = getThreadDisplayName(meta, actorRole);
                if (headerImg) headerImg.style.backgroundImage = `url('${imageUrl}')`;
                if (defaultAvatar) defaultAvatar.style.backgroundImage = `url('${imageUrl}')`;
            }

            function stopChatHeaderLiveSync() {
                if (typeof unsubscribeChatHeaderLive === 'function') {
                    unsubscribeChatHeaderLive();
                    unsubscribeChatHeaderLive = null;
                }
            }

            function startChatHeaderLiveSync(threadMeta, actorRole) {
                stopChatHeaderLiveSync();
                if (typeof firebase === 'undefined' || !threadMeta) return;
                const tid = String(threadMeta.id || '');
                const unsubs = [];

                if (actorRole === 'user' && !tid.startsWith('admin__u_')) {
                    const partnerDocId = String(threadMeta.participantPartnerDocId || '').trim();
                    if (!partnerDocId) return;
                    const ref = firebase.firestore().collection('partners').doc(partnerDocId);
                    const unsub = ref.onSnapshot(
                        (snap) => {
                            if (!snap.exists) return;
                            const d = snap.data() || {};
                            const name = String(d.name || d.companyName || d.shopName || '').trim();
                            const imgRaw = getPartnerThumbImage(d);
                            activeChatThreadMeta = {
                                ...activeChatThreadMeta,
                                partnerName: name || activeChatThreadMeta?.partnerName,
                                partnerImage: imgRaw ? normalizePartnerThumbnailForChat(imgRaw) : '',
                            };
                            applyChatSheetHeader(actorRole);
                            if (lastChatThreadMessages.length) {
                                renderRealtimeChatMessages(lastChatThreadMessages, actorRole);
                            }
                            updateChatCallButtonState(actorRole);
                        },
                        (e) => console.error('채팅 헤더(업체) 실시간 동기화 실패:', e),
                    );
                    unsubs.push(unsub);
                } else if (actorRole === 'partner' && !tid.startsWith('admin__p_')) {
                    const userDocId = String(threadMeta.participantUserDocId || '').trim();
                    if (!userDocId) return;
                    const ref = firebase.firestore().collection('users').doc(userDocId);
                    const unsub = ref.onSnapshot(
                        (snap) => {
                            if (!snap.exists) return;
                            const d = snap.data() || {};
                            const name = String(d.displayName || d.name || d.userId || d.username || '').trim();
                            const img = String(d.profileImageUrl || d.photoURL || d.avatarUrl || d.image || '').trim();
                            activeChatThreadMeta = {
                                ...activeChatThreadMeta,
                                userName: name || activeChatThreadMeta?.userName,
                                userImage: img || activeChatThreadMeta?.userImage,
                            };
                            applyChatSheetHeader(actorRole);
                            if (lastChatThreadMessages.length) {
                                renderRealtimeChatMessages(lastChatThreadMessages, actorRole);
                            }
                        },
                        (e) => console.error('채팅 헤더(고객) 실시간 동기화 실패:', e),
                    );
                    unsubs.push(unsub);
                } else {
                    return;
                }

                unsubscribeChatHeaderLive = () => {
                    unsubs.forEach((u) => u());
                };
            }

            function renderPartnerChatBadgeFromRows(rows = []) {
                const badge = document.getElementById('partner-chat-unread-badge');
                if (!badge) return;
                if (!isInAppChatEnabled('partner')) {
                    badge.classList.add('hidden');
                    return;
                }
                const totalUnread = rows.reduce((sum, row) => sum + Number(row.unreadForPartner || 0), 0);
                if (totalUnread > 0) {
                    badge.textContent = `새 문의 ${totalUnread}건`;
                    badge.classList.remove('hidden');
                } else {
                    badge.classList.add('hidden');
                }
            }

            function renderUserChatUnreadBadgeFromRows(rows = []) {
                const badge = document.getElementById('user-chat-unread-badge');
                if (!badge) return;
                if (!isInAppChatEnabled('user')) {
                    badge.classList.add('hidden');
                    return;
                }
                const totalUnread = rows.reduce((sum, row) => sum + Number(row.unreadForUser || 0), 0);
                badge.textContent = totalUnread > 99 ? '99+' : String(totalUnread);
                badge.classList.toggle('hidden', totalUnread <= 0);
            }

            function stopUserChatUnreadListener() {
                if (typeof unsubscribeUserChatUnread === 'function') {
                    unsubscribeUserChatUnread();
                }
                unsubscribeUserChatUnread = null;
                userChatUnreadTargetDocId = '';
            }

            async function startUserChatUnreadListener() {
                if (typeof firebase === 'undefined') return;
                const actor = await getCurrentChatActor();
                if (actor.role !== 'user' || !actor.docId) {
                    stopUserChatUnreadListener();
                    resetUnreadTrackers('user');
                    renderUserChatUnreadBadgeFromRows([]);
                    return;
                }
                if (
                    userChatUnreadTargetDocId === actor.docId &&
                    typeof unsubscribeUserChatUnread === 'function'
                ) {
                    return;
                }
                stopUserChatUnreadListener();
                userChatUnreadTargetDocId = actor.docId;

                let queryRows = [];
                let adminThreadRow = null;
                const renderMergedUnread = () => {
                    const merged = [...queryRows];
                    if (adminThreadRow) {
                        const exists = merged.some((row) => String(row.id || '') === String(adminThreadRow.id || ''));
                        if (!exists) merged.push(adminThreadRow);
                    }
                    maybeShowIncomingChatToastFromRows(merged, 'user');
                    renderUserChatUnreadBadgeFromRows(merged);
                };

                const queryUnsub = firebase
                    .firestore()
                    .collection('chat_threads')
                    .where('participantUserDocId', '==', actor.docId)
                    .onSnapshot((snap) => {
                        queryRows = snap.docs.map((doc) => ({ ...(doc.data() || {}), id: doc.id }));
                        renderMergedUnread();
                    });

                const adminThreadId = `admin__u_${actor.docId}`;
                const adminDocUnsub = firebase
                    .firestore()
                    .collection('chat_threads')
                    .doc(adminThreadId)
                    .onSnapshot((doc) => {
                        adminThreadRow = doc.exists ? { ...(doc.data() || {}), id: doc.id } : null;
                        renderMergedUnread();
                    });

                unsubscribeUserChatUnread = () => {
                    if (typeof queryUnsub === 'function') queryUnsub();
                    if (typeof adminDocUnsub === 'function') adminDocUnsub();
                };
            }

            let currentChatCallState = {
                phone: '',
                canCall: false,
                reason: '전화 연결 상태를 확인 중입니다.',
                isBusinessOpen: false,
                actorRole: 'user'
            };

            function parseKstMinutesFromAmPm(ampm = '', hour = 0, minute = 0) {
                let h = Number(hour || 0);
                const m = Number(minute || 0);
                if (ampm === '오전') {
                    if (h === 12) h = 0;
                } else if (ampm === '오후') {
                    if (h < 12) h += 12;
                }
                return h * 60 + m;
            }

            function parseBusinessHourWindow(rawText = '') {
                const text = String(rawText || '').trim();
                if (!text) return null;
                if (text.includes('24') || text.includes('연중무휴')) {
                    return { startMin: 0, endMin: 1440, overnight: false };
                }
                const regex = /(오전|오후)?\s*(\d{1,2})\s*:\s*(\d{2})/g;
                const matches = [...text.matchAll(regex)];
                if (matches.length < 2) return null;
                const start = matches[0];
                const end = matches[1];
                const startMin = parseKstMinutesFromAmPm(start[1] || '', start[2], start[3]);
                const endMin = parseKstMinutesFromAmPm(end[1] || '', end[2], end[3]);
                const overnight = endMin <= startMin;
                return { startMin, endMin, overnight };
            }

            function normalizeTimeValue(value = '') {
                const raw = String(value || '').trim();
                const match = raw.match(/^(\d{1,2}):(\d{2})$/);
                if (!match) return '';
                const hh = String(Math.min(23, Math.max(0, Number(match[1])))).padStart(2, '0');
                const mm = String(Math.min(59, Math.max(0, Number(match[2])))).padStart(2, '0');
                return `${hh}:${mm}`;
            }

            function parseCallHoursToRange(rawText = '') {
                const text = String(rawText || '').trim();
                const matches = [...text.matchAll(/(\d{1,2})\s*:\s*(\d{2})/g)];
                if (matches.length >= 2) {
                    const start = normalizeTimeValue(`${matches[0][1]}:${matches[0][2]}`) || '10:00';
                    const end = normalizeTimeValue(`${matches[1][1]}:${matches[1][2]}`) || '22:00';
                    return { start, end };
                }
                return { start: '10:00', end: '22:00' };
            }

            function getPartnerCallHourRange() {
                const startInput = document.getElementById('partner-input-call-start');
                const endInput = document.getElementById('partner-input-call-end');
                const start = normalizeTimeValue(startInput?.value || '');
                const end = normalizeTimeValue(endInput?.value || '');
                return {
                    start: start || '',
                    end: end || ''
                };
            }

            function setPartnerCallTimePreset(type = 'day') {
                const startInput = document.getElementById('partner-input-call-start');
                const endInput = document.getElementById('partner-input-call-end');
                if (!startInput || !endInput) return;
                if (type === 'night') {
                    startInput.value = '18:00';
                    endInput.value = '03:00';
                    return;
                }
                if (type === 'all_day') {
                    startInput.value = '00:00';
                    endInput.value = '23:59';
                    return;
                }
                startInput.value = '10:00';
                endInput.value = '22:00';
            }

            window.setPartnerCallTimePreset = setPartnerCallTimePreset;

            function getPartnerBusinessHourRange() {
                const startInput = document.getElementById('partner-input-hours-start');
                const endInput = document.getElementById('partner-input-hours-end');
                const start = normalizeTimeValue(startInput?.value || '');
                const end = normalizeTimeValue(endInput?.value || '');
                return {
                    start: start || '',
                    end: end || '',
                };
            }

            function setPartnerBusinessHoursPreset(type = 'day') {
                const startInput = document.getElementById('partner-input-hours-start');
                const endInput = document.getElementById('partner-input-hours-end');
                if (!startInput || !endInput) return;
                if (type === 'night') {
                    startInput.value = '18:00';
                    endInput.value = '03:00';
                    return;
                }
                if (type === 'all_day') {
                    startInput.value = '00:00';
                    endInput.value = '23:59';
                    return;
                }
                startInput.value = '10:00';
                endInput.value = '22:00';
            }

            window.setPartnerBusinessHoursPreset = setPartnerBusinessHoursPreset;

            const PARTNER_IMAGE_RULES = {
                thumb: {
                    field: 'imageThumb',
                    ratio: 1,
                    ratioLabel: '1:1',
                    minW: 600,
                    minH: 600,
                    recommended: '권장 1080x1080, 최소 600x600',
                    path: 'partners_profile_thumb',
                    noticeId: 'partner-thumb-warning',
                    maxBytes: 10 * 1024 * 1024,
                    gifMaxBytes: 5 * 1024 * 1024,
                    allowedExtensions: ['jpg', 'jpeg', 'png', 'gif'],
                    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
                },
                detail: {
                    field: 'imageDetail',
                    ratio: 16 / 9,
                    ratioLabel: '16:9',
                    minW: 1280,
                    minH: 720,
                    recommended: '권장 1440x810, 최소 1280x720',
                    path: 'partners_profile_detail',
                    noticeId: 'partner-detail-warning',
                    maxBytes: 10 * 1024 * 1024,
                    allowedExtensions: ['jpg', 'jpeg', 'png'],
                    allowedMimeTypes: ['image/jpeg', 'image/png'],
                },
            };

            function getFileExtension(name = '') {
                const text = String(name || '').toLowerCase().trim();
                const idx = text.lastIndexOf('.');
                if (idx < 0) return '';
                return text.slice(idx + 1);
            }

            function isAllowedImageFileForType(file, type = 'thumb') {
                const rule = PARTNER_IMAGE_RULES[type];
                if (!rule) return false;
                const ext = getFileExtension(file?.name || '');
                const mime = String(file?.type || '').toLowerCase().trim();
                const extAllowed = rule.allowedExtensions.includes(ext);
                const mimeAllowed = !mime || rule.allowedMimeTypes.includes(mime);
                return extAllowed && mimeAllowed;
            }

            function getPartnerThumbImage(partner = {}) {
                return (
                    partner?.imageThumb ||
                    partner?.thumbnailImage ||
                    partner?.thumbImage ||
                    partner?.image ||
                    ''
                );
            }

            function getPartnerDetailImage(partner = {}) {
                return (
                    partner?.imageDetail ||
                    partner?.detailImage ||
                    partner?.bannerImage ||
                    partner?.image ||
                    ''
                );
            }

            function setPartnerImageWarning(type = 'thumb', message = '') {
                const rule = PARTNER_IMAGE_RULES[type];
                if (!rule) return;
                const warnEl = document.getElementById(rule.noticeId);
                if (warnEl) warnEl.innerText = String(message || '');
            }

            function updateSinglePhotoPickerUI(type = 'thumb', imageUrl = '', isUploading = false) {
                const isThumb = type === 'thumb';
                const previewEl = document.getElementById(
                    isThumb ? 'partner-thumb-preview' : 'partner-detail-preview',
                );
                const labelEl = document.getElementById(
                    isThumb ? 'partner-thumb-picker-label' : 'partner-detail-picker-label',
                );
                const pickerBox = document.getElementById(
                    isThumb ? 'partner-thumb-picker-box' : 'partner-detail-picker-box',
                );
                const safeUrl = String(imageUrl || '').trim();
                const baseLabel = isThumb ? '썸네일 사진 업로드' : '상세 배너 업로드';

                if (previewEl) {
                    if (safeUrl) {
                        previewEl.style.backgroundImage = `url('${safeUrl}')`;
                        previewEl.classList.remove('hidden');
                    } else {
                        previewEl.style.backgroundImage = 'none';
                        previewEl.classList.add('hidden');
                    }
                }
                if (labelEl) {
                    if (isUploading) labelEl.innerText = '사진 업로드 중...';
                    else labelEl.innerText = safeUrl ? '사진 다시 변경하기' : baseLabel;
                }
                if (pickerBox) {
                    pickerBox.classList.toggle('opacity-60', !!isUploading);
                    pickerBox.classList.toggle('pointer-events-none', !!isUploading);
                }
            }

            function updatePartnerPhotoPickerUIFromPartner(partner = {}) {
                updateSinglePhotoPickerUI('thumb', getPartnerThumbImage(partner), false);
                updateSinglePhotoPickerUI('detail', getPartnerDetailImage(partner), false);
            }

            async function readImageMeta(file) {
                return new Promise((resolve, reject) => {
                    const objectUrl = URL.createObjectURL(file);
                    const img = new Image();
                    img.onload = () => {
                        const width = Number(img.naturalWidth || img.width || 0);
                        const height = Number(img.naturalHeight || img.height || 0);
                        URL.revokeObjectURL(objectUrl);
                        resolve({ width, height, ratio: height ? width / height : 0 });
                    };
                    img.onerror = () => {
                        URL.revokeObjectURL(objectUrl);
                        reject(new Error('이미지 메타데이터를 읽지 못했습니다.'));
                    };
                    img.src = objectUrl;
                });
            }

            async function validatePartnerImageFile(file, type = 'thumb') {
                const rule = PARTNER_IMAGE_RULES[type];
                if (!rule) return { ok: false, warning: '이미지 타입 설정이 올바르지 않습니다.' };
                const { width, height, ratio } = await readImageMeta(file);
                const ratioDiff = Math.abs(ratio - rule.ratio);
                const ratioOk = ratioDiff <= 0.08;
                const sizeOk = width >= rule.minW && height >= rule.minH;
                let warning = '';

                if (!ratioOk && !sizeOk) {
                    warning = `비율(${rule.ratioLabel})/해상도 기준 미달입니다. 일부 사진이 잘려보일 수 있습니다. (${rule.recommended})`;
                } else if (!ratioOk) {
                    warning = `비율이 ${rule.ratioLabel}가 아니어서 일부 사진이 잘려보일 수 있습니다.`;
                } else if (!sizeOk) {
                    warning = `해상도가 낮아 품질 저하/잘림이 발생할 수 있습니다. (${rule.recommended})`;
                }

                return { ok: true, warning, width, height };
            }

            function triggerPartnerImagePicker(type = 'thumb') {
                const input = document.getElementById(
                    type === 'detail' ? 'partner-detail-file-input' : 'partner-thumb-file-input',
                );
                if (!input) return;
                input.click();
            }

            async function handlePartnerImageSelected(inputEl, type = 'thumb') {
                const file = inputEl?.files?.[0];
                if (!file) return;
                const safeType = type === 'detail' ? 'detail' : 'thumb';
                const rule = PARTNER_IMAGE_RULES[safeType];

                if (!String(file.type || '').startsWith('image/')) {
                    showCustomToast('이미지 파일만 업로드할 수 있습니다.');
                    inputEl.value = '';
                    return;
                }

                if (!isAllowedImageFileForType(file, safeType)) {
                    if (safeType === 'detail') {
                        showCustomToast('상세 배너는 JPG/PNG 정지 이미지 파일만 업로드할 수 있습니다.');
                    } else {
                        showCustomToast('썸네일은 JPG/PNG/GIF 파일만 업로드할 수 있습니다.');
                    }
                    inputEl.value = '';
                    return;
                }

                const ext = getFileExtension(file.name || '');
                if (ext === 'gif' && safeType === 'thumb' && file.size > Number(rule.gifMaxBytes || 0)) {
                    showCustomToast('썸네일 GIF는 최대 5MB까지 업로드할 수 있습니다.');
                    inputEl.value = '';
                    return;
                }

                if (file.size > Number(rule.maxBytes || 10 * 1024 * 1024)) {
                    showCustomToast('이미지 용량은 10MB 이하만 업로드할 수 있습니다.');
                    inputEl.value = '';
                    return;
                }

                const partnerDocId = localStorage.getItem('dadok_loggedInPartnerDocId') || sessionStorage.getItem('dadok_loggedInPartnerDocId');
                if (!partnerDocId || typeof firebase === 'undefined') {
                    showCustomToast('로그인 정보 또는 네트워크 상태를 확인해주세요.');
                    inputEl.value = '';
                    return;
                }

                let validationInfo = null;
                try {
                    validationInfo = await validatePartnerImageFile(file, safeType);
                    setPartnerImageWarning(safeType, validationInfo.warning || '');
                } catch (e) {
                    setPartnerImageWarning(safeType, '이미지 분석에 실패했습니다. 권장 사이즈를 확인해주세요.');
                }

                updateSinglePhotoPickerUI(
                    safeType,
                    safeType === 'thumb' ? getPartnerThumbImage(currentPartner || {}) : getPartnerDetailImage(currentPartner || {}),
                    true,
                );

                try {
                    const partnerRef = firebase.firestore().collection('partners').doc(partnerDocId);
                    const partnerDoc = await partnerRef.get();
                    if (!partnerDoc.exists) {
                        showCustomToast('파트너 정보를 찾을 수 없습니다.');
                        inputEl.value = '';
                        updateSinglePhotoPickerUI(
                            safeType,
                            safeType === 'thumb' ? getPartnerThumbImage(currentPartner || {}) : getPartnerDetailImage(currentPartner || {}),
                            false,
                        );
                        return;
                    }

                    const partnerData = partnerDoc.data() || {};
                    if (!isPartnerApproved(partnerData)) {
                        showCustomToast('관리자 승인 완료된 파트너만 사진을 변경할 수 있습니다.');
                        inputEl.value = '';
                        updateSinglePhotoPickerUI(
                            safeType,
                            safeType === 'thumb' ? getPartnerThumbImage(currentPartner || {}) : getPartnerDetailImage(currentPartner || {}),
                            false,
                        );
                        return;
                    }

                    const safeFileName = String(file.name || 'partner_photo')
                        .replace(/[^\w.\-]/g, '_')
                        .slice(-80);
                    const storageRef = firebase.storage().ref();
                    const fileRef = storageRef.child(`${rule.path}/${partnerDocId}/${Date.now()}_${safeFileName}`);
                    const snapshot = await fileRef.put(file, { contentType: file.type || 'image/jpeg' });
                    const imageUrl = await snapshot.ref.getDownloadURL();
                    const updatePayload = {
                        [rule.field]: imageUrl,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    };
                    if (safeType === 'thumb') {
                        // 기존 앱/관리자 화면과의 호환을 위해 대표 image도 썸네일로 동기화
                        updatePayload.image = imageUrl;
                    }
                    await partnerRef.update(updatePayload);

                    currentPartner = {
                        ...(currentPartner || {}),
                        id: partnerDocId,
                        ...partnerData,
                        [rule.field]: imageUrl,
                        image: safeType === 'thumb' ? imageUrl : partnerData.image || currentPartner?.image || '',
                    };

                    const savedProfileRaw = localStorage.getItem('myPartnerProfile');
                    if (savedProfileRaw) {
                        try {
                            const savedProfile = JSON.parse(savedProfileRaw);
                            if (!savedProfile?.id || savedProfile.id === partnerDocId) {
                                const nextSaved = {
                                    ...savedProfile,
                                    [rule.field]: imageUrl,
                                };
                                if (safeType === 'thumb') nextSaved.image = imageUrl;
                                localStorage.setItem('myPartnerProfile', JSON.stringify(nextSaved));
                            }
                        } catch (e) {
                            console.error('로컬 프로필 이미지 동기화 실패:', e);
                        }
                    }

                    DB_CHOICE = DB_CHOICE.map((p) =>
                        p.id === partnerDocId
                            ? { ...p, [rule.field]: imageUrl, image: safeType === 'thumb' ? imageUrl : p.image }
                            : p,
                    );
                    DB_RECOMMEND = DB_RECOMMEND.map((p) =>
                        p.id === partnerDocId
                            ? { ...p, [rule.field]: imageUrl, image: safeType === 'thumb' ? imageUrl : p.image }
                            : p,
                    );
                    filteredChoiceDB = filteredChoiceDB.map((p) =>
                        p.id === partnerDocId
                            ? { ...p, [rule.field]: imageUrl, image: safeType === 'thumb' ? imageUrl : p.image }
                            : p,
                    );
                    filteredRecDB = filteredRecDB.map((p) =>
                        p.id === partnerDocId
                            ? { ...p, [rule.field]: imageUrl, image: safeType === 'thumb' ? imageUrl : p.image }
                            : p,
                    );

                    const profileNameEl = document.getElementById('profile-name');
                    const profileImageEl = document.getElementById('profile-img');
                    if (
                        safeType === 'detail' &&
                        profileImageEl &&
                        profileNameEl &&
                        profileNameEl.innerText === (currentPartner.name || '')
                    ) {
                        profileImageEl.style.backgroundImage = `url('${getPartnerDetailImage(currentPartner)}')`;
                    }

                    if (typeof applyFiltersToData === 'function') applyFiltersToData();
                    if (typeof initializeDynamicContent === 'function') initializeDynamicContent();
                    if (typeof ensureThreadForCurrentPartnerProfile === 'function') {
                        await ensureThreadForCurrentPartnerProfile().catch(() => null);
                    }

                    updateSinglePhotoPickerUI(safeType, imageUrl, false);
                    const typeLabel = safeType === 'thumb' ? '썸네일' : '상세 배너';
                    const warnText = validationInfo?.warning ? ' (경고: 비율/해상도 확인 필요)' : '';
                    showCustomToast(`${typeLabel} 이미지가 업로드되어 실시간 반영되었습니다.${warnText}`);
                } catch (e) {
                    console.error('업체 사진 업로드 실패:', e);
                    updateSinglePhotoPickerUI(
                        safeType,
                        safeType === 'thumb' ? getPartnerThumbImage(currentPartner || {}) : getPartnerDetailImage(currentPartner || {}),
                        false,
                    );
                    showCustomToast('사진 업로드에 실패했습니다. 잠시 후 다시 시도해주세요.');
                } finally {
                    inputEl.value = '';
                }
            }

            function updatePartnerPhotoPickerUI(imageUrl = '', isUploading = false) {
                // legacy wrapper (thumb)
                updateSinglePhotoPickerUI('thumb', imageUrl, isUploading);
            }

            window.triggerPartnerImagePicker = triggerPartnerImagePicker;
            window.handlePartnerImageSelected = handlePartnerImageSelected;

            function isWithinBusinessHours(rawHours = '') {
                const windowInfo = parseBusinessHourWindow(rawHours);
                if (!windowInfo) {
                    return { canEvaluate: false, isOpen: true, label: '영업시간 정보 미등록' };
                }

                const nowKst = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
                const nowMin = nowKst.getHours() * 60 + nowKst.getMinutes();
                let isOpen = false;
                if (windowInfo.overnight) {
                    isOpen = nowMin >= windowInfo.startMin || nowMin < windowInfo.endMin;
                } else {
                    isOpen = nowMin >= windowInfo.startMin && nowMin < windowInfo.endMin;
                }
                return {
                    canEvaluate: true,
                    isOpen,
                    label: isOpen ? '현재 통화 가능 시간입니다. 바로 전화 연결됩니다.' : '현재 통화 가능 시간이 아닙니다. 채팅 문의를 이용해주세요.'
                };
            }

            function getCurrentPartnerPhone() {
                const candidates = [
                    currentPartner?.phoneNumber,
                    currentPartner?.contact,
                    currentPartner?.phone,
                    activeChatThreadMeta?.partnerPhone,
                    activeChatThreadMeta?.participantPartnerUserId
                ];
                for (const value of candidates) {
                    const digits = normalizePhoneDigits(String(value || ''));
                    if (digits.length >= 9) return digits;
                }
                return '';
            }

            function getCurrentPartnerCallHoursText() {
                const start = activeChatThreadMeta?.partnerCallStart || currentPartner?.callAvailableStart || '';
                const end = activeChatThreadMeta?.partnerCallEnd || currentPartner?.callAvailableEnd || '';
                if (start && end) return `${start} ~ ${end}`;
                return (
                    activeChatThreadMeta?.partnerCallHours ||
                    currentPartner?.callAvailableHours ||
                    currentPartner?.callHours ||
                    ''
                );
            }

            function getCurrentPartnerCallEnabled() {
                if (typeof activeChatThreadMeta?.partnerCallEnabled === 'boolean') {
                    return activeChatThreadMeta.partnerCallEnabled;
                }
                if (typeof currentPartner?.callEnabled === 'boolean') return currentPartner.callEnabled;
                return true;
            }

            function updateChatCallButtonState(actorRole = 'user') {
                const callBtn = document.getElementById('chat-call-btn');
                const statusEl = document.getElementById('chat-call-status');
                if (!callBtn) return;
                const phoneDigits = getCurrentPartnerPhone();
                const callEnabled = getCurrentPartnerCallEnabled();
                const callHoursText = getCurrentPartnerCallHoursText();
                const callHourCheck = isWithinBusinessHours(callHoursText);
                const isUserMode = actorRole === 'user';
                const hasPhone = Boolean(phoneDigits);
                const hasCallHours = Boolean(String(callHoursText || '').trim());
                const canCall = isUserMode && hasPhone && callEnabled && hasCallHours && callHourCheck.isOpen;
                const reason = !isUserMode
                    ? '업체/관리자 모드에서는 전화 연결 버튼이 비활성화됩니다.'
                    : !hasPhone
                        ? '등록된 전화번호가 없어 채팅 문의만 가능합니다.'
                        : !callEnabled
                            ? '업체가 현재 전화 문의를 비활성화했습니다. 채팅 문의를 이용해주세요.'
                            : !hasCallHours
                                ? '업체가 통화 가능 시간을 아직 설정하지 않았습니다.'
                            : callHourCheck.label;

                currentChatCallState = {
                    phone: phoneDigits,
                    canCall,
                    reason,
                    isBusinessOpen: callHourCheck.isOpen,
                    actorRole
                };

                callBtn.disabled = !canCall;
                if (canCall) {
                    callBtn.className =
                        'shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-[var(--point-color)] text-[#06110D] shadow-sm hover:brightness-110 transition-colors';
                } else {
                    callBtn.className =
                        'shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-[#1A2521] text-[#A7B2AE] border border-[#2A3731] shadow-sm transition-colors cursor-not-allowed';
                }
                if (statusEl) {
                    statusEl.textContent = reason;
                    statusEl.className = canCall
                        ? 'text-[11px] text-[var(--point-color)] mt-2 ml-1'
                        : 'text-[11px] text-[var(--text-sub)] mt-2 ml-1';
                }
            }

            async function logCallClickEvent() {
                if (typeof firebase === 'undefined') return;
                try {
                    const actor = await getCurrentChatActor();
                    const partnerId =
                        currentPartner?.id ||
                        activeChatThreadMeta?.participantPartnerDocId ||
                        '';
                    const partnerName =
                        currentPartner?.name ||
                        activeChatThreadMeta?.partnerName ||
                        '';

                    await firebase.firestore().collection('call_click_logs').add({
                        threadId: activeChatThreadId || '',
                        partnerDocId: partnerId,
                        partnerName: partnerName,
                        callerRole: actor.role || 'user',
                        callerDocId: actor.docId || '',
                        callerUserId: actor.userId || '',
                        callerName: actor.name || '',
                        phoneDigits: currentChatCallState.phone || '',
                        isBusinessOpen: Boolean(currentChatCallState.isBusinessOpen),
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                } catch (e) {
                    console.error('전화 클릭 로그 저장 실패:', e);
                }
            }

            async function onChatCallButtonClick() {
                if (!currentChatCallState.canCall) return;
                await logCallClickEvent();
                window.location.href = `tel:${currentChatCallState.phone}`;
            }

            window.onChatCallButtonClick = onChatCallButtonClick;

            function bindPartnerDashboardChatBadgeListener() {
                const partnerDocId = getLoggedInPartnerDocId();
                if (!partnerDocId || typeof firebase === 'undefined') return;
                if (typeof unsubscribePartnerChatBadge === 'function') {
                    unsubscribePartnerChatBadge();
                    unsubscribePartnerChatBadge = null;
                }
                unsubscribePartnerChatBadge = firebase
                    .firestore()
                    .collection('chat_threads')
                    .where('participantPartnerDocId', '==', partnerDocId)
                    .onSnapshot((snap) => {
                        const rows = snap.docs.map((doc) => ({ ...(doc.data() || {}), id: doc.id }));
                        maybeShowIncomingChatToastFromRows(rows, 'partner');
                        renderPartnerChatBadgeFromRows(rows);
                    });
            }

            async function markThreadAsRead(threadId, actorRole) {
                if (!threadId || !actorRole || typeof firebase === 'undefined') return;
                const fieldName = actorRole === 'partner' ? 'unreadForPartner' : 'unreadForUser';
                try {
                    await firebase.firestore().collection('chat_threads').doc(threadId).set(
                        {
                            [fieldName]: 0,
                            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                        },
                        { merge: true }
                    );
                } catch (e) {
                    console.error('채팅 읽음 처리 실패:', e);
                }
            }

            async function ensureThreadForCurrentPartnerProfile() {
                if (typeof firebase === 'undefined' || !currentPartner) return null;
                const actor = await getCurrentChatActor();
                if (actor.role !== 'user') {
                    showCustomToast('고객 계정으로 예약 문의가 가능합니다.');
                    return null;
                }
                if (!actor.docId) {
                    showCustomToast('로그인 후 채팅을 이용할 수 있습니다.');
                    return null;
                }
                const partnerDocId = String(currentPartner.id || '').trim();
                if (!partnerDocId || partnerDocId === 'my-partner') {
                    showCustomToast('채팅 가능한 업체 정보를 찾지 못했습니다.');
                    return null;
                }

                const threadId = buildChatThreadId(actor.docId, partnerDocId);
                if (!threadId) return null;

                const threadRef = firebase.firestore().collection('chat_threads').doc(threadId);
                const userImageForThread =
                    currentUserProfileImageUrl || resolveStoredUserProfileImageUrl() || '';
                const baseData = {
                    id: threadId,
                    participantUserDocId: actor.docId,
                    participantUserId: actor.userId || '',
                    userImage: userImageForThread,
                    participantPartnerDocId: partnerDocId,
                    participantPartnerUserId: currentPartner.userId || '',
                    userName: actor.name || actor.userId || '고객',
                    partnerName: currentPartner.name || '업체',
                    partnerImage: currentPartner.image || '',
                    partnerPhone:
                        currentPartner.phoneNumber ||
                        currentPartner.contact ||
                        currentPartner.phone ||
                        '',
                    partnerBusinessHours:
                        currentPartner.hours ||
                        currentPartner.businessHours ||
                        currentPartner.operatingHours ||
                        '',
                    partnerCallEnabled:
                        typeof currentPartner.callEnabled === 'boolean'
                            ? currentPartner.callEnabled
                            : true,
                    partnerCallHours:
                        currentPartner.callAvailableHours ||
                        currentPartner.callHours ||
                        currentPartner.hours ||
                        '',
                    partnerCallStart: currentPartner.callAvailableStart || '',
                    partnerCallEnd: currentPartner.callAvailableEnd || '',
                    lastMessage: '',
                    lastSenderRole: '',
                    unreadForUser: 0,
                    unreadForPartner: 0,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                await threadRef.set(baseData, { merge: true });
                return {
                    id: threadId,
                    ...baseData
                };
            }

            function stopChatThreadMessagesListener() {
                stopChatHeaderLiveSync();
                if (typeof unsubscribeChatThreadMessages === 'function') {
                    unsubscribeChatThreadMessages();
                    unsubscribeChatThreadMessages = null;
                }
            }

            function scrollChatToBottom(forceRepeat = false) {
                const container = document.getElementById('chat-messages-container');
                if (!container) return;
                const scrollArea = container.parentElement;
                if (!scrollArea) return;
                const moveBottom = () => {
                    scrollArea.scrollTop = scrollArea.scrollHeight;
                };
                moveBottom();
                requestAnimationFrame(moveBottom);
                if (forceRepeat) {
                    setTimeout(moveBottom, 80);
                    setTimeout(moveBottom, 180);
                    setTimeout(moveBottom, 320);
                }
            }

            function renderRealtimeChatMessages(messages = [], actorRole = 'user') {
                const container = document.getElementById('chat-messages-container');
                if (!container) return;
                if (!messages.length) {
                    container.innerHTML = `<div class="text-center text-[13px] text-[var(--text-sub)] py-6">아직 대화가 없습니다. 첫 메시지를 보내보세요.</div>`;
                    return;
                }

                container.innerHTML = messages
                    .map((msg) => {
                        const senderRole = msg.senderRole || 'user';
                        const senderDocId = String(msg.senderDocId || '').trim();
                        const actorDocId = String(activeChatActor?.docId || '').trim();
                        const senderUserId = String(msg.senderUserId || '').trim();
                        const actorUserId = String(activeChatActor?.userId || '').trim();
                        const isMine =
                            (actorDocId && senderDocId && senderDocId === actorDocId) ||
                            (actorUserId && senderUserId && senderUserId === actorUserId);
                        const rawText = String(msg.text || '').trim();
                        const safeText = escapeChatHtml(rawText).replace(/\n/g, '<br>');
                        const hasText = !!rawText;
                        const timeLabel = formatChatTimestamp(msg.createdAt);
                        const attachments = Array.isArray(msg.attachments) ? msg.attachments : [];
                        const attachmentsHtml = attachments.length
                            ? `<div class="mt-2">${attachments
                                  .map((att, idx) => renderChatAttachmentInline(att, idx))
                                  .join('')}</div>`
                            : '';
                        const adminTag =
                            senderRole === 'admin' && !isMine
                                ? '<span class="text-[10px] text-[var(--point-color)] font-bold mb-1 block">다독 관리자</span>'
                                : '';
                        if (isMine) {
                            return `
                                <div class="flex justify-end mb-2">
                                    <div class="max-w-[80%]">
                                        ${hasText ? `<div class="bg-[var(--point-color)] text-[#06110D] p-3 rounded-2xl rounded-tr-sm text-[15px] leading-relaxed shadow-sm font-medium">${safeText}</div>` : ''}
                                        ${attachmentsHtml}
                                        <div class="text-[10px] text-[var(--text-sub)] text-right mt-1">${timeLabel}</div>
                                    </div>
                                </div>
                            `;
                        }
                        return `
                            <div class="flex gap-3 mb-2">
                                <div class="w-8 h-8 rounded-full bg-cover bg-center border border-[var(--point-color)] shrink-0 shadow-sm" style="background-image: url('${getThreadDisplayImage(activeChatThreadMeta || {}, actorRole)}');"></div>
                                <div class="max-w-[80%]">
                                    ${adminTag}
                                    ${hasText ? `<div class="bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--text-main)] p-3 rounded-2xl rounded-tl-sm text-[15px] leading-relaxed shadow-sm">${safeText}</div>` : ''}
                                    ${attachmentsHtml}
                                    <div class="text-[10px] text-[var(--text-sub)] mt-1">${timeLabel}</div>
                                </div>
                            </div>
                        `;
                    })
                    .join('');

                scrollChatToBottom(true);
                const mediaEls = container.querySelectorAll('img, iframe');
                mediaEls.forEach((el) => {
                    const bump = () => scrollChatToBottom(true);
                    if (el.tagName === 'IMG') {
                        if (el.complete) {
                            bump();
                        } else {
                            el.addEventListener('load', bump, { once: true });
                            el.addEventListener('error', bump, { once: true });
                        }
                    } else {
                        el.addEventListener('load', bump, { once: true });
                    }
                });
            }

            async function openChatByThread(threadMeta) {
                if (!threadMeta || !threadMeta.id || typeof firebase === 'undefined') return;
                const canonicalThreadId = String(threadMeta.id).trim();
                activeChatThreadId = canonicalThreadId;
                activeChatThreadMeta = { ...threadMeta, id: canonicalThreadId };
                lastChatThreadMessages = [];
                const actor = await getCurrentChatActor();
                activeChatActor = {
                    role: actor.role || 'user',
                    docId: actor.docId || '',
                    userId: actor.userId || '',
                };
                const defaultIntro = document.getElementById('chat-default-intro');
                const defaultGreeting = document.getElementById('chat-default-greeting');
                const quickTemplateBox = document.getElementById('chat-quick-template-box');
                if (defaultIntro) defaultIntro.style.display = 'none';
                if (defaultGreeting) defaultGreeting.style.display = 'none';
                if (quickTemplateBox) quickTemplateBox.style.display = 'none';
                closeChatAttachmentPreviewScreen(true);

                applyChatSheetHeader(actor.role);

                stopChatThreadMessagesListener();
                unsubscribeChatThreadMessages = firebase
                    .firestore()
                    .collection('chat_messages')
                    .where('threadId', '==', canonicalThreadId)
                    .onSnapshot(
                        (snap) => {
                            const rows = snap.docs.map((doc) => ({ ...(doc.data() || {}), id: doc.id }));
                            rows.sort((a, b) => {
                                const ta =
                                    a.createdAt && typeof a.createdAt.toMillis === 'function'
                                        ? a.createdAt.toMillis()
                                        : typeof a.createdAt === 'number'
                                          ? a.createdAt
                                          : 0;
                                const tb =
                                    b.createdAt && typeof b.createdAt.toMillis === 'function'
                                        ? b.createdAt.toMillis()
                                        : typeof b.createdAt === 'number'
                                          ? b.createdAt
                                          : 0;
                                return ta - tb;
                            });
                            lastChatThreadMessages = rows;
                            renderRealtimeChatMessages(rows, actor.role);
                        },
                        (err) => {
                            console.error('채팅 메시지 로드 실패(인덱스 또는 네트워크 확인):', err);
                            const mc = document.getElementById('chat-messages-container');
                            if (mc) {
                                mc.innerHTML = `<div class="text-center text-[13px] text-red-400/90 py-6 px-3">메시지를 불러오지 못했습니다.<br/><span class="text-[11px] text-[var(--text-sub)]">${escapeChatHtml(err.message || '')}</span></div>`;
                            }
                        },
                    );

                startChatHeaderLiveSync(activeChatThreadMeta, actor.role);

                await markThreadAsRead(canonicalThreadId, actor.role);
                updateChatCallButtonState(actor.role);
                const chatSheet = document.getElementById('chat-sheet');
                if (chatSheet) {
                    if (typeof profileOpenedFromFavorites !== 'undefined' && profileOpenedFromFavorites) {
                        chatSheet.style.zIndex = '260';
                    }
                    chatSheet.classList.add('open');
                }
                if (overlay) overlay.classList.add('show');
                scrollChatToBottom(true);
            }

            function setChatSheetFullscreenMode(enabled) {
                const chatSheet = document.getElementById('chat-sheet');
                if (!chatSheet) return;
                if (enabled) {
                    chatSheet.classList.add('chat-sheet-fullscreen');
                    return;
                }
                chatSheet.classList.remove('chat-sheet-fullscreen');
            }

            window.removeFavorite = function (id) {
                userFavorites = userFavorites.filter(p => p.id !== id);
                persistUserFavorites();
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
                const thread = chatListRows.find((row) => row.id === id);
                if (!thread) return;
                chatOpenedFromModal = true;
                if (typeof appModalStack !== 'undefined' && Array.isArray(appModalStack)) {
                    appModalStack.push('closeChatSheet');
                    history.pushState({ modalOpen: true, stackDepth: appModalStack.length }, '', location.href);
                }
                setChatSheetFullscreenMode(true);
                setTimeout(() => {
                    document.getElementById('chat-sheet').style.zIndex = '250';
                    document.getElementById('overlay').style.zIndex = '240';
                    openChatByThread(thread);
                }, 50);
            };

            /** 업체 소개(대시보드 저장). `desc`는 카드 클릭 시 배너 부제(지역·업종)로 덮어쓰이므로 사용하지 않음 */
            function getPartnerIntroText(partner) {
                const p = partner || {};
                return String(p.catchphrase || p.description || '').trim();
            }

            function updateProfileIntroDetailText(partner) {
                const el = document.getElementById('profile-intro-detail-text');
                if (!el) return;
                const intro = getPartnerIntroText(partner);
                if (!intro) {
                    el.textContent = '저희는 100% 철저한 예약제로 운영됩니다';
                    return;
                }
                el.innerHTML = escapeChatHtml(intro).replace(/\n/g, '<br>');
            }

            function updateProfileLocationParkingRows(partner) {
                const locEl = document.getElementById('profile-location-text');
                const parkEl = document.getElementById('profile-parking-text');
                if (!locEl || !parkEl) return;
                const p = partner || {};
                const addr = String(p.address || p.location || '').trim();
                locEl.textContent = addr || '문의 시 안내';
                const parkRaw = String(p.parkingInfo || p.parkingGuide || '').trim();
                if (!parkRaw) {
                    parkEl.textContent = '문의 시 안내';
                    return;
                }
                parkEl.innerHTML = escapeChatHtml(parkRaw).replace(/\n/g, '<br>');
            }

            async function openProfile(
                name,
                desc,
                id,
                reviews,
                rating,
                massage,
                place,
                age,
                image,
                ticketType,
                ticketExpiry,
                openedFromPartnerBannerDetail,
            ) {
                profileOpenedFromPartnerDashboard = !!openedFromPartnerBannerDetail;
                trackPartnerProfileView(id);
                // 목록(DB_CHOICE)에 없는 파트너(예: Firestore만)도 직전에 로드된 동일 id 객체로 메뉴·상세이미지 등을 유지
                const enrichFromCurrent =
                    currentPartner && String(currentPartner.id) === String(id) ? { ...currentPartner } : null;

                if (id === 'my-partner') {
                    if (localStorage.getItem('myPartnerProfile')) {
                        currentPartner = JSON.parse(localStorage.getItem('myPartnerProfile'));
                    } else if (!currentPartner) {
                        currentPartner = { name, desc, id, reviews, rating, image, menus: [], tags: [] };
                    }
                } else {
                    currentPartner = { name, desc, id, reviews, rating, massage, place, age, image, ticketType, ticketExpiry };
                    const sourcePartner = [...DB_CHOICE, ...DB_RECOMMEND].find((p) => String(p.id) === String(id));
                    if (sourcePartner) {
                        currentPartner = { ...sourcePartner, ...currentPartner };
                    } else if (enrichFromCurrent) {
                        currentPartner = { ...enrichFromCurrent, ...currentPartner };
                    }
                    // 상세 '선택 조건 한눈에 보기': 클릭 인자는 배너용 무작위 1개 — 저장된 전체 카테고리가 있으면 우선
                    const catSource =
                        sourcePartner ||
                        (enrichFromCurrent && String(enrichFromCurrent.id) === String(id) ? enrichFromCurrent : null);
                    if (catSource) {
                        if (Array.isArray(catSource.regionList) && catSource.regionList.length) {
                            currentPartner.regionList = catSource.regionList;
                        }
                        if (catSource.massage != null && String(catSource.massage).trim() !== '') {
                            currentPartner.massage = catSource.massage;
                        }
                        if (catSource.place != null && String(catSource.place).trim() !== '') {
                            currentPartner.place = catSource.place;
                        }
                        if (catSource.age != null && String(catSource.age).trim() !== '') {
                            currentPartner.age = catSource.age;
                        }
                        if (Array.isArray(catSource.tags) && catSource.tags.length) {
                            currentPartner.tags = catSource.tags;
                        }
                    }
                }

                if (
                    typeof getLoggedInPartnerDocId === 'function' &&
                    currentPartner &&
                    String(currentPartner.id) === String(getLoggedInPartnerDocId()) &&
                    typeof loadPartnerDashboardStats === 'function'
                ) {
                    await loadPartnerDashboardStats();
                }

                const rbProfile = getPartnerProfileReviewBaselines(currentPartner);
                currentPartner.reviews = rbProfile.reviews;
                currentPartner.rating = rbProfile.rating;
                const reviewBaseline = rbProfile.reviews;
                const ratingBaseline = rbProfile.rating;

                if (
                    typeof getLoggedInPartnerDocId === 'function' &&
                    currentPartner &&
                    String(currentPartner.id) === String(getLoggedInPartnerDocId())
                ) {
                    syncOwnPartnerBannerListRowFromDashboardStats();
                }

                document.getElementById('profile-name').innerText = currentPartner.name;
                const detailBannerUrl = getPartnerDetailImage(currentPartner || {});
                if (detailBannerUrl) {
                    document.getElementById('profile-img').style.backgroundImage = `url('${detailBannerUrl}')`;
                } else {
                    document.getElementById('profile-img').style.backgroundImage = 'none';
                }

                renderProfilePriceTableFromPartner(currentPartner);

                renderProfileCategorySummaryTable(currentPartner);

                if (reviewBaseline !== undefined && ratingBaseline !== undefined) {
                    const pr = document.getElementById('profile-rating-display');
                    const pd = document.getElementById('profile-review-display');
                    if (pr) pr.innerText = reviewBaseline > 0 ? Number(ratingBaseline).toFixed(1) : '0.0';
                    if (pd) pd.innerText = `방문자 찐리뷰 ${reviewBaseline}개 확인하기`;
                    window.currentProfileReviews = reviewBaseline;
                    window.currentProfileRating = ratingBaseline;
                }

                const profileHoursText = document.getElementById('profile-hours-text');
                const profileCallPolicyText = document.getElementById('profile-call-policy-text');
                const operatingHours =
                    currentPartner.hours ||
                    currentPartner.businessHours ||
                    currentPartner.operatingHours ||
                    '정보 없음';
                const callEnabled = typeof currentPartner.callEnabled === 'boolean' ? currentPartner.callEnabled : true;
                const startHour = currentPartner.callAvailableStart || '';
                const endHour = currentPartner.callAvailableEnd || '';
                const callHours =
                    (startHour && endHour ? `${startHour} ~ ${endHour}` : '') ||
                    currentPartner.callAvailableHours ||
                    currentPartner.callHours ||
                    '미설정';
                if (profileHoursText) {
                    profileHoursText.innerHTML = `${escapeChatHtml(operatingHours)}<br><span class="text-xs text-[var(--text-sub)] mt-1 block opacity-80">(변동 가능)</span>`;
                }
                if (profileCallPolicyText) {
                    profileCallPolicyText.innerHTML = `통화 가능: ${callEnabled ? '활성화' : '비활성화'}<br><span class="text-xs text-[var(--text-sub)] mt-1 block opacity-80">통화 가능 시간: ${escapeChatHtml(callHours)}</span>`;
                }

                updateProfileLocationParkingRows(currentPartner);
                updateProfileIntroDetailText(currentPartner);

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

                if (id !== 'my-partner') startLivePartnerDocListener(id);
            }

            // --- 파트너 실시간 동기화 배열 ---
            let DB_CHOICE = [];
            let DB_RECOMMEND = [];
            const APP_BANNER_EXPOSURE_REFRESH_MS = 10000;
            let appBannerExposureTimer = null;

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
                    const clean = tagData.filter(
                        (x) => x != null && String(x).trim() !== '' && String(x) !== 'undefined',
                    );
                    if (clean.length === 0) return fallback;
                    const el = clean[Math.floor(Math.random() * clean.length)];
                    if (typeof el === 'string') return el.trim();
                    return String(el);
                }
                if (typeof tagData === 'string') {
                    const parts = tagData.split(',').map(s => s.trim()).filter(s => s.length > 0);
                    if (parts.length > 0) {
                        return parts[Math.floor(Math.random() * parts.length)];
                    }
                }
                return tagData;
            }

            /** Firestore/대시보드에 저장된 마사지·공간·연령: 배열·쉼표 문자열 → 상세 '선택 조건'용 전체 문자열 */
            function normalizePartnerStoredCategoryString(val) {
                if (val == null || val === '') return '';
                if (Array.isArray(val)) {
                    return val
                        .map((x) => String(x).trim())
                        .filter((x) => x && x !== 'undefined')
                        .join(', ');
                }
                return String(val).trim();
            }

            function partnerCategoryCandidatesArray(storedVal, fallbackPool) {
                const s = normalizePartnerStoredCategoryString(storedVal);
                if (s) return s.split(',').map((x) => x.trim()).filter(Boolean);
                return Array.isArray(fallbackPool) ? [...fallbackPool] : [];
            }

            // 외부 배너·목록: 저장된 복수 조건(regionList, tags, 쉼표 문자열 등)에서 매 렌더마다 무작위 1개 표시
            const BANNER_TAG_MASSAGE_OPTIONS = ['상관없음(전체)', '스웨디시', '스포츠 마사지', '타이 마사지', '커플마사지'];
            const BANNER_TAG_SPACE_OPTIONS = ['상관없음(전체)', '방문 (홈케어/출장)', '1인샵 (매장 방문)', '다인샵 (일반 매장)'];
            const BANNER_TAG_AGE_OPTIONS = ['연령 무관 (전체)', '20대 초반', '20대 중후반', '30대 초반', '30대 중후반', '40대 초반', '40대 중후반'];

            /** 배너/필터 공통: regionList 배열·문자열·region 쉼표까지 후보 배열로 통일 */
            function normalizePartnerRegionListForBanner(p = {}) {
                if (Array.isArray(p.regionList) && p.regionList.length) {
                    return p.regionList
                        .map((x) => String(x).trim())
                        .filter((x) => x && x !== 'undefined');
                }
                if (typeof p.regionList === 'string' && p.regionList.trim()) {
                    return p.regionList.split(',').map((s) => s.trim()).filter(Boolean);
                }
                if (typeof p.region === 'string' && p.region.includes(',')) {
                    return p.region.split(',').map((s) => s.trim()).filter(Boolean);
                }
                if (p.region != null && String(p.region).trim()) {
                    return [String(p.region).trim()];
                }
                return [];
            }

            function pickBannerRegion(partner) {
                const p = partner || {};
                let fallback = '강남/서초';
                if (p.region != null && String(p.region).trim() !== '' && String(p.region) !== 'undefined') {
                    fallback = String(p.region).trim();
                }
                const list = normalizePartnerRegionListForBanner(p);
                const picked =
                    list.length > 0 ? getRandomCondition(list, fallback) : getRandomCondition(null, fallback);
                const s = picked == null ? '' : String(picked).trim();
                if (s && s !== 'undefined') return s;
                return fallback;
            }

            /** '서울 강남/서초' → 배너 칩에는 '강남/서초' (전체·기타는 풀문자 유지) */
            function formatBannerRegionChipLabel(fullRegion) {
                const s = String(fullRegion || '').trim();
                if (!s || s === 'undefined') return '';
                const parts = s.split(/\s+/);
                if (parts.length < 2) return s;
                const dist = parts.slice(1).join(' ');
                if (dist === '전체' || dist === '기타') return s;
                return dist;
            }

            function pickBannerMassage(partner) {
                const p = partner || {};
                const fb = String(p.massage || '스웨디시').trim() || '스웨디시';
                if (Array.isArray(p.massageList) && p.massageList.length) {
                    return getRandomCondition(p.massageList, fb);
                }
                const fromTags = (p.tags || []).filter((t) => BANNER_TAG_MASSAGE_OPTIONS.includes(String(t)));
                const merged =
                    (p.massage && String(p.massage).trim()) ||
                    (fromTags.length ? fromTags.join(', ') : '');
                return getRandomCondition(merged || null, fb);
            }

            function pickBannerPlace(partner) {
                const p = partner || {};
                const fbRaw = String(p.place || '방문 (홈케어/출장)').trim() || '방문 (홈케어/출장)';
                const fb = fbRaw.split(',')[0].trim() || '방문 (홈케어/출장)';
                if (Array.isArray(p.placeList) && p.placeList.length) {
                    return getRandomCondition(p.placeList, fb);
                }
                const fromTags = (p.tags || []).filter((t) => BANNER_TAG_SPACE_OPTIONS.includes(String(t)));
                const merged =
                    (p.place && String(p.place).trim()) ||
                    (fromTags.length ? fromTags.join(', ') : '');
                return getRandomCondition(merged || null, fb);
            }

            function pickBannerAge(partner) {
                const p = partner || {};
                const fbRaw = String(p.age || '연령 무관 (전체)').trim() || '연령 무관 (전체)';
                const fb = fbRaw.split(',')[0].trim() || '연령 무관 (전체)';
                if (Array.isArray(p.ageList) && p.ageList.length) {
                    return getRandomCondition(p.ageList, fb);
                }
                const fromTags = (p.tags || []).filter((t) => BANNER_TAG_AGE_OPTIONS.includes(String(t)));
                const merged =
                    (p.age && String(p.age).trim()) ||
                    (fromTags.length ? fromTags.join(', ') : '');
                return getRandomCondition(merged || null, fb);
            }

            /** 상세 상단·리뷰 시트용 — Firestore partners 문서의 집계(reviews·rating·stats)만 사용 */
            function getPartnerProfileReviewBaselines(partner) {
                if (!partner || partner.id == null || String(partner.id).trim() === '') {
                    return { reviews: 0, rating: 0 };
                }
                const id = String(partner.id);
                const listPartner = [...DB_CHOICE, ...DB_RECOMMEND].find((x) => String(x.id) === id);
                const loggedPid =
                    typeof getLoggedInPartnerDocId === 'function' ? getLoggedInPartnerDocId() : null;
                const isOwnShop =
                    loggedPid &&
                    id === String(loggedPid) &&
                    currentPartner &&
                    String(currentPartner.id) === id;
                const src = isOwnShop && currentPartner ? currentPartner : listPartner || partner;
                const st = src.stats || {};
                let reviews = Number(src.reviews);
                if (!Number.isFinite(reviews) || reviews < 0) reviews = 0;
                const stTr = Number(st.totalReviews);
                if (Number.isFinite(stTr) && stTr >= 0) {
                    reviews = Math.max(reviews, stTr);
                }
                if (
                    isOwnShop &&
                    typeof window.partnerDashboardStats !== 'undefined' &&
                    Number.isFinite(Number(window.partnerDashboardStats.totalReviews))
                ) {
                    const dashTr = Number(window.partnerDashboardStats.totalReviews);
                    if (dashTr >= 0) reviews = Math.max(reviews, dashTr);
                }
                let rating = parseFloat(src.rating);
                if (!Number.isFinite(rating)) rating = 0;
                if (reviews <= 0) rating = 0;
                return { reviews, rating };
            }

            /** 본인 업체 행: 메인 배너 카드 숫자를 대시보드 집계와 맞춤 */
            function syncOwnPartnerBannerListRowFromDashboardStats() {
                const pid = typeof getLoggedInPartnerDocId === 'function' ? getLoggedInPartnerDocId() : null;
                if (!pid || typeof window.partnerDashboardStats === 'undefined') return;
                const tr = Number(window.partnerDashboardStats.totalReviews);
                if (!Number.isFinite(tr)) return;
                const ratingSrc =
                    currentPartner && String(currentPartner.id) === String(pid)
                        ? parseFloat(currentPartner.rating)
                        : NaN;
                const apply = (arr) => {
                    const ix = arr.findIndex((x) => String(x.id) === String(pid));
                    if (ix < 0) return false;
                    arr[ix].reviews = tr;
                    if (Number.isFinite(ratingSrc)) arr[ix].rating = ratingSrc;
                    if (!arr[ix].stats || typeof arr[ix].stats !== 'object') arr[ix].stats = {};
                    arr[ix].stats.totalReviews = tr;
                    return true;
                };
                apply(DB_CHOICE) || apply(DB_RECOMMEND);
            }

            function formatPartnerCategoryFieldToList(raw) {
                if (raw == null || raw === '') return [];
                if (Array.isArray(raw)) {
                    return raw
                        .map((x) => String(x).trim())
                        .filter((x) => x && x !== 'undefined');
                }
                const s = String(raw).trim();
                if (!s) return [];
                return s
                    .split(',')
                    .map((p) => p.trim())
                    .filter((p) => p.length > 0);
            }

            function normalizePartnerMenusFromDoc(rawData = {}) {
                const d = rawData || {};
                const src = d.menus != null ? d.menus : d.pricing;
                if (!Array.isArray(src)) return [];
                return src
                    .map((m) => {
                        if (m && typeof m === 'object') {
                            const priceRaw = m.price != null ? String(m.price).replace(/[^0-9]/g, '') : '';
                            return {
                                name: String(m.name || '').trim(),
                                theme: String(m.theme || '').trim(),
                                desc: String(m.desc || '').trim(),
                                price: priceRaw,
                            };
                        }
                        return { name: String(m || '').trim(), theme: '', desc: '', price: '' };
                    })
                    .filter((row) => row.name || row.price);
            }

            function formatMenuPriceWonDisplay(raw) {
                const digits = String(raw == null ? '' : raw).replace(/[^0-9]/g, '');
                if (!digits) return '';
                try {
                    return Number(digits).toLocaleString('ko-KR');
                } catch (e) {
                    return digits;
                }
            }

            function renderProfilePriceTableFromPartner(partner) {
                const priceTable = document.querySelector('.price-table');
                if (!priceTable) return;
                let menus = normalizePartnerMenusFromDoc(partner || {});
                if (!menus.length) {
                    priceTable.innerHTML = `
                    <tr>
                        <td class="course-name text-[16px] border-none pb-0 text-[var(--text-sub)]">
                            등록된 테라피 코스가 없습니다.
                        </td>
                        <td class="course-price text-[16px] border-none pb-0 text-[var(--text-sub)]">-</td>
                    </tr>
                `;
                    return;
                }
                priceTable.innerHTML = menus
                    .map((menu, index) => {
                        const isLast = index === menus.length - 1;
                        const borderClass = isLast ? 'border-none pb-0' : '';
                        const priceLabel = formatMenuPriceWonDisplay(menu.price);
                        return `
                    <tr>
                        <td class="course-name text-[18.5px] ${borderClass}">
                            <span class="text-base font-bold text-[var(--point-color)] opacity-80 block mb-1.5">${menu.name}</span>
                            ${menu.theme}<br>
                            <span class="text-[15.5px] font-normal mt-1.5 block" style="color: var(--text-sub);">${menu.desc}</span>
                        </td>
                        <td class="course-price text-[22px] break-keep ${borderClass}" style="color: var(--point-color);">${priceLabel}원</td>
                    </tr>
                `;
                    })
                    .join('');
            }

            function renderProfileCategorySummaryTable(partner) {
                const p = partner || {};
                const setCell = (id, list) => {
                    const el = document.getElementById(id);
                    if (!el) return;
                    const parts = Array.isArray(list) ? list : [];
                    el.textContent = parts.length ? parts.join(', ') : '—';
                };

                let regions = [];
                if (Array.isArray(p.regionList) && p.regionList.length) {
                    regions = formatPartnerCategoryFieldToList(p.regionList);
                } else {
                    regions = formatPartnerCategoryFieldToList(p.region);
                }

                setCell('profile-category-region', regions);
                setCell('profile-category-massage', formatPartnerCategoryFieldToList(p.massage));
                setCell('profile-category-place', formatPartnerCategoryFieldToList(p.place));
                setCell('profile-category-age', formatPartnerCategoryFieldToList(p.age));
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
                return normalizePartnerStatus(rawData?.status || '') === 'active';
            }

            function normalizePartnerStatus(rawStatus = '') {
                const status = String(rawStatus || '').trim().toLowerCase();
                if (status === 'active' || status === 'approved') return 'active';
                if (status === 'rejected' || status === 'denied' || status === 'blocked') return 'rejected';
                if (status === 'pending' || status === 'review' || status === 'waiting') return 'pending';
                return 'pending';
            }

            function getPartnerStatusMeta(rawStatus = '') {
                const status = normalizePartnerStatus(rawStatus);
                if (status === 'active') {
                    return {
                        status,
                        badgeClass: 'px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#143321] text-[#86EFAC]',
                        badgeText: '승인 완료',
                        title: '관리자 승인 완료 상태입니다.',
                        desc: '업체 정보 수정, 배너 관리, 채팅/알림 기능을 자유롭게 이용할 수 있습니다.',
                        primaryButtonText: '입점권 안내/추가 구매 보기'
                    };
                }
                if (status === 'rejected') {
                    return {
                        status,
                        badgeClass: 'px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#3A1616] text-[#FCA5A5]',
                        badgeText: '반려/보완 필요',
                        title: '현재 승인 보류 상태입니다.',
                        desc: '안내된 보완 사항을 확인한 뒤 재신청하거나 관리자에게 문의해 주세요.',
                        primaryButtonText: '보완 후 재신청하기'
                    };
                }
                return {
                    status: 'pending',
                    badgeClass: 'px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#3A2810] text-[#FACC15]',
                    badgeText: '승인 대기',
                    title: '현재 승인 심사가 진행 중입니다.',
                    desc: '관리자 승인 완료 후 업체 정보 수정 및 배너 관리 기능이 자동으로 열립니다.',
                    primaryButtonText: '입점권 재신청/안내 보기'
                };
            }

            async function loadPartnerLatestNoticeMessage(partnerDocId = '') {
                if (!partnerDocId || typeof firebase === 'undefined') return '';
                try {
                    const snap = await firebase.firestore().collection('user_notifications')
                        .where('recipientType', '==', 'partner')
                        .where('recipientDocId', '==', partnerDocId)
                        .limit(30)
                        .get();
                    let latestRow = null;
                    snap.forEach((doc) => {
                        const data = doc.data() || {};
                        const createdAtMs = data.createdAt?.toDate ? data.createdAt.toDate().getTime() : 0;
                        if (!latestRow || createdAtMs > latestRow.createdAtMs) {
                            latestRow = { ...data, createdAtMs };
                        }
                    });
                    if (!latestRow) return '';
                    const title = String(latestRow.title || '').trim();
                    const body = String(latestRow.body || '').trim();
                    if (title && body) return `${title} - ${body}`;
                    return title || body || '';
                } catch (e) {
                    console.error('파트너 최신 안내메시지 조회 실패:', e);
                    return '';
                }
            }

            async function setPartnerDashboardAccessMode(partnerData = null) {
                const gateEl = document.getElementById('partner-approval-gate');
                const mainEl = document.getElementById('partner-dashboard-main-sections');
                if (!gateEl || !mainEl) return;

                const data = partnerData || currentPartner || {};
                const approved = isPartnerApproved(data);
                gateEl.classList.toggle('hidden', approved);
                mainEl.classList.toggle('hidden', !approved);
                if (approved) return;

                const meta = getPartnerStatusMeta(data.status || '');
                const badgeEl = document.getElementById('partner-approval-status-badge');
                const titleEl = document.getElementById('partner-approval-title');
                const descEl = document.getElementById('partner-approval-desc');
                const msgEl = document.getElementById('partner-approval-admin-message');
                const primaryBtn = document.getElementById('partner-approval-primary-btn');

                if (badgeEl) {
                    badgeEl.className = meta.badgeClass;
                    badgeEl.innerText = meta.badgeText;
                }
                if (titleEl) titleEl.innerText = meta.title;
                if (descEl) descEl.innerText = meta.desc;
                if (primaryBtn) primaryBtn.innerText = meta.primaryButtonText;

                const dataMessageCandidates = [
                    data.approvalMessage,
                    data.adminMessage,
                    data.adminMemo,
                    data.rejectReason,
                    data.rejectionReason,
                    data.reviewNote
                ];
                const localMessage = dataMessageCandidates
                    .map((v) => (typeof v === 'string' ? v.trim() : ''))
                    .find(Boolean);

                if (msgEl) {
                    msgEl.innerText = localMessage || '안내메시지 확인 중...';
                    if (!localMessage) {
                        const latestMsg = await loadPartnerLatestNoticeMessage(data.id || '');
                        msgEl.innerText = latestMsg || '아직 전달된 안내메시지가 없습니다.';
                    }
                }
            }

            // 앱 배너 노출은 "관리자 승인 + 입점권 부여 + 유효기간 내"를 모두 충족해야 함
            function canExposePartnerBanner(rawData = {}) {
                const data = rawData || {};
                const ticketLabel = String(data.ticketType || data.tier || '').trim();
                const normalizedTicket = ticketLabel.toLowerCase();
                const hasTicketLabel =
                    !!ticketLabel &&
                    normalizedTicket !== 'none' &&
                    normalizedTicket !== 'null' &&
                    normalizedTicket !== 'undefined';
                const expiryMs = getPartnerTicketExpiryMs(data);
                const now = Date.now();
                const hasExpiry = Number(expiryMs || 0) > 0;
                // 과거/혼합 데이터에서는 ticketType 라벨 없이 만료일만 저장된 케이스가 있어 둘 중 하나만 있어도 입점권 보유로 본다.
                const hasTicketEvidence = hasTicketLabel || hasExpiry;
                // 레거시 데이터(만료일 미보유)는 노출 유지, 만료일이 있는 데이터만 시간 만료 검사
                const ticketValid = hasExpiry ? expiryMs > now : true;
                return isPartnerApproved(data) && hasTicketEvidence && ticketValid;
            }

            // 메인 분류 우선순위: 관리자 수동 분류(adminPlacement) > 기존 티어 기반 자동
            function resolveMainPlacement(rawData = {}) {
                const data = rawData || {};
                const forced = String(data.adminPlacement || '').trim().toLowerCase();
                if (forced === 'choice' || forced === 'recommend') return forced;
                const tierRaw = String(data.tier || data.ticketType || '').trim().toLowerCase();
                return tierRaw.includes('vip') ? 'choice' : 'recommend';
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

                        if (!canExposePartnerBanner(data)) {
                            return;
                        }

                        const thumbImage =
                            data.imageThumb || data.thumbnailImage || data.thumbImage || data.image || '';
                        const detailImage =
                            data.imageDetail || data.detailImage || data.bannerImage || data.image || thumbImage || '';

                        const regionCandidates = normalizePartnerRegionListForBanner(data);
                        const regionListForApp = regionCandidates.length ? regionCandidates : ['서울 강남/서초'];

                        const statsObj = data.stats && typeof data.stats === 'object' ? data.stats : {};
                        const reviewCountFromDoc =
                            Number.isFinite(Number(statsObj.totalReviews))
                                ? Number(statsObj.totalReviews)
                                : Number(data.reviews);
                        const reviewCount = Number.isFinite(reviewCountFromDoc) && reviewCountFromDoc >= 0 ? reviewCountFromDoc : 0;
                        const ratingFromDoc = Number(data.rating);
                        const ratingStable = Number.isFinite(ratingFromDoc) ? ratingFromDoc : 0;

                        const massageStored = normalizePartnerStoredCategoryString(data.massage);
                        const ageStored = normalizePartnerStoredCategoryString(data.age);
                        const placeStored =
                            normalizePartnerStoredCategoryString(data.place) ||
                            (cleanPlaceArray.length ? cleanPlaceArray.join(', ') : '');

                        let appPartner = {
                            id: doc.id,
                            userId: data.userId || '',
                            name: data.name || '무명 업체',
                            status: data.status || '',
                            adminPlacement: String(data.adminPlacement || '').trim().toLowerCase() || 'auto',
                            regionList: regionListForApp,
                            massageList: partnerCategoryCandidatesArray(data.massage, ALL_MASSAGES),
                            placeList: cleanPlaceArray,
                            ageList: partnerCategoryCandidatesArray(data.age, ALL_AGES),
                            tags: data.tags || [],
                            region: regionCandidates[0] || data.region || '강남/서초',
                            massage: massageStored,
                            place: placeStored || '방문 (홈케어/출장)',
                            age: ageStored || '연령 무관 (전체)',
                            rating: ratingStable,
                            ticketType: data.ticketType || '일반 입점',
                            ticketExpiry: data.ticketExpiry || '',
                            reviews: reviewCount,
                            stats: data.stats || {},
                            image: thumbImage,
                            imageThumb: thumbImage,
                            imageDetail: detailImage,
                            menus: normalizePartnerMenusFromDoc(data),
                            catchphrase: data.catchphrase || '',
                            desc:
                                data.catchphrase ||
                                data.description ||
                                data.desc ||
                                '여성을 위한 프라이빗 라운지',
                            address: data.address || data.location || '',
                            location: data.location || data.address || '',
                            parkingInfo: data.parkingInfo || '',
                            phoneNumber: data.phoneNumber || data.phone || '',
                            hours: data.hours || data.businessHours || '',
                            callEnabled: typeof data.callEnabled === 'boolean' ? data.callEnabled : true,
                            callAvailableHours:
                                data.callAvailableHours ||
                                data.callHours ||
                                data.hours ||
                                data.businessHours ||
                                '',
                            callAvailableStart: data.callAvailableStart || '',
                            callAvailableEnd: data.callAvailableEnd || '',
                            tier: data.tier || 'Premium',
                            ticketExpiryTimestamp: getPartnerTicketExpiryMs(data)
                        };

                        // 파티셔닝
                        if (resolveMainPlacement(appPartner) === 'choice') {
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
                            const savedPartnerId = String(savedPartner.id || '').trim();
                            const savedPartnerUserId = String(savedPartner.userId || '').trim();
                            const savedPartnerName = String(savedPartner.name || '').trim();
                            const savedPartnerPhone = String(
                                savedPartner.phoneNumber ||
                                    savedPartner.phone ||
                                    savedPartner.contact ||
                                    '',
                            ).trim();
                            const existsInSyncedPartners = [...DB_CHOICE, ...DB_RECOMMEND].some((p) => {
                                const pid = String(p.id || '').trim();
                                const pUserId = String(p.userId || '').trim();
                                const pName = String(p.name || '').trim();
                                const pPhone = String(p.phoneNumber || p.phone || p.contact || '').trim();
                                if (savedPartnerId && pid && savedPartnerId === pid) return true;
                                if (savedPartnerUserId && pUserId && savedPartnerUserId === pUserId) return true;
                                if (savedPartnerName && savedPartnerPhone && pName && pPhone) {
                                    return savedPartnerName === pName && savedPartnerPhone === pPhone;
                                }
                                return false;
                            });
                            if (existsInSyncedPartners) {
                                return;
                            }
                            if (!canExposePartnerBanner(savedPartner)) {
                                return;
                            }
                            let rawLocalPlaceData = savedPartner.place || ALL_PLACES;
                            let placeLocalArray = Array.isArray(rawLocalPlaceData) ? rawLocalPlaceData : (typeof rawLocalPlaceData === 'string' ? rawLocalPlaceData.split(',').map(s=>s.trim()) : [rawLocalPlaceData]);
                            let cleanLocalPlaceArray = placeLocalArray.map(p => typeof p === 'string' ? p.replace('프라이빗 방문', '방문').replace('프라이빗 1인샵', '1인샵').replace('스탠다드 다인샵', '다인샵') : p);
                            const localPlaceStored =
                                normalizePartnerStoredCategoryString(savedPartner.place) ||
                                (cleanLocalPlaceArray.length ? cleanLocalPlaceArray.join(', ') : '');

                            const localThumbImage =
                                savedPartner.imageThumb || savedPartner.thumbnailImage || savedPartner.thumbImage || savedPartner.image || '';
                            const localDetailImage =
                                savedPartner.imageDetail || savedPartner.detailImage || savedPartner.bannerImage || savedPartner.image || localThumbImage;

                            const localRegionCandidates = normalizePartnerRegionListForBanner(savedPartner);
                            const localRegionListForApp = localRegionCandidates.length
                                ? localRegionCandidates
                                : ['서울 강남/서초'];

                            let myPartnerMock = {
                                id: savedPartner.id || `local_${Date.now()}`,
                                userId: savedPartner.userId || '',
                                name: savedPartner.name,
                                adminPlacement: String(savedPartner.adminPlacement || '').trim().toLowerCase() || 'auto',
                                regionList: localRegionListForApp,
                                massageList: partnerCategoryCandidatesArray(savedPartner.massage, ALL_MASSAGES),
                                placeList: cleanLocalPlaceArray,
                                ageList: partnerCategoryCandidatesArray(savedPartner.age, ALL_AGES),
                                tags: savedPartner.tags || [],
                                region: localRegionCandidates[0] || savedPartner.region || '강남/서초',
                                massage: normalizePartnerStoredCategoryString(savedPartner.massage),
                                place: localPlaceStored || '방문 (홈케어/출장)',
                                age: normalizePartnerStoredCategoryString(savedPartner.age) || '연령 무관 (전체)',
                                rating: savedPartner.rating || '5.0',
                                ticketType: savedPartner.ticketType || '일반 입점',
                                ticketExpiry: savedPartner.ticketExpiry || '',
                                reviews: savedPartner.reviews || 0,
                                tier: 'Premium',
                                ticketExpiryTimestamp: getPartnerTicketExpiryMs(savedPartner),
                                image: localThumbImage,
                                imageThumb: localThumbImage,
                                imageDetail: localDetailImage,
                                menus: normalizePartnerMenusFromDoc(savedPartner),
                                desc: savedPartner.description || '새로 둥록된 파트너',
                                phoneNumber: savedPartner.phoneNumber || savedPartner.phone || savedPartner.contact || '',
                                hours: savedPartner.hours || savedPartner.businessHours || '',
                                callEnabled:
                                    typeof savedPartner.callEnabled === 'boolean'
                                        ? savedPartner.callEnabled
                                        : true,
                                callAvailableHours:
                                    savedPartner.callAvailableHours ||
                                    savedPartner.callHours ||
                                    savedPartner.hours ||
                                    '',
                                callAvailableStart: savedPartner.callAvailableStart || '',
                                callAvailableEnd: savedPartner.callAvailableEnd || ''
                            };
                            if (resolveMainPlacement(myPartnerMock) === 'choice') {
                                DB_CHOICE.unshift(myPartnerMock);
                            } else {
                                DB_RECOMMEND.unshift(myPartnerMock);
                            }
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
            // 동일 대카테고리(지역·마사지·공간·연령) 안: 고객이 고른 소카테고리 중 하나라도 업체 값과 맞으면 그 축 통과(OR).
            // 고객이 여러 대카테고리에 조건을 둔 경우: 각 축을 모두 통과한 업체만 노출(대카테고리 간 AND).
            function matchFilter(partner) {
                if (activeFilters.region.length > 0) {
                    let passed = false;
                    let pList = normalizePartnerRegionListForBanner(partner);
                    if (!pList.length && partner.region) {
                        pList = [String(partner.region).trim()];
                    }
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
                    let pList = [];
                    if (Array.isArray(partner.massageList) && partner.massageList.length) {
                        pList = partner.massageList;
                    } else if (typeof partner.massageList === 'string' && partner.massageList.trim()) {
                        pList = partner.massageList.split(',').map((s) => s.trim()).filter(Boolean);
                    } else if (typeof partner.massage === 'string' && partner.massage.trim()) {
                        pList = partner.massage.split(',').map((s) => s.trim()).filter(Boolean);
                    } else if (partner.massageList != null) {
                        pList = [partner.massageList];
                    }
                    for (let m of activeFilters.massage) {
                        if (m === '상관없음(전체)' || pList.some(v => v && typeof v === 'string' && v === m)) passed = true;
                    }
                    if (!passed) return false;
                }
                if (activeFilters.place.length > 0) {
                    let passed = false;
                    let pList = [];
                    if (Array.isArray(partner.placeList) && partner.placeList.length) {
                        pList = partner.placeList;
                    } else if (typeof partner.placeList === 'string' && partner.placeList.trim()) {
                        pList = partner.placeList.split(',').map((s) => s.trim()).filter(Boolean);
                    } else if (typeof partner.place === 'string' && partner.place.trim()) {
                        pList = partner.place.split(',').map((s) => s.trim()).filter(Boolean);
                    } else if (partner.placeList != null) {
                        pList = [partner.placeList];
                    }
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
                    let pList = [];
                    if (Array.isArray(partner.ageList) && partner.ageList.length) {
                        pList = partner.ageList;
                    } else if (typeof partner.ageList === 'string' && partner.ageList.trim()) {
                        pList = partner.ageList.split(',').map((s) => s.trim()).filter(Boolean);
                    } else if (typeof partner.age === 'string' && partner.age.trim()) {
                        pList = partner.age.split(',').map((s) => s.trim()).filter(Boolean);
                    } else if (partner.ageList != null) {
                        pList = [partner.ageList];
                    }
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

            function refreshAppExposureByTicketExpiry() {
                const beforeChoice = DB_CHOICE.length;
                const beforeRecommend = DB_RECOMMEND.length;
                DB_CHOICE = DB_CHOICE.filter((partner) => canExposePartnerBanner(partner || {}));
                DB_RECOMMEND = DB_RECOMMEND.filter((partner) => canExposePartnerBanner(partner || {}));
                const changed =
                    beforeChoice !== DB_CHOICE.length || beforeRecommend !== DB_RECOMMEND.length;
                if (!changed) return;
                applyFiltersToData();
            }

            function startAppBannerExposureAutoRefresh() {
                if (appBannerExposureTimer) {
                    clearInterval(appBannerExposureTimer);
                    appBannerExposureTimer = null;
                }
                refreshAppExposureByTicketExpiry();
                appBannerExposureTimer = setInterval(() => {
                    refreshAppExposureByTicketExpiry();
                }, APP_BANNER_EXPOSURE_REFRESH_MS);
            }

            function openListView(type) {
                const listSheet = document.getElementById('list-sheet');
                const listContent = document.getElementById('list-content');
                const listTitle = document.getElementById('list-title');

                listContent.innerHTML = '';
                listSheet.scrollTop = 0;
                // 요청사항: 추천 파트너 전체보기도 다독초이스와 동일 크기로 표시
                listContent.classList.add('choice-list-large');

                let db = type === 'choice' ? [...filteredChoiceDB] : [...filteredRecDB];
                listTitle.innerText = type === 'choice' ? '다독 초이스 전체보기' : '추천 파트너 전체보기';

                if (db.length === 0) {
                    listContent.innerHTML = `<div class="p-5 text-sm text-center w-full" style="color:var(--text-sub);">조건에 맞는 업체가 없습니다.</div>`;
                } else {
                    // 매번 리스트뷰 열 때마다 랜덤 섞기
                    db.sort(() => Math.random() - 0.5);
                    const thumbSizeClass = 'w-[128px] h-[128px]';

                    let html = '';
                    for (let partner of db) {
                        let badgeHtml = '';
                        if (partner.tier === 'VIP') {
                            badgeHtml = `<div class="absolute top-2 left-2 z-10 bg-gradient-to-r from-[#D4AF37] to-[#B38D1B] text-[#06110D] text-[10px] font-extrabold px-2 py-0.5 rounded opacity-95 tracking-wide shadow-md">VIP</div>`;
                        } else if (partner.tier === 'Premium') {
                            badgeHtml = `<div class="absolute top-2 left-2 z-10 bg-[var(--surface-color)] text-[var(--point-color)] text-[10px] font-extrabold px-2 py-0.5 rounded border border-[var(--point-color)] opacity-95 tracking-wide shadow-md">Premium</div>`;
                        }

                        let rndRegion = pickBannerRegion(partner);
                        let rndMassage = pickBannerMassage(partner);
                        let rndPlace = pickBannerPlace(partner);
                        let rndAge = pickBannerAge(partner);
                        const rb = getPartnerProfileReviewBaselines(partner);
                        html += `
                <div class="card p-4 flex gap-4 mb-4 items-center relative" onclick="openProfile('${partner.name}', '${rndRegion} · ${rndPlace}', '${partner.id}', ${rb.reviews}, ${rb.rating}, '${rndMassage}', '${rndPlace}', '${rndAge}', '${partner.image}', '${partner.ticketType || '일반 입점'}', '${partner.ticketExpiry || ''}')">
                    <div class="${thumbSizeClass} rounded-2xl bg-cover bg-center flex-shrink-0 relative border border-white" style="background-image: url('${partner.image}'); filter: grayscale(15%) sepia(20%);">
                        ${badgeHtml}
                    </div>
                    <div class="flex-1 py-1">
                        <h3 class="font-bold text-[16px] mb-0.5 tracking-tight" style="color: var(--text-main);">${partner.name}</h3>
                        <p class="text-[13px] mt-0.5" style="color: var(--text-sub);">${rndRegion ?? ''}</p>
                        <div class="grid grid-cols-2 gap-1.5 mt-2.5">
                            <span class="text-[11px] px-2 py-1 border border-[var(--point-color)] bg-[var(--point-color)]/10 rounded-full font-medium text-white  flex items-center justify-center truncate tracking-tight shadow-sm">${formatBannerRegionChipLabel(rndRegion)}</span>
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

            function visitorReviewRowViewerId(row) {
                return String((row && (row.viewerId || row.authorUserId)) || '');
            }

            function canCurrentUserEditVisitorReview(row) {
                const mine = getCurrentViewerId();
                const rid = visitorReviewRowViewerId(row);
                return mine && rid && rid === String(mine);
            }

            function canShopReplyToVisitorReview() {
                const pid = getLoggedInPartnerDocId();
                const isOwnShop =
                    !!(pid && currentPartner && String(currentPartner.id) === String(pid));
                return !!(isOwnShop && profileOpenedFromPartnerDashboard);
            }

            function formatVisitorReviewRowDate(row) {
                const ca = row && row.createdAt;
                if (ca && typeof ca.toDate === 'function') {
                    const d = ca.toDate();
                    return (
                        d.getFullYear() +
                        '.' +
                        String(d.getMonth() + 1).padStart(2, '0') +
                        '.' +
                        String(d.getDate()).padStart(2, '0')
                    );
                }
                if (row && typeof row.date === 'string') return row.date;
                return '-';
            }

            function buildVisitorReviewStarsSmall(rating, starPath) {
                const r = Number(rating) || 0;
                let html = '';
                for (let k = 0; k < Math.floor(r); k++) {
                    html += `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="${starPath}"></path></svg>`;
                }
                if (r - Math.floor(r) >= 0.5 && Math.floor(r) < 5) {
                    html += `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="${starPath}" opacity="0.55"></path></svg>`;
                }
                return html;
            }

            function getVisitorReviewStarPath() {
                return 'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z';
            }

            let livePartnerDocUnsub = null;
            let livePartnerReviewsQueryUnsub = null;
            let liveReviewSheetRefreshTimer = null;

            function stopLivePartnerReviewsQueryListener() {
                if (typeof livePartnerReviewsQueryUnsub === 'function') {
                    livePartnerReviewsQueryUnsub();
                    livePartnerReviewsQueryUnsub = null;
                }
                if (liveReviewSheetRefreshTimer) {
                    clearTimeout(liveReviewSheetRefreshTimer);
                    liveReviewSheetRefreshTimer = null;
                }
            }

            function stopLivePartnerDocListener() {
                if (typeof livePartnerDocUnsub === 'function') {
                    livePartnerDocUnsub();
                    livePartnerDocUnsub = null;
                }
            }

            function stopLivePartnerFirebaseListeners() {
                stopLivePartnerDocListener();
                stopLivePartnerReviewsQueryListener();
            }

            function buildVisitorReviewListInnerHtml(loadedRows, starPath) {
                const shopReply = canShopReplyToVisitorReview();
                let html = '';
                loadedRows.forEach((cr) => {
                    const author = escapeChatHtml(String(cr.author || '회원').trim() || '회원');
                    const dateStr = formatVisitorReviewRowDate(cr);
                    const stars = buildVisitorReviewStarsSmall(cr.rating, starPath);
                    const bodyText = escapeChatHtml(String(cr.content || cr.text || '').trim());
                    const canEdit = canCurrentUserEditVisitorReview(cr);
                    const replyHtml = cr.reply
                        ? `
                <div class="review-reply-area mt-4 pt-4 border-t border-[var(--border-color)]" onclick="event.stopPropagation()">
                    <div class="flex items-start gap-3">
                        <div class="w-8 h-8 rounded-full bg-gradient-to-tl from-[var(--point-color)] to-[#F4D03F] flex-shrink-0 flex items-center justify-center text-[#06110D] font-bold text-xs tracking-tighter" style="padding-top:1px;">운영</div>
                        <div class="flex-1 bg-gradient-to-br from-[var(--surface-color)] to-[var(--bg-color)] rounded-xl p-4 border border-[var(--point-color)]/40 shadow-sm relative">
                            <div class="font-bold text-[var(--point-color)] text-[13.5px] mb-1.5">매장 답변</div>
                            <p class="text-[var(--text-main)] text-[14px] leading-relaxed">${escapeChatHtml(String(cr.reply)).replace(/\n/g, '<br>')}</p>
                        </div>
                    </div>
                </div>`
                        : '';
                    const rowClick = shopReply ? `onclick="toggleReplyInput(this)"` : '';
                    const rowClass = shopReply
                        ? 'cursor-pointer hover:border-[var(--point-color)]'
                        : '';
                    const actions = canEdit
                        ? `<div class="flex gap-2 mt-2" onclick="event.stopPropagation()">
                        <button type="button" class="text-xs px-2 py-1 rounded border border-[var(--border-color)] text-[var(--text-sub)] hover:border-[var(--point-color)]" onclick="editVisitorReviewPrompt('${cr.id}')">수정</button>
                        <button type="button" class="text-xs px-2 py-1 rounded border border-red-900/50 text-red-300 hover:bg-red-900/20" onclick="deleteVisitorReview('${cr.id}')">삭제</button>
                    </div>`
                        : '';
                    const shopReplyHint =
                        shopReply && !cr.reply
                            ? `<div class="mt-3 flex items-center justify-end gap-1.5"><span class="text-[13px] font-semibold text-[var(--point-color)]">댓글</span><span class="text-[11px] text-[var(--text-sub)]">카드 탭</span></div>`
                            : '';
                    html += `
            <div data-review-id="${cr.id}" data-firestore-doc-id="${cr.id}" class="bg-[var(--surface-color)] p-5 rounded-2xl mb-4 border border-[var(--border-color)] transition-colors ${rowClass}" ${rowClick}>
                <div class="flex justify-between items-start mb-3 gap-2">
                    <div class="flex flex-wrap items-center gap-2">
                        <span class="font-bold text-[var(--text-main)]">${author}</span>
                        <span class="text-sm text-[var(--text-sub)]">${dateStr}</span>
                    </div>
                    <div class="flex text-[var(--point-color)] gap-0.5 flex-shrink-0">${stars}</div>
                </div>
                <p class="text-[var(--text-sub)] leading-relaxed font-normal">${bodyText}</p>
                ${shopReplyHint}
                ${actions}
                ${replyHtml}
            </div>
            `;
                });
                if (loadedRows.length === 0) {
                    html += `<p class="text-sm text-[var(--text-sub)] py-4 text-center">등록된 찐리뷰가 없습니다. 첫 리뷰를 남겨보세요.</p>`;
                }
                return html;
            }

            window.closeReviewSheet = function () {
                stopLivePartnerReviewsQueryListener();
                const rs = document.getElementById('review-sheet');
                if (rs) {
                    rs.classList.remove('open');
                    rs.style.zIndex = '';
                }
            };

            async function openReviewSheet() {
                const reviewSheet = document.getElementById('review-sheet');
                const reviewContent = document.getElementById('review-content');
                if (!reviewSheet || !reviewContent || !currentPartner) return;

                const profileSheetEl = document.getElementById('profile-sheet');
                if (profileSheetEl && profileSheetEl.classList.contains('open')) {
                    reviewSheet.style.zIndex = '270';
                } else {
                    reviewSheet.style.zIndex = '';
                }

                const rbSheet = getPartnerProfileReviewBaselines(currentPartner);
                window.currentProfileReviews = rbSheet.reviews;
                window.currentProfileRating = rbSheet.rating;

                reviewContent.innerHTML =
                    '<div class="px-5 py-10 text-center text-[var(--text-sub)] text-sm">리뷰를 불러오는 중...</div>';
                reviewSheet.classList.add('open');

                const partnerKey = String(currentPartner.id);
                const starPath = getVisitorReviewStarPath();

                let loadedRows = [];
                if (partnerKey !== 'my-partner' && typeof firebase !== 'undefined') {
                    try {
                        const snap = await firebase
                            .firestore()
                            .collection('partner_reviews')
                            .where('partnerId', '==', partnerKey)
                            .get();
                        snap.forEach((doc) => {
                            loadedRows.push({ id: doc.id, ...doc.data() });
                        });
                        loadedRows = loadedRows
                            .filter((r) => (r.status || 'published') === 'published')
                            .sort((a, b) => {
                                const ta =
                                    a.createdAt && a.createdAt.toMillis
                                        ? a.createdAt.toMillis()
                                        : 0;
                                const tb =
                                    b.createdAt && b.createdAt.toMillis
                                        ? b.createdAt.toMillis()
                                        : 0;
                                return tb - ta;
                            });
                    } catch (e) {
                        console.error('찐리뷰 로드 실패', e);
                    }
                }

                let sumLive = 0;
                let nLive = 0;
                loadedRows.forEach((r) => {
                    const rv = Number(r.rating);
                    if (!Number.isFinite(rv)) return;
                    sumLive += rv;
                    nLive++;
                });
                const liveAvg = nLive ? Math.round((sumLive / nLive) * 10) / 10 : 0;
                let totalCount = Math.max(rbSheet.reviews, nLive);
                let displayRating =
                    nLive > 0
                        ? liveAvg.toFixed(1)
                        : totalCount > 0
                          ? Number(rbSheet.rating).toFixed(1)
                          : '0.0';
                if (nLive > 0 && rbSheet.reviews === 0 && typeof recomputePartnerReviewAggregates === 'function') {
                    recomputePartnerReviewAggregates(partnerKey).catch(() => null);
                }

                let html = `<div class="flex items-center gap-3 mb-6"><div class="flex items-center gap-1 text-[var(--point-color)]"><svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg><span class="font-bold text-3xl" id="review-sheet-rating-display">${displayRating}</span></div><span class="text-[var(--text-sub)]">방문자 찐리뷰 <span class="font-bold" id="review-sheet-count-display">${nLive > 0 ? nLive : totalCount}</span>개</span></div>`;

                window.currentNewReviewRating = 5;
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
                <button type="button" onclick="submitReview()" class="bg-[var(--point-color)] text-[#06110D] px-6 py-2.5 rounded-full font-bold text-[15px] hover:opacity-90 transition-opacity shadow-md">리뷰 등록</button>
            </div>
        </div>
        `;

                html += `<div id="review-list-container">${buildVisitorReviewListInnerHtml(loadedRows, starPath)}</div>`;
                reviewContent.innerHTML = html;
                window.setReviewRating(window.currentNewReviewRating || 5);
                if (partnerKey !== 'my-partner') startLivePartnerReviewsQueryListener(partnerKey);
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
                if (typeof canShopReplyToVisitorReview === 'function' && !canShopReplyToVisitorReview()) {
                    return;
                }
                let existingReply = reviewDiv.querySelector('.review-reply-area');
                if (existingReply) {
                    existingReply.classList.toggle('hidden');
                    return;
                }

                const replyArea = document.createElement('div');
                replyArea.className = 'review-reply-area mt-4 pt-4 border-t border-[var(--border-color)]';
                replyArea.onclick = function (e) {
                    e.stopPropagation();
                };
                replyArea.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-full bg-gradient-to-tl from-[var(--point-color)] to-[#F4D03F] flex-shrink-0 flex items-center justify-center text-[#06110D] font-bold text-xs tracking-tighter" style="padding-top:1px;">운영</div>
                <div class="flex-1 bg-[var(--bg-color)] rounded-xl border border-[var(--border-color)] overflow-hidden focus-within:border-[var(--point-color)] transition-colors">
                    <textarea class="w-full bg-transparent p-3 text-[var(--text-main)] focus:outline-none resize-none text-[14px]" rows="2" placeholder="리뷰에 답글을 달아보세요."></textarea>
                    <div class="flex justify-end p-2 bg-[var(--surface-color)] border-t border-[var(--border-color)]">
                        <button type="button" class="bg-gradient-to-r from-[#D4AF37] to-[#B38D1B] text-[#06110D] px-4 py-1.5 rounded-full font-bold text-[13px] shadow-sm hover:opacity-90" onclick="submitReply(this, event)">답글 등록</button>
                    </div>
                </div>
            </div>
        `;
                reviewDiv.appendChild(replyArea);
                setTimeout(() => {
                    replyArea.querySelector('textarea').focus();
                }, 50);
            };

            window.submitReply = async function (btn, event) {
                event.stopPropagation();
                if (typeof canShopReplyToVisitorReview === 'function' && !canShopReplyToVisitorReview()) {
                    alert(
                        '매장 답글은 파트너 대시보드의 「내 업체 배너 바로가기」로 연 본인 업체 상세에서만 작성할 수 있습니다.',
                    );
                    return;
                }
                const replyArea = btn.closest('.review-reply-area');
                const textarea = replyArea.querySelector('textarea');
                const reviewDiv = btn.closest('[data-firestore-doc-id]');
                const text = textarea.value.trim();
                if (!text) {
                    alert('답글 내용을 입력해주세요.');
                    textarea.focus();
                    return;
                }

                const docId = reviewDiv ? reviewDiv.getAttribute('data-firestore-doc-id') : '';
                if (!docId || typeof firebase === 'undefined') {
                    alert('답글 저장에 실패했습니다.');
                    return;
                }
                try {
                    await firebase.firestore().collection('partner_reviews').doc(docId).set(
                        {
                            reply: text,
                            replyAt: firebase.firestore.FieldValue.serverTimestamp(),
                            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        },
                        { merge: true },
                    );
                } catch (err) {
                    console.error(err);
                    alert('답글 저장에 실패했습니다.');
                    return;
                }

                replyArea.onclick = function (e) {
                    e.stopPropagation();
                };
                replyArea.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-full bg-gradient-to-tl from-[var(--point-color)] to-[#F4D03F] flex-shrink-0 flex items-center justify-center text-[#06110D] font-bold text-xs tracking-tighter" style="padding-top:1px;">운영</div>
                <div class="flex-1 bg-gradient-to-br from-[var(--surface-color)] to-[var(--bg-color)] rounded-xl p-4 border border-[var(--point-color)]/40 shadow-sm relative">
                    <div class="font-bold text-[var(--point-color)] text-[13.5px] mb-1.5">매장 답변</div>
                    <p class="text-[var(--text-main)] text-[14px] leading-relaxed">${escapeChatHtml(text).replace(/\n/g, '<br>')}</p>
                </div>
            </div>
        `;
            };

            window.deleteVisitorReview = async function (docId) {
                if (!docId || typeof firebase === 'undefined') return;
                if (!confirm('이 리뷰를 삭제할까요?')) return;
                try {
                    const ref = firebase.firestore().collection('partner_reviews').doc(docId);
                    const snap = await ref.get();
                    if (!snap.exists) {
                        alert('이미 삭제된 리뷰입니다.');
                        return;
                    }
                    const d = snap.data() || {};
                    const rid = String(d.viewerId || d.authorUserId || '');
                    if (rid !== String(getCurrentViewerId())) {
                        alert('본인이 작성한 리뷰만 삭제할 수 있습니다.');
                        return;
                    }
                    await ref.delete();
                    if (currentPartner && currentPartner.id) {
                        await recomputePartnerReviewAggregates(String(currentPartner.id));
                    }
                    await openReviewSheet();
                } catch (e) {
                    console.error(e);
                    alert('삭제에 실패했습니다.');
                }
            };

            window.editVisitorReviewPrompt = async function (docId) {
                if (!docId || typeof firebase === 'undefined') return;
                try {
                    const ref = firebase.firestore().collection('partner_reviews').doc(docId);
                    const snap = await ref.get();
                    if (!snap.exists) {
                        alert('리뷰를 찾을 수 없습니다.');
                        return;
                    }
                    const d = snap.data() || {};
                    const rid = String(d.viewerId || d.authorUserId || '');
                    if (rid !== String(getCurrentViewerId())) {
                        alert('본인이 작성한 리뷰만 수정할 수 있습니다.');
                        return;
                    }
                    const prevText = String(d.content || d.text || '').trim();
                    const next = prompt('리뷰 내용을 수정합니다.', prevText);
                    if (next == null) return;
                    const trimmed = String(next).trim();
                    if (!trimmed) {
                        alert('내용을 입력해주세요.');
                        return;
                    }
                    await ref.set(
                        {
                            content: trimmed,
                            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        },
                        { merge: true },
                    );
                    await openReviewSheet();
                } catch (e) {
                    console.error(e);
                    alert('수정에 실패했습니다.');
                }
            };

            window.submitReview = async function () {
                const input = document.getElementById('review-text-input');
                if (!input || !input.value.trim()) {
                    alert('리뷰 내용을 입력해주세요.');
                    if (input) input.focus();
                    return;
                }
                if (!currentPartner || !currentPartner.id || currentPartner.id === 'my-partner') {
                    alert('리뷰를 등록할 수 없는 프로필입니다.');
                    return;
                }

                const text = input.value.trim();
                const rating = window.currentNewReviewRating || 5;

                let uid = localStorage.getItem('dadok_username') || sessionStorage.getItem('dadok_username') || 'user';
                let maskedId =
                    uid.length <= 2
                        ? uid[0] + '*'
                        : uid.substring(0, 2) + '*'.repeat(uid.length > 5 ? 4 : uid.length - 2);

                const newId = await persistPartnerReview(currentPartner.id, rating, text, maskedId);
                if (!newId) {
                    alert('리뷰 저장에 실패했습니다. 네트워크와 로그인 상태를 확인해주세요.');
                    return;
                }

                input.value = '';
                window.setReviewRating(5);
                await openReviewSheet();
                const rc = document.getElementById('review-content');
                if (rc) rc.scrollTo({ top: 0, behavior: 'smooth' });
            };

            function closeProfileSheet() {
                stopLivePartnerFirebaseListeners();
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
                            let rndRegion = pickBannerRegion(partner);
                            let rndMassage = pickBannerMassage(partner);
                            let rndPlace = pickBannerPlace(partner);
                            let rndAge = pickBannerAge(partner);
                            const rb = getPartnerProfileReviewBaselines(partner);
                            html += `
                    <div class="card p-4 flex gap-4 mb-4 items-center transition-all duration-500 ease-in-out" onclick="openProfile('${partner.name}', '${rndRegion} · ${rndPlace}', '${partner.id}', ${rb.reviews}, ${rb.rating}, '${rndMassage}', '${rndPlace}', '${rndAge}', '${partner.image}', '${partner.ticketType || '일반 입점'}', '${partner.ticketExpiry || ''}')">
                        <div class="w-[108px] h-[108px] rounded-2xl bg-cover bg-center flex-shrink-0 relative border border-white" style="background-image: url('${partner.image}'); filter: grayscale(10%) sepia(10%);"></div>
                        <div class="flex-1 py-1">
                            <h3 class="font-bold text-[16px] mb-0.5 tracking-tight" style="color: var(--text-main);">${partner.name}</h3>
                            <p class="text-[13px] mt-0.5" style="color: var(--text-sub);">${rndRegion ?? ''}</p>
                            <div class="grid grid-cols-2 gap-1.5 mt-2.5">
                                <span class="text-[11px] px-2 py-1 border border-[var(--point-color)] bg-[var(--point-color)]/10 rounded-full font-medium text-white  flex items-center justify-center truncate tracking-tight shadow-sm">${formatBannerRegionChipLabel(rndRegion)}</span>
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
                        let badgeHtml = '';
                        if (partner.tier === 'VIP') {
                            badgeHtml = `<div class="absolute top-3 left-3 z-10 bg-gradient-to-r from-[#D4AF37] to-[#B38D1B] text-[#06110D] text-[11px] font-extrabold px-2.5 py-1 rounded opacity-95 tracking-wide shadow-md">VIP</div>`;
                        } else if (partner.tier === 'Premium') {
                            badgeHtml = `<div class="absolute top-3 left-3 z-10 bg-[var(--surface-color)] text-[var(--point-color)] border border-[var(--point-color)] text-[11px] font-extrabold px-2.5 py-1 rounded opacity-95 tracking-wide shadow-md">Premium</div>`;
                        }

                        let rndRegion = pickBannerRegion(partner);
                        let rndMassage = pickBannerMassage(partner);
                        let rndPlace = pickBannerPlace(partner);
                        let rndAge = pickBannerAge(partner);
                        const rb = getPartnerProfileReviewBaselines(partner);
                        chunk += `
                <div class="card min-w-[340px] max-w-[340px]" onclick="openProfile('${partner.name}', '${rndRegion} · ${rndPlace}', '${partner.id}', ${rb.reviews}, ${rb.rating}, '${rndMassage}', '${rndPlace}', '${rndAge}', '${partner.image}', '${partner.ticketType || '일반 입점'}', '${partner.ticketExpiry || ''}')">
                    <div class="relative h-[180px] bg-cover bg-center rounded-t-2xl" style="background-image: url('${partner.image}'); filter: grayscale(15%) sepia(20%); border-bottom: 1px solid var(--accent-color);">
                        ${badgeHtml}
                    </div>
                    <div class="p-5 pt-0 mt-3">
                        <h3 class="font-bold text-lg">${partner.name}</h3>
                        <p class="text-sm mt-1.5" style="color: var(--text-sub);">${rndRegion ?? ''}</p>
                        <div class="grid grid-cols-2 gap-2 mt-4 text-xs">
                            <span class="border border-[var(--point-color)] bg-[var(--point-color)]/10 px-8 py-1.5 rounded-full font-bold text-white flex items-center justify-center truncate tracking-tight shadow-sm">${formatBannerRegionChipLabel(rndRegion)}</span>
                            <span class="border border-[var(--point-color)] bg-transparent px-8 py-1.5 rounded-full font-medium text-white flex items-center justify-center truncate tracking-tight shadow-sm">${rndMassage}</span>
                            <span class="border border-[var(--point-color)] bg-transparent px-8 py-1.5 rounded-full font-medium text-white flex items-center justify-center truncate tracking-tight shadow-sm">${rndPlace}</span>
                            <span class="border border-[var(--point-color)] bg-transparent px-8 py-1.5 rounded-full font-medium text-white flex items-center justify-center truncate tracking-tight shadow-sm">${rndAge}</span>
                        </div>

                    </div>
                </div>`;
                    }
                    return chunk;
                };

                if (filteredChoiceDB.length === 0) {
                    sliderTrack.innerHTML = `<div class="p-5 text-sm w-full h-[180px] flex items-center justify-center" style="color:var(--text-sub);">조건에 맞는 업체가 없습니다.</div>`;
                } else {
                    // 업체 수가 적을 때는 동일 카드가 즉시 반복되어 "중복"처럼 보이므로 1회만 렌더링
                    const shouldDuplicateForLoop = filteredChoiceDB.length >= 4;
                    sliderTrack.innerHTML = shouldDuplicateForLoop
                        ? generateChoiceItems() + generateChoiceItems()
                        : generateChoiceItems();
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
                        let badgeHtml = '';
                        if (partner.tier === 'VIP') {
                            badgeHtml = `<div class="absolute top-1 left-1 z-10 bg-gradient-to-r from-[#D4AF37] to-[#B38D1B] text-[#06110D] text-[9px] font-extrabold px-1.5 py-0.5 rounded opacity-95 tracking-wide shadow-md">VIP</div>`;
                        } else if (partner.tier === 'Premium') {
                            badgeHtml = `<div class="absolute top-1 left-1 z-10 bg-[var(--surface-color)] text-[var(--point-color)] border border-[var(--point-color)] text-[9px] font-extrabold px-1.5 py-0.5 rounded opacity-95 tracking-wide shadow-md">Premium</div>`;
                        }

                        let rndRegion = pickBannerRegion(partner);
                        let rndMassage = pickBannerMassage(partner);
                        let rndPlace = pickBannerPlace(partner);
                        let rndAge = pickBannerAge(partner);
                        const rb = getPartnerProfileReviewBaselines(partner);
                        recHtml += `
                <div class="card p-4 flex gap-4 mb-4 items-center transition-all duration-500 ease-in-out opacity-0 translate-y-2" style="animation: fadeInUp 0.5s ease forwards;" onclick="openProfile('${partner.name}', '${rndRegion} · ${rndPlace}', '${partner.id}', ${rb.reviews}, ${rb.rating}, '${rndMassage}', '${rndPlace}', '${rndAge}', '${partner.image}', '${partner.ticketType || '일반 입점'}', '${partner.ticketExpiry || ''}')">
                    <div class="w-[128px] h-[128px] rounded-2xl bg-cover bg-center flex-shrink-0 relative border border-white" style="background-image: url('${partner.image}'); filter: grayscale(10%) sepia(10%);">
                        ${badgeHtml}
                    </div>
                    <div class="flex-1 py-1">
                        <div class="flex justify-between items-start">
                            <h3 class="font-bold text-[16px] mb-0.5 tracking-tight" style="color: var(--text-main);">${partner.name}</h3>
                        </div>
                        <p class="text-[13px] mt-0.5" style="color: var(--text-sub);">${rndRegion ?? ''}</p>
                        <div class="grid grid-cols-2 gap-1.5 mt-2.5">
                            <span class="text-[11px] px-2 py-1 border border-[var(--point-color)] bg-[var(--point-color)]/10 rounded-full font-medium text-white  flex items-center justify-center truncate tracking-tight shadow-sm">${formatBannerRegionChipLabel(rndRegion)}</span>
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
            startAppBannerExposureAutoRefresh();

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
                    const normalized = normalizeFavoriteEntry(currentPartner);
                    if (normalized) userFavorites.push(normalized);
                    isFavorite = true;
                    heartIcon.setAttribute('fill', 'currentColor');
                    heartIcon.classList.add('drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]', 'scale-110');
                }

                persistUserFavorites();
                renderFavoritesList();
            }

            async function openChatSheet() {
                setChatSheetFullscreenMode(true);
                const actor = await getCurrentChatActor();
                if (actor.role === 'user') {
                    const thread = await ensureThreadForCurrentPartnerProfile();
                    if (!thread) return;
                    await openChatByThread(thread);
                    const input = document.getElementById('chat-input');
                    if (input) input.value = '';
                    return;
                }

                if (!activeChatThreadMeta || !activeChatThreadMeta.id) {
                    showCustomToast('채팅 목록에서 대화를 선택해주세요.');
                    return;
                }
                await openChatByThread(activeChatThreadMeta);
            }

            function closeChatSheet() {
                const chatSheet = document.getElementById('chat-sheet');
                chatSheet.classList.remove('open');
                closeChatAttachmentPreviewScreen(true);
                const actorRole = getLoggedInPartnerDocId() ? 'partner' : 'user';
                if (activeChatThreadId) {
                    markThreadAsRead(activeChatThreadId, actorRole);
                }
                stopChatThreadMessagesListener();

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
                setChatSheetFullscreenMode(false);
            }

            async function sendUserMessage() {
                if (isChatSending) return;
                const input = document.getElementById('chat-input');
                const text = input.value.trim();
                const filesToUpload = [...pendingChatAttachmentFiles];
                if (!text && filesToUpload.length === 0) return;
                if (!activeChatThreadId || typeof firebase === 'undefined') {
                    showCustomToast('채팅방 연결 중입니다. 잠시 후 다시 시도해주세요.');
                    return;
                }
                const attachmentValidation = validateChatAttachmentFiles(filesToUpload);
                if (!attachmentValidation.ok) {
                    showCustomToast(attachmentValidation.message);
                    return;
                }
                const actor = await getCurrentChatActor();
                const senderName = actor.name || actor.userId || actor.role;
                const dbRef = firebase.firestore();
                let uploadedAttachments = [];
                setChatSendingState(true, filesToUpload.length > 0 ? '첨부파일 전송 중...' : '메시지 전송 중...');
                if (filesToUpload.length > 0) {
                    try {
                        if (pendingChatAttachmentUploadState === 'done' && pendingChatUploadedAttachments.length) {
                            uploadedAttachments = [...pendingChatUploadedAttachments];
                        } else if (pendingChatAttachmentUploadPromise) {
                            uploadedAttachments = await pendingChatAttachmentUploadPromise;
                        } else {
                            uploadedAttachments = await uploadChatAttachments(activeChatThreadId, filesToUpload);
                        }
                    } catch (uploadErr) {
                        console.error('채팅 첨부파일 업로드 실패:', uploadErr);
                        showCustomToast('첨부파일 업로드에 실패했습니다. 잠시 후 다시 시도해주세요.');
                        setChatSendingState(false);
                        return;
                    }
                }
                const messagePayload = {
                    threadId: activeChatThreadId,
                    senderRole: actor.role,
                    senderDocId: actor.docId || '',
                    senderUserId: actor.userId || '',
                    senderName,
                    text,
                    attachments: uploadedAttachments,
                    attachmentCount: uploadedAttachments.length,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                const threadRef = dbRef.collection('chat_threads').doc(activeChatThreadId);
                const incrementTargetField = actor.role === 'partner' ? 'unreadForUser' : 'unreadForPartner';
                const resetField = actor.role === 'partner' ? 'unreadForPartner' : 'unreadForUser';
                const lastMessageText = text || `첨부파일 ${uploadedAttachments.length}개`;

                try {
                    await dbRef.collection('chat_messages').add(messagePayload);
                    await threadRef.set(
                        {
                            lastMessage: lastMessageText,
                            lastSenderRole: actor.role,
                            lastAt: firebase.firestore.FieldValue.serverTimestamp(),
                            [incrementTargetField]: firebase.firestore.FieldValue.increment(1),
                            [resetField]: 0,
                            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                        },
                        { merge: true }
                    );
                    input.value = '';
                    closeChatAttachmentPreviewScreen(false);
                    resetChatAttachmentInput();
                } catch (e) {
                    console.error('메시지 전송 실패:', e);
                    showCustomToast('메시지 전송 중 오류가 발생했습니다.');
                } finally {
                    setChatSendingState(false);
                }
            }

            // 엔터키 입력 지원
            const chatInput = document.getElementById('chat-input');
            if (chatInput) {
                chatInput.addEventListener('keypress', function (e) {
                    if (e.key === 'Enter') sendUserMessage();
                });
            }

            function sendMockChatMessage(text) {
                const input = document.getElementById('chat-input');
                if (input) {
                    input.value = text;
                    sendUserMessage();
                }
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
            const DADOK_USER_GENDER_STORAGE_KEY = 'dadok_user_gender';
            /** 일반고객 로그인 후 헤더·마이페이지 원형 프로필 (성별에 따라) */
            const DADOK_USER_AVATAR_CACHE_BUST = '2';
            const DADOK_USER_AVATAR_MALE_URL =
                './assets/images/dadok_user_male_character.png?v=' + DADOK_USER_AVATAR_CACHE_BUST;
            const DADOK_USER_AVATAR_FEMALE_URL =
                './assets/images/dadok_user_female_character.png?v=' + DADOK_USER_AVATAR_CACHE_BUST;
            const DADOK_USER_PROFILE_IMAGE_STORAGE_KEY = 'dadok_user_profile_image_url';
            const USER_PROFILE_MAX_SIZE = 5 * 1024 * 1024;
            let currentUserProfileImageUrl = '';

            function getCharacterAvatarImageUrl(isMale) {
                return isMale ? DADOK_USER_AVATAR_MALE_URL : DADOK_USER_AVATAR_FEMALE_URL;
            }

            function resolveStoredUserProfileImageUrl() {
                const ls = localStorage.getItem(DADOK_USER_PROFILE_IMAGE_STORAGE_KEY);
                const ss = sessionStorage.getItem(DADOK_USER_PROFILE_IMAGE_STORAGE_KEY);
                const raw = String(ls || ss || '').trim();
                return raw || '';
            }

            function persistUserProfileImageUrl(url = '') {
                const value = String(url || '').trim();
                const keepLogin = localStorage.getItem('dadok_isLoggedIn') === 'true';
                if (keepLogin) {
                    if (value) localStorage.setItem(DADOK_USER_PROFILE_IMAGE_STORAGE_KEY, value);
                    else localStorage.removeItem(DADOK_USER_PROFILE_IMAGE_STORAGE_KEY);
                    sessionStorage.removeItem(DADOK_USER_PROFILE_IMAGE_STORAGE_KEY);
                    return;
                }
                if (value) sessionStorage.setItem(DADOK_USER_PROFILE_IMAGE_STORAGE_KEY, value);
                else sessionStorage.removeItem(DADOK_USER_PROFILE_IMAGE_STORAGE_KEY);
                localStorage.removeItem(DADOK_USER_PROFILE_IMAGE_STORAGE_KEY);
            }

            function getResolvedUserAvatarUrl(genderKey = 'female', explicitProfileImageUrl = '') {
                const customUrl = String(explicitProfileImageUrl || '').trim() || resolveStoredUserProfileImageUrl();
                if (customUrl) return customUrl;
                return getCharacterAvatarImageUrl(genderKey === 'male');
            }

            function triggerUserProfileImagePicker() {
                const input = document.getElementById('mypage-profile-file-input');
                if (input) input.click();
            }

            window.triggerUserProfileImagePicker = triggerUserProfileImagePicker;

            async function syncLoggedInUserProfileImageFromFirestore() {
                if (typeof firebase === 'undefined') return;
                const userDocId = await ensureLoggedInUserDocId();
                if (!userDocId) return;
                try {
                    const doc = await firebase.firestore().collection('users').doc(userDocId).get();
                    if (!doc.exists) return;
                    const data = doc.data() || {};
                    const profileUrl = String(
                        data.profileImageUrl || data.photoURL || data.avatarUrl || data.image || '',
                    ).trim();
                    if (profileUrl) {
                        updateHeaderToLoggedInState(
                            localStorage.getItem('dadok_username') || sessionStorage.getItem('dadok_username') || '',
                            resolveStoredCustomerGenderKey(),
                            profileUrl,
                        );
                    }
                } catch (e) {
                    console.error('사용자 프로필 이미지 동기화 실패:', e);
                }
            }

            function resolveStoredCustomerGenderKey() {
                const ls = localStorage.getItem(DADOK_USER_GENDER_STORAGE_KEY);
                const ss = sessionStorage.getItem(DADOK_USER_GENDER_STORAGE_KEY);
                const raw = ls || ss || 'female';
                if (raw === 'male' || raw === '남성') return 'male';
                if (raw === 'female' || raw === '여성') return 'female';
                return 'female';
            }

            function persistCustomerGenderKey(genderKey) {
                if (genderKey !== 'male' && genderKey !== 'female') return;
                const keepBox = document.getElementById('keep-login-checkbox');
                const keepLogin = keepBox ? keepBox.checked : true;
                if (keepLogin) {
                    localStorage.setItem(DADOK_USER_GENDER_STORAGE_KEY, genderKey);
                    sessionStorage.removeItem(DADOK_USER_GENDER_STORAGE_KEY);
                } else {
                    sessionStorage.setItem(DADOK_USER_GENDER_STORAGE_KEY, genderKey);
                    localStorage.removeItem(DADOK_USER_GENDER_STORAGE_KEY);
                }
            }

            function resetUserLoginFormFields() {
                const idInput = document.getElementById('login-id-input');
                const passwordInput = document.getElementById('login-password-input');
                const idError = document.getElementById('login-id-error');
                const pwError = document.getElementById('login-password-error');
                const mismatchError = document.getElementById('login-mismatch-error');
                if (idInput) idInput.value = '';
                if (passwordInput) passwordInput.value = '';
                if (idInput) idInput.classList.remove('!border-[#ef4444]');
                if (passwordInput) passwordInput.classList.remove('!border-[#ef4444]');
                if (idError) idError.classList.add('hidden');
                if (pwError) pwError.classList.add('hidden');
                if (mismatchError) mismatchError.classList.add('hidden');
            }

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
                    resetUserLoginFormFields();
                }, 300);
            }

            // 아이디/비밀번호 로그인 폼 스크린 열기/닫기
            function openLoginFormModal() {
                resetUserLoginFormFields();
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
                    resetUserLoginFormFields();
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
            const LEGAL_CONSENT_VERSION = '2026-04-17.v1';
            let signupIdCheckTimer = null;
            let partnerSignupIdCheckTimer = null;
            let signupIdCheckToken = 0;
            let partnerSignupIdCheckToken = 0;
            let signupIdStatus = 'idle'; // idle | invalid | checking | duplicate | available | error
            let partnerSignupIdStatus = 'idle'; // idle | invalid | checking | duplicate | available | error

            function buildLegalConsentPayload(accountType = 'user') {
                const agreedAt = new Date().toISOString();
                return {
                    version: LEGAL_CONSENT_VERSION,
                    accountType,
                    agreedAt,
                    termsAgreed: true,
                    privacyAgreed: true,
                    operationsMonitoringNoticeAgreed: true,
                    consentChannel: 'signup_modal',
                };
            }

            function resetSignupForm() {
                const fields = ['signup-id', 'signup-pw', 'signup-pw-confirm'];
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
                const normalizedId = normalizeAuthEmail(id);
                const firestoreDb = firebase.firestore();
                const [userSnap, partnerSnap] = await Promise.all([
                    firestoreDb.collection('users').where('userId', '==', normalizedId).limit(1).get(),
                    firestoreDb.collection('partners').where('userId', '==', normalizedId).limit(1).get()
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

                if (!isValidEmailFormat(id)) {
                    signupIdStatus = 'invalid';
                    setIdStatusMessage(msgEl, 'invalid', '※ 올바른 이메일 형식으로 입력해주세요.');
                    checkSignupValidity();
                    return;
                }

                signupIdStatus = 'checking';
                setIdStatusMessage(msgEl, 'checking', '※ 이메일 중복을 확인하고 있습니다...');
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
                            isDuplicate ? '※ 이미 사용 중인 이메일입니다.' : '※ 사용 가능한 이메일입니다.'
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

                if (!isValidEmailFormat(id)) {
                    partnerSignupIdStatus = 'invalid';
                    setIdStatusMessage(msgEl, 'invalid', '※ 올바른 이메일 형식으로 입력해주세요.');
                    checkPartnerSignupForm();
                    return;
                }

                partnerSignupIdStatus = 'checking';
                setIdStatusMessage(msgEl, 'checking', '※ 이메일 중복을 확인하고 있습니다...');
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
                            isDuplicate ? '※ 이미 사용 중인 이메일입니다.' : '※ 사용 가능한 이메일입니다.'
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
                const agreeTerms = document.getElementById('signup-agree-terms').checked;
                const checkIconTerms = document.getElementById('signup-agree-terms-check');
                const agree = document.getElementById('signup-agree').checked;
                const checkIcon = document.getElementById('signup-agree-check');
                const isPasswordValid = isValidPartnerSignupPassword(pw || '');
                const isIdAvailable = signupIdStatus === 'available';

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
                if (id && isIdAvailable && pw && isPasswordValid && pwConfirm && pw === pwConfirm && agree && agreeTerms) {
                    btn.disabled = false;
                    btn.classList.remove('bg-[#0A1B13]', 'text-[#A7B2AE]', 'border-[#2A3731]', 'opacity-70');
                    btn.classList.add('bg-gradient-to-r', 'from-[var(--point-color)]', 'to-[#B59530]', 'text-[#06110D]', 'shadow-[0_8px_20px_rgba(212,175,55,0.25)]', 'border-[#D4AF37]', 'hover:brightness-110', 'active:scale-[0.98]');
                } else {
                    btn.disabled = true;
                    btn.classList.add('bg-[#0A1B13]', 'text-[#A7B2AE]', 'border-[#2A3731]', 'opacity-70');
                    btn.classList.remove('bg-gradient-to-r', 'from-[var(--point-color)]', 'to-[#B59530]', 'text-[#06110D]', 'shadow-[0_8px_20px_rgba(212,175,55,0.25)]', 'border-[#D4AF37]', 'hover:brightness-110', 'active:scale-[0.98]');
                }
            }

            async function handleSignupSubmit() {
                const id = document.getElementById('signup-id').value.trim();
                const pw = document.getElementById('signup-pw').value.trim();
                const pwConfirm = document.getElementById('signup-pw-confirm').value.trim();
                const agreeTerms = document.getElementById('signup-agree-terms').checked;
                const agree = document.getElementById('signup-agree').checked;
                const legalConsent = buildLegalConsentPayload('user');

                if (!agreeTerms || !agree) {
                    alert('필수 확인 항목 및 약관에 동의해주세요.');
                    return;
                }

                if (!isValidEmailFormat(id)) {
                    alert('이메일 형식으로 입력해주세요.');
                    return;
                }

                if (!isValidPartnerSignupPassword(pw)) {
                    alert('비밀번호는 8자리 이상이며 영문/숫자/특수문자를 모두 포함해야 합니다.');
                    return;
                }

                if (pw !== pwConfirm) {
                    alert('비밀번호가 일치하지 않습니다.');
                    return;
                }

                // Firestore에 사용자 정보 저장
                if (typeof firebase === 'undefined') {
                    alert('데이터베이스 연결에 실패했습니다. 캐시 문제일 수 있으니 [Ctrl + F5]를 눌러 강력 새로고침 후 다시 시도해주세요.');
                    return;
                }

                const auth = getAuthInstance();
                if (!auth) {
                    alert('인증 기능을 초기화하지 못했습니다. 잠시 후 다시 시도해주세요.');
                    return;
                }

                const firestoreDb = firebase.firestore();
                const now = firebase.firestore.FieldValue.serverTimestamp();
                try {
                    const isDuplicate = await checkIdDuplicateAcrossUsersAndPartners(id);
                    if (isDuplicate) {
                        alert('이미 사용 중인 이메일입니다.');
                        signupIdStatus = 'duplicate';
                        setIdStatusMessage(document.getElementById('signup-id-status-msg'), 'duplicate', '※ 이미 사용 중인 이메일입니다.');
                        checkSignupValidity();
                        return;
                    }
                    const normalizedEmail = normalizeAuthEmail(id);
                    const authEmail = buildAuthEmailByRole(normalizedEmail, 'user');
                    await applyAuthPersistenceByKeepLogin(Boolean(document.getElementById('keep-login-checkbox')?.checked));
                    const cred = await auth.createUserWithEmailAndPassword(authEmail, pw);
                    const authUid = String(cred?.user?.uid || '').trim();

                    const docRef = firestoreDb.collection('users').doc(normalizedEmail);
                    await docRef.set({
                        userId: normalizedEmail,
                        authUid,
                        authEmail,
                        authRole: 'user',
                        legalConsent,
                        createdAt: now,
                        lastLoginAt: now
                    }, { merge: true });

                    completeSignup(normalizedEmail, normalizedEmail);
                } catch (error) {
                    console.error('ID duplicate check error:', error);
                    const code = String(error?.code || '');
                    if (code === 'auth/email-already-in-use') {
                        alert('이미 사용 중인 이메일입니다.');
                    } else if (code === 'auth/weak-password') {
                        alert('비밀번호 보안 수준이 낮습니다. 더 복잡한 비밀번호를 사용해주세요.');
                    } else {
                        alert('가입 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
                    }
                }
            }

            function completeSignup(name, id) {
                alert(name + '님, 다독 회원이 되신 것을 환영합니다!');
                resetSignupForm();
                closeSignupModal();
                completeLoginProcess(id, id, '', '');
            }

            // 모의 로그인 처리 로직
            let isLoggedIn = false;
            let isPartnerLoggedIn = false;
            let currentPassword = '';

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
                } else {
                    currPwMsg.textContent = '현재 비밀번호를 확인합니다.';
                    currPwMsg.className = 'text-xs mt-2 text-[var(--point-color)]';
                    isCurrValid = true;
                }

                // New Password Validation
                if (newPw === '') {
                    newPwMsg.textContent = '';
                } else if (!isValidPartnerSignupPassword(newPw)) {
                    newPwMsg.textContent = '비밀번호는 8자리 이상이며 영문/숫자/특수문자를 모두 포함해야 합니다.';
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

            async function handleChangePassword() {
                const currPw = document.getElementById('curr-pw').value;
                const newPw = document.getElementById('new-pw').value;
                const confirmPw = document.getElementById('confirm-pw').value;

                // 추가적인 다중 보안 검증
                if (!currPw) {
                    alert('현재 비밀번호를 입력해주세요.');
                    return;
                }
                if (newPw === '') {
                    alert('새 비밀번호를 입력해주세요.');
                    return;
                }
                if (!isValidPartnerSignupPassword(newPw)) {
                    alert('새 비밀번호는 8자리 이상이며 영문/숫자/특수문자를 모두 포함해야 합니다.');
                    return;
                }
                if (newPw === currPw) {
                    alert('새 비밀번호가 현재 비밀번호와 동일합니다.');
                    return;
                }
                if (newPw !== confirmPw) {
                    alert('새 비밀번호와 확인이 일치하지 않습니다.');
                    return;
                }

                try {
                    const auth = getAuthInstance();
                    const user = auth?.currentUser;
                    if (!auth || !user || !user.email) {
                        alert('로그인 세션이 확인되지 않습니다. 다시 로그인 후 시도해주세요.');
                        return;
                    }
                    const credential = firebase.auth.EmailAuthProvider.credential(user.email, currPw);
                    await user.reauthenticateWithCredential(credential);
                    await user.updatePassword(newPw);
                    alert('비밀번호가 안전하게 변경되었습니다.');
                } catch (e) {
                    const code = String(e?.code || '');
                    if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
                        alert('현재 비밀번호가 올바르지 않습니다.');
                    } else if (code === 'auth/too-many-requests') {
                        alert('시도가 너무 많습니다. 잠시 후 다시 시도해주세요.');
                    } else {
                        alert('비밀번호 변경 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
                    }
                    return;
                }

                document.getElementById('curr-pw').value = '';
                document.getElementById('new-pw').value = '';
                document.getElementById('confirm-pw').value = '';
                validatePasswordChange();

                closeSecurityModal();
            }

            function openPartnerLoginScreen() {
                if (typeof isLoggedIn !== 'undefined' && isLoggedIn) {
                    showCustomToast('업체회원 전용입니다.');
                    return;
                }
                if (typeof isPartnerLoggedIn !== 'undefined' && isPartnerLoggedIn) {
                    openPartnerDashboard();
                    return;
                }
                resetPartnerLoginFormFields();
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
                    resetPartnerLoginFormFields();
                }, 300);
            }

            function resetPartnerLoginFormFields() {
                const idInput = document.getElementById('partner-login-id-input');
                const passwordInput = document.getElementById('partner-login-password-input');
                const idError = document.getElementById('partner-login-id-error');
                const pwError = document.getElementById('partner-login-password-error');
                const mismatchError = document.getElementById('partner-login-mismatch-error');
                if (idInput) {
                    idInput.value = '';
                    idInput.classList.remove('!border-[#ef4444]');
                }
                if (passwordInput) {
                    passwordInput.value = '';
                    passwordInput.classList.remove('!border-[#ef4444]');
                }
                if (idError) idError.classList.add('hidden');
                if (pwError) pwError.classList.add('hidden');
                if (mismatchError) mismatchError.classList.add('hidden');
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
                setPartnerRecoveryResult(
                    '보안 강화로 비밀번호 재설정 방식이 변경되었습니다. 관리자 문의를 통해 재설정 요청을 진행해주세요.',
                    'error'
                );
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

                    setPartnerRecoveryResult(`확인된 파트너 이메일은 ${matchedUserId} 입니다.`, 'success');
                } catch (e) {
                    console.error('파트너 이메일 찾기 오류:', e);
                    setPartnerRecoveryResult('이메일 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error');
                }
            }

            async function handlePartnerPasswordResetRequest() {
                const userId = document.getElementById('partner-find-pw-id')?.value?.trim();
                const company = document.getElementById('partner-find-pw-company')?.value?.trim();

                if (!userId || !company) {
                    setPartnerRecoveryResult('이메일과 업체명을 모두 입력해주세요.', 'error');
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
                    const splitDateTimeStr = (s) => {
                        const i = s.indexOf(' ');
                        return i >= 0 ? { date: s.slice(0, i), time: s.slice(i + 1) } : { date: s, time: '' };
                    };

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

                    const purchaseDT = splitDateTimeStr(formatDT(purchaseDateObj));
                    const expiryDT = splitDateTimeStr(formatDT(finalExpirationDate));

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
                        <div class="mt-4 pt-4 border-t border-[#D4AF37]/20 space-y-3 text-[13px]">
                            <div class="flex items-baseline justify-between gap-3 w-full min-w-0">
                                <span class="text-[var(--text-sub)] shrink-0">최초 구매일</span>
                                <div class="flex items-baseline justify-end gap-2 min-w-0 text-right tabular-nums">
                                    <span class="text-[#E0E8E4]">${purchaseDT.date}</span>
                                    <span class="text-[#5C6B66] shrink-0" aria-hidden="true">·</span>
                                    <span class="text-[#C5D0CC]">${purchaseDT.time}</span>
                                </div>
                            </div>
                            <div class="flex items-start justify-between gap-3 w-full min-w-0">
                                <span class="text-[var(--text-sub)] shrink-0 pt-0.5">예상 만료일</span>
                                <div class="text-right min-w-0 flex flex-col items-end gap-0.5">
                                    <div class="flex items-baseline justify-end gap-2 tabular-nums">
                                        <span class="text-[#E0E8E4] font-medium">${expiryDT.date}</span>
                                        <span class="text-[#5C6B66] shrink-0" aria-hidden="true">·</span>
                                        <span class="text-[#C5D0CC] font-medium">${expiryDT.time}</span>
                                    </div>
                                    <span class="text-[11px] text-[var(--text-sub)] opacity-75">(자동 삭제)</span>
                                </div>
                            </div>
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

            async function openPartnerDashboard() {
                await loadNotificationSettings('partner');
                resetUnreadTrackers('partner');
                await populateDashboardFromPartner();
                loadPartnerDashboardStats();
                renderPartnerBanners();
                refreshNoticeUnreadBadges();
                bindPartnerDashboardChatBadgeListener();
                await setPartnerDashboardAccessMode(currentPartner);
                startPartnerDashboardLiveSync();
                const modal = document.getElementById('partner-dashboard-modal');
                if (modal) {
                    const resetPartnerDashboardTop = () => {
                        modal.scrollTop = 0;
                        const scrollable = modal.querySelector('.overflow-y-auto');
                        if (scrollable) scrollable.scrollTop = 0;
                    };
                    modal.style.display = 'flex';
                    modal.style.transform = '';
                    resetPartnerDashboardTop();
                    setTimeout(() => {
                        modal.classList.remove('translate-x-full');
                        resetPartnerDashboardTop();
                        requestAnimationFrame(resetPartnerDashboardTop);
                    }, 10);
                }
                registerPartnerDashboardBackStack();
            }

            function closePartnerDashboardToLogin() {
                stopPartnerDashboardLiveSync();
                resetUnreadTrackers('partner');
                popPartnerDashboardHistoryEntryIfTop();
                const loginModal = document.getElementById('partner-login-modal');
                if (loginModal) {
                    loginModal.style.display = 'flex';
                    loginModal.classList.remove('translate-x-full');
                    resetPartnerLoginFormFields();
                }

                const modal = document.getElementById('partner-dashboard-modal');
                if (modal) {
                    modal.classList.add('translate-x-full');
                    setTimeout(() => {
                        modal.style.display = 'none';
                    }, 300);
                }
                if (typeof unsubscribePartnerChatBadge === 'function') {
                    unsubscribePartnerChatBadge();
                    unsubscribePartnerChatBadge = null;
                }
            }

            function logoutPartnerToLogin() {
                isPartnerLoggedIn = false;
                currentPartner = null;
                const auth = getAuthInstance();
                if (auth?.currentUser) {
                    auth.signOut().catch((e) => console.error('파트너 로그아웃(signOut) 실패:', e));
                }
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
                stopPartnerDashboardLiveSync();
                resetUnreadTrackers('partner');
                popPartnerDashboardHistoryEntryIfTop();
                const modal = document.getElementById('partner-dashboard-modal');
                if (modal) {
                    modal.classList.add('translate-x-full');
                    setTimeout(() => {
                        modal.style.display = 'none';
                    }, 300);
                }
                if (typeof unsubscribePartnerChatBadge === 'function') {
                    unsubscribePartnerChatBadge();
                    unsubscribePartnerChatBadge = null;
                }
            }

            function goToPartnerEntryFromDashboard() {
                // 대시보드 위에 입점 안내 페이지를 띄움
                openPartnerEntryScreen();
                registerPartnerEntryFromDashboardBackStack();
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

                const idValue = normalizeAuthEmail(idInput.value.trim());
                const pwValue = passwordInput.value.trim();
                if (!isValidEmailFormat(idValue)) {
                    mismatchError.classList.remove('hidden');
                    idInput.classList.add('!border-[#ef4444]');
                    return;
                }
                if (typeof firebase === 'undefined') {
                    alert('데이터베이스 연결에 실패했습니다. 캐시 문제일 수 있으니 [Ctrl + F5]를 눌러 강력 새로고침 후 다시 시도해주세요.');
                    return;
                }
                const auth = getAuthInstance();
                if (!auth) {
                    alert('인증 기능을 초기화하지 못했습니다. 잠시 후 다시 시도해주세요.');
                    return;
                }
                const firestoreDb = firebase.firestore();
                try {
                    const keepLogin = document.getElementById('partner-keep-login-checkbox').checked;
                    await applyAuthPersistenceByKeepLogin(keepLogin);
                    const authEmail = buildAuthEmailByRole(idValue, 'partner');
                    try {
                        await auth.signInWithEmailAndPassword(authEmail, pwValue);
                    } catch (signInError) {
                        // 레거시 파트너 계정 마이그레이션
                        const signInCode = String(signInError?.code || '');
                        if (
                            signInCode === 'auth/user-not-found' ||
                            signInCode === 'auth/invalid-credential' ||
                            signInCode === 'auth/wrong-password'
                        ) {
                            const partnerSnapshot = await firestoreDb.collection('partners').where('userId', '==', idValue).limit(1).get();
                            if (partnerSnapshot.empty) throw signInError;
                            const partnerDoc = partnerSnapshot.docs[0];
                            const partnerData = partnerDoc.data() || {};
                            const legacyPw = String(partnerData.password || '');
                            if (!legacyPw || legacyPw !== pwValue) throw signInError;
                            const cred = await auth.createUserWithEmailAndPassword(authEmail, pwValue);
                            await partnerDoc.ref.set(
                                {
                                    authUid: String(cred?.user?.uid || ''),
                                    authEmail,
                                    authRole: 'partner',
                                    password: firebase.firestore.FieldValue.delete(),
                                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                                },
                                { merge: true },
                            );
                        } else {
                            throw signInError;
                        }
                    }

                    let loggedInPartnerDocId = null;
                    const partnerSnapshot = await firestoreDb.collection('partners').where('userId', '==', idValue).limit(1).get();
                    if (!partnerSnapshot.empty) {
                        const partnerDoc = partnerSnapshot.docs[0];
                        const partnerData = partnerDoc.data() || {};
                        loggedInPartnerDocId = partnerDoc.id;
                        currentPartner = { id: partnerDoc.id, ...partnerData };
                        await partnerDoc.ref.set({
                            authUid: String(auth.currentUser?.uid || partnerData.authUid || ''),
                            authEmail,
                            authRole: 'partner',
                            lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
                        }, { merge: true });
                    }
                    if (!loggedInPartnerDocId) {
                        throw new Error('PARTNER_PROFILE_NOT_FOUND');
                    }

                    isPartnerLoggedIn = true;
                    // 파트너 로그인 시 일반회원 세션을 함께 정리해 동시 로그인 상태를 방지
                    isLoggedIn = false;
                    localStorage.removeItem('dadok_isLoggedIn');
                    localStorage.removeItem('dadok_username');
                    localStorage.removeItem('dadok_loggedInUserDocId');
                    sessionStorage.removeItem('dadok_isLoggedIn');
                    sessionStorage.removeItem('dadok_username');
                    sessionStorage.removeItem('dadok_loggedInUserDocId');
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
                        currentPartner = null;
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
                } catch (error) {
                    console.error('파트너 로그인 검증 실패:', error);
                    mismatchError.classList.remove('hidden');
                    idInput.classList.add('!border-[#ef4444]');
                    passwordInput.classList.add('!border-[#ef4444]');
                }
            }

            function openPartnerSignupModal() {
                if (typeof isLoggedIn !== 'undefined' && isLoggedIn) {
                    showCustomToast('업체회원 전용입니다.');
                    return;
                }
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
                    // 뒤로가기/닫기 시 작성 중인 내용이 남지 않도록 항상 초기화
                    resetPartnerSignupForm();
                }, 300);
            }

            function openLegalModal(type) {
                const modal = document.getElementById('legal-modal');
                const titleEl = document.getElementById('legal-modal-title');
                const contentEl = document.getElementById('legal-modal-content');

                if (type === 'terms') {
                    titleEl.innerText = "서비스 이용약관";
                    contentEl.innerText = "제 1장 총칙\n\n제 1조 [목적]\n본 약관은 다독(이하 '회사')이 제공하는 피부·바디 케어(테라피) 목적의 정보 제공/중개 서비스와 관련하여 회사와 회원의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.\n\n제 2조 [서비스 성격]\n회사는 이용자와 파트너를 연결하는 플랫폼 운영자이며, 현장 서비스의 직접 제공 주체가 아닙니다.\n\n제 3조 [금지 행위]\n회원 및 파트너는 성적 서비스 요구, 성매매 알선/유도, 폭언·협박, 불법 촬영, 사기 및 기타 불법·유해 행위를 해서는 안 됩니다.\n\n제 4조 [운영 목적 범위 내 정보 확인]\n회사는 운영 안정화, 고객 문의/분쟁 처리, 부정 이용 탐지 및 보안 점검을 위해 권한이 부여된 관리자에 한하여 필요한 범위 내 운영 데이터를 확인할 수 있습니다.\n\n제 5조 [최소 열람 및 기록]\n관리자 열람은 업무상 필요 시에 한정되며, 열람 사유/시각/대상 범위를 기록하여 내부 통제를 수행합니다.\n\n제 6조 [제재 및 협조]\n금지 행위 적발 시 경고 없이 이용 제한, 계정 정지 또는 영구 이용 제한이 가능하며, 법령에 따라 관계 기관 요청 시 필요한 범위에서 협조할 수 있습니다.\n\n제 7조 [약관의 고지와 개정]\n회사는 본 약관을 서비스 화면에 게시하며, 법령 및 운영정책 변경 시 관련 절차에 따라 고지합니다.";
                } else if (type === 'privacy') {
                    titleEl.innerText = "개인정보 수집 및 동의";
                    contentEl.innerText = "개인정보 수집 및 이용 동의\n\n1. 수집하는 개인정보 항목\n- 공통 필수: 이메일 주소, 비밀번호\n- 파트너 가입 시 필수: 업체명, 대표자명, 휴대폰 번호\n- 파트너 유형별 추가 수집(선택/필수는 정책에 따름): 사업자 정보, 본인확인 자료(마스킹본)\n- 서비스 이용 과정에서 생성: 접속/이용기록, 고객센터/운영 메시지 관련 기록\n\n2. 개인정보 수집 및 이용 목적\n- 회원 가입 및 본인 확인\n- 서비스 제공, 고객 문의 응대, 분쟁 처리\n- 서비스 안정성 확보, 부정 이용 탐지, 보안 점검\n\n3. 관리자 열람 고지\n회사는 위 목적 범위 내에서 권한이 부여된 관리자에게 최소 범위의 열람 권한을 부여할 수 있으며, 열람 내역은 내부 기준에 따라 기록/관리합니다.\n\n4. 보관 및 파기\n원칙적으로 목적 달성 후 지체 없이 파기하며, 관련 법령 또는 내부 보관정책에 따라 일정 기간 보관 후 안전하게 파기합니다.";
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

            function formatFirebaseError(error) {
                const code = String(error?.code || '').trim();
                const message = String(error?.message || '').trim();
                if (code && message) return `${code} - ${message}`;
                if (code) return code;
                if (message) return message;
                return '알 수 없는 오류';
            }

            function setPartnerSignupSubmitButtonLabel(label = '가입하기') {
                const btn = document.getElementById('partner-signup-submit-btn');
                if (!btn) return;
                const labelSpan = btn.querySelector('span');
                if (labelSpan) {
                    labelSpan.innerText = label;
                } else {
                    btn.innerText = label;
                }
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

                setPartnerSignupSubmitButtonLabel('가입하기');

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
                const legalConsent = buildLegalConsentPayload('partner');
                
                if (!isValidEmailFormat(id)) {
                    alert('이메일 형식으로 입력해주세요.');
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

                const auth = getAuthInstance();
                if (!auth) {
                    alert('인증 기능을 초기화하지 못했습니다. 잠시 후 다시 시도해주세요.');
                    return;
                }

                const firestoreDb = firebase.firestore();
                
                try {
                    const isDuplicate = await checkIdDuplicateAcrossUsersAndPartners(id);
                    if (isDuplicate) {
                        alert('이미 사용중인 파트너 이메일입니다.');
                        partnerSignupIdStatus = 'duplicate';
                        setIdStatusMessage(document.getElementById('partner-signup-id-status-msg'), 'duplicate', '※ 이미 사용 중인 이메일입니다.');
                        checkPartnerSignupForm();
                        return;
                    }
                } catch (error) {
                    console.error('파트너 이메일 중복 확인 실패:', error);
                    alert(`이메일 중복 확인 중 오류가 발생했습니다.\n${formatFirebaseError(error)}`);
                    setPartnerSignupSubmitButtonLabel('가입하기');
                    return;
                }

                const now = firebase.firestore.FieldValue.serverTimestamp();
                setPartnerSignupSubmitButtonLabel('서류 업로드 중...');

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
                        alert(`증빙 서류 업로드에 실패했습니다.\n${formatFirebaseError(uploadObjError)}`);
                        setPartnerSignupSubmitButtonLabel('가입하기');
                        return;
                    }
                }

                setPartnerSignupSubmitButtonLabel('데이터 저장 중...');
                let createdAuthUser = null;
                try {
                    const normalizedEmail = normalizeAuthEmail(id);
                    const authEmail = buildAuthEmailByRole(normalizedEmail, 'partner');
                    await applyAuthPersistenceByKeepLogin(false);
                    const cred = await auth.createUserWithEmailAndPassword(authEmail, pw);
                    createdAuthUser = cred?.user || null;

                    // 파트너 컬렉션에 새 문서 저장
                    await firestoreDb.collection('partners').add({
                        userId: normalizedEmail,
                        authUid: String(createdAuthUser?.uid || ''),
                        authEmail,
                        authRole: 'partner',
                        name: company,
                        ownerName: ownerName,
                        phone: phone,
                        bizType: bizType,
                        bizNo: bizNo,
                        bizDocUrl: bizDocUrl,
                        status: 'pending', // 대기 상태
                        legalConsent,
                        createdAt: now,
                        updatedAt: now
                    });
                    if (createdAuthUser) {
                        await auth.signOut();
                    }
                } catch (error) {
                    console.error('파트너 문서 저장 실패:', error);
                    if (createdAuthUser) {
                        try {
                            await createdAuthUser.delete();
                        } catch (rollbackError) {
                            console.error('파트너 가입 롤백 실패:', rollbackError);
                        }
                    }
                    const code = String(error?.code || '');
                    if (code === 'auth/email-already-in-use') {
                        alert('이미 사용 중인 파트너 이메일입니다.');
                    } else {
                        alert(`가입 데이터 저장 중 오류가 발생했습니다.\n${formatFirebaseError(error)}`);
                    }
                    setPartnerSignupSubmitButtonLabel('가입하기');
                    return;
                }

                setPartnerSignupSubmitButtonLabel('가입하기');

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
                    document.getElementById('app-contact-error').innerText = '연락처를 입력해주세요.';
                    document.getElementById('app-company-name').classList.remove('!border-[#ef4444]');
                    document.getElementById('app-depositor-name').classList.remove('!border-[#ef4444]');
                    document.getElementById('app-contact').classList.remove('!border-[#ef4444]');
                }, 300);
            }

            function getPartnerApplicationContactValidation(contactRaw = '') {
                const digits = normalizePhoneDigits(contactRaw).slice(0, 11);
                if (!digits) {
                    return { digits, isEmpty: true, isValid: false, message: '연락처를 입력해주세요.' };
                }
                if (!digits.startsWith('010')) {
                    return {
                        digits,
                        isEmpty: false,
                        isValid: false,
                        message: '연락처는 010으로 시작해야 합니다.',
                    };
                }
                if (!/^010\d{8}$/.test(digits)) {
                    return {
                        digits,
                        isEmpty: false,
                        isValid: false,
                        message: '010으로 시작하는 11자리 숫자로 입력해주세요.',
                    };
                }
                return { digits, isEmpty: false, isValid: true, message: '' };
            }

            function applyPartnerApplicationContactValidation(contactInput, { showEmptyError = false } = {}) {
                if (!contactInput) return false;
                const errorEl = document.getElementById('app-contact-error');
                const result = getPartnerApplicationContactValidation(contactInput.value || '');
                contactInput.value = result.digits;

                if (result.isValid) {
                    contactInput.classList.remove('!border-[#ef4444]');
                    if (errorEl) {
                        errorEl.classList.add('hidden');
                        errorEl.innerText = '연락처를 입력해주세요.';
                    }
                    return true;
                }

                if (result.isEmpty && !showEmptyError) {
                    contactInput.classList.remove('!border-[#ef4444]');
                    if (errorEl) {
                        errorEl.classList.add('hidden');
                        errorEl.innerText = '연락처를 입력해주세요.';
                    }
                    return false;
                }

                contactInput.classList.add('!border-[#ef4444]');
                if (errorEl) {
                    errorEl.classList.remove('hidden');
                    errorEl.innerText = result.message;
                }
                return false;
            }

            function handlePartnerApplicationContactInput(inputEl) {
                applyPartnerApplicationContactValidation(inputEl, { showEmptyError: false });
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
                    document.getElementById('app-contact-error').innerText = '연락처를 입력해주세요.';
                    contactInput.classList.add('!border-[#ef4444]');
                    isValid = false;
                } else {
                    const isValidContact = applyPartnerApplicationContactValidation(contactInput, {
                        showEmptyError: true,
                    });
                    if (!isValidContact) isValid = false;
                }

                if (!isValid) {
                    return;
                }

                if (!applyPartnerApplicationContactValidation(contactInput, { showEmptyError: true })) {
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
                <div class="leading-relaxed text-center">
                    <span class="text-[#F6DC7A] font-extrabold text-[18px] tracking-wide">[${title}]</span><span class="text-white font-semibold text-[18px]"> 접수 완료</span>
                </div>
            </div>

            <div class="mb-4 rounded-2xl border border-[#2A3832] bg-[#0C1512] p-4">
                <p class="text-center text-[12px] font-semibold text-[#9EAEA8] mb-4">입금 정보</p>
                <div class="space-y-4">
                    <div>
                        <p class="text-[11px] text-white/45 mb-1">입금 계좌</p>
                        <p class="text-[16px] font-bold text-[#E8D89A] leading-snug tracking-wide">카카오뱅크 <span class="text-white/90">3333-37-0613731</span></p>
                    </div>
                    <div class="h-px bg-white/[0.08]"></div>
                    <div>
                        <p class="text-[11px] text-white/45 mb-1">예금주</p>
                        <p class="text-[16px] font-bold text-white leading-snug">다독(DA:DOK)</p>
                    </div>
                </div>
            </div>

            <div class="text-center bg-[#0A1310] border border-[#22312B] rounded-xl px-4 py-3">
                <p class="text-[#9EA9A5] text-[13px] leading-relaxed tracking-wide">
                    입금 확인 후 즉시 파트너 권한 부여
                </p>
            </div>
        `;
                document.getElementById('app-success-message').innerHTML = successHTML;

                const successModal = document.getElementById('partner-application-success-modal');
                successModal.style.display = 'flex';
                setTimeout(() => {
                    successModal.classList.remove('translate-x-full');
                }, 10);
                registerPartnerApplicationSuccessBackStack();
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
                    document.getElementById('app-contact-error').innerText = '연락처를 입력해주세요.';
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

                /* 기기 뒤로가기로 신청완료만 닫은 뒤 스택에 입점신청이 남아 있으면 히스토리·스택 정리 → 입점 안내로 자연스럽게 복귀 */
                if (typeof appModalStack !== 'undefined' && typeof isClickClosing !== 'undefined'
                    && appModalStack.length && appModalStack[appModalStack.length - 1] === 'closePartnerApplication') {
                    appModalStack.pop();
                    if (history.state && history.state.modalOpen) {
                        isClickClosing = true;
                        history.back();
                        setTimeout(() => { isClickClosing = false; }, 50);
                    }
                }
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
                const idError = document.getElementById('login-id-error');
                const pwError = document.getElementById('login-password-error');
                const mismatchError = document.getElementById('login-mismatch-error');
                const idValue = normalizeAuthEmail(idInput.value.trim());
                const pwValue = passwordInput.value.trim();

                if (idError) idError.classList.add('hidden');
                if (pwError) pwError.classList.add('hidden');
                if (mismatchError) mismatchError.classList.add('hidden');
                if (idInput) idInput.classList.remove('!border-[#ef4444]');
                if (passwordInput) passwordInput.classList.remove('!border-[#ef4444]');

                let hasError = false;
                if (!idValue) {
                    if (idError) idError.classList.remove('hidden');
                    if (idInput) idInput.classList.add('!border-[#ef4444]');
                    hasError = true;
                }
                if (!isValidEmailFormat(idValue)) {
                    if (mismatchError) mismatchError.classList.remove('hidden');
                    if (idInput) idInput.classList.add('!border-[#ef4444]');
                    return;
                }
                if (!pwValue) {
                    if (pwError) pwError.classList.remove('hidden');
                    if (passwordInput) passwordInput.classList.add('!border-[#ef4444]');
                    hasError = true;
                }
                if (hasError) return;

                if (typeof firebase === 'undefined') {
                    alert('서버 연결 실패. 페이지를 강력 새로고침(Ctrl + F5) 후 다시 시도해주세요.');
                    return;
                }

                const auth = getAuthInstance();
                if (!auth) {
                    alert('인증 기능을 초기화하지 못했습니다. 잠시 후 다시 시도해주세요.');
                    return;
                }
                const firestoreDb = firebase.firestore();
                try {
                    const keepLoginBox = document.getElementById('keep-login-checkbox');
                    await applyAuthPersistenceByKeepLogin(Boolean(keepLoginBox?.checked));
                    const authEmail = buildAuthEmailByRole(idValue, 'user');
                    try {
                        await auth.signInWithEmailAndPassword(authEmail, pwValue);
                    } catch (signInError) {
                        // 레거시 평문 비밀번호 계정 1회 마이그레이션
                        const signInCode = String(signInError?.code || '');
                        if (
                            signInCode === 'auth/user-not-found' ||
                            signInCode === 'auth/invalid-credential' ||
                            signInCode === 'auth/wrong-password'
                        ) {
                            const legacySnap = await firestoreDb.collection('users').where('userId', '==', idValue).limit(1).get();
                            if (legacySnap.empty) throw signInError;
                            const legacyDoc = legacySnap.docs[0];
                            const legacyData = legacyDoc.data() || {};
                            const legacyPw = String(legacyData.password || '');
                            if (!legacyPw || legacyPw !== pwValue) throw signInError;
                            const cred = await auth.createUserWithEmailAndPassword(authEmail, pwValue);
                            await legacyDoc.ref.set(
                                {
                                    authUid: String(cred?.user?.uid || ''),
                                    authEmail,
                                    authRole: 'user',
                                    password: firebase.firestore.FieldValue.delete(),
                                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                                },
                                { merge: true },
                            );
                        } else {
                            throw signInError;
                        }
                    }

                    const userSnapshot = await firestoreDb.collection('users').where('userId', '==', idValue).limit(1).get();
                    if (!userSnapshot.empty) {
                        const userDoc = userSnapshot.docs[0];
                        const userData = userDoc.data() || {};
                        await userDoc.ref.set(
                            {
                                authUid: String(auth.currentUser?.uid || userData.authUid || ''),
                                authEmail: buildAuthEmailByRole(idValue, 'user'),
                                authRole: 'user',
                                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
                            },
                            { merge: true }
                        );
                        let resolvedGenderKey = '';
                        if (userData.gender === '남성') resolvedGenderKey = 'male';
                        else if (userData.gender === '여성') resolvedGenderKey = 'female';
                        const resolvedProfileImage =
                            userData.profileImageUrl ||
                            userData.photoURL ||
                            userData.avatarUrl ||
                            userData.image ||
                            '';
                        completeLoginProcess(
                            idValue,
                            userDoc.id,
                            resolvedGenderKey,
                            resolvedProfileImage,
                        );
                        return;
                    }

                    if (mismatchError) mismatchError.classList.remove('hidden');
                    if (idInput) idInput.classList.add('!border-[#ef4444]');
                    if (passwordInput) passwordInput.classList.add('!border-[#ef4444]');
                } catch (error) {
                    console.error("Login Error: ", error);
                    alert("로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
                }
            }

            function completeLoginProcess(
                username,
                userDocId = '',
                genderKey = '',
                profileImageUrl = '',
            ) {
                isLoggedIn = true;
                isPartnerLoggedIn = false;
                const idInput = document.getElementById('login-id-input');
                const passwordInput = document.getElementById('login-password-input');
                if(idInput) idInput.value = '';
                if(passwordInput) passwordInput.value = '';

                closeLoginFormModal();
                closeLoginModal();

                const keepLoginBox = document.getElementById('keep-login-checkbox');
                const keepLogin = keepLoginBox ? keepLoginBox.checked : false;
                if (keepLogin) {
                    localStorage.setItem('dadok_isLoggedIn', 'true');
                    localStorage.setItem('dadok_username', username);
                    if (userDocId) localStorage.setItem('dadok_loggedInUserDocId', userDocId);
                    else localStorage.removeItem('dadok_loggedInUserDocId');
                } else {
                    sessionStorage.setItem('dadok_isLoggedIn', 'true');
                    sessionStorage.setItem('dadok_username', username);
                    if (userDocId) sessionStorage.setItem('dadok_loggedInUserDocId', userDocId);
                    else sessionStorage.removeItem('dadok_loggedInUserDocId');
                }

                if (genderKey === 'male' || genderKey === 'female') {
                    persistCustomerGenderKey(genderKey);
                }

                // 일반회원 로그인 시 파트너 세션 잔존값 제거(채팅 actor 오판 방지)
                localStorage.removeItem('dadok_isPartnerLoggedIn');
                sessionStorage.removeItem('dadok_isPartnerLoggedIn');
                localStorage.removeItem('dadok_loggedInPartnerDocId');
                sessionStorage.removeItem('dadok_loggedInPartnerDocId');
                localStorage.removeItem('dadok_loggedInPartnerUserId');
                sessionStorage.removeItem('dadok_loggedInPartnerUserId');
                currentPartner = null;

                updateHeaderToLoggedInState(username, genderKey, profileImageUrl);
                loadUserFavorites();
            }

            function updateHeaderToLoggedInState(name, explicitGenderKey, explicitProfileImageUrl = '') {
                const key =
                    explicitGenderKey === 'male' || explicitGenderKey === 'female'
                        ? explicitGenderKey
                        : resolveStoredCustomerGenderKey();
                const avatarUrl = getResolvedUserAvatarUrl(key, explicitProfileImageUrl);
                currentUserProfileImageUrl = String(explicitProfileImageUrl || '').trim()
                    ? String(explicitProfileImageUrl || '').trim()
                    : resolveStoredUserProfileImageUrl();
                persistUserProfileImageUrl(currentUserProfileImageUrl);

                const headerProfileBtn = document.getElementById('header-profile-btn');
                if (headerProfileBtn) {
                    headerProfileBtn.setAttribute('onclick', "openMyPageModal()");
                    headerProfileBtn.innerHTML = `
                <div class="w-[42px] h-[42px] rounded-full bg-cover bg-center border-[1.5px] border-[var(--point-color)] shadow-sm overflow-hidden" style="background-image: url('${avatarUrl}');"></div>
            `;
                }

                const myPageProfileImg = document.getElementById('mypage-profile-img');
                const myPageFallback = document.getElementById('mypage-profile-fallback');
                if (myPageProfileImg) {
                    myPageProfileImg.style.backgroundImage = `url('${avatarUrl}')`;
                }
                if (myPageFallback) {
                    myPageFallback.style.display = 'none';
                }

                const mypageName = document.getElementById('mypage-user-name');
                if (mypageName && name) {
                    mypageName.textContent = name;
                }
            }

            async function openNotificationSettingsModal(audience = 'user') {
                currentNotificationSettingsAudience = audience === 'partner' ? 'partner' : 'user';
                const modal = document.getElementById('notification-settings-modal');
                if (!modal) return;
                // 모바일 네트워크 지연 시에도 화면은 먼저 열고, 설정값은 뒤에서 갱신한다.
                modal.style.display = 'flex';
                void modal.offsetWidth;
                setTimeout(() => {
                    modal.classList.remove('translate-x-full');
                    modal.classList.add('translate-x-0');
                }, 10);
                const fallbackSettings = normalizeNotificationSettings(DEFAULT_NOTIFICATION_SETTINGS);
                applyNotificationSettingsToForm(fallbackSettings);
                setPushStatusText('알림 설정을 불러오는 중입니다...');
                try {
                    const settings = await withTimeout(
                        loadNotificationSettings(currentNotificationSettingsAudience, true),
                        10000,
                        '알림 설정 불러오기가 지연되고 있습니다.',
                    );
                    applyNotificationSettingsToForm(settings);
                    if (settings.push.enabled && settings.push.chat !== false) {
                        setPushStatusText('채팅 알림을 받는 상태입니다.');
                    } else if (settings.push.enabled && settings.push.notice !== false) {
                        setPushStatusText('공지/안내 알림을 받는 상태입니다.');
                    } else {
                        setPushStatusText('휴대폰 알림이 꺼져 있습니다.');
                    }
                } catch (e) {
                    console.error('알림 설정 모달 초기화 실패:', e);
                    setPushStatusText('알림 설정을 불러오지 못했습니다. 기본값으로 표시됩니다.', true);
                }
                if (currentNotificationSettingsAudience === 'partner') {
                    bindPartnerDashboardChatBadgeListener();
                } else {
                    startUserChatUnreadListener();
                }
                refreshNoticeUnreadBadges();
            }

            function closeNotificationSettingsModal() {
                const modal = document.getElementById('notification-settings-modal');
                if (!modal) return;
                modal.classList.remove('translate-x-0');
                modal.classList.add('translate-x-full');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            }

            async function saveNotificationSettings() {
                const audience = currentNotificationSettingsAudience === 'partner' ? 'partner' : 'user';
                const nextSettings = collectNotificationSettingsFromForm();
                const ref = await getNotificationRecipientRef(audience);
                if (!ref) {
                    showCustomToast('로그인 상태를 확인해주세요.');
                    return;
                }
                try {
                    await ref.set(
                        {
                            notificationSettings: nextSettings,
                            notificationSettingsUpdatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        },
                        { merge: true },
                    );
                    notificationSettingsCache[audience] = nextSettings;
                    if (nextSettings.push.enabled) {
                        await registerFcmTokenForAudience(audience);
                        await bindForegroundPushListener();
                    } else {
                        setPushStatusText('휴대폰 알림이 꺼져 있습니다.');
                    }
                    refreshNoticeUnreadBadges();
                    if (audience === 'partner') {
                        bindPartnerDashboardChatBadgeListener();
                    } else {
                        startUserChatUnreadListener();
                    }
                    showSuccessToast('알림 설정이 저장되었습니다.');
                    closeNotificationSettingsModal();
                } catch (e) {
                    console.error('알림 설정 저장 실패:', e);
                    showCustomToast('알림 설정 저장 중 오류가 발생했습니다.');
                }
            }

            async function requestPushPermissionNow() {
                if (typeof Notification === 'undefined') {
                    setPushStatusText('현재 브라우저에서는 휴대폰 알림 기능을 지원하지 않습니다.', true);
                    return;
                }
                try {
                    setPushStatusText('휴대폰 알림 연결을 준비 중입니다...');
                    const permission = await withTimeout(
                        Notification.requestPermission(),
                        10000,
                        '알림 권한 확인이 지연되고 있습니다.',
                    );
                    if (permission !== 'granted') {
                        setPushStatusText('휴대폰 알림 권한이 허용되지 않았습니다.', true);
                        return;
                    }
                    const audience = currentNotificationSettingsAudience === 'partner' ? 'partner' : 'user';
                    setPushStatusText('알림 설정을 적용하는 중입니다...');
                    const currentSettings = await withTimeout(
                        loadNotificationSettings(audience, true),
                        10000,
                        '알림 설정 조회가 지연되고 있습니다.',
                    );
                    const nextSettings = normalizeNotificationSettings({
                        ...currentSettings,
                        push: {
                            ...(currentSettings?.push || {}),
                            enabled: true,
                            // 둘 다 꺼져 있으면 버튼으로 켜는 순간 채팅 알림은 기본 활성화
                            chat:
                                (currentSettings?.push?.chat !== false) ||
                                (currentSettings?.push?.notice === false &&
                                    currentSettings?.push?.chat === false),
                            notice: currentSettings?.push?.notice !== false,
                        },
                    });
                    const ref = await withTimeout(
                        getNotificationRecipientRef(audience),
                        10000,
                        '사용자 정보 조회가 지연되고 있습니다.',
                    );
                    if (ref) {
                        await withTimeout(
                            ref.set(
                                {
                                    notificationSettings: nextSettings,
                                    notificationSettingsUpdatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                                },
                                { merge: true },
                            ),
                            10000,
                            '알림 설정 저장이 지연되고 있습니다.',
                        );
                    }
                    notificationSettingsCache[audience] = nextSettings;
                    applyNotificationSettingsToForm(nextSettings);
                    setPushStatusText('휴대폰 알림을 연결하는 중입니다...');
                    const token = await withTimeout(
                        registerFcmTokenForAudience(audience),
                        18000,
                        '휴대폰 알림 연결이 지연되고 있습니다.',
                    );
                    if (!token) {
                        // registerFcmTokenForAudience()에서 상세 실패 사유를 이미 표시함
                        return;
                    }
                    await withTimeout(
                        bindForegroundPushListener(),
                        5000,
                        '알림 리스너 설정이 지연되고 있습니다.',
                    );
                    setPushStatusText('휴대폰 알림이 켜졌습니다.');
                } catch (e) {
                    console.error('푸시 권한 요청 실패:', e);
                    setPushStatusText(`휴대폰 알림 권한 요청 실패: ${e?.message || 'unknown'}`, true);
                }
            }

            // 마이페이지 모달 처리 
            function openMyPageModal() {
                const myPageModal = document.getElementById('mypage-modal');
                myPageModal.style.display = 'flex';
                syncLoggedInUserProfileImageFromFirestore();
                loadNotificationSettings('user');
                resetUnreadTrackers('user');
                startNoticeRealtimeListener('user');
                startUserChatUnreadListener();
                refreshNoticeUnreadBadges();
                void myPageModal.offsetWidth; // force reflow
                setTimeout(() => {
                    myPageModal.classList.remove('translate-x-full');
                    myPageModal.classList.add('translate-x-0');
                }, 10);
            }

            async function handleUserProfileImageSelected(inputEl) {
                const file = inputEl?.files?.[0];
                if (!file) return;
                const lowerName = String(file.name || '').toLowerCase();
                const isImage =
                    lowerName.endsWith('.jpg') ||
                    lowerName.endsWith('.jpeg') ||
                    lowerName.endsWith('.png') ||
                    lowerName.endsWith('.webp');
                if (!isImage) {
                    showCustomToast('JPG/PNG/WEBP 이미지 파일만 업로드할 수 있습니다.');
                    if (inputEl) inputEl.value = '';
                    return;
                }
                if (Number(file.size || 0) > USER_PROFILE_MAX_SIZE) {
                    showCustomToast('프로필 이미지는 5MB 이하만 업로드할 수 있습니다.');
                    if (inputEl) inputEl.value = '';
                    return;
                }
                if (typeof firebase === 'undefined') {
                    showCustomToast('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.');
                    if (inputEl) inputEl.value = '';
                    return;
                }

                const userDocId = await ensureLoggedInUserDocId();
                if (!userDocId) {
                    showCustomToast('로그인 정보를 확인할 수 없습니다. 다시 로그인해주세요.');
                    if (inputEl) inputEl.value = '';
                    return;
                }

                try {
                    const ext = lowerName.split('.').pop() || 'jpg';
                    const path = `users_profile_avatars/${userDocId}/${Date.now()}.${ext}`;
                    const storageRef = firebase.storage().ref();
                    await storageRef.child(path).put(file);
                    const downloadUrl = await storageRef.child(path).getDownloadURL();

                    await firebase.firestore().collection('users').doc(userDocId).update({
                        profileImageUrl: downloadUrl,
                        photoURL: downloadUrl,
                        avatarUrl: downloadUrl,
                        image: downloadUrl,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    });

                    const threadsSnap = await firebase
                        .firestore()
                        .collection('chat_threads')
                        .where('participantUserDocId', '==', userDocId)
                        .get();
                    if (!threadsSnap.empty) {
                        const batch = firebase.firestore().batch();
                        threadsSnap.forEach((doc) => {
                            batch.set(
                                doc.ref,
                                {
                                    userImage: downloadUrl,
                                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                                },
                                { merge: true },
                            );
                        });
                        await batch.commit();
                    }

                    const userName =
                        localStorage.getItem('dadok_username') ||
                        sessionStorage.getItem('dadok_username') ||
                        '';
                    updateHeaderToLoggedInState(
                        userName,
                        resolveStoredCustomerGenderKey(),
                        downloadUrl,
                    );

                    const actorRole = getLoggedInPartnerDocId() ? 'partner' : 'user';
                    if (activeChatThreadMeta && actorRole === 'partner') {
                        activeChatThreadMeta = {
                            ...(activeChatThreadMeta || {}),
                            userImage: downloadUrl,
                        };
                        applyChatSheetHeader(actorRole);
                    }

                    showSuccessToast('프로필 사진이 변경되었습니다.');
                } catch (e) {
                    console.error('프로필 이미지 업로드 실패:', e);
                    showCustomToast('프로필 사진 변경 중 오류가 발생했습니다.');
                } finally {
                    if (inputEl) inputEl.value = '';
                }
            }

            window.handleUserProfileImageSelected = handleUserProfileImageSelected;

            function closeMyPageModal() {
                const myPageModal = document.getElementById('mypage-modal');
                myPageModal.classList.remove('translate-x-0');
                myPageModal.classList.add('translate-x-full');
                stopNoticeRealtimeListener('user');
                stopUserChatUnreadListener();
                resetUnreadTrackers('user');
                setTimeout(() => {
                    myPageModal.style.display = 'none';
                }, 300);
            }

            // 마이페이지 서브 모달 처리 로직
            async function bindRealtimeChatList() {
                if (typeof firebase === 'undefined') return;
                if (typeof unsubscribeChatList === 'function') {
                    unsubscribeChatList();
                    unsubscribeChatList = null;
                }

                const actor = await getCurrentChatActor();
                if (actor.role === 'partner' && actor.docId) {
                    unsubscribeChatList = firebase
                        .firestore()
                        .collection('chat_threads')
                        .where('participantPartnerDocId', '==', actor.docId)
                        .onSnapshot((snap) => {
                            chatListRows = snap.docs.map((doc) => ({ ...(doc.data() || {}), id: doc.id }));
                            chatListRows.sort((a, b) => {
                                const aMs = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
                                const bMs = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
                                return bMs - aMs;
                            });
                            renderChatList();
                            renderPartnerChatBadgeFromRows(chatListRows);
                        });
                    return;
                }

                if (actor.role === 'user' && actor.docId) {
                    let queryRows = [];
                    let adminThreadRow = null;
                    const renderMergedRows = () => {
                        const merged = [...queryRows];
                        if (adminThreadRow) {
                            const exists = merged.some((row) => String(row.id || '') === String(adminThreadRow.id || ''));
                            if (!exists) merged.push(adminThreadRow);
                        }
                        merged.sort((a, b) => {
                            const aMs = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
                            const bMs = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
                            return bMs - aMs;
                        });
                        chatListRows = merged;
                        renderChatList();
                    };

                    const queryUnsub = firebase
                        .firestore()
                        .collection('chat_threads')
                        .where('participantUserDocId', '==', actor.docId)
                        .onSnapshot((snap) => {
                            queryRows = snap.docs.map((doc) => ({ ...(doc.data() || {}), id: doc.id }));
                            renderMergedRows();
                        });

                    const adminThreadId = `admin__u_${actor.docId}`;
                    const adminDocUnsub = firebase
                        .firestore()
                        .collection('chat_threads')
                        .doc(adminThreadId)
                        .onSnapshot((doc) => {
                            adminThreadRow = doc.exists ? { ...(doc.data() || {}), id: doc.id } : null;
                            renderMergedRows();
                        });

                    unsubscribeChatList = () => {
                        if (typeof queryUnsub === 'function') queryUnsub();
                        if (typeof adminDocUnsub === 'function') adminDocUnsub();
                    };
                    return;
                }

                chatListRows = [];
                renderChatList();
            }

            async function openChatListModal() {
                const modal = document.getElementById('chat-list-modal');
                modal.style.display = 'flex';
                void modal.offsetWidth;
                setTimeout(() => {
                    modal.classList.remove('translate-x-full');
                    modal.classList.add('translate-x-0');
                }, 10);
                await bindRealtimeChatList();
            }

            function closeChatListModal() {
                const modal = document.getElementById('chat-list-modal');
                modal.classList.remove('translate-x-0');
                modal.classList.add('translate-x-full');
                if (typeof unsubscribeChatList === 'function') {
                    unsubscribeChatList();
                    unsubscribeChatList = null;
                }
                setTimeout(() => {
                    modal.style.display = 'none';
                    modal.classList.remove('z-[240]');
                    modal.classList.add('z-[220]');
                }, 300);
            }

            function renderChatList() {
                const container = document.getElementById('chat-list-container');
                if (!container) return;
                if (chatListRows.length === 0) {
                    container.innerHTML = `<div class="p-10 text-sm text-center w-full" style="color:var(--text-sub);">채팅 내역이 없습니다.<br>원하는 업체와 대화를 시작해보세요.</div>`;
                    return;
                }
                const actorRole = getLoggedInPartnerDocId() ? 'partner' : 'user';
                const showInAppUnread = isInAppChatEnabled(actorRole);
                let html = '<div class="space-y-4">';
                chatListRows.forEach(thread => {
                    const unread = getThreadUnreadCountForActor(thread, actorRole);
                    const displayName = escapeChatHtml(getThreadDisplayName(thread, actorRole));
                    const displayImage = getThreadDisplayImage(thread, actorRole);
                    const timeText = formatChatRelativeTime(thread.lastAt || thread.updatedAt);
                    const lastText = escapeChatHtml(thread.lastMessage || '대화가 아직 없습니다.');
                    html += `
                <div class="bg-[var(--surface-color)] p-4 rounded-xl border border-[var(--border-color)] flex items-center gap-4 cursor-pointer hover:bg-[var(--point-color)]/10 transition-colors" onclick="resumeChat('${thread.id}')">
                    <div class="w-12 h-12 rounded-full bg-cover bg-center shrink-0 border border-[var(--point-color)]/50" style="background-image: url('${displayImage}')"></div>
                    <div class="flex-1 overflow-hidden">
                        <div class="flex justify-between items-center mb-1">
                            <h4 class="text-white font-bold text-[15px]">${displayName}</h4>
                            <span class="text-[11px] text-[var(--text-sub)]">${timeText}</span>
                        </div>
                        <div class="flex items-center justify-between gap-2">
                            <p class="text-[13px] text-[var(--text-sub)] truncate">${lastText}</p>
                            ${showInAppUnread && unread > 0 ? `<span class="shrink-0 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">${unread}</span>` : ''}
                        </div>
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
                let shouldPersistFavorites = false;
                userFavorites.forEach(partner => {
                    const sourcePartner = [...DB_CHOICE, ...DB_RECOMMEND].find(
                        (p) => String(p?.id || '') === String(partner?.id || ''),
                    );
                    if (sourcePartner && Array.isArray(sourcePartner.regionList) && sourcePartner.regionList.length) {
                        const normalized = sourcePartner.regionList
                            .map((v) => String(v || '').trim())
                            .filter(Boolean);
                        const before = JSON.stringify(Array.isArray(partner.regionList) ? partner.regionList : []);
                        const after = JSON.stringify(normalized);
                        if (before !== after) {
                            partner.regionList = normalized;
                            if (!partner.region && normalized[0]) partner.region = normalized[0];
                            shouldPersistFavorites = true;
                        }
                    }
                    const regionList = Array.isArray(partner.regionList)
                        ? partner.regionList.map((v) => String(v || '').trim()).filter(Boolean)
                        : [];
                    let region = regionList.length ? regionList.join(', ') : String(partner.region || '').trim();
                    const rb = getPartnerProfileReviewBaselines(partner);
                    html += `
                <div class="bg-[var(--surface-color)] p-4 rounded-xl border border-[var(--border-color)] flex gap-4 cursor-pointer hover:border-[var(--point-color)]/50 transition-colors" onclick="openProfileFromFavorites('${partner.name}', '${partner.desc}', '${partner.id}', ${rb.reviews}, ${rb.rating}, '${partner.massage}', '${partner.place}', '${partner.age}', '${partner.image}', '${partner.ticketType || '일반 입점'}', '${partner.ticketExpiry || ''}')">
                    <div class="w-[120px] h-[120px] rounded-lg bg-cover bg-center shrink-0 shadow-sm" style="background-image: url('${partner.image}')"></div>
                    <div class="flex-1 flex flex-col justify-center overflow-hidden">
                        <div class="flex justify-between items-start mb-1.5">
                            <h4 class="text-white font-bold text-lg leading-tight truncate mr-2">${partner.name}</h4>
                            <svg class="w-5 h-5 text-[var(--point-color)] shrink-0 drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]" fill="currentColor" viewBox="0 0 24 24" onclick="event.stopPropagation(); removeFavorite('${partner.id}')"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                        </div>
                        <p class="text-[13px] text-[var(--point-color)] font-medium mb-1 truncate">${partner.age}</p>
                        <p class="text-[12px] text-[var(--text-sub)] truncate">${region}</p>
                    </div>
                </div>
            `;
                });
                html += '</div>';
                container.innerHTML = html;
                if (shouldPersistFavorites) persistUserFavorites();
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

            function getNoticeAttachmentExt(name = '') {
                const raw = String(name || '').trim().toLowerCase();
                const dot = raw.lastIndexOf('.');
                if (dot <= -1 || dot >= raw.length - 1) return '';
                return raw.slice(dot + 1);
            }

            function renderNoticeAttachmentInline(att = {}, idx = 0) {
                const fileName = escapeNoticeText(att?.name || `첨부파일 ${idx + 1}`);
                const fileUrl = escapeNoticeText(att?.url || '#');
                const ext = getNoticeAttachmentExt(att?.name || '');
                const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
                if (imageExts.includes(ext)) {
                    return `
                        <div class="mt-2 rounded-xl border border-[#2A3731] bg-[#06110D] overflow-hidden">
                            <img src="${fileUrl}" alt="${fileName}" class="w-full h-auto max-h-[260px] object-contain bg-[#020806]">
                        </div>
                    `;
                }
                if (ext === 'pdf') {
                    return `
                        <div class="mt-2 rounded-xl border border-[#2A3731] bg-[#06110D] overflow-hidden">
                            <iframe src="${fileUrl}" class="w-full h-[300px] bg-white" loading="lazy"></iframe>
                            <div class="px-3 py-2 text-[11px] text-[#A7B2AE] truncate">${fileName}</div>
                        </div>
                    `;
                }
                return `
                    <div class="mt-2 px-3 py-2 rounded-lg border border-[#2A3731] bg-[#06110D] text-[11px] text-[#C8D1CD]">
                        첨부파일: ${fileName}
                    </div>
                `;
            }

            let currentNoticeAudience = 'user';
            let currentNoticeRecipient = { type: '', docId: '' };
            let currentNoticeRows = [];
            const noticeRealtimeUnsubs = { user: null, partner: null };
            const noticeRealtimeTargets = { user: '', partner: '' };
            const noticeRealtimeRows = { user: [], partner: [] };

            function sortNoticeRows(rows = []) {
                const getTs = (x) => {
                    if (x?.createdAt && typeof x.createdAt.toMillis === 'function') return x.createdAt.toMillis();
                    return 0;
                };
                return [...rows].sort((a, b) => getTs(b) - getTs(a));
            }

            function renderNoticeRowsToContainer(rows = []) {
                const container = document.getElementById('notice-list-container');
                if (!container) return;
                if (!rows.length) {
                    container.innerHTML =
                        '<div class="text-[var(--text-sub)] text-sm p-4">도착한 관리자 알림이 없습니다.</div>';
                    return;
                }
                let html = '<div class="space-y-3">';
                rows.forEach((row) => {
                    const priorityBadge =
                        row.priority === 'important'
                            ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">중요</span>'
                            : '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#11291D] text-[var(--point-color)] border border-[#2A3731]">일반</span>';
                    const unreadDot = row.isRead
                        ? ''
                        : '<span class="inline-flex w-2.5 h-2.5 rounded-full bg-red-400"></span>';
                    const linkBtn =
                        row.linkType && row.linkType !== 'none'
                            ? `<button onclick="openNoticeLinkedScreen('${row.id}', '${row.linkType}')" class="px-2 py-1 text-[10px] font-bold rounded-lg border border-[#2A3731] text-white hover:border-[var(--point-color)] hover:text-[var(--point-color)] transition-colors">관련 화면 이동</button>`
                            : '';
                    const readBtn = row.isRead
                        ? '<span class="text-[10px] text-[#6C7A74]">읽음</span>'
                        : `<button onclick="markNoticeAsRead('${row.id}')" class="px-2 py-1 text-[10px] font-bold rounded-lg border border-[var(--point-color)]/40 text-[var(--point-color)] hover:bg-[var(--point-color)]/15 transition-colors">읽음 처리</button>`;
                    const attachments = Array.isArray(row.attachments) ? row.attachments : [];
                    const attachmentsHtml = attachments.length
                        ? `<div class="mt-2">${attachments
                              .map((att, idx) => renderNoticeAttachmentInline(att, idx))
                              .join('')}</div>`
                        : '';
                    html += `
                        <div class="bg-[#0A1B13] border ${row.isRead ? 'border-[#2A3731]' : 'border-[var(--point-color)]/35'} rounded-2xl p-4">
                            <div class="flex items-start justify-between gap-2 mb-2">
                                <div class="flex items-center gap-2 text-white font-bold text-[15px]">${unreadDot}${escapeNoticeText(row.title || '(제목 없음)')}</div>
                                <div class="flex items-center gap-2">${priorityBadge}${readBtn}${linkBtn}</div>
                            </div>
                            <div class="text-[11px] text-[var(--text-sub)] mb-2">${escapeNoticeText(row.category || 'notice')} · ${formatNoticeDate(row.createdAt)} · ${escapeNoticeText(row.linkLabel || '이동 없음')}</div>
                            <p class="text-[13px] text-white/85 leading-relaxed whitespace-pre-wrap">${escapeNoticeText(row.body || '')}</p>
                            ${attachmentsHtml}
                        </div>
                    `;
                });
                html += '</div>';
                container.innerHTML = html;
            }

            function stopNoticeRealtimeListener(audience = 'user') {
                if (typeof noticeRealtimeUnsubs[audience] === 'function') {
                    noticeRealtimeUnsubs[audience]();
                }
                noticeRealtimeUnsubs[audience] = null;
                noticeRealtimeTargets[audience] = '';
            }

            async function startNoticeRealtimeListener(audience = 'user', target = null) {
                if (typeof firebase === 'undefined') return;
                const resolvedTarget = target || (await resolveNotificationRecipient(audience));
                const nextKey = resolvedTarget?.docId
                    ? `${resolvedTarget.type}:${resolvedTarget.docId}`
                    : '';
                if (!nextKey) {
                    stopNoticeRealtimeListener(audience);
                    noticeRealtimeRows[audience] = [];
                    refreshNoticeUnreadBadges();
                    return;
                }
                if (
                    noticeRealtimeTargets[audience] === nextKey &&
                    typeof noticeRealtimeUnsubs[audience] === 'function'
                ) {
                    return;
                }
                stopNoticeRealtimeListener(audience);
                noticeRealtimeTargets[audience] = nextKey;
                noticeRealtimeUnsubs[audience] = firebase
                    .firestore()
                    .collection('user_notifications')
                    .where('recipientType', '==', resolvedTarget.type)
                    .where('recipientDocId', '==', resolvedTarget.docId)
                    .onSnapshot(
                        (snap) => {
                            const rows = [];
                            snap.forEach((doc) => rows.push({ id: doc.id, ...doc.data() }));
                            const sortedRows = sortNoticeRows(rows);
                            noticeRealtimeRows[audience] = sortedRows;
                            maybeShowIncomingNoticeToast(sortedRows, audience);
                            if (currentNoticeAudience === audience) {
                                currentNoticeRows = sortedRows;
                                renderNoticeRowsToContainer(sortedRows);
                            }
                            refreshNoticeUnreadBadges();
                        },
                        (err) => {
                            console.error('알림 실시간 동기화 실패:', err);
                        },
                    );
            }

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
                        noticeRealtimeRows[audience] = [];
                        container.innerHTML = '<div class="text-[var(--text-sub)] text-sm">수신자 정보를 찾을 수 없습니다.</div>';
                        return;
                    }
                    await startNoticeRealtimeListener(audience, target);

                    const snap = await firebase.firestore().collection('user_notifications')
                        .where('recipientType', '==', target.type)
                        .where('recipientDocId', '==', target.docId)
                        .get();

                    const rows = [];
                    snap.forEach((doc) => rows.push({ id: doc.id, ...doc.data() }));
                    const sortedRows = sortNoticeRows(rows);

                    if (!sortedRows.length) {
                        currentNoticeRows = [];
                        noticeRealtimeRows[audience] = [];
                        refreshNoticeUnreadBadges();
                        renderNoticeRowsToContainer([]);
                        return;
                    }

                    currentNoticeRows = sortedRows;
                    noticeRealtimeRows[audience] = sortedRows;
                    refreshNoticeUnreadBadges();
                    renderNoticeRowsToContainer(sortedRows);
                } catch (e) {
                    console.error('알림함 로드 실패:', e);
                    container.innerHTML = `<div class="text-[#F87171] text-sm p-4">알림 로드 실패: ${escapeNoticeText(e.message || 'Unknown error')}</div>`;
                }
            }

            async function refreshNoticeUnreadBadges() {
                const userBadge = document.getElementById('user-notice-unread-badge');
                const partnerBadge = document.getElementById('partner-notice-unread-badge');
                const setNoticeBadge = (el, count) => {
                    if (!el) return;
                    if (el.id === 'user-notice-unread-badge' && !isInAppNoticeEnabled('user')) {
                        el.classList.add('hidden');
                        return;
                    }
                    if (el.id === 'partner-notice-unread-badge' && !isInAppNoticeEnabled('partner')) {
                        el.classList.add('hidden');
                        return;
                    }
                    const safeCount = Number(count || 0);
                    el.innerText = `새 공지 ${safeCount}건`;
                    el.classList.toggle('hidden', safeCount === 0);
                };

                if (currentNoticeRows.length > 0 && currentNoticeAudience) {
                    const unread = currentNoticeRows.filter((r) => !r.isRead).length;
                    const targetBadge = currentNoticeAudience === 'partner' ? partnerBadge : userBadge;
                    setNoticeBadge(targetBadge, unread);
                }

                const hasUserRealtime = typeof noticeRealtimeUnsubs.user === 'function';
                const hasPartnerRealtime = typeof noticeRealtimeUnsubs.partner === 'function';
                if (hasUserRealtime) {
                    setNoticeBadge(
                        userBadge,
                        (noticeRealtimeRows.user || []).filter((r) => !r.isRead).length,
                    );
                }
                if (hasPartnerRealtime) {
                    setNoticeBadge(
                        partnerBadge,
                        (noticeRealtimeRows.partner || []).filter((r) => !r.isRead).length,
                    );
                }

                if ((hasUserRealtime && hasPartnerRealtime) || typeof firebase === 'undefined') return;
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
                    const [userUnread, partnerUnread] = await Promise.all([
                        hasUserRealtime ? Promise.resolve((noticeRealtimeRows.user || []).filter((r) => !r.isRead).length) : loadUnread(userTarget),
                        hasPartnerRealtime ? Promise.resolve((noticeRealtimeRows.partner || []).filter((r) => !r.isRead).length) : loadUnread(partnerTarget)
                    ]);
                    if (!hasUserRealtime) setNoticeBadge(userBadge, userUnread);
                    if (!hasPartnerRealtime) setNoticeBadge(partnerBadge, partnerUnread);
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
                if (titleEl) titleEl.innerText = audience === 'partner' ? '업체 공지/안내함' : '회원 공지/안내함';
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

            // 공지함을 전용 페이지처럼 여는 진입점 (기존 모달 로직 재사용)
            function openNoticePage(audience = 'user') {
                openNoticeModal(audience);
            }

            function closeNoticePage() {
                closeNoticeModal();
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
                const auth = getAuthInstance();
                if (auth?.currentUser) {
                    auth.signOut().catch((e) => console.error('로그아웃(signOut) 실패:', e));
                }
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

                const myPageProfileImg = document.getElementById('mypage-profile-img');
                const myPageFallback = document.getElementById('mypage-profile-fallback');
                if (myPageProfileImg) {
                    myPageProfileImg.style.backgroundImage = '';
                }
                if (myPageFallback) {
                    myPageFallback.style.display = 'flex';
                }

                // 로그인 상태 초기화
                localStorage.removeItem('dadok_isLoggedIn');
                localStorage.removeItem('dadok_username');
                localStorage.removeItem('dadok_loggedInUserDocId');
                sessionStorage.removeItem('dadok_isLoggedIn');
                sessionStorage.removeItem('dadok_username');
                sessionStorage.removeItem('dadok_loggedInUserDocId');
                localStorage.removeItem(DADOK_USER_GENDER_STORAGE_KEY);
                sessionStorage.removeItem(DADOK_USER_GENDER_STORAGE_KEY);
                localStorage.removeItem(DADOK_USER_PROFILE_IMAGE_STORAGE_KEY);
                sessionStorage.removeItem(DADOK_USER_PROFILE_IMAGE_STORAGE_KEY);
                currentUserProfileImageUrl = '';
                stopUserChatUnreadListener();
                renderUserChatUnreadBadgeFromRows([]);
                loadUserFavorites();
            }

            function scrollMainAppToTop() {
                window.scrollTo({ top: 0, behavior: 'auto' });
                document.documentElement.scrollTop = 0;
                document.body.scrollTop = 0;
                const appContainer = document.getElementById('app-container');
                if (appContainer) appContainer.scrollTop = 0;
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
                if (typeof closeNotificationSettingsModal === 'function') closeNotificationSettingsModal();
                if (typeof closeFavoritesModal === 'function') closeFavoritesModal();
                if (typeof closeChatListModal === 'function') closeChatListModal();
                if (typeof closeNoticeModal === 'function') closeNoticeModal();
                if (typeof closeLoginModal === 'function') closeLoginModal();
                if (typeof closeLoginFormModal === 'function') closeLoginFormModal();
                if (typeof closeFindIdPwScreen === 'function') closeFindIdPwScreen();
                if (typeof closeSignupModal === 'function') closeSignupModal();
                if (typeof resetUserLoginFormFields === 'function') resetUserLoginFormFields();
                if (typeof resetPartnerLoginFormFields === 'function') resetPartnerLoginFormFields();
                if (typeof resetSupportDraftFields === 'function') resetSupportDraftFields();

                document.getElementById('overlay').classList.remove('show');
                document.body.style.overflow = 'auto'; // 스크롤 활성화

                // 모든 검색 조건 및 필터 초기화
                if (typeof resetAllFiltersFast === 'function') resetAllFiltersFast();
                document.getElementById('filter-options-container').classList.add('hidden');

                scrollMainAppToTop();
            }

            // 페이지 로드 시 로그인 상태 복원
            function checkLoginState() {
                isLoggedIn = false;
                isPartnerLoggedIn = false;
                const auth = getAuthInstance();
                const authReady = Boolean(auth && auth.currentUser);
                const partnerLoggedInPersisted =
                    localStorage.getItem('dadok_isPartnerLoggedIn') === 'true' ||
                    sessionStorage.getItem('dadok_isPartnerLoggedIn') === 'true';
                const userLoggedInPersisted =
                    localStorage.getItem('dadok_isLoggedIn') === 'true' ||
                    sessionStorage.getItem('dadok_isLoggedIn') === 'true';

                if (!authReady && (partnerLoggedInPersisted || userLoggedInPersisted)) {
                    localStorage.removeItem('dadok_isLoggedIn');
                    localStorage.removeItem('dadok_username');
                    localStorage.removeItem('dadok_loggedInUserDocId');
                    sessionStorage.removeItem('dadok_isLoggedIn');
                    sessionStorage.removeItem('dadok_username');
                    sessionStorage.removeItem('dadok_loggedInUserDocId');
                    localStorage.removeItem('dadok_isPartnerLoggedIn');
                    localStorage.removeItem('dadok_loggedInPartnerDocId');
                    localStorage.removeItem('dadok_loggedInPartnerUserId');
                    sessionStorage.removeItem('dadok_isPartnerLoggedIn');
                    sessionStorage.removeItem('dadok_loggedInPartnerDocId');
                    sessionStorage.removeItem('dadok_loggedInPartnerUserId');
                }

                // 과거 버전에서 남은 동시 로그인 잔존값 정리
                if (partnerLoggedInPersisted && userLoggedInPersisted) {
                    const partnerDocId =
                        localStorage.getItem('dadok_loggedInPartnerDocId') ||
                        sessionStorage.getItem('dadok_loggedInPartnerDocId') ||
                        '';
                    const partnerUserId =
                        localStorage.getItem('dadok_loggedInPartnerUserId') ||
                        sessionStorage.getItem('dadok_loggedInPartnerUserId') ||
                        '';

                    if (partnerDocId || partnerUserId) {
                        localStorage.removeItem('dadok_isLoggedIn');
                        localStorage.removeItem('dadok_username');
                        localStorage.removeItem('dadok_loggedInUserDocId');
                        sessionStorage.removeItem('dadok_isLoggedIn');
                        sessionStorage.removeItem('dadok_username');
                        sessionStorage.removeItem('dadok_loggedInUserDocId');
                    } else {
                        localStorage.removeItem('dadok_isPartnerLoggedIn');
                        localStorage.removeItem('dadok_loggedInPartnerDocId');
                        localStorage.removeItem('dadok_loggedInPartnerUserId');
                        sessionStorage.removeItem('dadok_isPartnerLoggedIn');
                        sessionStorage.removeItem('dadok_loggedInPartnerDocId');
                        sessionStorage.removeItem('dadok_loggedInPartnerUserId');
                    }
                }

                if (authReady && (localStorage.getItem('dadok_isPartnerLoggedIn') === 'true' || sessionStorage.getItem('dadok_isPartnerLoggedIn') === 'true')) {
                    isPartnerLoggedIn = true;
                    loadNotificationSettings('partner').then((settings) => {
                        if (settings.push.enabled) {
                            bindForegroundPushListener();
                        }
                    });
                }
                if (authReady && localStorage.getItem('dadok_isLoggedIn') === 'true') {
                    isLoggedIn = true;
                    updateHeaderToLoggedInState(localStorage.getItem('dadok_username') || 'test');
                    syncLoggedInUserProfileImageFromFirestore();
                    loadNotificationSettings('user').then((settings) => {
                        if (settings.push.enabled) {
                            bindForegroundPushListener();
                        }
                    });
                } else if (authReady && sessionStorage.getItem('dadok_isLoggedIn') === 'true') {
                    isLoggedIn = true;
                    updateHeaderToLoggedInState(sessionStorage.getItem('dadok_username') || 'test');
                    syncLoggedInUserProfileImageFromFirestore();
                    loadNotificationSettings('user').then((settings) => {
                        if (settings.push.enabled) {
                            bindForegroundPushListener();
                        }
                    });
                }
                loadUserFavorites();
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
                window.partnerCustomReviews = {};
                window.partnerMockReviews = {};
                const auth = getAuthInstance();
                if (auth) {
                    auth.onAuthStateChanged(() => {
                        checkLoginState();
                    });
                } else {
                    checkLoginState();
                }
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
                if (!currentPartner || !String(currentPartner.id || '').trim()) {
                    showCustomToast("파트너 정보가 없습니다.");
                    return;
                }
                const profileSheet = document.getElementById('profile-sheet');
                const overlay = document.getElementById('overlay');
                const ctaBtn = document.getElementById('cta-button');
                if (profileSheet) profileSheet.style.zIndex = '250';
                if (overlay) overlay.style.zIndex = '240';
                if (ctaBtn) ctaBtn.style.zIndex = '260';

                // 메인 배너/목록과 동일한 인자 규칙 — 리뷰 수·평점은 openProfile 내부에서 본인 업체 집계 갱신 후 단일 계산
                const p = currentPartner;
                const rndRegion = pickBannerRegion(p);
                const rndPlace = pickBannerPlace(p);
                const rndMassage = pickBannerMassage(p);
                const rndAge = pickBannerAge(p);
                const descLine = `${rndRegion} · ${rndPlace}`;
                await openProfile(
                    p.name,
                    descLine,
                    p.id,
                    0,
                    0,
                    rndMassage,
                    rndPlace,
                    rndAge,
                    p.image || '',
                    p.ticketType || '일반 입점',
                    p.ticketExpiry || '',
                    true,
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

                    bindRealtimeChatList();
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

            function syncPartnerInMemoryAfterReviewUpdate(partnerId, n, avg) {
                const pid = String(partnerId || '');
                const patch = (arr) => {
                    const ix = arr.findIndex((x) => String(x.id) === pid);
                    if (ix < 0) return;
                    arr[ix].reviews = n;
                    arr[ix].rating = avg;
                    if (!arr[ix].stats) arr[ix].stats = {};
                    arr[ix].stats.totalReviews = n;
                };
                patch(DB_CHOICE);
                patch(DB_RECOMMEND);
                if (currentPartner && String(currentPartner.id) === pid) {
                    currentPartner.reviews = n;
                    currentPartner.rating = avg;
                    if (!currentPartner.stats) currentPartner.stats = {};
                    currentPartner.stats.totalReviews = n;
                }
            }

            function applyVisitorReviewAggregatesToProfileUI(partnerId, n, avg) {
                const pid = String(partnerId || '');
                if (!currentPartner || String(currentPartner.id) !== pid) return;
                const rEl = document.getElementById('profile-rating-display');
                const tEl = document.getElementById('profile-review-display');
                if (rEl) rEl.innerText = n > 0 ? Number(avg).toFixed(1) : '0.0';
                if (tEl) tEl.innerText = `방문자 찐리뷰 ${n}개 확인하기`;
                window.currentProfileReviews = n;
                window.currentProfileRating = avg;
                document.querySelectorAll(`.partner-rating-badge[data-partner-id="${pid}"]`).forEach((b) => {
                    b.innerText = n > 0 ? Number(avg).toFixed(1) : '0.0';
                });
                document.querySelectorAll(`.partner-reviews-badge[data-partner-id="${pid}"]`).forEach((b) => {
                    b.innerText = String(n);
                });
            }

            function refreshReviewSheetFromLiveSnapshot(querySnapshot) {
                const rs = document.getElementById('review-sheet');
                if (!rs || !rs.classList.contains('open') || !currentPartner) return;
                const partnerKey = String(currentPartner.id);
                let loadedRows = [];
                querySnapshot.forEach((doc) => loadedRows.push({ id: doc.id, ...doc.data() }));
                loadedRows = loadedRows
                    .filter((r) => (r.status || 'published') === 'published')
                    .sort((a, b) => {
                        const ta = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
                        const tb = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
                        return tb - ta;
                    });
                const listEl = document.getElementById('review-list-container');
                if (!listEl) return;
                listEl.innerHTML = buildVisitorReviewListInnerHtml(loadedRows, getVisitorReviewStarPath());
                let sumLive = 0;
                let nLive = 0;
                loadedRows.forEach((r) => {
                    const rv = Number(r.rating);
                    if (!Number.isFinite(rv)) return;
                    sumLive += rv;
                    nLive++;
                });
                const liveAvg = nLive ? Math.round((sumLive / nLive) * 10) / 10 : 0;
                const rd = document.getElementById('review-sheet-rating-display');
                const cd = document.getElementById('review-sheet-count-display');
                if (rd) rd.innerText = nLive > 0 ? liveAvg.toFixed(1) : '0.0';
                if (cd) cd.innerText = String(nLive);
                syncPartnerInMemoryAfterReviewUpdate(partnerKey, nLive, liveAvg);
                applyVisitorReviewAggregatesToProfileUI(partnerKey, nLive, liveAvg);
                if (typeof applyFiltersToData === 'function') applyFiltersToData();
            }

            function applyPartnerDocLiveSnapshot(data, partnerId) {
                const pid = String(partnerId || '');
                const d = data || {};
                const st = d.stats || {};
                let n = Number(d.reviews);
                if (!Number.isFinite(n) || n < 0) n = 0;
                const stTr = Number(st.totalReviews);
                if (Number.isFinite(stTr) && stTr >= 0) n = Math.max(n, stTr);
                if (
                    typeof getLoggedInPartnerDocId === 'function' &&
                    pid === String(getLoggedInPartnerDocId()) &&
                    typeof window.partnerDashboardStats !== 'undefined'
                ) {
                    const dsh = Number(window.partnerDashboardStats.totalReviews);
                    if (Number.isFinite(dsh) && dsh >= 0) n = Math.max(n, dsh);
                }
                let avg = parseFloat(d.rating);
                if (!Number.isFinite(avg)) avg = 0;
                if (n <= 0) avg = 0;
                syncPartnerInMemoryAfterReviewUpdate(pid, n, avg);
                applyVisitorReviewAggregatesToProfileUI(pid, n, avg);

                const menusFromDoc = normalizePartnerMenusFromDoc(d);
                if (currentPartner && String(currentPartner.id) === pid) {
                    currentPartner.menus = menusFromDoc;
                    if (d.name != null && String(d.name).trim() !== '') currentPartner.name = d.name;
                    if (d.massage != null) currentPartner.massage = d.massage;
                    if (d.place != null) currentPartner.place = d.place;
                    if (d.age != null) currentPartner.age = d.age;
                    if (Array.isArray(d.regionList)) currentPartner.regionList = d.regionList;
                    if (d.region != null) currentPartner.region = d.region;
                    if (Array.isArray(d.tags)) currentPartner.tags = d.tags;
                    if (d.hours != null) currentPartner.hours = d.hours;
                    if (d.businessHours != null) currentPartner.businessHours = d.businessHours;
                    if (d.operatingHours != null) currentPartner.operatingHours = d.operatingHours;
                    if (typeof d.callEnabled === 'boolean') currentPartner.callEnabled = d.callEnabled;
                    if (d.callAvailableStart != null) currentPartner.callAvailableStart = d.callAvailableStart;
                    if (d.callAvailableEnd != null) currentPartner.callAvailableEnd = d.callAvailableEnd;
                    if (d.callAvailableHours != null) currentPartner.callAvailableHours = d.callAvailableHours;
                    if (d.phoneNumber != null) currentPartner.phoneNumber = d.phoneNumber;
                    if (d.phone != null) currentPartner.phone = d.phone;
                    if (d.contact != null) currentPartner.contact = d.contact;
                    if (d.imageThumb != null) currentPartner.imageThumb = d.imageThumb;
                    if (d.imageDetail != null) currentPartner.imageDetail = d.imageDetail;
                    if (d.image != null) currentPartner.image = d.image;
                    if (d.ticketType != null) currentPartner.ticketType = d.ticketType;
                    if (d.ticketExpiry != null) currentPartner.ticketExpiry = d.ticketExpiry;
                    if (d.ticketExpiryTimestamp != null) currentPartner.ticketExpiryTimestamp = d.ticketExpiryTimestamp;
                    const descLine =
                        d.catchphrase != null
                            ? d.catchphrase
                            : d.description != null
                              ? d.description
                              : d.desc;
                    if (descLine != null && String(descLine).trim() !== '') {
                        currentPartner.desc = descLine;
                        currentPartner.catchphrase = descLine;
                    }
                    if (d.parkingInfo != null) currentPartner.parkingInfo = d.parkingInfo;
                    if (d.location != null) currentPartner.location = d.location;
                    if (d.address != null) currentPartner.address = d.address;
                }

                const patchMenusInList = (arr) => {
                    const ix = arr.findIndex((x) => String(x.id) === pid);
                    if (ix < 0) return;
                    arr[ix] = {
                        ...arr[ix],
                        menus: menusFromDoc,
                        massage: d.massage != null ? d.massage : arr[ix].massage,
                        place: d.place != null ? d.place : arr[ix].place,
                        age: d.age != null ? d.age : arr[ix].age,
                        tags: Array.isArray(d.tags) ? d.tags : arr[ix].tags,
                        region: d.region != null ? d.region : arr[ix].region,
                        regionList: Array.isArray(d.regionList) ? d.regionList : arr[ix].regionList,
                        hours: d.hours != null ? d.hours : arr[ix].hours,
                        businessHours: d.businessHours != null ? d.businessHours : arr[ix].businessHours,
                        operatingHours: d.operatingHours != null ? d.operatingHours : arr[ix].operatingHours,
                        callEnabled: typeof d.callEnabled === 'boolean' ? d.callEnabled : arr[ix].callEnabled,
                        callAvailableStart:
                            d.callAvailableStart != null ? d.callAvailableStart : arr[ix].callAvailableStart,
                        callAvailableEnd: d.callAvailableEnd != null ? d.callAvailableEnd : arr[ix].callAvailableEnd,
                        callAvailableHours:
                            d.callAvailableHours != null ? d.callAvailableHours : arr[ix].callAvailableHours,
                        phoneNumber: d.phoneNumber != null ? d.phoneNumber : arr[ix].phoneNumber,
                        phone: d.phone != null ? d.phone : arr[ix].phone,
                        contact: d.contact != null ? d.contact : arr[ix].contact,
                        imageThumb: d.imageThumb != null ? d.imageThumb : arr[ix].imageThumb,
                        imageDetail: d.imageDetail != null ? d.imageDetail : arr[ix].imageDetail,
                        image: d.image != null ? d.image : arr[ix].image,
                        ticketType: d.ticketType != null ? d.ticketType : arr[ix].ticketType,
                        ticketExpiry: d.ticketExpiry != null ? d.ticketExpiry : arr[ix].ticketExpiry,
                        ticketExpiryTimestamp:
                            d.ticketExpiryTimestamp != null
                                ? d.ticketExpiryTimestamp
                                : arr[ix].ticketExpiryTimestamp,
                    };
                };
                patchMenusInList(DB_CHOICE);
                patchMenusInList(DB_RECOMMEND);

                const profileSheet = document.getElementById('profile-sheet');
                if (
                    profileSheet &&
                    profileSheet.classList.contains('open') &&
                    currentPartner &&
                    String(currentPartner.id) === pid
                ) {
                    renderProfilePriceTableFromPartner(currentPartner);
                    renderProfileCategorySummaryTable(currentPartner);
                    const pn = document.getElementById('profile-name');
                    if (pn && d.name != null && String(d.name).trim() !== '') pn.innerText = d.name;
                    const profileHoursText = document.getElementById('profile-hours-text');
                    const profileCallPolicyText = document.getElementById('profile-call-policy-text');
                    const operatingHours =
                        currentPartner.hours ||
                        currentPartner.businessHours ||
                        currentPartner.operatingHours ||
                        '정보 없음';
                    const callEnabled =
                        typeof currentPartner.callEnabled === 'boolean' ? currentPartner.callEnabled : true;
                    const startHour = currentPartner.callAvailableStart || '';
                    const endHour = currentPartner.callAvailableEnd || '';
                    const callHours =
                        (startHour && endHour ? `${startHour} ~ ${endHour}` : '') ||
                        currentPartner.callAvailableHours ||
                        currentPartner.callHours ||
                        '미설정';
                    if (profileHoursText) {
                        profileHoursText.innerHTML = `${escapeChatHtml(operatingHours)}<br><span class="text-xs text-[var(--text-sub)] mt-1 block opacity-80">(변동 가능)</span>`;
                    }
                    if (profileCallPolicyText) {
                        profileCallPolicyText.innerHTML = `통화 가능: ${callEnabled ? '활성화' : '비활성화'}<br><span class="text-xs text-[var(--text-sub)] mt-1 block opacity-80">통화 가능 시간: ${escapeChatHtml(callHours)}</span>`;
                    }
                    updateProfileLocationParkingRows(currentPartner);
                    updateProfileIntroDetailText(currentPartner);
                }

                const rs = document.getElementById('review-sheet');
                if (rs && rs.classList.contains('open')) {
                    const rd = document.getElementById('review-sheet-rating-display');
                    const cd = document.getElementById('review-sheet-count-display');
                    if (rd) rd.innerText = n > 0 ? avg.toFixed(1) : '0.0';
                    if (cd) cd.innerText = String(n);
                }
                if (typeof applyFiltersToData === 'function') applyFiltersToData();
            }

            function startLivePartnerDocListener(partnerId) {
                stopLivePartnerDocListener();
                const pid = String(partnerId || '').trim();
                if (!pid || pid === 'my-partner' || typeof firebase === 'undefined') return;
                livePartnerDocUnsub = firebase
                    .firestore()
                    .collection('partners')
                    .doc(pid)
                    .onSnapshot(
                        (snap) => {
                            if (!snap.exists) return;
                            applyPartnerDocLiveSnapshot(snap.data() || {}, pid);
                        },
                        (err) => console.error('파트너 문서 실시간 동기화 오류', err),
                    );
            }

            function startLivePartnerReviewsQueryListener(partnerId) {
                stopLivePartnerReviewsQueryListener();
                const pid = String(partnerId || '').trim();
                if (!pid || pid === 'my-partner' || typeof firebase === 'undefined') return;
                livePartnerReviewsQueryUnsub = firebase
                    .firestore()
                    .collection('partner_reviews')
                    .where('partnerId', '==', pid)
                    .onSnapshot(
                        (snap) => {
                            if (liveReviewSheetRefreshTimer) clearTimeout(liveReviewSheetRefreshTimer);
                            liveReviewSheetRefreshTimer = setTimeout(() => {
                                refreshReviewSheetFromLiveSnapshot(snap);
                                liveReviewSheetRefreshTimer = null;
                            }, 80);
                        },
                        (err) => console.error('찐리뷰 쿼리 실시간 동기화 오류', err),
                    );
            }

            async function recomputePartnerReviewAggregates(partnerId) {
                const pid = String(partnerId || '').trim();
                if (!pid || pid === 'my-partner' || typeof firebase === 'undefined') return;
                try {
                    const db = firebase.firestore();
                    const snap = await db.collection('partner_reviews').where('partnerId', '==', pid).get();
                    let sum = 0;
                    let n = 0;
                    snap.forEach((doc) => {
                        const d = doc.data() || {};
                        if ((d.status || 'published') !== 'published') return;
                        const rv = Number(d.rating);
                        if (!Number.isFinite(rv)) return;
                        sum += rv;
                        n++;
                    });
                    const avg = n ? Math.round((sum / n) * 10) / 10 : 0;
                    const partnerRef = db.collection('partners').doc(pid);
                    const existing = await partnerRef.get();
                    const prev = existing.exists ? existing.data() : {};
                    const prevStats = normalizeDashboardStats(prev.stats || {});
                    await partnerRef.set(
                        {
                            reviews: n,
                            rating: avg,
                            stats: { ...prevStats, totalReviews: n },
                            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        },
                        { merge: true },
                    );
                    syncPartnerInMemoryAfterReviewUpdate(pid, n, avg);
                    applyVisitorReviewAggregatesToProfileUI(pid, n, avg);
                } catch (e) {
                    console.error('리뷰 집계 반영 실패', e);
                }
            }

            async function persistPartnerReview(partnerId, rating, text, authorMaskedId) {
                const cleanPartnerId = String(partnerId || '').trim();
                if (!cleanPartnerId || cleanPartnerId === 'my-partner' || typeof firebase === 'undefined') return null;
                try {
                    const vid = getCurrentViewerId();
                    const docRef = await firebase.firestore().collection('partner_reviews').add({
                        partnerId: cleanPartnerId,
                        viewerId: vid,
                        authorUserId: vid,
                        author: authorMaskedId || 'user',
                        rating: Number(rating || 0),
                        content: String(text || '').trim(),
                        dayKey: getTodayDateKey(),
                        status: 'published',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    });
                    await recomputePartnerReviewAggregates(cleanPartnerId);
                    const loggedInPartnerId = getLoggedInPartnerDocId();
                    if (loggedInPartnerId && loggedInPartnerId === cleanPartnerId) {
                        queueRefreshPartnerDashboardStats();
                    }
                    return docRef.id;
                } catch (e) {
                    console.error('리뷰 저장 실패', e);
                    return null;
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
                    syncOwnPartnerBannerListRowFromDashboardStats();
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
            async function populateDashboardFromPartner(partnerData = null) {
                if (partnerData && typeof partnerData === 'object') {
                    currentPartner = {
                        ...(currentPartner || {}),
                        ...partnerData,
                        id: partnerData.id || currentPartner?.id || '',
                    };
                }

                const partnerDocId = localStorage.getItem('dadok_loggedInPartnerDocId') || sessionStorage.getItem('dadok_loggedInPartnerDocId');
                if (!partnerData && partnerDocId && typeof firebase !== 'undefined') {
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
                const hoursStartInput = document.getElementById('partner-input-hours-start');
                const hoursEndInput = document.getElementById('partner-input-hours-end');
                const callEnabledInput = document.getElementById('partner-input-call-enabled');
                const callStartInput = document.getElementById('partner-input-call-start');
                const callEndInput = document.getElementById('partner-input-call-end');
                const addressInput = document.getElementById('partner-input-address');
                const parkingInput = document.getElementById('partner-input-parking');
                const descInput = document.getElementById('partner-input-desc');

                if (nameInput) nameInput.value = currentPartner.name || '';
                const hoursText =
                    currentPartner.hours ||
                    currentPartner.businessHours ||
                    currentPartner.operatingHours ||
                    '';
                const parsedBusiness = parseCallHoursToRange(hoursText);
                const hasBusinessHours = !!String(hoursText || '').trim();
                if (hoursStartInput) hoursStartInput.value = hasBusinessHours ? parsedBusiness.start : '';
                if (hoursEndInput) hoursEndInput.value = hasBusinessHours ? parsedBusiness.end : '';
                if (callEnabledInput) {
                    callEnabledInput.checked =
                        typeof currentPartner.callEnabled === 'boolean'
                            ? currentPartner.callEnabled
                            : false;
                }
                const hasExplicitCallRange =
                    !!String(currentPartner.callAvailableStart || '').trim() ||
                    !!String(currentPartner.callAvailableEnd || '').trim();
                const callHoursText = currentPartner.callAvailableHours || currentPartner.callHours || '';
                const parsedCallRange = parseCallHoursToRange(
                    `${currentPartner.callAvailableStart || ''} ~ ${currentPartner.callAvailableEnd || ''}`.trim() !== '~'
                        ? `${currentPartner.callAvailableStart || ''} ~ ${currentPartner.callAvailableEnd || ''}`
                        : callHoursText,
                );
                const hasCallHours = hasExplicitCallRange || !!String(callHoursText || '').trim();
                if (callStartInput) callStartInput.value = hasCallHours ? (currentPartner.callAvailableStart || parsedCallRange.start) : '';
                if (callEndInput) callEndInput.value = hasCallHours ? (currentPartner.callAvailableEnd || parsedCallRange.end) : '';
                if (addressInput) addressInput.value = currentPartner.address || currentPartner.location || '';
                if (parkingInput) {
                    parkingInput.value =
                        (currentPartner.parkingInfo != null && currentPartner.parkingInfo !== ''
                            ? currentPartner.parkingInfo
                            : currentPartner.parkingGuide) || '';
                }
                if (descInput) {
                    descInput.value =
                        (currentPartner.catchphrase != null && currentPartner.catchphrase !== ''
                            ? currentPartner.catchphrase
                            : currentPartner.desc) ||
                        currentPartner.description ||
                        '';
                }
                updatePartnerPhotoPickerUIFromPartner(currentPartner || {});

                // 메뉴 채우기 (저장된 항목만 렌더링)
                const menuContainer = document.getElementById('menu-list-container');
                if (menuContainer) {
                    const menus = Array.isArray(currentPartner.menus) ? currentPartner.menus : [];
                    menuContainer.innerHTML = '';
                    menus.forEach(menu => {
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

                if (typeof window.applyPartnerDashboardCategoriesFromPartner === 'function') {
                    window.applyPartnerDashboardCategoriesFromPartner(currentPartner);
                }
            }

            function stopPartnerDashboardLiveSync() {
                if (typeof unsubscribePartnerDashboardLive === 'function') {
                    unsubscribePartnerDashboardLive();
                    unsubscribePartnerDashboardLive = null;
                }
            }

            function startPartnerDashboardLiveSync() {
                stopPartnerDashboardLiveSync();
                const partnerDocId =
                    localStorage.getItem('dadok_loggedInPartnerDocId') ||
                    sessionStorage.getItem('dadok_loggedInPartnerDocId');
                if (!partnerDocId || typeof firebase === 'undefined') return;

                unsubscribePartnerDashboardLive = firebase
                    .firestore()
                    .collection('partners')
                    .doc(partnerDocId)
                    .onSnapshot(
                        async (doc) => {
                            if (!doc.exists) return;
                            const livePartner = { id: doc.id, ...(doc.data() || {}) };
                            currentPartner = livePartner;
                            await populateDashboardFromPartner(livePartner);
                            await setPartnerDashboardAccessMode(livePartner);
                            renderPartnerBanners();
                        },
                        (err) => {
                            console.error('파트너 대시보드 실시간 동기화 실패:', err);
                        },
                    );
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
                    const callEnabledInput = document.getElementById('partner-input-call-enabled');
                    const addressInput = document.getElementById('partner-input-address');
                    const parkingInput = document.getElementById('partner-input-parking');
                    const descInput = document.getElementById('partner-input-desc');

                    if (nameInput) currentPartner.name = nameInput.value;
                    const businessRange = getPartnerBusinessHourRange();
                    const hoursLine =
                        businessRange.start && businessRange.end
                            ? `${businessRange.start} ~ ${businessRange.end}`
                            : '';
                    currentPartner.hours = hoursLine;
                    currentPartner.businessHours = hoursLine;
                    currentPartner.operatingHours = hoursLine;
                    const callRange = getPartnerCallHourRange();
                    currentPartner.callEnabled = callEnabledInput ? !!callEnabledInput.checked : false;
                    currentPartner.callAvailableStart = callRange.start;
                    currentPartner.callAvailableEnd = callRange.end;
                    currentPartner.callAvailableHours =
                        callRange.start && callRange.end ? `${callRange.start} ~ ${callRange.end}` : '';
                    if (addressInput) currentPartner.address = addressInput.value;
                    if (parkingInput) currentPartner.parkingInfo = parkingInput.value.trim();
                    if (descInput) {
                        currentPartner.desc = descInput.value.trim();
                        currentPartner.catchphrase = currentPartner.desc;
                    }
                    const preservedPhone =
                        (data.phoneNumber || data.mobile || data.phone || currentPartner.phoneNumber || '').trim();
                    if (preservedPhone) currentPartner.phoneNumber = preservedPhone;

                    // 카테고리 태그 정리 (피커 상태 + 다중 지역 Set 기준)
                    const pick = window.partnerDashboardCategoryPickers || {};
                    const regionListForDb = window.partnerDashboardRegionSet
                        ? Array.from(window.partnerDashboardRegionSet)
                        : [];
                    const selectedMassages = pick.massage ? pick.massage.getSelections() : [];
                    const selectedSpaces = pick.space ? pick.space.getSelections() : [];
                    const selectedAges = pick.age ? pick.age.getSelections() : [];

                    currentPartner.tags = [...selectedMassages, ...selectedSpaces, ...selectedAges].filter(Boolean);
                    currentPartner.massage = selectedMassages.join(', ');
                    currentPartner.regionList = regionListForDb;
                    currentPartner.region =
                        regionListForDb.length > 0
                            ? (() => {
                                  const first = regionListForDb[0];
                                  const parts = String(first).trim().split(/\s+/);
                                  if (parts.length < 2) return first;
                                  const dist = parts.slice(1).join(' ');
                                  return dist === '전체' || dist === '기타'
                                      ? `${parts[0]} ${dist}`
                                      : dist;
                              })()
                            : '';
                    currentPartner.place =
                        selectedSpaces.length > 0
                            ? selectedSpaces.join(', ')
                            : '';
                    currentPartner.age = selectedAges.length > 0 ? selectedAges.join(', ') : '';

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
                        phoneNumber: preservedPhone || currentPartner.phoneNumber || '',
                        phone: preservedPhone || currentPartner.phoneNumber || '',
                        contact: preservedPhone || currentPartner.phoneNumber || '',
                        hours: hoursLine,
                        businessHours: hoursLine,
                        operatingHours: hoursLine,
                        imageThumb:
                            currentPartner.imageThumb ||
                            currentPartner.thumbnailImage ||
                            currentPartner.thumbImage ||
                            currentPartner.image ||
                            '',
                        imageDetail:
                            currentPartner.imageDetail ||
                            currentPartner.detailImage ||
                            currentPartner.bannerImage ||
                            currentPartner.image ||
                            '',
                        callEnabled: !!currentPartner.callEnabled,
                        callAvailableStart: currentPartner.callAvailableStart || '',
                        callAvailableEnd: currentPartner.callAvailableEnd || '',
                        callAvailableHours: currentPartner.callAvailableHours || '',
                        location: currentPartner.address,
                        parkingInfo: currentPartner.parkingInfo || '',
                        catchphrase: currentPartner.desc,
                        description: currentPartner.desc,
                        tags: currentPartner.tags,
                        massage: currentPartner.massage,
                        region: currentPartner.region,
                        regionList: currentPartner.regionList || [],
                        place: currentPartner.place,
                        age: currentPartner.age,
                        menus: currentPartner.menus,
                        stats: normalizeDashboardStats(window.partnerDashboardStats),
                        statsDate: window.partnerDashboardStatsDate || getTodayDateKey(),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });

                    // 메인 화면 배너 리스트(DB_CHOICE)에도 실시간 연동 (Mock 반영용)
                    // 앱 공개 배너 배열은 조건 충족 업체만 유지
                    const resolvedTicketExpiryTimestamp =
                        getPartnerTicketExpiryMs(data) ||
                        getPartnerTicketExpiryMs(currentPartner) ||
                        0;
                    const resolvedTicketType = String(
                        data.ticketType ||
                        data.tier ||
                        currentPartner.ticketType ||
                        currentPartner.tier ||
                        '',
                    ).trim();
                    const exposureSource = {
                        ...data,
                        status: data.status || currentPartner.status || '',
                        adminPlacement:
                            String(data.adminPlacement || currentPartner.adminPlacement || '')
                                .trim()
                                .toLowerCase() || 'auto',
                        ticketType: resolvedTicketType,
                        tier: String(data.tier || resolvedTicketType || '').trim(),
                        ticketExpiryTimestamp: resolvedTicketExpiryTimestamp,
                        ticketExpiry: data.ticketExpiry || currentPartner.ticketExpiry || '',
                    };

                    if (canExposePartnerBanner(exposureSource)) {
                        const tierForList = String(exposureSource.tier || exposureSource.ticketType || 'Premium').trim();
                        const placementBucket = resolveMainPlacement(exposureSource);
                        let myPartnerMock = {
                            id: partnerDocId,
                            userId: currentPartner.userId || '',
                            name: currentPartner.name,
                            status: exposureSource.status || 'active',
                            adminPlacement: exposureSource.adminPlacement || 'auto',
                            region: currentPartner.region,
                            regionList: currentPartner.regionList || [],
                            tags: currentPartner.tags || [],
                            massageList: partnerCategoryCandidatesArray(currentPartner.massage, ALL_MASSAGES),
                            placeList: partnerCategoryCandidatesArray(currentPartner.place, ALL_PLACES),
                            ageList: partnerCategoryCandidatesArray(currentPartner.age, ALL_AGES),
                            massage: currentPartner.massage,
                            place: currentPartner.place,
                            age: currentPartner.age,
                            rating: currentPartner.rating || 5.0,
                            reviews: currentPartner.reviews || 0,
                            tier: tierForList || 'Premium',
                            ticketType: exposureSource.ticketType || '',
                            ticketExpiryTimestamp: resolvedTicketExpiryTimestamp,
                            ticketExpiry: exposureSource.ticketExpiry || '',
                            image:
                                currentPartner.imageThumb ||
                                currentPartner.thumbnailImage ||
                                currentPartner.thumbImage ||
                                currentPartner.image ||
                                '',
                            imageThumb:
                                currentPartner.imageThumb ||
                                currentPartner.thumbnailImage ||
                                currentPartner.thumbImage ||
                                currentPartner.image ||
                                '',
                            imageDetail:
                                currentPartner.imageDetail ||
                                currentPartner.detailImage ||
                                currentPartner.bannerImage ||
                                currentPartner.image ||
                                '',
                            phoneNumber: preservedPhone || currentPartner.phoneNumber || '',
                            hours: hoursLine,
                            businessHours: hoursLine,
                            operatingHours: hoursLine,
                            callEnabled: !!currentPartner.callEnabled,
                            callAvailableStart: currentPartner.callAvailableStart || '',
                            callAvailableEnd: currentPartner.callAvailableEnd || '',
                            callAvailableHours: currentPartner.callAvailableHours || '',
                            parkingInfo: currentPartner.parkingInfo || '',
                            menus: Array.isArray(currentPartner.menus) ? currentPartner.menus : [],
                        };

                        DB_CHOICE = DB_CHOICE.filter(p => p.id !== partnerDocId);
                        DB_RECOMMEND = DB_RECOMMEND.filter(p => p.id !== partnerDocId);
                        if (placementBucket === 'choice') {
                            DB_CHOICE.unshift(myPartnerMock);
                        } else {
                            DB_RECOMMEND.unshift(myPartnerMock);
                        }
                    } else {
                        DB_CHOICE = DB_CHOICE.filter(p => p.id !== partnerDocId);
                        DB_RECOMMEND = DB_RECOMMEND.filter(p => p.id !== partnerDocId);
                    }

                    // 필터 및 메인 뷰 재렌더링
                    if (typeof applyFiltersToData === 'function') applyFiltersToData();
                    if (typeof initializeDynamicContent === 'function') initializeDynamicContent();

                    showCustomToast("설정이 실시간으로 연동/저장되었습니다.");

                    closePartnerDashboardToMain();
                    scrollMainAppToTop();

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

            let supportTypeUnsubscribe = null;

            function stopSupportTypeRealtimeSync() {
                if (typeof supportTypeUnsubscribe === 'function') {
                    supportTypeUnsubscribe();
                    supportTypeUnsubscribe = null;
                }
            }

            async function getSupportActorRole() {
                try {
                    const actor = await getCurrentChatActor();
                    return actor?.role === 'partner' ? 'partner' : 'user';
                } catch (e) {
                    console.warn('신고/문의 사용자 역할 확인 실패:', e);
                    return getLoggedInPartnerDocId() ? 'partner' : 'user';
                }
            }

            function getSupportFilterDocKey(tab, actorRole = 'user') {
                const isPartner = actorRole === 'partner';
                if (tab === 'report') {
                    return isPartner ? 'partner_report_reason' : 'customer_report_reason';
                }
                return isPartner ? 'partner_inquiry_type' : 'customer_inquiry_type';
            }

            function getSupportTicketType(tab, actorRole = 'user') {
                const isPartner = actorRole === 'partner';
                if (tab === 'report') {
                    return isPartner ? 'partner_report' : 'customer_report';
                }
                return isPartner ? 'partner_inquiry' : 'customer_inquiry';
            }

            async function loadSupportTypeOptions(tab) {
                const select = document.getElementById('support-type');
                if (!select) return;

                const fallback = supportTypeFallbacks[tab] || [];
                const renderOptions = (options) => {
                    const normalized = Array.isArray(options)
                        ? options
                              .map(v => (typeof v === 'string' ? v.trim() : ''))
                              .filter(Boolean)
                        : [];
                    const safeOptions = normalized.length ? normalized : ['일반'];
                    const prevValue = String(select.value || '').trim();
                    const menu = document.getElementById('support-type-menu');
                    select.innerHTML = '';
                    if (menu) menu.innerHTML = '';

                    safeOptions.forEach((label, idx) => {
                        const opt = document.createElement('option');
                        opt.value = label;
                        opt.textContent = label;
                        select.appendChild(opt);

                        if (menu) {
                            const btn = document.createElement('button');
                            btn.type = 'button';
                            btn.className =
                                'w-full text-left px-4 py-3 rounded-xl text-[var(--text-main)] text-[15px] font-medium hover:bg-[#12241B] transition-colors';
                            btn.textContent = label;
                            btn.addEventListener('click', (e) => {
                                e.preventDefault();
                                selectSupportTypeOption(label);
                            });
                            menu.appendChild(btn);
                        }
                    });

                    const nextValue = safeOptions.includes(prevValue) ? prevValue : safeOptions[0];
                    select.value = nextValue || '';
                    syncSupportTypeLabel();
                };

                // 네트워크/권한 이슈가 있어도 빈 드롭다운이 되지 않도록 기본값을 즉시 표시
                renderOptions(fallback);

                if (typeof firebase !== 'undefined') {
                    try {
                        const actorRole = await getSupportActorRole();
                        const docKey = getSupportFilterDocKey(tab, actorRole);
                        stopSupportTypeRealtimeSync();
                        supportTypeUnsubscribe = firebase
                            .firestore()
                            .collection('app_filters')
                            .doc(docKey)
                            .onSnapshot((doc) => {
                                if (!doc.exists) {
                                    renderOptions(fallback);
                                    return;
                                }
                                const dbOptions = Array.isArray(doc.data()?.options) ? doc.data().options : [];
                                const sanitized = dbOptions
                                    .map(v => (typeof v === 'string' ? v.trim() : ''))
                                    .filter(Boolean);
                                if (sanitized.length > 0) {
                                    renderOptions(sanitized);
                                } else {
                                    renderOptions(fallback);
                                }
                            }, (e) => {
                                console.error('신고/문의 유형 실시간 구독 실패:', e);
                                renderOptions(fallback);
                            });
                    } catch (e) {
                        console.error('신고/문의 유형 로드 실패:', e);
                    }
                }
            }

            function closeSupportTypeMenu() {
                const menu = document.getElementById('support-type-menu');
                const icon = document.getElementById('support-type-trigger-icon');
                if (menu) menu.classList.add('hidden');
                if (icon) icon.classList.remove('rotate-180');
            }

            function syncSupportTypeLabel() {
                const select = document.getElementById('support-type');
                const labelEl = document.getElementById('support-type-selected-label');
                if (!select || !labelEl) return;
                const text = select.selectedOptions?.[0]?.textContent || select.value || '유형 선택';
                labelEl.textContent = text;
            }

            window.toggleSupportTypeMenu = function toggleSupportTypeMenu(event) {
                if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
                const menu = document.getElementById('support-type-menu');
                const icon = document.getElementById('support-type-trigger-icon');
                if (!menu) return;
                const willOpen = menu.classList.contains('hidden');
                if (willOpen) {
                    menu.classList.remove('hidden');
                    if (icon) icon.classList.add('rotate-180');
                } else {
                    closeSupportTypeMenu();
                }
            };

            window.selectSupportTypeOption = function selectSupportTypeOption(value) {
                const select = document.getElementById('support-type');
                if (!select) return;
                select.value = value;
                syncSupportTypeLabel();
                closeSupportTypeMenu();
            };

            if (!window.__supportTypeMenuOutsideClickBound) {
                document.addEventListener('click', (event) => {
                    const wrap = document.getElementById('support-type-dropdown-wrap');
                    if (!wrap || wrap.contains(event.target)) return;
                    closeSupportTypeMenu();
                });
                window.__supportTypeMenuOutsideClickBound = true;
            }

            function openSupportScreen() {
                const supportModal = document.getElementById('support-modal');
                supportModal.style.display = 'flex';
                supportModal.style.zIndex = '260';
                changeSupportTab('report'); // Default to Report
                resetSupportDraftFields();

                setTimeout(() => {
                    supportModal.classList.remove('translate-x-full');
                }, 10);
            }

            function closeSupportScreen() {
                const supportModal = document.getElementById('support-modal');
                supportModal.classList.add('translate-x-full');
                setTimeout(() => {
                    supportModal.style.display = 'none';
                    supportModal.style.zIndex = '';
                    resetSupportDraftFields();
                    closeSupportTypeMenu();
                    stopSupportTypeRealtimeSync();
                }, 300);
            }

            function openSupportFromPartnerDashboard() {
                openSupportScreen();
            }

            function resetSupportDraftFields() {
                const contentEl = document.getElementById('support-content');
                const fileInputEl = document.getElementById('support-file-input');
                const fileNameEl = document.getElementById('support-file-name');
                if (contentEl) contentEl.value = '';
                if (fileInputEl) fileInputEl.value = '';
                if (fileNameEl) fileNameEl.innerText = '터치하여 이미지 첨부';
                closeSupportTypeMenu();
            }

            window.updateSupportFileLabel = function updateSupportFileLabel() {
                const el = document.getElementById('support-file-name');
                const input = document.getElementById('support-file-input');
                const f = input && input.files;
                if (!el) return;
                el.innerText =
                    f && f.length ? (f.length > 1 ? `${f.length}장 선택됨` : f[0].name) : '터치하여 이미지 첨부';
            };

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
                    desc.innerHTML = '건전한 피부·바디 케어 서비스 운영을 위해<br>불법·유해 행위 제보를 접수합니다.';
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
                const actor = await getCurrentChatActor();
                const actorRole = actor?.role === 'partner' ? 'partner' : 'user';
                const type = getSupportTicketType(isReportTab ? 'report' : 'inquiry', actorRole);
                const supportTypeSelect = document.getElementById('support-type');
                const selectedCategory = supportTypeSelect?.value || '';
                const selectedCategoryText = supportTypeSelect?.selectedOptions?.[0]?.textContent || selectedCategory || '일반';
                const rawContent = content.value.trim();
                const title = `[${selectedCategoryText}] ${rawContent.slice(0, 30)}${rawContent.length > 30 ? '...' : ''}`;
                const actorId = String(
                    actor?.userId ||
                    localStorage.getItem('dadok_username') ||
                    sessionStorage.getItem('dadok_username') ||
                    localStorage.getItem('dadok_loggedInPartnerUserId') ||
                    sessionStorage.getItem('dadok_loggedInPartnerUserId') ||
                    'anonymous'
                );

                const fileInputEl = document.getElementById('support-file-input');
                const selectedFiles = fileInputEl?.files;
                const attachmentUrls = [];
                const maxSupportImages = 5;
                if (selectedFiles && selectedFiles.length > 0) {
                    if (selectedFiles.length > maxSupportImages) {
                        showCustomToast(`사진은 최대 ${maxSupportImages}장까지 첨부할 수 있습니다.`);
                        return;
                    }
                    let storageRoot;
                    try {
                        storageRoot = firebase.storage().ref();
                    } catch (err) {
                        console.error('Firebase Storage 초기화 실패:', err);
                        showCustomToast('사진 업로드(Storage)를 사용할 수 없습니다.');
                        return;
                    }
                    const uploadId = `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
                    for (let i = 0; i < selectedFiles.length; i++) {
                        const file = selectedFiles[i];
                        if (!file.type || !file.type.startsWith('image/')) {
                            showCustomToast('이미지 파일만 첨부할 수 있습니다.');
                            return;
                        }
                        const safeName = String(file.name || 'image')
                            .replace(/[^\w.\-]/g, '_')
                            .slice(-100);
                        const path = `cs_tickets/${uploadId}/${i}_${Date.now()}_${safeName}`;
                        const fileRef = storageRoot.child(path);
                        try {
                            const snapshot = await fileRef.put(file, { contentType: file.type || 'image/jpeg' });
                            attachmentUrls.push(await snapshot.ref.getDownloadURL());
                        } catch (upErr) {
                            console.error('첨부 업로드 실패:', upErr);
                            showCustomToast('사진 업로드에 실패했습니다. 네트워크·Storage 규칙을 확인해 주세요.');
                            return;
                        }
                    }
                }

                try {
                    const ticketPayload = {
                        type: type,
                        status: 'pending',
                        title: title,
                        content: rawContent,
                        author: actorId,
                        authorRole: actorRole,
                        authorDocId: actor?.docId || '',
                        category: selectedCategory,
                        categoryLabel: selectedCategoryText,
                        source: actorRole === 'partner' ? 'app_partner_support' : 'app_user_support',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    };
                    if (attachmentUrls.length > 0) {
                        ticketPayload.attachmentUrls = attachmentUrls;
                    }
                    await firebase.firestore().collection('cs_tickets').add(ticketPayload);

                    showCustomToast("정상적으로 접수되었습니다. 최대한 빠르게 답변드리겠습니다.");
                    resetSupportDraftFields();
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

            /** 프로그램적으로 열리는 파트너 대시보드도 기기 뒤로가기(popstate)에 잡히도록 히스토리에 한 단계 쌓음 */
            function registerPartnerDashboardBackStack() {
                if (appModalStack.length && appModalStack[appModalStack.length - 1] === 'closePartnerDashboardToMain') {
                    return;
                }
                appModalStack.push('closePartnerDashboardToMain');
                history.pushState({ modalOpen: true, stackDepth: appModalStack.length }, '', location.href);
            }

            /** 대시보드 닫기(메인/로그인/저장 등) 시 스택·히스토리 정리 — 클릭으로 이미 비운 경우는 무시 */
            function popPartnerDashboardHistoryEntryIfTop() {
                if (!appModalStack.length || appModalStack[appModalStack.length - 1] !== 'closePartnerDashboardToMain') {
                    return;
                }
                appModalStack.pop();
                if (history.state && history.state.modalOpen) {
                    isClickClosing = true;
                    history.back();
                    setTimeout(() => { isClickClosing = false; }, 50);
                }
            }

            /**
             * 파트너 대시보드에서만 입점 안내로 들어온 경우: 기기 뒤로가기 시 입점 안내를 닫고 대시보드로 복귀
             * (onclick이 open* 가 아니어서 전역 클릭 핸들러가 히스토리를 쌓지 않음)
             */
            function registerPartnerEntryFromDashboardBackStack() {
                if (appModalStack.length && appModalStack[appModalStack.length - 1] === 'closePartnerEntryScreen') {
                    return;
                }
                appModalStack.push('closePartnerEntryScreen');
                history.pushState({ modalOpen: true, stackDepth: appModalStack.length }, '', location.href);
            }

            /** 입점 신청 완료 모달: 기기 뒤로가기 시 closeSuccessAndReturnToEntry와 동일(입점 안내로 복귀) */
            function registerPartnerApplicationSuccessBackStack() {
                if (appModalStack.length && appModalStack[appModalStack.length - 1] === 'closeSuccessAndReturnToEntry') {
                    return;
                }
                appModalStack.push('closeSuccessAndReturnToEntry');
                history.pushState({ modalOpen: true, stackDepth: appModalStack.length }, '', location.href);
            }

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
                    'openNoticeModal': 'closeNoticeModal',
                    'openNoticePage': 'closeNoticePage',
                    'openNotificationSettingsModal': 'closeNotificationSettingsModal',
                    'openSecurityModal': 'closeSecurityModal',
                    'openSupportScreen': 'closeSupportScreen',
                    'openSupportFromPartnerDashboard': 'closeSupportScreen',
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
                    const chatSheet = document.getElementById('chat-sheet');
                    if (chatSheet && chatSheet.classList.contains('open')) {
                        if (typeof closeChatSheet === 'function') {
                            try { closeChatSheet(); } catch (err) { }
                        }
                        return;
                    }
                    if (typeof handleOverlayClick === 'function') { try { handleOverlayClick(); } catch (err) { } }
                    if (typeof closeAllModals === 'function') { try { closeAllModals(); } catch (err) { } }
                }
            });
// removed end wrapper