const breme = require('./breme.js');
const { credText, credSel } = require('./credentials.js');

(async() => {
    // Main function

    async function postRetrieval(stock) {
        p = new breme.ProductList(stock);
        itemInfo = p.getInfo('makah zip up jacket');

        sampleItem = new breme.ItemPage(await browser.newPage(), itemInfo['name'], itemInfo['ID'], size='Large', color='Teal');
        console.log(sampleItem.itemLink);
        await sampleItem.addItemMacro();

        await sampleItem.waitToCheckout();

        checkout = new breme.CheckoutPage(await browser.newPage());
        await checkout.goToCheckout(sampleItem.getPage());
        await checkout.autofill(credText, credSel);
    }

    browser = new breme.Browser(await breme.setBrowser());
    
    signIn = new breme.SignInPage(await browser.newPage());
    await signIn.signIn('liberati.ties@gmail.com', 'Weloveali.');

    await breme.retrieveStock(postRetrieval);

})()
