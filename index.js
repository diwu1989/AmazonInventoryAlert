const axios = require('axios');
const puppeteer = require('puppeteer');
const logger = require('logger').createLogger();

const PRODUCTS = require('./products');

function getProductUrl(product) {
  return `https://www.amazon.com/gp/offer-listing/${product}/ref=olp_f_new?ie=UTF8&f_all=true&f_freeShipping=true&f_primeEligible=true`;
}

async function checkProduct(page, product) {
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
  return amazonSeller.length > 0;
}

async function run() {
  logger.info(`Running product checks on ${PRODUCTS.length} products`);
  const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
  try {
    for (let product of PRODUCTS) {
      let page = await browser.newPage();
      try {
        let inStock = await checkProduct(page, product);
        if (inStock) {
          logger.log(`${product} is in stock`);
          axios.post('https://hooks.zapier.com/hooks/catch/500091/8x9slt/', {
            url: getProductUrl(product)
          })
        } else {
          logger.log('Not in stock');
        }
        logger.log('- - - - - - -');
      } finally {
        await page.close();
      }
    }
  } finally {
    browser.close()
  }
  // check again in 30s
  setTimeout(run, 30 * 1000);
  logger.info('Done checking products, sleeping');
  logger.info('---------------------------------------------------');
}

run();
