function execute(url) {
    let response = fetch(url);
    if (!response.ok) return null;
    let text = response.text().replace(/\r/g, '');
    let lines = text.split('\n');
    let name = lines[0].trim() || '';
    let author = '';
    let description = '';
    let detail = '';
    let inDesc = false;
    let inDetail = false;
    for (let line of lines) {
      line = line.trim();
      if (line.startsWith('Tác giả:')) {
        author = line.replace('Tác giả:', '').trim();
      } else if (line.startsWith('Tình trạng:')) {
        inDetail = true;
        detail += line + '<br>';
      } else if (inDetail && (line.startsWith('Thể loại:') || line.startsWith('Số chương:') || line.startsWith('Lượt xem:'))) {
        detail += line + '<br>';
      } else if (!inDesc && line && !line.startsWith('#####') && !line.match(/\[Chương/)) {
        inDesc = true;
        description += line + '\n';
      } else if (inDesc && line && !line.match(/\[Chương/)) {
        description += line + '\n';
      } else if (line.match(/\[Chương/)) {
        inDesc = false;
        inDetail = false;
      }
    }
    let ongoing = detail.includes('Đang ra') || false;
    return Response.success({ name, author, description: description.trim(), detail: detail.trim(), ongoing });
  }