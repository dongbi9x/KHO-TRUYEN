function execute() {
    var res = fetch("https://raw.githubusercontent.com/dongbi9x/KHO-TRUYEN/main/list.json");
    var json = JSON.parse(res.string());
    return Response.success(json.map(function(item) {
        return {
            name: item.title,
            link: item.url,
            cover: item.cover || "https://via.placeholder.com/200x300?text=EPUB",
            description: "Bản sạch by dongbi9x"
        };
    }));
}