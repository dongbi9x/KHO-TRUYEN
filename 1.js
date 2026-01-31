const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const JSZip = require('jszip');
const fs = require('fs');

async function crawlFinal(startUrl) {
    console.log("🚀 Khởi động Bot v18.2 - Sắp xếp chuẩn & Chống lẫn lộn...");
    const browser = await puppeteer.launch({ 
        headless: false, 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    }); 
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');

    let chapters = [];
    let currentUrl = startUrl;
    let storyTitle = 'Truyen_Gom';

    try {
        // Test 2 chương (Bạn có thể đổi số 2 thành số khác khi đã tin tưởng code)
        while (currentUrl && chapters.length < 2) {
            console.log(`🚀 [${chapters.length + 1}] Đang xử lý: ${currentUrl}`);
            const response = await page.goto(currentUrl, { waitUntil: 'networkidle2', timeout: 60000 });
            
            if (response.status() === 404) break;

            await page.waitForSelector('#chapter-c, .chapter-content', { timeout: 10000 }).catch(() => {});

            const data = await page.evaluate(() => {
                function getRenderedText(node) {
                    if (node.nodeType === 3) return node.textContent;
                    const style = window.getComputedStyle(node);
                    if (style.display === 'none') return "";
                    let before = window.getComputedStyle(node, '::before').content.replace(/['"]/g, '');
                    let after = window.getComputedStyle(node, '::after').content.replace(/['"]/g, '');
                    before = (before === 'none' || before === 'normal') ? '' : before;
                    after = (after === 'none' || after === 'normal') ? '' : after;
                    let childText = "";
                    for (let child of node.childNodes) childText += getRenderedText(child);
                    return before + childText + after;
                }

                const sTitle = document.querySelector('.name-story, h1.title-story')?.innerText.trim();
                const cTitle = document.querySelector('h1, .chapter-title')?.innerText.trim();
                const contentArea = document.querySelector('#chapter-c') || document.querySelector('.chapter-content');
                
                let cleanHtml = "";
                if (contentArea) {
                    const paragraphs = Array.from(contentArea.querySelectorAll('p, div'))
                        .map(p => getRenderedText(p).trim())
                        .filter(t => {
                            // Lọc rác: Shopee + Các nút điều hướng bị nhặt nhầm
                            const isTrash = /shopee|tiki|lazada|chuong sau|chuong truoc|quay lai|muc luc/i.test(t);
                            return t.length > 5 && !isTrash;
                        });
                    cleanHtml = paragraphs.map(p => `<p>${p}</p>`).join('');
                }
                return { sTitle, cTitle, html: cleanHtml };
            });

            if (chapters.length === 0 && data.sTitle) storyTitle = data.sTitle;
            chapters.push({ title: data.cTitle, html: data.html });

            // Tự tăng số chương
            currentUrl = currentUrl.replace(/(\d+)(\.html)$/, (match, p1, p2) => (parseInt(p1) + 1) + p2);
            await new Promise(r => setTimeout(r, 2000)); 
        }

        // --- ĐÓNG GÓI CHUẨN EPUB ---
        const zip = new JSZip();
        zip.file("mimetype", "application/epub+zip");
        const meta = zip.folder("META-INF");
        meta.file("container.xml", `<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`);

        const oebps = zip.folder("OEBPS");
        let manifest = ""; let spine = ""; let navMap = "";
        
        chapters.forEach((ch, i) => {
            // Đánh số file 4 chữ số (0001, 0002) để ép thứ tự
            const fileId = (i + 1).toString().padStart(4, '0');
            const fileName = `chapter_${fileId}.xhtml`;
            
            const xhtml = `<?xml version="1.0" encoding="utf-8"?><!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml"><head><title>${ch.title}</title><style>p{margin:1em 0;line-height:1.6;}</style></head><body><h3>${ch.title}</h3>${ch.html}</body></html>`;
            oebps.file(fileName, xhtml);

            manifest += `<item href="${fileName}" id="id${fileId}" media-type="application/xhtml+xml"/>\n`;
            spine += `<itemref idref="id${fileId}"/>\n`;
            navMap += `<navPoint id="nav${fileId}" playOrder="${i+1}"><navLabel><text>${ch.title}</text></navLabel><content src="${fileName}"/></navPoint>\n`;
        });

        oebps.file("content.opf", `<?xml version="1.0" encoding="utf-8"?><package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="bookid"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${storyTitle}</dc:title><dc:language>vi</dc:language></metadata><manifest>${manifest}<item href="toc.ncx" id="ncx" media-type="application/x-dtbncx+xml"/></manifest><spine toc="ncx">${spine}</spine></package>`);
        oebps.file("toc.ncx", `<?xml version="1.0" encoding="utf-8"?><ncx xmlns="http://www.idpf.org/2000/ncx/" version="2005-1"><navMap>${navMap}</navMap></ncx>`);

        const buffer = await zip.generateAsync({type: "nodebuffer"});
        const safeName = storyTitle.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');
        fs.writeFileSync(`${safeName}.epub`, buffer);
        console.log(`\n✅ Đã xuất file chuẩn: ${safeName}.epub`);

    } catch (err) {
        console.error("🔴 Lỗi:", err.message);
    } finally {
        await browser.close();
    }
}

const targetUrl = process.argv[2];
if (targetUrl) crawlFinal(targetUrl);