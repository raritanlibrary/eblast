const fs = require('fs');
const puppeteer = require('puppeteer')

const month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
let d = new Date();
d.setDate(d.getDate() + 14);
const fdate = d.getFullYear() + month[d.getMonth()];

const printPDF = async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:1234/', {waitUntil: 'networkidle0'});
  
  const h = await page.evaluate(() => document.body.offsetHeight + 135);
  const pdf = await page.pdf({ width: '1200px', height: `${h}px`, printBackground: true});

  await browser.close();

  fs.writeFileSync(`./out/eBlast_${fdate}.pdf`, pdf);
}

printPDF();