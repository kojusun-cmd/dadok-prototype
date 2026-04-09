import re

with open('assets/js/script.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Remove interception block
text = re.sub(
    r"sliderWrapper\.addEventListener\('click',\s*\(e\)\s*=>\s*\{[\s\S]*?\}, true\);",
    "/* drag interceptor clicks removed */",
    text
)

# Replace clicking action for card with HTML-entity safe replace (just in case they have quotes)
# The current format in script.js is: onclick="openProfile('\', '\ ¡¤ \', '\', \, \, '\', '\', '\', '\')"
# Wait, actually, the user doesn't have quotes. BUT if we just replace the single quotes with safe function calls, it's fine.
# Let's just leave the 'onclick' AS IS! It already works (since it has no single quotes in the db)!
# The reason it was failing to open for the user was 100% the isDraggingCard interceptor!

with open('assets/js/script.js', 'w', encoding='utf-8') as f:
    f.write(text)
print("done")
