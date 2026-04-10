const fs = require('fs');
const text1 = fs.readFileSync('assets/js/script.js', 'utf8');
const text2 = fs.readFileSync('index.html', 'utf8');
const fns = new Set();
[text1, text2].forEach(text => {
    const lines = text.split('\n');
    lines.forEach(l => {
        let idx = l.indexOf('onclick="');
        if (idx !== -1) {
            let sub = l.substring(idx + 9);
            let end = sub.indexOf('(');
            let endQuote = sub.indexOf('"');
            if (end !== -1 && end < 40 && end < endQuote) {
                let fname = sub.substring(0, end).trim();
                // some simple heuristic to drop standard JS inside onclick like event.stopPropagation
                if(fname && !fname.includes('.')) {
                    fns.add(fname);
                }
            }
        }
    });
});
console.log(Array.from(fns).map(f => `window.${f} = ${f};`).join('\n'));
