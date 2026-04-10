const fs = require('fs');
let txt = fs.readFileSync('assets/js/script.js', 'utf8');

// Replace Unsplash images with picsum
for(let i=1; i<=20; i++){
    txt = txt.replace(/image: '[^']+?unsplash[^']+?'/, `image: 'https://picsum.photos/seed/vip${i}/400/400'`);
}

// Ensure all UI functions are exposed
const endStr = `initSliderDrag();\n            });`;
const endStrWin = `initSliderDrag();\r\n            });`;

const exportStr = `initSliderDrag();

    const uiFunctions = { executeFilterSearch, toggleRegion, applyFilter, removeFilterItem, openProfile, setReviewRating, submitReview, toggleReplyInput, submitReply, resumeChat, openProfileFromFavorites, goHome, openLoginModal, openFilter, openListView, openPartnerLoginScreen, openSupportScreen, handleOverlayClick, closeSupportScreen, changeSupportTab, toggleSupportTypeDropdown, submitSupportForm, closeLoginModal, openLoginFormModal, openSignupModal, closeSignupModal, checkDuplicateId, handleSignupSubmit, closeLoginFormModal, openFindIdPwScreen, switchToSignupModal, handleMockLogin, closePartnerLoginScreen, handlePartnerMockLogin, openPartnerSignupModal, openPartnerEntryScreen, closePartnerSignupModal, openLegalModal, handlePartnerSignupSubmit, closeLegalModal, goToPartnerLoginFromSuccess, logoutPartnerToLogin, goToPartnerEntryFromDashboard, openMyBanner, openChatTabFromDashboard, addMenuItem, closePartnerDashboardToMain, saveDashboardSettings, closePartnerEntryScreen, openPartnerApplication, closePartnerApplication, submitPartnerApplication, closeSuccessAndReturnToEntry, finishPartnerApplication, closeFindIdPwScreen, switchFindTab, handleFindIdSubmit, handleFindPwSubmit, closeMyPageModal, openChatListModal, openFavoritesModal, openSecurityModal, logout, closeChatListModal, closeFavoritesModal, closeSecurityModal, handleChangePassword, closeAllModals, closeProfileSheet, openReviewSheet, toggleFavorite, openChatSheet, closeFilterSheet, closeChatSheet, sendMockChatMessage, sendUserMessage };
    for (const [key, val] of Object.entries(uiFunctions)) {
        if (typeof val === 'function') window[key] = val;
    }
            });`;

if(txt.includes(endStrWin)) {
    txt = txt.replace(endStrWin, exportStr);
} else if(txt.includes(endStr)) {
    txt = txt.replace(endStr, exportStr);
}

fs.writeFileSync('assets/js/script.js', txt, 'utf8');
