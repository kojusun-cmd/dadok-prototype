import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace star icon with a crown and change rating/review ids.
target = r'<div class=\"flex items-center gap-1\.5 text-\[var\(--point-color\)\]\">\s*<svg[^>]+>\s*<path[^>]+>\s*</path>\s*</svg>\s*<span id=\"profile-rating-display\">4\.9</span>\s*</div>\s*<div class=\"h-4 w-px bg-\[var\(--border-color\)\]\"></div>\s*<span id=\"profile-review-display\" class=\"text-\[17\.5px\] font-medium\"\s*style=\"color: var\(--text-main\);\">(방문자 찐리뷰 6개 확인하기)</span>'

replacement = r'''<div class="flex items-center gap-1.5 text-[var(--point-color)]">
                            <span class="text-[20px]">👑</span>
                            <span id="profile-rating-display" class="font-bold">프리미엄 입점권</span>
                        </div>
                        <div class="h-4 w-px bg-[var(--border-color)]"></div>
                        <span id="profile-review-display" class="text-[15px] font-medium"
                            style="color: var(--text-sub);">만료일: -</span>'''

content = re.sub(target, replacement, content)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("index.html patched")
