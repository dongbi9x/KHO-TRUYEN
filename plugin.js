function home() {
    var response = fetch("https://raw.githubusercontent.com/dongbi9x/KHO-TRUYEN/main/list.json");
    var json = JSON.parse(response.string());
    var result = [];
    for (var i = 0; i < json.length; i++) {
        result.push({
            name: json[i].title,
            link: json[i].url,
            cover: "https://via.placeholder.com/200x300?text=KHO+TRUYEN",
            description: "Bản EPUB sạch - dongbi9x"
        });
    }
    return Response.success(result);
}

function detail(url) {
    return Response.success({
        book: { name: "Truyện Sạch", author: "dongbi9x" },
        chapters: [{ name: "NHẤN ĐỂ TẢI BẢN FULL EPUB", url: url }]
    });
}

function search(query) {
    return home();
}