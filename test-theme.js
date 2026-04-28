const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
  
  const initialClass = await page.evaluate(() => document.documentElement.className);
  console.log('Initial html className:', initialClass);
  
  const initialTheme = await page.evaluate(() => window.localStorage.getItem('theme'));
  console.log('Initial localStorage theme:', initialTheme);
  
  // Find the toggle button
  const button = await page.$('button[aria-label="Toggle theme"]');
  if (button) {
    console.log('Found theme toggle button, clicking it...');
    await button.click();
    
    // Wait a bit
    await new Promise(r => setTimeout(r, 500));
    
    const newClass = await page.evaluate(() => document.documentElement.className);
    console.log('New html className after click:', newClass);
    
    const newTheme = await page.evaluate(() => window.localStorage.getItem('theme'));
    console.log('New localStorage theme:', newTheme);
  } else {
    console.log('Could not find theme toggle button');
  }
  
  await browser.close();
})();
