function execute(url) {
    return Response.success({
        name: "Truyện EPUB",
        author: "dongbi9x",
        chapters: [{ name: "TẢI BẢN FULL EPUB", url: url }]
    });
}