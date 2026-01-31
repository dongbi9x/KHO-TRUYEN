const fs = require('fs');
const { execSync } = require('child_process');

// 1. TẠO FILE PLUGIN.JSON (CHO VBOOK)
const plugin = {
  metadata: {
    name: "Kho Dongbi9x",
    author: "Dongbi9x",
    version: 1,
    source: "https://github.com/dongbi9x",
    type: "novel",
    locale: "vi_VN"
  },
  script: {
    home: "src/home.js",
    detail: "src/detail.js",
    toc: "src/toc.js",
    chap: "src/chap.js"
  }
};
fs.writeFileSync('plugin.json', JSON.stringify(plugin, null, 2));

// 2. TẠO GIAO DIỆN WEB (CÓ NÚT VÀ TÌM KIẾM)
const webCode = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>
        body { background: #121212; color: #fff; font-family: sans-serif; padding: 15px; margin: 0; }
        .sticky-top { position: sticky; top: 0; background: #121212; padding: 10px 0; border-bottom: 2px solid #333; z-index: 99; }
        .vbook-btn { display: block; background: #ff9800; color: #000; text-align: center; padding: 15px; border-radius: 10px; font-weight: bold; text-decoration: none; margin-bottom: 15px; font-size: 18px; border: 3px solid #fff; }
        #search { width: 100%; padding: 12px; border-radius: 8px; border: none; margin-bottom: 10px; box-sizing: border-box; font-size: 16px; }
        .item { background: #1e1e1e; padding: 15px; margin: 10px 0; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #444; }
        .title { color: #0f8; font-weight: bold; font-size: 16px; }
        .btn-download { background: #007bff; color: #fff; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-weight: bold; }
        h2 { text-align: center; color: #fc0; margin: 5px 0; }
    </style>
</head>
<body>
    <div class="sticky-top">
        <h2>🚀 KHO TRUYỆN DONGBI9X</h2>
        <a href="vbook://add-extension?url=https://raw.githubusercontent.com/dongbi9x/KHO-TRUYEN/main/plugin.json" class="vbook-btn">➕ THÊM VÀO VBOOK (CLICK ĐÂY)</a>
        <input type="text" id="search" placeholder="🔍 Tìm tên truyện..." onkeyup="doSearch()">
    </div>
    <div id="list">Đang tải danh sách...</div>

    <script>
        let data = [];
        fetch('list.json?v=' + Date.now())
            .then(r => r.json())
            .then(json => {
                data = json;
                show(data);
            });

        function show(arr) {
            let h = '';
            arr.forEach(i => {
                h += '<div class="item"><div class="title">' + i.title + '</div><a href="' + i.url + '" class="btn-download">TẢI EPUB</a></div>';
            });
            document.getElementById('list').innerHTML = h || '<p>Không tìm thấy truyện</p>';
        }

        function doSearch() {
            let k = document.getElementById('search').value.toLowerCase();
            show(data.filter(i => i.title.toLowerCase().includes(k)));
        }
    </script>
</body>
</html>`;

fs.writeFileSync('index.html', webCode);

// 3. QUÉT TRUYỆN VÀ PUSH GITHUB
console.log('--- Đang quét file ---');
const files = fs.readdirSync('./').filter(f => f.endsWith('.epub'));
const list = files.map(f => ({
    title: f.replace('.epub', ''),
    url: 'https://raw.githubusercontent.com/dongbi9x/KHO-TRUYEN/main/' + encodeURIComponent(f)
}));
fs.writeFileSync('list.json', JSON.stringify(list, null, 2));

try {
    execSync('git add .');
    execSync('git commit -m "Update full"');
    execSync('git push origin main');
    console.log('✅ ĐÃ XONG! LÊN HÀNG RỒI.');
} catch (e) {
    console.log('❌ Lỗi Git!');
}