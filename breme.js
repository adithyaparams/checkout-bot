const randomUseragent = require('random-useragent');
const axios = require('axios');
const puppeteer = require("puppeteer-extra");
const pluginStealth = require("puppeteer-extra-plugin-stealth");
puppeteer.use(pluginStealth());

async function setBrowser() {
    return await puppeteer.launch({ headless: false });
}

async function getStock(currentDate=getCurrentDate()) {                   // load json and resolve if new release week
    try {
        const response = await axios.get('https://www.supremenewyork.com/mobile_stock.json');
        let stock = response.data.products_and_categories.new;
        const releaseDate = response.data.release_date;
        if (releaseDate == currentDate) {
            return stock;
        } else {
            return 'releaseDate does not equal currentDate';
        }
    }
    catch(error) {
      return error;
    }
}

class ProductList {
    // Class for parsing through product names, IDs

    constructor(stockJSON) {
        this.products = {};
        for (let i = 0; i < stockJSON.length; i++) {
            this.products[stockJSON[i].name.toLowerCase()] = stockJSON[i].id;
        }
    }

    getStock() {
        return this.products;
    }

    getID(keyword) {
        for (const [key, value] of Object.entries(this.products)) {
            if (key.includes(keyword)) {
                return value;
            }
        }
        return null
    }
}

class Browser {
    // Class for controlling overall browser window

    constructor(browser) {
        this.browser = browser;
        // this.userAgent = randomUseragent.getRandom();
    }

    async newPage() {
        // Create new page in current browser context
        
        let page = await this.browser.newPage();
        // await page.setUserAgent(this.userAgent);
        return page;
    }
}

class Page {
    // Class for controlling individual pages

    constructor(page) {
        this.page = page;
    }

    async goTo(link) {
        // Go to specific link
        
        await this.page.goto(link, { waitUntil: 'networkidle0' });
    }

    getPage() {
        // Return Puppeteer page object

        return this.page;
    }
}

class ItemPage extends Page {
    // Class for individual item pages, extended from Page
    
    constructor(page, keyword, id='', size='', color='') {
        super(page);

        this.sizes = ['Small', 'Medium', 'Large', 'XLarge'];
        this.id = id;
        this.keyword = keyword;
        this.size = size;
        this.color = color;
        this.itemLink = `https://www.supremenewyork.com/shop/${id}`;
    }

    setItemLink (id='', link='') {
        // Set item URL, based off of either item id or hard URL

        if (id != '') {
            this.id = id;
            this.itemLink = `https://www.supremenewyork.com/shop/${id}`;
        } else if (link != '') {
            this.itemLink = link;
        } else {
            console.log('Call setItemLink with an argument, doofus.');
        }
    }

    async goToItem() {
        // Go to item page

        await Page.prototype.goTo.call(this, this.itemLink);
    }

    async chooseColor(color=this.color) {       // todo: add failsafe for if color is not found
        // Choose specified color for product

        let colorLink = await this.page.$eval(`a[data-style-name="${color}"]`, el => el.href);
        await Page.prototype.goTo.call(this, colorLink);
    }

    async selectSize(size=this.size) {          // todo: add failsafe for if size is not found
        // Choose specified size for product
        
        if (this.sizes.includes(size)) {
            const option = (await this.page.$x(
                `//*[@id = "s"]/option[text() = '${size}']`
              ))[0];
            const value = await (await option.getProperty('value')).jsonValue();
            await this.page.select('#s', value);
        } else {
            console.log(`Chosen size, ${size}, does not match any values in ${this.sizes}`);
        }
    }

    async addToCart() {
        await this.page.$eval('input[name="commit"]', btn => btn.click())
        // .then(
        //     added => console.log(`added ${name}`),
        //     err => console.log(`${name} item sold out`))
    }

    async addItemMacro() {
        // Combine item-related steps for one abstracted macro

        await this.goToItem();              // Go to item's page
        if (this.color != '') {
            await this.chooseColor();       // If color provided, choose it
        }
        if (this.size != '') {
            await this.selectSize();        // If size provided, choose it
        }
        await this.addToCart();             // Add item to cart
    }

    async waitToCheckout() {
        this.page.waitForSelector('a[class="button checkout"]', { visible: true });
    }
}

class CheckoutPage extends Page {
    // Class for checkout page, extended from Page

    constructor(page) {
        super(page);

        this.checkoutLink = 'https://www.supremenewyork.com/checkout';
        this.textSelectors = ['order_billing_name', 'order_email', 'order_tel',
                                    'bo', 'oba3', 'zip_label', 'order_billing_city', 'cnb', 'vval'];
        this.selSelectors = ['order_billing_state', 'order_billing_country', 'credit_card_month',
                                'credit_card_year'];
    }

    async goToCheckout(page) {
        // Go to checkout page

        // await page.waitForSelector('a[class="button checkout"]', { visible: true });
        Page.prototype.goTo.call(this, this.checkoutLink);
    }

    async autofill(credText, credSel) {
        // Fill in text and menu inputs with info from credentials.js file
        
        for (var i = 0; i < this.textSelectors.length; i++) {
            await this.page.waitForSelector(`#${this.textSelectors[i]}`);
            await this.page.type(`#${this.textSelectors[i]}`, credText[i], { delay: 1 });
        }
        for (var i = 0; i < this.selSelectors.length; i++) {
            await this.page.select(`#${this.selSelectors[i]}`, credSel[i]);
        }
    }
}

class SignInPage extends Page {
    // Class for Google authentication page, extended from Page

    async signIn(username, password) {
        // Sign user into google account on given page

        await this.page.goto("https://accounts.google.com/ServiceLogin");

        await this.page.waitForSelector('#identifierId');
        await this.page.type('#identifierId', username, {  delay: 5 });
        await this.page.click('#identifierNext');

        await this.page.waitForSelector('input[type="password"]', { visible: true });
        await this.page.type('input[type="password"]', password);

        await this.page.waitForSelector('#passwordNext', { visible: true });
        await this.page.click('#passwordNext');
    }
}

function getCurrentDate() {
    // Return current date in 'mm/dd/yyyy' format to compare against mobile_stock.json

    date = new Date();
    let dayFiller = '', monthFiller = ''
    if (date.getMonth()+1 < 10) monthFiller = '0';     // Filler for months 1-9
    if (date.getDate() < 10) dayFiller = '0';          // Filler for days 1-9
    let y = date.getFullYear(), m = date.getMonth()+1, d = date.getDate();
    return `${monthFiller}${m}/${dayFiller}${d}/${y}`;
}

module.exports = { setBrowser, getStock, Browser, ItemPage, SignInPage, CheckoutPage, ProductList }
