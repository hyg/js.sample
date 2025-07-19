const { chromium, firefox, webkit } = require('playwright');
const fs = require("fs");

(async () => {
    const browser = await webkit.launch();  // Or 'firefox' or 'webkit'.
    const page = await browser.newPage();
    await page.goto('https://www.eshian.com/sat/yyss/detail/LXMjAyNS0wNy0xOQ==/1134');
    const pageContent = await page.content(); // 获取加载完的页面上下文
    //console.log(pageContent); // 输出页面内容
    fs.writeFileSync("playwright.webkit.txt",pageContent);
    await browser.close();
})();