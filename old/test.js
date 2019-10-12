// connect from existing window

// // /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --no-first-run --no-default-browser-check --user-data-dir=$(mktemp -d -t 'chrome-remote_data_dir')
// const puppeteer = require('puppeteer');


// async function broswerCheck(endpoint) {
//     const browser = await puppeteer.connect({
//         browserWSEndpoint: endpoint,
//     });
//     page = await browser.newPage();
//     page.goto('https://bot.sannysoft.com/')
// }

// const endpoint = 'ws://127.0.0.1:9222/devtools/browser/a9827f91-de58-4c95-afed-8cd6d60c463f';
// broswerCheck(endpoint);

// open new window with stealth plugin

const puppeteer = require("puppeteer-extra")
const pluginStealth = require("puppeteer-extra-plugin-stealth")
puppeteer.use(pluginStealth())

puppeteer.launch({ headless: false }).then(async browser => {
    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 600 });
    await page.goto("https://accounts.google.com/ServiceLogin");

    await page.waitForSelector('#identifierId')
    await page.type('#identifierId', 'liberati.ties@gmail.com', { delay: 5 } )
    await page.click('#identifierNext')

    await page.waitForSelector('input[type="password"]', { visible: true })
    await page.type('input[type="password"]', 'Weloveali.' )

    await page.waitForSelector('#passwordNext', { visible: true })
    await page.click('#passwordNext')
})