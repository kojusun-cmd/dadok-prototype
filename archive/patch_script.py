import re

with open('assets/js/script.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Add ticketType and ticketExpiry mapping
content = re.sub(
    r'(rating: data\.rating\?\.toString\(\) \|\| \(Math\.random\(\) \* 0\.5 \+ 4\.5\)\.toFixed\(1\),)',
    r'\1\n                            ticketType: data.ticketType || \'일반 입점\',\n                            ticketExpiry: data.ticketExpiry || \'\',',
    content
)

content = re.sub(
    r'(rating: savedPartner\.rating \|\| \'5\.0\',)',
    r'\1\n                                ticketType: savedPartner.ticketType || \'일반 입점\',\n                                ticketExpiry: savedPartner.ticketExpiry || \'\',',
    content
)

# Modify openProfile call
content = re.sub(
    r'onclick=\"openProfile\(\'\$\{partner\.name\}\', \'\$\{partner\.region\} · \$\{partner\.place\}\', \'\$\{partner\.id\}\', \$\{partner\.reviews\}, \$\{partner\.rating\}, \'\$\{partner\.massage\}\', \'\$\{partner\.place\}\', \'\$\{partner\.age\}\', \'\$\{partner\.image\}\'\)\"',
    r'onclick=\"openProfile(\'${partner.name}\', \'${partner.region} · ${partner.place}\', \'${partner.id}\', 0, 0, \'${partner.massage}\', \'${partner.place}\', \'${partner.age}\', \'${partner.image}\', \'${partner.ticketType || \'일반 입점\'}\', \'${partner.ticketExpiry || \'\'}\')\"',
    content
)

# openProfile signature
content = re.sub(
    r'function openProfile\(name, desc, id, reviews, rating, massage, place, age, image\) {',
    r'function openProfile(name, desc, id, reviews, rating, massage, place, age, image, ticketType, ticketExpiry) {',
    content
)

content = re.sub(
    r'currentPartner = { name, desc, id, reviews, rating, massage, place, age, image };',
    r'currentPartner = { name, desc, id, reviews, rating, massage, place, age, image, ticketType, ticketExpiry };',
    content
)

# And inside openProfile from favorites
content = re.sub(
    r'function openProfileFromFavorites\(name, desc, id, reviews, rating, massage, place, age, image\) {',
    r'function openProfileFromFavorites(name, desc, id, reviews, rating, massage, place, age, image, ticketType, ticketExpiry) {',
    content
)
content = re.sub(
    r'openProfile\(name, desc, id, reviews, rating, massage, place, age, image\);',
    r'openProfile(name, desc, id, reviews, rating, massage, place, age, image, ticketType, ticketExpiry);',
    content
)

content = re.sub(
    r'onclick=\"openProfileFromFavorites\(\'\$\{partner\.name\}\', \'\$\{partner\.desc\}\', \'\$\{partner\.id\}\', \$\{partner\.reviews\}, \$\{partner\.rating\}, \'\$\{partner\.massage\}\', \'\$\{partner\.place\}\', \'\$\{partner\.age\}\', \'\$\{partner\.image\}\'\)\"',
    r'onclick=\"openProfileFromFavorites(\'${partner.name}\', \'${partner.desc}\', \'${partner.id}\', 0, 0, \'${partner.massage}\', \'${partner.place}\', \'${partner.age}\', \'${partner.image}\', \'${partner.ticketType || \'일반 입점\'}\', \'${partner.ticketExpiry || \'\'}\')\"',
    content
)

# Modify profile rendering (hide rating and reviews) inside openProfile
# In openProfile, it does:
# document.getElementById('profile-rating-display').innerText = finalRating.toFixed(1);
# document.getElementById('profile-review-display').innerText = `방문자 찐리뷰 ${totalCount}개 확인하기`;
content = re.sub(
    r"document\.getElementById\('profile-rating-display'\)\.innerText = finalRating\.toFixed\(1\);\s*document\.getElementById\('profile-review-display'\)\.innerText = `방문자 찐리뷰 \$\{totalCount\}개 확인하기`;",
    r"document.getElementById('profile-rating-display').innerText = ticketType || '일반 입점';\n                    document.getElementById('profile-review-display').innerText = ticketExpiry ? `입점권 만료일: ${ticketExpiry}` : '';",
    content
)


# Replace the HTML block displaying rating and reviews in the card grid lists
html_target = r'<span class=\"text-\[var\(--point-color\)\] font-bold flex items-center gap-1\"><svg[^>]+><path[^>]+></path></svg>\s*<span class=\"partner-rating-badge\"[^>]+>\$\{stats\.rating\}</span></span>\s+<span style=\"color: var\(--text-sub\);\w*\">(?:\(리뷰 |)\s*<span class=\"partner-reviews-badge\"[^>]+>\$\{stats\.count\}</span>\)?</span>'

html_replacement = r"""<span class="text-[var(--point-color)] font-bold flex items-center gap-1">👑 <span class="partner-ticket-badge" data-partner-id="${partner.id}">${partner.ticketType || '일반 입점'}</span></span>
                                ${partner.ticketExpiry ? `<span style="color: var(--text-sub);">(~ ${partner.ticketExpiry})</span>` : ''}"""

content = re.sub(html_target, html_replacement, content)

with open('assets/js/script.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Replacement complete")
