const randomUseragent = require('random-useragent');
const axios = require('axios');
const puppeteer = require("puppeteer-extra");
const pluginStealth = require("puppeteer-extra-plugin-stealth");
puppeteer.use(pluginStealth());

async function setBrowser() {
    return await puppeteer.launch({ headless: false });
}

async function retrieveStock(postStock) {

    var discovered = false;

    async function getStock(currentDate='10/17/2019') {             // SWITCHED
        try {
            const response = await axios.get('https://www.supremenewyork.com/mobile_stock.json');
            let stock = response.data.products_and_categories.new;
            const releaseDate = response.data.release_date;
            if (!discovered && releaseDate == currentDate) {
                discovered = true;
                return stock;
            } else if (discovered) {
                return 'mobileStock.json already retrieved';
            } else {
                return `releaseDate ${releaseDate} does not equal currentDate ${currentDate}`;
            }
        }
        catch(error) {
          return error;
        }
    }

    let updateCheck = setInterval(async function() {
        let newStock = await getStock();      // SUBSTITUTED WITH LAST WEEKS RELEASE DATE
        if (typeof(newStock) === 'object') {
            clearInterval(updateCheck);
            await postStock(newStock);
        } else {
            console.log(newStock);
        }
    }, 300);

}

class Product {
    // Class for creating and parsing through desired items

    constructor(keyword, size='', color='') {
        this.keyword = keyword.toLowerCase();
        this.size = size;
        this.color = color;
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

    getInfo(keyword) {
        for (const [key, value] of Object.entries(this.products)) {
            if (key.includes(keyword)) {
                return {'name' : key, 'ID' : value};
            }
        }
        return null;
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
    
    constructor(page, name, id='', size='', color='') {
        super(page);

        this.sizes = ['Small', 'Medium', 'Large', 'XLarge'];
        this.id = id;
        this.name = name;
        this.size = size;
        this.color = color;
        this.itemLink = `https://www.supremenewyork.com/shop/${id}`;
    }

    setItemLink (id='', link='') {          // TESTING
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

        await this.page.$eval(`button[data-style-name="${color}"]`, btn => btn.click());
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
        await this.page.$eval('input[name="commit"]', btn => btn.click());
        // .then(
        //     added => console.log(`added ${name}`),
        //     err => console.log(`${name} item sold out`))
    }

    async addItemMacro() {
        // Combine item-related steps for one abstracted macro

        try {
            await this.goToItem();              // Go to item's page
            if (this.color != '') {
                await this.chooseColor();       // If color provided, choose it
            }
            if (this.size != '') {
                await this.selectSize();        // If size provided, choose it
            }
            await this.addToCart();             // Add item to cart
        }
        catch (error) {
            console.log(`Hit error on ${this.name}, the item is likely sold out`);
            console.log(error);
        }
    }

    async waitToCheckout() {
        await this.page.waitForSelector('a[class="button checkout"]', { visible: true });
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

    async autofill(shipping, billing) {
        // Fill in text and menu inputs with info from credentials.js file
        
        await this.page.waitForSelector(`#order_billing_name`);

        await this.page.type(`#order_billing_name`, shipping['name'], { delay: 1 });
        await this.page.type(`#order_email`, shipping['email'], { delay: 1 });
        await this.page.type(`#order_tel`, shipping['tel'], { delay: 1 });
        await this.page.type(`#bo`, shipping['address'], { delay: 1 });
        await this.page.type(`#oba3`, shipping['apt'], { delay: 1 });
        await this.page.type(`#zip_label`, shipping['zip'], { delay: 1 });
        await this.page.type(`#order_billing_city`, shipping['city'], { delay: 1 });
        await this.page.select(`#order_billing_state`, shipping['state']);
        await this.page.select(`#order_billing_country`, shipping['country']);

        await this.page.type(`#cnb`, billing['card'], { delay: 1 });
        await this.page.type(`#vval`, billing['cvv'], { delay: 1 });
        await this.page.select(`#credit_card_month`, billing['expm']);
        await this.page.select(`#credit_card_year`, billing['expy']);
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

module.exports = { setBrowser, retrieveStock, Browser, ItemPage, SignInPage, CheckoutPage, ProductList, Product }
