function execute(url) {
    let response = fetch(url);
    if (!response.ok) return null;
    let text = response.text().replace(/\r/g, '');
    let lines = text.split('\n');
    let chapters = [];
    for (let line of lines) {
      line = line.trim();
      let match = line.match(/\[(.+)\]\((https?:\/\/.+\/chuong-.+\.html)\)/);
      if (match) {
        chapters.push({ name: match[1], url: match[2] });
      }
    }
    return Response.success(chapters.reverse());
  }