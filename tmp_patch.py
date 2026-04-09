import re

with open('assets/js/script.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the old eval block
content = re.sub(r'// EXPLICIT GLOBAL BINDINGS TO FIX UNCAUGHT REFERENCE ERRORS.*?\}\);\n?', '', content, flags=re.DOTALL)

ui_funcs = [
    'executeFilterSearch','toggleRegion','applyFilter','removeFilterItem','openProfile',
    'setReviewRating','submitReview','toggleReplyInput','submitReply','resumeChat',
    'openProfileFromFavorites','goHome','openLoginModal','openFilter','openListView',
    'openPartnerLoginScreen','openSupportScreen','handleOverlayClick','closeSupportScreen',
    'changeSupportTab','toggleSupportTypeDropdown','submitSupportForm','closeLoginModal',
    'openLoginFormModal','openSignupModal','closeSignupModal','checkDuplicateId',
    'handleSignupSubmit','closeLoginFormModal','openFindIdPwScreen','switchToSignupModal',
    'handleMockLogin','closePartnerLoginScreen','handlePartnerMockLogin',
    'openPartnerSignupModal','openPartnerEntryScreen','closePartnerSignupModal',
    'openLegalModal','handlePartnerSignupSubmit','closeLegalModal',
    'goToPartnerLoginFromSuccess','logoutPartnerToLogin','goToPartnerEntryFromDashboard',
    'openMyBanner','openChatTabFromDashboard','addMenuItem','closePartnerDashboardToMain',
    'saveDashboardSettings','closePartnerEntryScreen','openPartnerApplication',
    'closePartnerApplication','submitPartnerApplication','closeSuccessAndReturnToEntry',
    'finishPartnerApplication','closeFindIdPwScreen','switchFindTab','handleFindIdSubmit',
    'handleFindPwSubmit','closeMyPageModal','openChatListModal','openFavoritesModal',
    'openSecurityModal','logout','closeChatListModal','closeFavoritesModal',
    'closeSecurityModal','handleChangePassword','closeAllModals','closeProfileSheet',
    'openReviewSheet','toggleFavorite','openChatSheet','closeFilterSheet','closeChatSheet',
    'sendMockChatMessage','sendUserMessage'
]

assignments = []
for fn in ui_funcs:
    assignments.append(f"if (typeof {fn} === 'function') window.{fn} = {fn};")

new_block = '\n// EXPLICIT GLOBAL BINDINGS WITHOUT EVAL TO FIX SCOPE ISSUES\n' + '\n'.join(assignments) + '\n'

with open('assets/js/script.js', 'w', encoding='utf-8') as f:
    f.write(content + new_block)
