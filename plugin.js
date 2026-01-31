function home() {
    var res = fetch("https://raw.githubusercontent.com/dongbi9x/KHO-TRUYEN/main/list.json");
    var json = JSON.parse(res.string());
    return Response.success(json.map(function(i) {
        return { name: i.title, link: i.url, description: "Bản sạch by dongbi9x" };
    }));
}
function detail(url) {
    return Response.success({ chapters: [{ name: "TẢI EPUB", url: url }] });
}
function search(q) { return home(); }