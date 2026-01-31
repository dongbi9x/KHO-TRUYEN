function home() {
    var response = fetch("https://raw.githubusercontent.com/dongbi9x/KHO-TRUYEN/main/list.json");
    if (response.status !== 200) return Response.error("Loi ket noi GitHub");
    
    var json = JSON.parse(response.string());
    var list = json.map(function(item) {
        return {
            name: item.title,
            link: item.url,
            cover: "https://via.placeholder.com/200x300?text=TRUYEN+SACH",
            description: "Bản EPUB sạch - dongbi9x"
        };
    });
    return Response.success(list);
}

function detail(url) {
    return Response.success({
        book: { name: "Truyen Sach", author: "dongbi9x" },
        chapters: [{ name: "TAI BAN FULL EPUB", url: url }]
    });
}

function search(key) {
    return home();
}