//import puppeteer from 'puppeteer';
import puppeteer from 'puppeteer-core';

// Launch the browser and open a new blank page
const browser = await puppeteer.launch({"executablePath":"C:\\Program Files\\Mozilla Firefox\\firefox.exe"});
const page = await browser.newPage();

// Navigate the page to a URL.
await page.goto('https://www.eshian.com/yyss/1081.html');


await browser.close();