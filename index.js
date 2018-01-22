const axios = require('axios');
const puppeteer = require('puppeteer');
const logger = require('logger').createLogger();

const PRODUCTS = [
  'B01GCAVRSU',
  'B01HDUVJ1I',
  'B01IFESATU',
  'B01IPVTHL8',
  'B01KMVHB6M',
  'B01LLAJ8PU',
  'B076Q62TDF',
  'B076S4RT1J',
  'B076XDQ55N',
  'B077547NV8',
  'B077Z6LFQ1',
]

function getProductUrl(product) {
  return `https://www.amazon.com/gp/offer-listing/${product}/ref=olp_f_new?ie=UTF8&f_all=true&f_freeShipping=true&f_primeEligible=true`;
}

async function checkProduct(browser, product) {
  const page = await browser.newPage();
  page.setViewport({
    width: 1280,
    height: 768
  });

  logger.info(`Checking product ${product}`);
  const productUrl = getProductUrl(product);
  await page.goto(productUrl);

  const title = await page.title();
  logger.info(`Product: ${title.substring(28)}`);

  const amazonSeller = await page.$$('.olpSellerName img[alt~="Amazon.com"]');
  await page.close();
  return amazonSeller.length > 0;
}

async function run() {
  logger.info(`Running product checks on ${PRODUCTS.length} products`);
  const browser = await puppeteer.launch();
  for (let product of PRODUCTS) {
    let inStock = await checkProduct(browser, product);
    if (inStock) {
      logger.log(`${product} is in stock`);
      axios.post('https://hooks.zapier.com/hooks/catch/500091/8x9slt/', {
        url: getProductUrl(product)
      })
    } else {
      logger.log('Not in stock');
    }
    logger.log('- - - - - - -');
  }
  browser.close();
  logger.info('Done checking products, sleeping');
  logger.info('---------------------------------------------------');
}

run();

// check every 5 minutes
setInterval(run, 5 * 60 * 1000);
