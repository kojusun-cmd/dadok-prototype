const fs = require('fs');
let file = fs.readFileSync('index.html', 'utf8');

// Replace the first banner-slide to have openProfile ('루비 스파')
file = file.replace(
    /<div class="banner-slide min-w-full h-full bg-cover bg-center relative" style="background-image: url\('assets\/images\/banner1\.jpg'\);">/,
    <div class="banner-slide min-w-full h-full bg-cover bg-center relative cursor-pointer" onclick="if(typeof openProfile==='function') openProfile('루비 스파', '강남 · 1인샵', 'ruby-spa', 150, 4.9, '스웨디시', '1인샵', '20대', 'https://source.unsplash.com/random/300x300?massage&1')" style="background-image: url('assets/images/banner1.jpg');">
);

// Replace the second banner-slide to have openProfile ('퀸 테라피')
file = file.replace(
    /<div class="banner-slide min-w-full h-full bg-cover bg-center relative" style="background-image: url\('assets\/images\/banner2\.jpg'\);">/,
    <div class="banner-slide min-w-full h-full bg-cover bg-center relative cursor-pointer" onclick="if(typeof openProfile==='function') openProfile('퀸 테라피', '건대 · 로드샵', 'queen-therapy', 89, 4.8, '아로마', '로드샵', '30대', 'https://source.unsplash.com/random/300x300?massage&2')" style="background-image: url('assets/images/banner2.jpg');">
);

fs.writeFileSync('index.html', file);
console.log('index.html banners updated.');
