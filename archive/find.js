const fs = require('fs');
const lines = fs.readFileSync('assets/js/script.js', 'utf8').split('\n');
lines.forEach((l, i) => {
    if (l.includes('openProfile(') || l.includes('openProfileFromFavorites(')) {
        console.log(i + 1, l.trim());
    }
});
