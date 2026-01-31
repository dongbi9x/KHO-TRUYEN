function execute(url, page) {
    var response = fetch(url);
    if (response.ok) {
        var json = JSON.parse(response.string());
        var data = json.map(function(item) {
            return {
                name: item.title,
                link: item.url,
                cover: item.cover || "https://via.placeholder.com/150",
                description: "Dongbi9x",
                host: "https://raw.githubusercontent.com"
            };
        });
        return Response.success(data);
    }
    return null;
}