function home() {
    let response = fetch("https://raw.githubusercontent.com/dongbi9x/KHO-TRUYEN/main/list.json");
    let json = JSON.parse(response.string());
    return Response.success(json.map(item => ({
        name: item.title,
        link: item.url,
        cover: item.cover || "https://via.placeholder.com/200x300?text=No+Cover",
        description: "Cập nhật: " + (item.updateAt || "Vừa xong")
    })));
}

function detail(url) {
    return Response.success({
        book: { name: "Bản EPUB Sạch", author: "dongbi9x" },
        chapters: [{ name: "TẢI BẢN FULL EPUB", url: url }]
    });
}