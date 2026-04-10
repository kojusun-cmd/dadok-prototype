const fs = require('fs');
let code = fs.readFileSync('assets/js/script.js', 'utf8');

const modalMap = {
    'openProfile': 'closeProfileSheet',
    'openProfileFromFavorites': 'closeProfileSheet',
    'openFilter': 'closeFilterSheet',
    'openChatSheet': 'closeChatSheet',
    'openChatWithUser': 'closeChatSheet',
    'openFindIdPwScreen': 'closeFindIdPwScreen',
    'openLoginModal': 'closeLoginModal',
    'openLoginFormModal': 'closeLoginFormModal',
    'openSignupModal': 'closeSignupModal',
    'openPartnerLoginScreen': 'closePartnerLoginScreen',
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
    'openMyBanner': 'closeAllModals',
    'openReviewSheet': 'closeReviewSheet'
};

const regexStack = /^[ \t]*\/\/ \[모바일 뒤로가기 방어 로직[\s\S]*?window\.addEventListener\('popstate'[\s\S]*?\}\);/m;
const matchStack = code.match(regexStack);
if(matchStack) {
    let injection = `// [모바일 뒤로가기 방어 로직 - Router 기반 구조 개선]
            window.dadokRouter = {
                stack: [],
                isSystemPopping: false,
                push: function(modalId, closeAction) {
                    let currentModal = this.stack.length > 0 ? this.stack[this.stack.length - 1].modalId : null;
                    if (currentModal === modalId) return;
                    history.pushState({ modalId: modalId, isDadok: true, depth: this.stack.length }, '', location.href);
                    this.stack.push({ modalId: modalId, closeAction: closeAction });
                },
                pop: function(modalId) {
                    if (this.isSystemPopping) return true;
                    if (this.stack.length > 0 && this.stack[this.stack.length - 1].modalId === modalId) {
                        history.back(); // Trigger native back button -> goes to popstate listener -> calls manual close natively.
                        return false; 
                    } else if (this.stack.length > 0) {
                        this.stack = this.stack.filter(m => m.modalId !== modalId);
                        return true;
                    }
                    return true;
                }
            };
            window.addEventListener('popstate', function(e) {
                if (window.dadokRouter.stack.length > 0) {
                    let last = window.dadokRouter.stack.pop();
                    window.dadokRouter.isSystemPopping = true;
                    if (typeof last.closeAction === 'function') last.closeAction();
                    else if (last.closeAction === 'closeReviewSheet') {
                        const rSheet = document.getElementById('review-sheet');
                        if (rSheet) rSheet.classList.remove('open');
                        const overlay = document.getElementById('main-overlay');
                        if (overlay) { overlay.style.zIndex = ''; overlay.classList.remove('show'); }
                    }
                    else {
                        try { eval(last.closeAction + "()"); } catch (err) { }
                    }
                    window.dadokRouter.isSystemPopping = false;
                } else {
                    try { eval("closeAllModals()"); } catch (err) { }
                }
            });`;
    code = code.replace(regexStack, injection);
} else {
    console.log("Could not find the previous stack logic string in script.js to replace!");
}

let modifiedFunctions = new Set();

for(const [openFn, closeFn] of Object.entries(modalMap)) {
    const openRegex = new RegExp('function\\s+(' + openFn + ')\\s*\\(([^)]*)\\)\\s*\\{');
    code = code.replace(openRegex, `function $1($2) { window.dadokRouter.push('${closeFn}', '${closeFn}'); `);
    
    if (closeFn && closeFn !== 'closeAllModals' && closeFn !== 'closeReviewSheet' && !modifiedFunctions.has(closeFn)) {
        modifiedFunctions.add(closeFn);
        const closeRegex = new RegExp('function\\s+(' + closeFn + ')\\s*\\(([^)]*)\\)\\s*\\{');
        code = code.replace(closeRegex, `function $1($2) { if (window.dadokRouter && !window.dadokRouter.pop('$1')) return; `);
    }
}

fs.writeFileSync('assets/js/script.js', code);
console.log('Refactoring complete!');
