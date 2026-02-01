function execute(key, page) {
    if (!page) page = 1;
    let url = "https://monkeydtruyen.com/tim-kiem/?tukhoa=" + encodeURI(key) + "&page=" + page;
    return execute(url, page.toString());  // Reuse gen.js logic
  }