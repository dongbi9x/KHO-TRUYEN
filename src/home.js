function execute() {
    var response = fetch("https://raw.githubusercontent.com/dongbi9x/KHO-TRUYEN/main/list.json");
    if (response.ok) {
        var json = JSON.parse(response.string());
        return Response.success(json.map(function(item) {
            return {
                name: item.title,
                link: item.url,
                cover: item.cover || "https://via.placeholder.com/200x300?text=EPUB",
                description: "Bản sạch by dongbi9x"
            };
        }));
    }
    return Response.error("Lỗi tải danh sách");
}