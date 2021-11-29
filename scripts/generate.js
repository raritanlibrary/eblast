const fs = require('fs');
const puppeteer = require('puppeteer')
const m = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

async function printPDF() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:1234/', {waitUntil: 'networkidle0'});
  
  const h = await page.evaluate(() => document.body.offsetHeight + 135);
  const pdf = await page.pdf({ width: '1200px', height: `${h}px`, printBackground: true});

  await browser.close();
  const d = new Date();
  fs.writeFileSync(`./out/eBlast_${d.getFullYear()}${m[d.getMonth()+1]}.pdf`, pdf);
}

printPDF();