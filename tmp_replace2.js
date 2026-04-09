const fs = require('fs');
let file = fs.readFileSync('assets/js/script.js', 'utf8');

// Replace all onclick="openProfile(..., ...)"
// Looking for onclick="openProfile('')"
const target = "onclick=\"openProfile('', ' ¡¤ ', '', , , '', '', '', '')\"";
// It's easier just to pass the exact objects but escape them via JSON.stringify or just use &quot;.
// Let's use a regex that matches onclick="openProfile([^"]+)" and rewrites it clean.

file = file.replace(/onclick="openProfile\([^"]+\)"/g, (match) => {
    // We rewrite the invocation
    return onclick="openProfile(\\\, \\ ¡¤ \\, '\', \, \, '\', '\', '\', '\')";
});

// Remove the strict isDraggingCard prevention from sliderWrapper:
file = file.replace(/if\s*\(isDraggingCard\)\s*\{\s*e\.preventDefault\(\);\s*e\.stopPropagation\(\);\s*isDraggingCard\s*=\s*false;\s*\}/g, "/* isDraggingCard block removed */");

// Also check openProfileFromFavorites
file = file.replace(/onclick="openProfileFromFavorites\([^"]+\)"/g, (match) => {
    return onclick="openProfileFromFavorites(\\\, \\\, '\', \, \, '\', '\', '\', '\')";
});

fs.writeFileSync('assets/js/script.js', file);
console.log('Replaced onclick and removed isDragging blocker.');
