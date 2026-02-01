function execute(url) {
    let response = fetch(url);
    if (!response.ok) return null;
    let text = response.text().replace(/\r/g, '');
    let lines = text.split('\n');
    let content = '';
    let inContent = false;
    for (let line of lines) {
      line = line.trim();
      if (line.startsWith('##### ') || line.match(/\[Chương/)) {
        inContent = true;
        continue;
      }
      if (inContent && line && !line.startsWith('---') && !line.includes('MonkeyD')) {
        content += line + '\n';
      } else if (line.startsWith('---')) {
        break;
      }
    }
    return Response.success(content.trim());
  }