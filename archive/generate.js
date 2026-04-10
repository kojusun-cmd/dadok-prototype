const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const filePath = `file://${path.resolve(__dirname, 'admin.html').replace(/\\/g, '/')}`;
    console.log('Navigating to', filePath);
    
    // Launch browser
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Handle the confirm dialog automatically to accept generating dummies
    page.on('dialog', async dialog => {
        console.log('Dialog opened:', dialog.message());
        await dialog.accept();
    });

    try {
        await page.goto(filePath, { waitUntil: 'domcontentloaded' });
        
        // Wait for Firebase to initialize
        await new Promise(r => setTimeout(r, 2000));
        
        console.log('Clicking generate Dummy button...');
        // We know the generate dummies button has the onclick function generateDummyPartners
        await page.evaluate(() => {
            window.generateDummyPartners();
        });
        
        // Wait for 3 seconds for the DB requests to commit
        await new Promise(r => setTimeout(r, 3000));
        console.log('Done!');
    } catch(err) {
        console.error(err);
    } finally {
        await browser.close();
        process.exit(0);
    }
})();
