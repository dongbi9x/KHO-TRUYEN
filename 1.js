const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const JSZip = require('jszip');
const fs = require('fs');
const { execSync } = require('child_process');

async function crawlAndPush(startUrl) {
    console.log("🚀 Bot v24 - FIX 'EXTENSION ERROR'...");
    
    // --- BƯỚC 1: CÀO TRUYỆN (Giữ nguyên) ---
    const browser = await puppeteer.launch({ headless: false }); 
    const page = await browser.newPage();
    let chapters = [];
    let currentUrl = startUrl;
    let storyInfo = { title: 'Truyen_Moi', cover: '' };

    try {
        // Demo 5 chương
        while (currentUrl && chapters.length < 5) { 
            console.log(`Đang xử lý: ${currentUrl}`);
            await page.goto(currentUrl, { waitUntil: 'networkidle2' });
            const data = await page.evaluate(() => {
                const sTitle = document.querySelector('.name-story, h1.title-story')?.innerText.trim();
                const cTitle = document.querySelector('h1, .chapter-title')?.innerText.trim();
                const content = document.querySelector('#chapter-c, .chapter-content')?.innerHTML || "";
                return { sTitle, cTitle, html: content };
            });
            if (chapters.length === 0) storyInfo.title = data.sTitle || "Truyen_Khong_Ten";
            chapters.push(data);
            currentUrl = currentUrl.replace(/(\d+)(\.html)$/, (m, p1, p2) => (parseInt(p1) + 1) + p2);
        }

        // Tạo EPUB
        const storyZip = new JSZip();
        storyZip.file("mimetype", "application/epub+zip");
        const oebps = storyZip.folder("OEBPS");
        let manifest = "", spine = "";
        chapters.forEach((ch, i) => {
            oebps.file(`chapter_${i}.xhtml`, `<html xmlns="http://www.w3.org/1999/xhtml"><body><h3>${ch.cTitle}</h3>${ch.html}</body></html>`);
            manifest += `<item href="chapter_${i}.xhtml" id="id${i}" media-type="application/xhtml+xml"/>`;
            spine += `<itemref idref="id${i}"/>`;
        });
        oebps.file("content.opf", `<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf" unique-identifier="id" version="2.0"><metadata><dc:title>${storyInfo.title}</dc:title></metadata><manifest>${manifest}<item href="toc.ncx" id="ncx" media-type="application/x-dtbncx+xml"/></manifest><spine toc="ncx">${spine}</spine></package>`);
        oebps.file("toc.ncx", `<?xml version="1.0"?><ncx xmlns="http://www.idpf.org/2000/ncx/" version="2005-1"><navMap></navMap></ncx>`);
        
        const epubBuffer = await storyZip.generateAsync({type: "nodebuffer"});
        const epubName = `${storyInfo.title.replace(/\s+/g, '_')}.epub`;
        fs.writeFileSync(epubName, epubBuffer);

        // Update list.json
        let list = fs.existsSync('list.json') ? JSON.parse(fs.readFileSync('list.json', 'utf8')) : [];
        if (!list.find(i => i.title === storyInfo.title)) {
            list.push({ title: storyInfo.title, url: `https://raw.githubusercontent.com/dongbi9x/KHO-TRUYEN/main/${epubName}`, cover: "" });
            fs.writeFileSync('list.json', JSON.stringify(list, null, 2));
        }

        // --- BƯỚC 2: TẠO FILE ZIP FIX LỖI (QUAN TRỌNG) ---
        console.log("📦 Đang tạo plugin.zip với logic JSON...");
        const finalZip = new JSZip();

        // 1. home.js: Chỉ đường dẫn tới list.json
        finalZip.file("home.js", `function execute() {
    return Response.success([
        {title: "Danh Sách Truyện", input: "https://raw.githubusercontent.com/dongbi9x/KHO-TRUYEN/main/list.json", script: "gen.js"}
    ]);
}`);

        // 2. gen.js: ĐỌC JSON (Khác hoàn toàn ReadWN đọc HTML)
        finalZip.file("gen.js", `function execute(url, page) {
    var response = fetch(url);
    if (response.ok) {
        var json = JSON.parse(response.string());
        var data = [];
        json.forEach(function(item){
            data.push({
                name: item.title,
                link: item.url,
                cover: item.cover || "https://via.placeholder.com/150",
                description: "Dongbi9x Repo",
                host: "https://github.com"
            });
        });
        return Response.success(data);
    }
    return Response.success([]);
}`);

        // 3. toc.js: Trả về link tải EPUB
        finalZip.file("toc.js", `function execute(url) {
    return Response.success([{
        name: "Tải EPUB Ngay",
        url: url,
        host: "https://github.com"
    }]);
}`);

        // 4. chap.js & detail.js (Cơ bản)
        finalZip.file("chap.js", `function execute(url) { return Response.success("Link: " + url); }`);
        finalZip.file("detail.js", `function execute(url) { 
            return Response.success({
                name: "Truyện EPUB", cover: "", description: "Tải tại mục danh sách", detail: "...", host: ""
            }); 
        }`);

        // 5. plugin.json: Cấu hình chuẩn, KHÔNG dùng src/
        finalZip.file("plugin.json", JSON.stringify({
            "metadata": {
                "name": "Kho Dongbi9x (Fixed)",
                "author": "dongbi9x",
                "version": 2026,
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
        }, null, 2));

        const content = await finalZip.generateAsync({type: "nodebuffer"});
        fs.writeFileSync('plugin.zip', content);

        // --- BƯỚC 3: PUSH LÊN GITHUB ---
        console.log("📤 Đang đẩy lên GitHub...");
        try {
            execSync('git add .');
            execSync('git commit -m "Fix Extension Error Logic"');
            execSync('git push origin main');
        } catch (e) { console.log("Git status: Có thể chưa có thay đổi mới."); }
        
        console.log("✅ XONG! LÀM THEO HƯỚNG DẪN BÊN DƯỚI ĐỂ CÀI ĐẶT.");

    } catch (e) { console.error(e); } finally { await browser.close(); }
}

const targetUrl = process.argv[2];
if (targetUrl) crawlAndPush(targetUrl);