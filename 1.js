const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const JSZip = require('jszip');
const fs = require('fs');
const { execSync } = require('child_process');

async function crawlAndPush(startUrl) {
    console.log("🚀 Bot v20.0 - Tự động đóng gói ZIP & Push GitHub...");
    const browser = await puppeteer.launch({ headless: false }); 
    const page = await browser.newPage();
    
    // ... (Phần code cào truyện giữ nguyên như v19.5 của bạn) ...
    // Tôi sẽ tập trung vào phần đóng gói Extension ở dưới đây:

    try {
        // [GIẢ LẬP CODE CÀO TRUYỆN] - Giả sử bạn đã có chapters và storyInfo
        // (Để tiết kiệm không gian, tôi viết tiếp phần đóng gói ZIP)

        // 1. TẠO FILE PLUGIN.JS (Cái này vBook sẽ chạy)
        const pluginCode = `function home() {
    var res = fetch("https://raw.githubusercontent.com/dongbi9x/KHO-TRUYEN/main/list.json");
    var json = JSON.parse(res.string());
    return Response.success(json.map(function(i) {
        return { name: i.title, link: i.url, description: "Bản sạch by dongbi9x" };
    }));
}
function detail(url) {
    return Response.success({ chapters: [{ name: "TẢI EPUB", url: url }] });
}
function search(q) { return home(); }`;
        fs.writeFileSync('plugin.js', pluginCode);

        // 2. TẠO FILE PLUGIN.JSON (Giấy khai sinh)
        const pluginJson = {
            "name": "Kho dongbi9x",
            "author": "dongbi9x",
            "version": 1,
            "type": "book"
        };
        fs.writeFileSync('plugin.json', JSON.stringify(pluginJson, null, 2));

        // 3. TỰ ĐỘNG NÉN THÀNH PLUGIN.ZIP (Không cần WinRAR)
        console.log("📦 Đang tự động đóng gói Extension (.zip)...");
        const zip = new JSZip();
        zip.file("plugin.js", pluginCode);
        zip.file("plugin.json", JSON.stringify(pluginJson));
        
        const zipContent = await zip.generateAsync({type: "nodebuffer"});
        fs.writeFileSync('plugin.zip', zipContent);

        // 4. PUSH LÊN GITHUB
        console.log("📤 Đang đẩy toàn bộ lên GitHub...");
        execSync('git add .');
        execSync('git commit -m "Auto update Extension and Stories"');
        execSync('git push origin main');
        
        console.log("✅ HOÀN TẤT! Giờ bạn vào vBook add link nguon.json là xong.");

    } catch (err) {
        console.error("🔴 Lỗi:", err.message);
    } finally {
        await browser.close();
    }
}

const targetUrl = process.argv[2];
if (targetUrl) crawlAndPush(targetUrl);