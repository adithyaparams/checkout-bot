const puppeteer = require('puppeteer');
const axios = require('axios');
const cheerio = require('cheerio');

async function get_stock(past_week) {
  try {
    const response = await axios.get('https://www.supremenewyork.com/mobile_stock.json');
    let stock = response.data.products_and_categories.new;
    const release = response.data.release_week;
    if (release != past_week && !discovered) {
      discovered = true;
      return Promise.resolve(stock);
    } else {
      return Promise.reject([release, discovered]);
    }
  } catch(error) {
    return Promise.reject(error);
  }
}

async function find_and_add(keyword, products, page, total) {
  let id = false;
  let selector = 'input[name="commit"]';
  let wait = ms => new Promise((r, j)=>setTimeout(r, ms))
  for (let i = 0; i < products.length; i++) {
    if (products[i].name.toLowerCase().includes(keyword)) {
      console.log(`${products[i].name} and ${products[i].id}`);
      id = products[i].id;
      break;
    }
  }
  if (id) {
    await page.goto(`https://www.supremenewyork.com/shop/${id}`, { waitUntil: 'networkidle0' });
    // await page.click('input[name="commit"]').catch(err => console.log(`item sold out ${err}`))
    await page.$eval(selector, btn => btn.click()).catch(err => console.log(`item sold out ${err}`))
    counter += 1;
    console.log(`${keyword} ${counter} ${total}`)
    if (counter == total) { setTimeout(() => checkout_page.goto('https://www.supremenewyork.com/checkout/'), 150) }
  } else { console.log(`${keyword} could not be found`) }
}

async function add_items(products, keywords, pages) {
  for (let i = 0; i < keywords.length; i++) {
    setTimeout(() => find_and_add(keywords[i], products, pages[i], keywords.length));
  }
}

async function full_purchase(keywords, past_week) {
  let pages = [];
  discovered = false;
  counter = 0;
  const browser = await puppeteer.connect({
      browserWSEndpoint: endpoint,
  });
  for (let i = 0; i < keywords.length; i++) {
    pages[i] = await browser.newPage();
  }
  checkout_page = await browser.newPage();
  let updateCheck = setInterval(() => {
    get_stock(past_week).then(
      resolve => add_items(resolve, keywords, pages),
      reject => console.log(reject)
    )
    if (discovered) { clearInterval(updateCheck); }
  }, 350);
}

const endpoint = 'ws://127.0.0.1:9222/devtools/browser/a917e0e6-37e9-4b25-901a-1b2442206aa3'

// full_purchase(['foulard', 'moka'], '17SS19')
full_purchase(['mophie', 'snorkel'], '18SS19')
