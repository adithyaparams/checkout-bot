const puppeteer = require('puppeteer');
const axios = require('axios');
const cheerio = require('cheerio');
const JSON5 = require('json5')

past_week = '18SS19'

async function get_stock() {
  try {
    const response = await axios.get('https://www.supremenewyork.com/mobile_stock.json');
    let stock = response.data.products_and_categories;
    const release = response.data.release_week;
    console.log((release != past_week));
    return stock;
  } catch(error) {
    console.log(error)
    return error;
  }
}

stock = get_stock()
// console.log(stock)
