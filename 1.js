const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const JSZip = require('jszip');
const fs = require('fs');
const { execSync } = require('child_process');

async function crawlAndPush(startUrl) {
    console.log("🚀 Bot v23.0 - Chế độ Phẳng (Flat Mode) & Direct Zip...");
    
    // 1. Cào dữ liệu & Tạo EPUB (Giữ nguyên logic cũ)
    const browser = await puppeteer.launch({ headless: false }); 
    const page = await browser.newPage();
    let chapters = [];
    let currentUrl = startUrl;
    let storyInfo = { title: 'Truyen_Moi', cover: '' };

    try {
        while (currentUrl && chapters.length < 5) { // Demo 5 chương
            console.log(`Đang lấy: ${currentUrl}`);
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

        // Tạo file EPUB
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

        // 2. TẠO FILE ZIP (CẤU TRÚC PHẲNG - KHÔNG THƯ MỤC CON)
        console.log("📦 Đang đóng gói plugin.zip (Flat)...");
        const finalZip = new JSZip();

        // -> Tạo nội dung file Home.js (Gọi Gen.js)
        const homeJsContent = `function execute() {
    return Response.success([
        {title: "Danh Sách Truyện", input: "https://raw.githubusercontent.com/dongbi9x/KHO-TRUYEN/main/list.json", script: "gen.js"}
    ]);
}`;
        // -> Tạo nội dung file Gen.js (Xử lý list.json)
        const genJsContent = `function execute(url, page) {
    var response = fetch(url);
    if (response.ok) {
        try {
            var json = JSON.parse(response.string());
            var data = json.map(item => ({
                name: item.title,
                link: item.url,
                cover: item.cover || "https://via.placeholder.com/150",
                description: "Dongbi9x Repo",
                host: "https://github.com"
            }));
            return Response.success(data);
        } catch (e) { return Response.error("Lỗi JSON: " + e.message); }
    }
    return Response.error("Lỗi kết nối");
}`;
        // -> Tạo nội dung file Toc.js
        const tocJsContent = `function execute(url) {
    return Response.success([{
        name: "Tải EPUB Ngay",
        url: url,
        host: "https://github.com"
    }]);
}`;
        
        // -> Nạp thẳng vào gốc file Zip (QUAN TRỌNG)
        finalZip.file("home.js", homeJsContent);
        finalZip.file("gen.js", genJsContent);
        finalZip.file("detail.js", `function execute(url) { return Response.success({name: "Truyện EPUB", cover: "", description: "Tải tại mục danh sách", detail: "...", host: ""}); }`);
        finalZip.file("toc.js", tocJsContent);
        finalZip.file("chap.js", `function execute(url) { return Response.success("Link: " + url); }`);
        
        // -> File plugin.json nội bộ (Cũng nằm ở gốc Zip)
        finalZip.file("plugin.json", JSON.stringify({
            "metadata": {
                "name": "Kho Dongbi9x (Flat)",
                "author": "dongbi9x",
                "version": 2026,
                "source": "https://github.com/dongbi9x",
                "type": "novel"
            },
            "script": {
                "home": "home.js", // Không còn src/ nữa
                "gen": "gen.js",
                "detail": "detail.js",
                "toc": "toc.js",
                "chap": "chap.js"
            }
        }, null, 2));

        const content = await finalZip.generateAsync({type: "nodebuffer"});
        fs.writeFileSync('plugin.zip', content);

        // 3. ĐẨY LÊN GITHUB
        console.log("📤 Push lên GitHub...");
        execSync('git add .');
        execSync('git commit -m "Update Flat Zip v23"');
        execSync('git push origin main');
        
        console.log("✅ XONG! Hãy dùng Link Zip bên dưới:");
        console.log(`https://raw.githubusercontent.com/dongbi9x/KHO-TRUYEN/main/plugin.zip?v=${new Date().getTime()}`);

    } catch (e) { console.error(e); } finally { await browser.close(); }
}

const targetUrl = process.argv[2];
if (targetUrl) crawlAndPush(targetUrl);