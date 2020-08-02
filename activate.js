const puppeteer = require('puppeteer');
const fs = require('fs');
var twilio = require('twilio');

async function main(credentials) {
    
    console.log('\nLaunching browser');
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Safari/537.36');
    await page.setViewport({width: 1200, height: 720})
    await page.goto('https://mijntele2.tele2.nl/mijntele2/4G/producten/verbruik/data/nleu');

    await page.waitForSelector('label[for="Row1_Column1_Cell1_CookieSettings_SelectedCookieTypeTracking"]', {
        visible: true,
    });

    console.log('Accepting cookies');
    await page.click('label[for="Row1_Column1_Cell1_CookieSettings_SelectedCookieTypeTracking"]'),

    await page.waitForSelector('#Section1_Row1_Column1_Cell1_Login_Username', {
        visible: true,
    });

    console.log('Logging in');
    await page.type('#Section1_Row1_Column1_Cell1_Login_Username', credentials.tele2.username);
    await page.type('#Section1_Row1_Column1_Cell1_Login_Password', credentials.tele2.password);

    await page.click('#Section1_Row1_Column1_Cell1_Login_LoginButton'),

    console.log('Redirecting to usage page');
    await page.waitForSelector('.circle-chart__amount-text', {
        visible: true,
    });

    const megabytesLeft = (await page.evaluate(el => el.textContent, await page.$('.circle-chart__amount-text'))).replace('.', '');
    console.log(`${megabytesLeft} MB left`);


    if (megabytesLeft < 999) {
        console.log('Sending SMS to mobile phone');

        const client = new twilio(credentials.twilio.sid, credentials.twilio.token);

        client.messages.create({
            body: 'NOG 1GB',
            to: credentials.twilio.to,
            from: credentials.twilio.from
        })
        .then((message) => console.log(`SMS message sent - ${message.sid}`));

        console.log('Wait for 5 minutes');
        await page.waitFor(300000);
    }

    console.log('Closing browser');
    await browser.close();
}

const credentials = JSON.parse(fs.readFileSync('credentials.json'));

setInterval(() => main(credentials), 120000);