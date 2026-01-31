const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const JSZip = require('jszip');
const fs = require('fs');
const { execSync } = require('child_process');

async function crawlAndPush(startUrl) {
    console.log("🚀 Bot v26 - Chế độ Siêu Tương Thích (Super Flat)...");
    
    // 1. Cào dữ liệu (Giữ nguyên)
    const browser = await puppeteer.launch({ headless: false }); 
    const page = await browser.newPage();
    let chapters = [];
    let currentUrl = startUrl;
    let storyInfo = { title: 'Truyen_Moi', cover: '' };

    try {
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

        // --- TẠO ZIP V26 (Cấu trúc phẳng - An toàn nhất) ---
        console.log("📦 Đang tạo plugin.zip chuẩn...");
        const finalZip = new JSZip();

        // Nạp file JS trực tiếp vào gốc (Không dùng folder src để tránh lỗi đường dẫn)
        finalZip.file("home.js", `function execute() { return Response.success([{title: "Danh Sách Truyện", input: "https://raw.githubusercontent.com/dongbi9x/KHO-TRUYEN/main/list.json", script: "gen.js"}]); }`);
        
        finalZip.file("gen.js", `function execute(url, page) {
            var response = fetch(url);
            if (response.ok) {
                var json = JSON.parse(response.string());
                var data = json.map(item => ({
                    name: item.title, link: item.url, cover: "https://via.placeholder.com/150", description: "EPUB", host: "https://github.com"
                }));
                return Response.success(data, null);
            }
            return Response.success([]); 
        }`);

        finalZip.file("toc.js", `function execute(url) { return Response.success([{name: "Tải EPUB", url: url, host: "https://github.com"}]); }`);
        finalZip.file("chap.js", `function execute(url) { return Response.success("Link: " + url); }`);
        finalZip.file("detail.js", `function execute(url) { return Response.success({name: "Truyện EPUB", cover: "", description: "...", detail: "...", host: ""}); }`);
        finalZip.file("page.js", `function execute(url) { return Response.success([]); }`);

        // Plugin.json nằm cùng cấp với các file JS
        finalZip.file("plugin.json", JSON.stringify({
            "metadata": { "name": "Kho Dongbi9x", "author": "dongbi9x", "version": 2026, "source": "https://github.com/dongbi9x", "type": "novel" },
            "script": { "home": "home.js", "gen": "gen.js", "detail": "detail.js", "toc": "toc.js", "chap": "chap.js", "page": "page.js" }
        }, null, 2));

        const content = await finalZip.generateAsync({type: "nodebuffer"});
        fs.writeFileSync('plugin.zip', content);

        console.log("📤 Đang đẩy lên GitHub...");
        try { execSync('git add .'); execSync('git commit -m "Update v26 Flat Structure"'); execSync('git push origin main'); } catch (e) {}
        
        console.log("✅ XONG! File plugin.zip đã sẵn sàng.");

    } catch (e) { console.error(e); } finally { await browser.close(); }
}

const targetUrl = process.argv[2];
if (targetUrl) crawlAndPush(targetUrl);