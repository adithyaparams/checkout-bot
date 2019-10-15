const breme = require('./breme.js');
const { credText, credSel } = require('./credentials.js');

(async() => {
    // Main function

    async function postRetrieval(stock) {
        // Asynchronous checkout macro for after stock.json retrieval

        newProducts = new breme.ProductList(stock);

        officialItemList = [];
        
        // iterate through item list
        for (let i = 0; i < itemList.length; i++) {
            itemInfo = newProducts.getInfo(itemList[i].keyword);
            console.log(itemInfo);
            if (!!itemInfo) {
                officialItemList.push(sampleItem = new breme.ItemPage(await browser.newPage(), itemInfo['name'], itemInfo['ID'], 
                                                                                    size=itemList[i].size, color=itemList[i].color));
            }
        }

        for (let i = 0; i < officialItemList.length; i++) {
            await officialItemList[i].addItemMacro();
        }

        await officialItemList[officialItemList.length-1].waitToCheckout();

        checkout = new breme.CheckoutPage(await browser.newPage());
        await checkout.goToCheckout(sampleItem.getPage());
        await checkout.autofill(credText, credSel);
    }

    let itemList = [];
    itemList.push(new breme.Product('piping', 'Medium', 'White'));
    itemList.push(new breme.Product('makah zip up jacket', 'Large', 'Teal'));

    browser = new breme.Browser(await breme.setBrowser());
    
    signIn = new breme.SignInPage(await browser.newPage());
    await signIn.signIn('liberati.ties@gmail.com', 'Weloveali.');

    await breme.retrieveStock(postRetrieval);

})()

// todo:
// find points of failure, add contingencies
// anti-recaptcha: random user agents?
// credentials.js more intuitive
// documentation?
// 
// SWITCH retrieveStock BACK TO CURRENT WEEK RELEASE DATE