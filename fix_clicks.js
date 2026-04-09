const fs = require('fs');

let file = fs.readFileSync('assets/js/script.js', 'utf8');

// The original strings (from my initial attempt which didn't quote correctly or whatever)
// Let's replace the whole onclick block for generating list items.
// They match things like: onclick="openProfile('\', '\ ¡¤ \'....)

// Safer regex that finds onclick="openProfile( ... )" and replaces single quotes with encoded values just in case.
// Actually, it's easiest to write a custom replacer that just injects \\\ ... wait!
// HTML is evaluated first. So inside HTML, we use &apos; or &#39;.
// Let's just use JSON.stringify but strip double quotes or use single quotes.

// We can just find all the card divs and inject the safe onclick.
file = file.replace(/onclick="openProfile\([^"]+\)"/g, (match) => {
    // Instead of messing with single quotes and escapes, let's just make it call the function.
    // The safest way is to use HTML entities!
    // Example: onclick="openProfile('\', ... )"
    return onclick="openProfile('\', '\ ¡¤ \', '\', \, \, '\', '\', '\', '\')";
});

// Fix favorites as well
file = file.replace(/onclick="openProfileFromFavorites\([^"]+\)"/g, (match) => {
    return onclick="openProfileFromFavorites('\', '\', '\', \, \, '\', '\', '\', '\')";
});

// MOST IMPORTANTLY: REMOVE the drag interceptor entirely to guarantee clicks are not eaten!
// Find the exact block for sliderWrapper click interception:
file = file.replace(/sliderWrapper\.addEventListener\('click',\s*\(e\)\s*=>\s*\{[\s\S]*?\},\s*true\);/g, "/* Interceptor removed */");

// ALSO remove isDraggingCard entirely inside mousemove so we don't do weird stuff
file = file.replace(/if\s*\(Math\.abs\(walk\)\s*>\s*5\)\s*isDraggingCard\s*=\s*true;/g, "/* isDragging disabled */");

fs.writeFileSync('assets/js/script.js', file);
console.log('Fixed script.js!');

