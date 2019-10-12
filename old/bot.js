// supreme checkout bot apis

const puppeteer = require("puppeteer-extra")
const pluginStealth = require("puppeteer-extra-plugin-stealth")
const axios = require('axios');

async function newStealthBrowser() {
  puppeteer.use(pluginStealth())
  return await puppeteer.launch({headless:false});
}

async function newPages(browser, tabs) {
  let pages = [];
  for (let i = 0; i < tabs; i++) {
    pages[i] = await browser.newPage();
  }
  return pages;
}

async function get_stock() {
  return await axios.get('https://www.supremenewyork.com/mobile_stock.json');
}

async function get_item_from_new(keyword=false) {
  const stock = await axios.get('https://www.supremenewyork.com/mobile_stock.json');
  console.log(stock);
  let new_items = stock.data.products_and_categories.new;
  if (keyword) {
    for (let i = 0; i < new_items.length; i++) {           // iterate through each new product and match ...
      if (new_items[i].name.toLowerCase().includes(keyword)) {   // keyword, save id
        return new_items[i];
      }
    }
  } else { return new_items }
}

get_item_from_new('mophie').then(result => console.log(result))
