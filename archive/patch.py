import re

JS_PATH = r"c:\Users\kojus\Desktop\마사지앱개발\dadok-prototype\assets\js\script.js"

with open(JS_PATH, "r", encoding="utf-8") as f:
    js = f.read()

# 1. Add global helpers for chat
global_helpers = """
            // --- FIREBASE CHAT / REVIEW DYNAMIC LOGIC ---
            window.currentChatRoomId = null;
            window.chatUnsubscribe = null;

            function startChatListener(roomId) {
                if (window.chatUnsubscribe) {
                    window.chatUnsubscribe();
                    window.chatUnsubscribe = null;
                }
                const container = document.getElementById('chat-messages-container');
                container.innerHTML = '';
                let uid = firebase.auth().currentUser ? firebase.auth().currentUser.uid : 'guest';
                
                window.chatUnsubscribe = db.collection('chats').doc(roomId).collection('messages')
                    .orderBy('timestamp', 'asc')
                    .onSnapshot(snapshot => {
                        snapshot.docChanges().forEach(change => {
                            if (change.type === 'added') {
                                let msg = change.doc.data();
                                // if sender is me, append user message, otherwise partner message
                                if (msg.sender === uid) {
                                    appendUserMessage(msg.text);
                                } else {
                                    appendBotMessage(msg.text);
                                }
                            }
                        });
                        setTimeout(() => {
                            container.scrollTop = container.scrollHeight;
                        }, 50);
                    });
            }
"""
if "window.currentChatRoomId" not in js:
    js = js.replace("document.addEventListener('DOMContentLoaded', () => {", "document.addEventListener('DOMContentLoaded', () => {\n" + global_helpers)

# 2. Update sendUserMessage
send_msg_old = """            function sendUserMessage() {
                const input = document.getElementById('chat-input');
                const text = input.value.trim();
                let uid = firebase.auth().currentUser ? firebase.auth().currentUser.uid : 'guest';
                
                if (text && currentPartner) {
                    appendUserMessage(text);
                    recordChatProgress(text);
                    input.value = '';

                    const chatRoomId = uid + '_' + currentPartner.id;
                    db.collection('chats').doc(chatRoomId).collection('messages').add({
                        text: text,
                        sender: uid,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    });

                    setTimeout(() => {
                        const botHtml = '연락을 확인 중입니다. 잠시 기다려 주시면 매장에서 답변해 드리겠습니다. (실시간)';
                        appendBotMessage(botHtml);
                        db.collection('chats').doc(chatRoomId).collection('messages').add({
                            text: botHtml,
                            sender: currentPartner.id,
                            timestamp: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    }, 1000);
                }
            }"""
send_msg_new = """            function sendUserMessage() {
                const input = document.getElementById('chat-input');
                const text = input.value.trim();
                let uid = firebase.auth().currentUser ? firebase.auth().currentUser.uid : 'guest';
                
                if (text && window.currentChatRoomId) {
                    input.value = '';
                    recordChatProgress(text);
                    
                    const chatRoomId = window.currentChatRoomId;
                    const chatDocRef = db.collection('chats').doc(chatRoomId);
                    
                    let uname = localStorage.getItem('dadok_username') || '고객님';
                    if (!isPartnerLoggedIn && currentPartner) {
                        chatDocRef.set({
                            userId: uid,
                            partnerId: currentPartner.id,
                            lastMessage: text,
                            userName: uname,
                            partnerName: currentPartner.name,
                            partnerImage: currentPartner.image,
                            timestamp: firebase.firestore.FieldValue.serverTimestamp()
                        }, { merge: true });
                    } else {
                        chatDocRef.update({
                            lastMessage: text,
                            timestamp: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    }

                    chatDocRef.collection('messages').add({
                        text: text,
                        sender: uid,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            }"""
if send_msg_old in js:
    js = js.replace(send_msg_old, send_msg_new)

# 3. Update openChatSheet
open_chat_old = """            function openChatSheet() { window.dadokRouter.push('closeChatSheet', 'closeChatSheet'); 
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
            }"""
open_chat_new = """            function openChatSheet() { window.dadokRouter.push('closeChatSheet', 'closeChatSheet'); 
                const chatSheet = document.getElementById('chat-sheet');
                const chatName = document.getElementById('chat-profile-name');

                let uid = firebase.auth().currentUser ? firebase.auth().currentUser.uid : 'guest';
                if (!chatName.dataset.resume) {
                    chatName.innerText = document.getElementById('profile-name').innerText;
                    if (currentPartner && currentPartner.image) {
                        document.getElementById('chat-header-img').style.backgroundImage = `url('${currentPartner.image}')`;
                        document.getElementById('chat-default-avatar').style.backgroundImage = `url('${currentPartner.image}')`;
                    }
                    // Setup current chat room and listener
                    window.currentChatRoomId = uid + '_' + currentPartner.id;
                    startChatListener(window.currentChatRoomId);
                } else {
                    delete chatName.dataset.resume;
                }
                if (typeof profileOpenedFromFavorites !== 'undefined' && profileOpenedFromFavorites) {
                    chatSheet.style.zIndex = '260';
                }

                document.getElementById('chat-input').value = '';
                chatSheet.classList.add('open');
                overlay.classList.add('show');
            }"""
if open_chat_old in js:
    js = js.replace(open_chat_old, open_chat_new)

# 4. closeChatSheet to unsubscribe (Wait, I won't unsubscribe on close so background messages can arrive if needed, but it's simpler to unsubscribe)
close_chat_old = """                if (typeof chatOpenedFromModal !== 'undefined' && chatOpenedFromModal) {"""
close_chat_new = """                if (window.chatUnsubscribe) { window.chatUnsubscribe(); window.chatUnsubscribe = null; }
                if (typeof chatOpenedFromModal !== 'undefined' && chatOpenedFromModal) {"""
js = js.replace(close_chat_old, close_chat_new)

# 5. renderChatList
render_chat_old = """            function renderChatList() {
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
            }"""
render_chat_new = """            async function renderChatList() {
                const container = document.getElementById('chat-list-container');
                let uid = firebase.auth().currentUser ? firebase.auth().currentUser.uid : 'guest';
                
                let query;
                if (isPartnerLoggedIn && currentPartner) {
                    query = db.collection('chats').where('partnerId', '==', currentPartner.id);
                } else {
                    query = db.collection('chats').where('userId', '==', uid);
                }

                try {
                    const snapshot = await query.orderBy('timestamp', 'desc').get();
                    if (snapshot.empty) {
                        container.innerHTML = `<div class="p-10 text-sm text-center w-full" style="color:var(--text-sub);">채팅 내역이 없습니다.<br>알림과 대화가 이곳에 표시됩니다.</div>`;
                        return;
                    }

                    let html = '<div class="space-y-4">';
                    snapshot.forEach(doc => {
                        let chat = doc.data();
                        chat.id = doc.id;
                        let displayImage = isPartnerLoggedIn ? 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' : chat.partnerImage;
                        let displayName = isPartnerLoggedIn ? (chat.userName || '고객님') : (chat.partnerName || '파트너');
                        let timeStr = chat.timestamp ? new Date(chat.timestamp.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '방금 전';

                        html += `
                <div class="bg-[var(--surface-color)] p-4 rounded-xl border border-[var(--border-color)] flex items-center gap-4 cursor-pointer hover:bg-[var(--point-color)]/10 transition-colors" onclick="resumeChat('${chat.id}', '${displayName}', '${displayImage}')">
                    <div class="w-12 h-12 rounded-full bg-cover bg-center shrink-0 border border-[var(--point-color)]/50" style="background-image: url('${displayImage}')"></div>
                    <div class="flex-1 overflow-hidden">
                        <div class="flex justify-between items-center mb-1">
                            <h4 class="text-white font-bold text-[15px]">${displayName}</h4>
                            <span class="text-[11px] text-[var(--text-sub)]">${timeStr}</span>
                        </div>
                        <p class="text-[13px] text-[var(--text-sub)] truncate">${chat.lastMessage}</p>
                    </div>
                </div>
            `;
                    });
                    html += '</div>';
                    container.innerHTML = html;
                } catch(e) {
                    console.error('채팅 목록 불러오기 실패:', e);
                    container.innerHTML = `<div class="p-10 text-sm text-center w-full" style="color:red;">채팅 목록을 불러오지 못했습니다.</div>`;
                }
            }"""
if render_chat_old in js:
    js = js.replace(render_chat_old, render_chat_new)
else:
    print("WARNING: renderChatList not found")

# 6. resumeChat
resume_chat_old = """            window.resumeChat = function (id) {
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
            };"""
resume_chat_new = """            window.resumeChat = function (id, dName, dImg) {
                window.currentChatRoomId = id;
                chatOpenedFromModal = true;
                setTimeout(() => {
                    const chatName = document.getElementById('chat-profile-name');
                    chatName.innerText = dName || '채팅방';
                    chatName.dataset.resume = "true";
                    if (dImg) {
                        document.getElementById('chat-header-img').style.backgroundImage = `url('${dImg}')`;
                        document.getElementById('chat-default-avatar').style.backgroundImage = `url('${dImg}')`;
                    }
                    startChatListener(id);
                    document.getElementById('chat-sheet').style.zIndex = '250';
                    document.getElementById('overlay').style.zIndex = '240';
                    window.dadokRouter.push('closeChatSheet', 'closeChatSheet');
                    document.getElementById('chat-sheet').classList.add('open');
                    overlay.classList.add('show');
                }, 50);
            };"""
if resume_chat_old in js:
    js = js.replace(resume_chat_old, resume_chat_new)
else:
    print("WARNING: resumeChat not found")


# ======== REVIEWS SYNC ==========
open_review_old = """            function openReviewSheet() { window.dadokRouter.push('closeReviewSheet', 'closeReviewSheet'); 
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

                html += `</div>`; // 컨테이너 종료

                reviewContent.innerHTML = html;
                reviewSheet.classList.add('open');
                overlay.classList.add('show');
                document.body.style.overflow = 'hidden';
            }"""

open_review_new = """            async function openReviewSheet() { window.dadokRouter.push('closeReviewSheet', 'closeReviewSheet'); 
                const reviewSheet = document.getElementById('review-sheet');
                const reviewContent = document.getElementById('review-content');

                try {
                    const reviewsRef = db.collection('reviews').where('partnerId', '==', currentPartner.id);
                    const sn = await reviewsRef.orderBy('createdAt', 'desc').get();
                    let dbReviews = [];
                    let customTotal = 0;
                    sn.forEach(d => {
                        let data = d.data();
                        data.id = d.id;
                        dbReviews.push(data);
                        customTotal += Number(data.rating || 0);
                    });

                    let totalCount = dbReviews.length;
                    let displayRating = totalCount > 0 ? (customTotal / totalCount).toFixed(1) : parseFloat(currentPartner.rating || 5.0).toFixed(1);

                    const starPath = "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z";
                    
                    let html = `<div class="flex items-center gap-3 mb-6"><div class="flex items-center gap-1 text-[var(--point-color)]"><svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="${starPath}"></path></svg><span class="font-bold text-3xl" id="review-sheet-rating-display">${displayRating}</span></div><span class="text-[var(--text-sub)]">방문자 찐리뷰 <span class="font-bold" id="review-sheet-count-display">${totalCount}</span>개</span></div>`;

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
                    <button onclick="submitReview()" class="bg-[var(--point-color)] text-[#06110D] px-6 py-2.5 rounded-full font-bold text-[15px] hover:opacity-90 transition-opacity shadow-md">리뷰 등록</button>
                </div>
            </div>
            `;

                    html += `<div id="review-list-container">`;

                    if(dbReviews.length === 0) {
                       html += `<p class="p-10 text-center text-[var(--text-sub)] w-full">아직 등록된 리뷰가 없습니다.</p>`;
                    }

                    dbReviews.forEach((cr) => {
                        let author = cr.author || '고객';
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

                    html += `</div>`; 

                    reviewContent.innerHTML = html;
                    reviewSheet.classList.add('open');
                    overlay.classList.add('show');
                    document.body.style.overflow = 'hidden';
                } catch(e) { console.error('리뷰 불러오기 실패', e); }
            }"""

if open_review_old in js:
    js = js.replace(open_review_old, open_review_new)
else:
    print("WARNING: openReviewSheet not found")


with open(JS_PATH, "w", encoding="utf-8") as f:
    f.write(js)
print("Patch script executed successfully.")
