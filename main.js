const puppeteer = require('puppeteer');
const axios = require('axios');
const cheerio = require('cheerio');
const JSON5 = require('json5')

past_week = '18SS19'

async function get_stock() {
  try {
    const response = await axios.get('https://www.supremenewyork.com/mobile_stock.json');
    let stock = response.data.products_and_categories.new;
    // const release = response.data.release_week;
    // console.log((release != past_week)); // return whether this week's release
    return stock;
  } catch(error) {
    console.log(error)
    return error;
  }
}

function find_and_add(keyword, products) {
  let id = false;
  for (let i = 0; i < products.length; i++) {
    if (products[i].name.toLowerCase().includes(keyword)) {
      console.log(`${products[i].name} and ${products[i].id}`);
      id = products[i].id;
    }
  }
  if (id) {
    console.log(`https://www.supremenewyork.com/shop/${id}`);
  } else { console.log(`${keyword} could not be found`) }
}

async function full_purchase() {
  const products = await get_stock();
  setTimeout(() => find_and_add('foulard', products));
}

full_purchase();
