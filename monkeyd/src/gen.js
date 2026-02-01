function execute(url, page) {
    if (!page) page = '';
    let fullUrl = url + (page ? '?page=' + page : '');
    let response = fetch(fullUrl);
    if (!response.ok) return null;
    let text = response.text().replace(/\r/g, '');
    let lines = text.split('\n');
    let data = [];
    let inList = false;
    let currentTitle = '';
    let currentLink = '';
    let currentDesc = '';
    for (let line of lines) {
      line = line.trim();
      if (line.startsWith('##### ') && (line.includes('Đề cử') || line.includes('Hot') || line.includes('mới cập nhật') || line.includes('hoàn thành'))) {
        inList = true;
        continue;
      }
      if (inList && line.match(/\[.+\]\((https?:\/\/.+\.html)\)/)) {
        if (currentTitle) data.push({ name: currentTitle, link: currentLink, description: currentDesc.trim() });
        let match = line.match(/\[(.+)\]\((https?:\/\/.+\.html)\)/);
        currentTitle = match[1];
        currentLink = match[2];
        currentDesc = '';
      } else if (inList && line && !line.startsWith('---') && !line.startsWith('‹ ›')) {
        currentDesc += line + '\n';
      } else if (line === '---' || line.startsWith('‹ ›')) {
        if (currentTitle) data.push({ name: currentTitle, link: currentLink, description: currentDesc.trim() });
        inList = false;
        currentTitle = '';
      }
    }
    let next = text.includes('›') ? (page ? parseInt(page) + 1 : 2) : null;
    return Response.success(data, next ? next.toString() : null);
  }