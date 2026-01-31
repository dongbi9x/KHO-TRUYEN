function home() {
    var response = fetch("https://raw.githubusercontent.com/dongbi9x/KHO-TRUYEN/main/list.json");
    var json = JSON.parse(response.string());
    return Response.success(json.map(function(item) {
        return {
            name: item.title,
            link: item.url,
            cover: item.cover || "https://via.placeholder.com/200x300?text=No+Cover",
            description: "Bản EPUB sạch by dongbi9x"
        };
    }));
}

function detail(url) {
    return Response.success({
        book: { name: "Truyện Sạch", author: "dongbi9x" },
        chapters: [{ name: "NHẤN ĐỂ TẢI BẢN FULL EPUB", url: url }]
    });
}

function search(key) {
    return home();
}