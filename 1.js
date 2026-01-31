const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const JSZip = require('jszip');
const fs = require('fs');
const { execSync } = require('child_process');

async function crawlAndPush(startUrl) {
    console.log("🚀 Bot v21.0 - Cấu trúc đa file chuyên nghiệp...");
    const browser = await puppeteer.launch({ headless: false }); 
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');

    let chapters = [];
    let currentUrl = startUrl;
    let storyInfo = { title: 'Truyen_Moi', cover: '' };

    try {
        // --- BƯỚC 1: CÀO TRUYỆN ---
        // Mặc định lấy 5 chương để test, sửa số 5 thành số lớn hơn để lấy full
        while (currentUrl && chapters.length < 5) { 
            console.log(`🚀 Đang lấy: ${currentUrl}`);
            await page.goto(currentUrl, { waitUntil: 'networkidle2' });
            
            const data = await page.evaluate(() => {
                const sTitle = document.querySelector('.name-story, h1.title-story')?.innerText.trim();
                const cTitle = document.querySelector('h1, .chapter-title')?.innerText.trim();
                const coverImg = document.querySelector('.book-info img, .info-cover img')?.src || '';
                const contentArea = document.querySelector('#chapter-c') || document.querySelector('.chapter-content');
                let html = "";
                if (contentArea) {
                    const ps = Array.from(contentArea.querySelectorAll('p')).map(p => p.innerText.trim()).filter(t => t.length > 5);
                    html = ps.map(p => `<p>${p}</p>`).join('');
                }
                return { sTitle, cTitle, html, coverImg };
            });

            if (chapters.length === 0) {
                storyInfo.title = data.sTitle || "Truyen_Khong_Ten";
                storyInfo.cover = data.coverImg;
            }
            chapters.push({ title: data.cTitle, html: data.html });
            currentUrl = currentUrl.replace(/(\d+)(\.html)$/, (m, p1, p2) => (parseInt(p1) + 1) + p2);
            await new Promise(r => setTimeout(r, 1000));
        }

        // --- BƯỚC 2: ĐÓNG GÓI EPUB ---
        const storyZip = new JSZip();
        storyZip.file("mimetype", "application/epub+zip");
        const oebps = storyZip.folder("OEBPS");
        let manifest = ""; let spine = ""; let navMap = "";
        chapters.forEach((ch, i) => {
            const fileId = (i + 1).toString().padStart(4, '0');
            const fileName = `chapter_${fileId}.xhtml`;
            oebps.file(fileName, `<?xml version="1.0" encoding="utf-8"?><!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml"><head><title>${ch.title}</title></head><body><h3>${ch.title}</h3>${ch.html}</body></html>`);
            manifest += `<item href="${fileName}" id="id${fileId}" media-type="application/xhtml+xml"/>\n`;
            spine += `<itemref idref="id${fileId}"/>\n`;
            navMap += `<navPoint id="nav${fileId}" playOrder="${i+1}"><navLabel><text>${ch.title}</text></navLabel><content src="${fileName}"/></navPoint>\n`;
        });
        oebps.file("content.opf", `<?xml version="1.0" encoding="utf-8"?><package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="id"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${storyInfo.title}</dc:title><dc:language>vi</dc:language></metadata><manifest>${manifest}<item href="toc.ncx" id="ncx" media-type="application/x-dtbncx+xml"/></manifest><spine toc="ncx">${spine}</spine></package>`);
        oebps.file("toc.ncx", `<?xml version="1.0" encoding="utf-8"?><ncx xmlns="http://www.idpf.org/2000/ncx/" version="2005-1"><navMap>${navMap}</navMap></ncx>`);
        
        const storyBuffer = await storyZip.generateAsync({type: "nodebuffer"});
        const safeName = storyInfo.title.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');
        const epubFileName = `${safeName}.epub`;
        fs.writeFileSync(epubFileName, storyBuffer);

        // --- BƯỚC 3: CẬP NHẬT list.json ---
        let list = fs.existsSync('list.json') ? JSON.parse(fs.readFileSync('list.json', 'utf8')) : [];
        if (!list.find(i => i.title === storyInfo.title)) {
            list.push({ 
                title: storyInfo.title, 
                url: `https://raw.githubusercontent.com/dongbi9x/KHO-TRUYEN/main/${epubFileName}`,
                cover: storyInfo.cover,
                updateAt: new Date().toLocaleString('vi-VN')
            });
            fs.writeFileSync('list.json', JSON.stringify(list, null, 2));
        }

        // --- BƯỚC 4: ĐÓNG GÓI PLUGIN.ZIP (THEO CẤU TRÚC PRO) ---
        console.log("📦 Đang đóng gói Plugin.zip từ thư mục src...");
        const pluginZip = new JSZip();
        
        // Thêm file plugin.json vào gốc của ZIP
        if (fs.existsSync('plugin.json')) {
            pluginZip.file("plugin.json", fs.readFileSync('plugin.json', 'utf8'));
        }

        // Thêm toàn bộ file trong thư mục src vào folder src bên trong ZIP
        const srcZipFolder = pluginZip.folder("src");
        if (fs.existsSync('./src')) {
            const files = fs.readdirSync("./src");
            files.forEach(file => {
                srcZipFolder.file(file, fs.readFileSync(`./src/${file}`, 'utf8'));
            });
        }

        const pluginBuffer = await pluginZip.generateAsync({type: "nodebuffer"});
        fs.writeFileSync('plugin.zip', pluginBuffer);

        // --- BƯỚC 5: ĐẨY LÊN GITHUB ---
        console.log("📤 Đang đẩy toàn bộ lên GitHub...");
        // Tự động bỏ qua thư mục node_modules khi push
        if (!fs.existsSync('.gitignore')) {
            fs.writeFileSync('.gitignore', 'node_modules/');
        }
        
        execSync('git add .');
        execSync(`git commit -m "Auto update: ${storyInfo.title}"`);
        execSync('git push origin main');
        
        console.log("✅ HOÀN TẤT!");
        console.log("👉 Link Store vBook của bạn:");
        console.log("https://raw.githubusercontent.com/dongbi9x/KHO-TRUYEN/main/plugin.json");

    } catch (err) {
        console.error("🔴 Lỗi:", err.message);
    } finally {
        await browser.close();
    }
}

const targetUrl = process.argv[2];
if (targetUrl) crawlAndPush(targetUrl);