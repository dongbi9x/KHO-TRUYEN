function execute(url) {
    return Response.success([{
        name: "Tải xuống EPUB (Nhấn vào đây)",
        url: url,
        host: "https://raw.githubusercontent.com"
    }]);
}