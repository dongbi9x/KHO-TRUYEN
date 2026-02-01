function execute() {
    let response = fetch("https://monkeydtruyen.com/the-loai/ngon-tinh.html");  // Any genre to get list
    if (!response.ok) return null;
    let text = response.text();
    let lines = text.split('\n');
    let genres = [];
    for (let line of lines) {
      let match = line.match(/\[(.+)\]\((https?:\/\/.+the-loai.+\.html)\)/);
      if (match) {
        genres.push({ title: match[1], input: match[2], script: "gen.js" });
      }
    }
    return Response.success(genres);
  }