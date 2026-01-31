function home() {
    var url = "https://raw.githubusercontent.com/dongbi9x/KHO-TRUYEN/main/list.json";
    var response = fetch(url);
    var json = JSON.parse(response.string());
    var result = [];
    for (var i = 0; i < json.length; i++) {
        result.push({
            name: json[i].title,
            link: json[i].url,
            description: "EPUB sach by dongbi9x"
        });
    }
    return Response.success(result);
}

function detail(url) {
    return Response.success({
        chapters: [{ name: "DOWNLOAD FULL EPUB", url: url }]
    });
}

function search(key) { return home(); }