function execute(url) {
    // url ở đây chính là link file EPUB mà bạn đã truyền từ home.js/detail.js sang
    return Response.success([
        {
            name: "NHẤN ĐỂ TẢI BẢN EPUB FULL",
            url: url,
            host: ""
        }
    ]);
}