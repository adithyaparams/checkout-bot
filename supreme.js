const breme = require('./breme.js');
const { credText, credSel } = require('./credentials.js');

(async() => {
    browser = new breme.Browser(await breme.setBrowser())
    
    signIn = new breme.SignInPage(await browser.newPage());
    await signIn.signIn('liberati.ties@gmail.com', 'Weloveali.');

    sampleItem = new breme.ItemPage(await browser.newPage(), '', '', size='Large', color='Red');
    sampleItem.setItemLink(undefined, 'https://www.supremenewyork.com/shop/jackets/ptolbdx5q');
    await sampleItem.addItemMacro();

    // todo: abstract away 'wait for checkout ready' button
    await sampleItem.page.waitForSelector('a[class="button checkout"]', { visible: true });

    checkout = new breme.CheckoutPage(await browser.newPage());
    await checkout.goToCheckout(sampleItem.getPage());
    await checkout.autofill(credText, credSel);
})()
