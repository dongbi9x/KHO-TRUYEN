const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const JSZip = require('jszip');
const fs = require('fs');
const { execSync } = require('child_process');

async function crawlAndPush(startUrl) {
    console.log("🚀 Bot v22.0 - Structure chuẩn ReadWN (Home -> Gen)...");
    
    // --- PHẦN 1: CÀO TRUYỆN & TẠO EPUB (Giữ nguyên logic cũ) ---
    // (Tôi rút gọn phần log cào để tập trung vào phần đóng gói bên dưới)
    const browser = await puppeteer.launch({ headless: false }); 
    const page = await browser.newPage();
    let chapters = [];
    let currentUrl = startUrl;
    let storyInfo = { title: 'Truyen_Moi', cover: '' };

    try {
        // Cào 5 chương demo
        while (currentUrl && chapters.length < 5) { 
            console.log(`Processing: ${currentUrl}`);
            await page.goto(currentUrl, { waitUntil: 'networkidle2' });
            const data = await page.evaluate(() => {
                const sTitle = document.querySelector('.name-story, h1.title-story')?.innerText.trim();
                const cTitle = document.querySelector('h1, .chapter-title')?.innerText.trim();
                const coverImg = document.querySelector('.book-info img, .info-cover img')?.src || '';
                const content = document.querySelector('#chapter-c, .chapter-content')?.innerHTML || "";
                return { sTitle, cTitle, html: content, coverImg };
            });
            if (chapters.length === 0) { storyInfo.title = data.sTitle || "Truyen_Khong_Ten"; storyInfo.cover = data.coverImg; }
            chapters.push({ title: data.cTitle, html: data.html });
            currentUrl = currentUrl.replace(/(\d+)(\.html)$/, (m, p1, p2) => (parseInt(p1) + 1) + p2);
        }

        // Tạo EPUB
        const storyZip = new JSZip();
        storyZip.file("mimetype", "application/epub+zip");
        // ... (Code tạo EPUB chuẩn như trước) ...
        const oebps = storyZip.folder("OEBPS");
        let manifest = "", spine = "";
        chapters.forEach((ch, i) => {
            const fname = `chapter_${i}.xhtml`;
            oebps.file(fname, `<html xmlns="http://www.w3.org/1999/xhtml"><body><h3>${ch.title}</h3>${ch.html}</body></html>`);
            manifest += `<item href="${fname}" id="id${i}" media-type="application/xhtml+xml"/>`;
            spine += `<itemref idref="id${i}"/>`;
        });
        oebps.file("content.opf", `<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf" unique-identifier="id" version="2.0"><metadata><dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">${storyInfo.title}</dc:title></metadata><manifest>${manifest}<item href="toc.ncx" id="ncx" media-type="application/x-dtbncx+xml"/></manifest><spine toc="ncx">${spine}</spine></package>`);
        oebps.file("toc.ncx", `<?xml version="1.0"?><ncx xmlns="http://www.idpf.org/2000/ncx/" version="2005-1"><navMap></navMap></ncx>`);
        
        const epubBuffer = await storyZip.generateAsync({type: "nodebuffer"});
        const epubName = `${storyInfo.title.replace(/\s+/g, '_')}.epub`;
        fs.writeFileSync(epubName, epubBuffer);

        // Update list.json
        let list = fs.existsSync('list.json') ? JSON.parse(fs.readFileSync('list.json', 'utf8')) : [];
        if (!list.find(i => i.title === storyInfo.title)) {
            list.push({ title: storyInfo.title, url: `https://raw.githubusercontent.com/dongbi9x/KHO-TRUYEN/main/${epubName}`, cover: storyInfo.cover });
            fs.writeFileSync('list.json', JSON.stringify(list, null, 2));
        }

        // --- PHẦN 2: TẠO SRC CODE THEO CHUẨN READWN ---
        console.log("📦 Đang tạo cấu trúc src/ giống mẫu ReadWN...");
        if (!fs.existsSync('src')) fs.mkdirSync('src');

        // 1. home.js (Chỉ hiện Menu, trỏ sang gen.js)
        fs.writeFileSync('src/home.js', `function execute() {
    return Response.success([
        {title: "Cập nhật mới", input: "https://raw.githubusercontent.com/dongbi9x/KHO-TRUYEN/main/list.json", script: "gen.js"}
    ]);
}`);

        // 2. gen.js (Xử lý danh sách truyện từ JSON)
        fs.writeFileSync('src/gen.js', `function execute(url, page) {
    var response = fetch(url);
    if (response.ok) {
        var json = JSON.parse(response.string());
        var data = json.map(function(item) {
            return {
                name: item.title,
                link: item.url,
                cover: item.cover || "https://via.placeholder.com/150",
                description: "Dongbi9x",
                host: "https://raw.githubusercontent.com"
            };
        });
        return Response.success(data);
    }
    return null;
}`);

        // 3. detail.js (Thông tin truyện)
        fs.writeFileSync('src/detail.js', `function execute(url) {
    return Response.success({
        name: "Truyện EPUB",
        cover: "https://via.placeholder.com/150",
        author: "Dongbi9x",
        description: "Truyện sạch đã lọc quảng cáo.",
        detail: "Kho truyện cá nhân",
        host: "https://raw.githubusercontent.com"
    });
}`);

        // 4. toc.js (Mục lục - Trả về 1 chương download)
        fs.writeFileSync('src/toc.js', `function execute(url) {
    return Response.success([{
        name: "Tải xuống EPUB (Nhấn vào đây)",
        url: url,
        host: "https://raw.githubusercontent.com"
    }]);
}`);

        // 5. chap.js (Xử lý khi bấm tải)
        fs.writeFileSync('src/chap.js', `function execute(url) {
    // Trả về link để vBook tự xử lý hoặc hiển thị thông báo
    return Response.success("Link tải: " + url);
}`);

        // 6. plugin.json (BÊN TRONG ZIP - Cấu trúc y hệt ReadWN)
        // Lưu ý: type "novel" và script không cần "src/"
        const internalJson = {
            "metadata": {
                "name": "Kho Dongbi9x",
                "author": "dongbi9x",
                "version": 1,
                "source": "https://github.com/dongbi9x",
                "type": "novel"
            },
            "script": {
                "home": "home.js",
                "gen": "gen.js",
                "detail": "detail.js",
                "toc": "toc.js",
                "chap": "chap.js"
            }
        };

        // --- PHẦN 3: ĐÓNG GÓI ZIP (CÓ THƯ MỤC SRC) ---
        const finalZip = new JSZip();
        finalZip.file("plugin.json", JSON.stringify(internalJson, null, 2)); // File gốc
        const srcFolder = finalZip.folder("src"); // Tạo folder src trong zip
        
        // Nạp code vào folder src trong zip
        srcFolder.file("home.js", fs.readFileSync('src/home.js'));
        srcFolder.file("gen.js", fs.readFileSync('src/gen.js'));
        srcFolder.file("detail.js", fs.readFileSync('src/detail.js'));
        srcFolder.file("toc.js", fs.readFileSync('src/toc.js'));
        srcFolder.file("chap.js", fs.readFileSync('src/chap.js'));

        const content = await finalZip.generateAsync({type: "nodebuffer"});
        fs.writeFileSync('plugin.zip', content);

        // --- PHẦN 4: UPDATE FILE STORE (BÊN NGOÀI) ---
        const storeJson = {
            "metadata": { "author": "dongbi9x", "description": "Kho truyện sạch" },
            "data": [{
                "name": "Kho Dongbi9x (ReadWN Style)",
                "author": "dongbi9x",
                "path": "https://raw.githubusercontent.com/dongbi9x/KHO-TRUYEN/main/plugin.zip",
                "version": new Date().getTime(), // Luôn mới để ép update
                "type": "novel"
            }]
        };
        fs.writeFileSync('plugin.json', JSON.stringify(storeJson, null, 2));

        // --- PHẦN 5: PUSH GITHUB ---
        console.log("📤 Đang đẩy lên GitHub...");
        if(fs.existsSync('plugin.zip')) {
            execSync('git add .');
            execSync('git commit -m "Update structure to match ReadWN example"');
            execSync('git push origin main');
        }
        console.log("✅ Xong! Link add nguồn bên dưới:");
        console.log(`https://raw.githubusercontent.com/dongbi9x/KHO-TRUYEN/main/plugin.json?v=${new Date().getTime()}`);

    } catch (e) { console.error(e); } finally { await browser.close(); }
}

const targetUrl = process.argv[2];
if (targetUrl) crawlAndPush(targetUrl);