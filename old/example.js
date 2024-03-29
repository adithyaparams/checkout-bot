// limited functionality supreme checkout bot

const puppeteer = require('puppeteer');
const axios = require('axios');

async function find_and_add(keyword, products, page, total) {
  let id = false;                                       // default id to false for if statement
  for (let i = 0; i < products.length; i++) {           // iterate through each new product and match ...
    if (products[i].name.toLowerCase().includes(keyword)) {   // keyword, save id
      console.log(`${products[i].name} and ${products[i].id}`);
      name = products[i].name;
      id = products[i].id;
      break;
    }
  }
  if (id) {                                             // go to item url, add to cart
    await page.goto(`https://www.supremenewyork.com/shop/${id}`, { waitUntil: 'networkidle0' });
    await page.$eval('input[name="commit"]', btn => btn.click()).then(
      added => console.log(`added ${name}`),
      err => console.log(`${name} item sold out`))
    console.log('waiting');
    await page.waitForNavigation({ waitUntil: 'networkidle0' })
    console.log('done waiting');
  } else { console.log(`${keyword} could not be found`) }
  counter += 1;
  console.log(`${keyword} ${counter} ${total}`)
  if (counter == total) {
    // setTimeout(() => page.goto('https://www.supremenewyork.com/checkout/'), 2000).then(
    //   await checkout_page.$eval('input[id="order_billing_name"]', el => el.value = 'Adithya Paramasivam')
    // );
    console.log('going to checkout')
    page.goto('https://www.supremenewyork.com/checkout/')
  }
}

async function add_items(products, keywords, pages) {   // add to cart macro for each item
  for (let i = 0; i < keywords.length; i++) {
    setTimeout(() => find_and_add(keywords[i], products, pages[i], keywords.length));
  }
}

async function get_stock(past_week) {                   // load json and resolve if new release week
  try {
    const response = await axios.get('https://www.supremenewyork.com/mobile_stock.json');
    let stock = response.data.products_and_categories.Accessories;  // switched new to Accessories
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

async function full_purchase(keywords, past_week) {     // go through entire checkout process
  let pages = [];
  discovered = false;
  counter = 0;
  // const browser = await puppeteer.connect({
  //     browserWSEndpoint: endpoint,
  // });
  const browser = await puppeteer.launch({headless: false})
  for (let i = 0; i < keywords.length; i++) {
    pages[i] = await browser.newPage();
  }
  checkout_page = await browser.newPage();
  let updateCheck = setInterval(() => {                 // check for updated stock every 350ms
    get_stock(past_week).then(
      resolve => add_items(resolve, keywords, pages),   // add items if updated stock found
      reject => console.log(reject)
    )
    if (discovered) { clearInterval(updateCheck); }
  }, 350);
}

// 
const endpoint = 'ws://127.0.0.1:9222/devtools/browser/78b5424a-cf18-45c1-ab7a-12c524d4c0ba'

// full_purchase(['foulard', 'moka'], '17SS19')
full_purchase(['truck'], '18SS19')
