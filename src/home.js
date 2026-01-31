function execute() {
    var response = fetch("https://raw.githubusercontent.com/dongbi9x/KHO-TRUYEN/main/list.json");
    if (response.ok) {
        var json = JSON.parse(response.string());
        return Response.success(json.map(function(item) {
            return {
                name: item.title,
                link: item.url,
                cover: item.cover || "",
                description: "Bản sạch by dongbi9x",
                host: "https://github.com/dongbi9x"
            };
        }));
    }
    return null;
}