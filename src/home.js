function execute() {
    return Response.success([
      { title: "Đề cử hôm nay", input: "https://monkeydtruyen.com/", script: "gen.js" },
      { title: "Truyện Hot Tháng Này", input: "https://monkeydtruyen.com/", script: "gen.js" },
      { title: "Truyện mới cập nhật", input: "https://monkeydtruyen.com/truyen-moi.html", script: "gen.js" },
      { title: "Truyện đã hoàn thành", input: "https://monkeydtruyen.com/truyen-hoan-thanh.html", script: "gen.js" }
    ]);
  }