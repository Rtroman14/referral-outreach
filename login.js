require("dotenv").config();

const puppeteer = require("puppeteer");

// const scrapeProperty = require("./src/scrapeProperty");
const writeJson = require("./src/writeJson");
const ZoomInfo = require("./src/ZoomInfo");

const ZOOM_INFO = "https://app.zoominfo.com/#/apps/home-page";

(async () => {
    let browser;

    try {
        browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();

        await page.setViewport({ width: 1366, height: 768 });

        // robot detection incognito - console.log(navigator.userAgent);
        page.setUserAgent(
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36"
        );

        await page.goto(ZOOM_INFO, { waitUntil: "networkidle2" });
        console.log("login loaded");

        // login
        await ZoomInfo.login(page);

        await page.waitForTimeout(28000);
        console.log("Done waiting");

        await page.goto(ZOOM_INFO, { waitUntil: "networkidle2" });
        console.log("Navigated");

        await page.waitForTimeout(5000);

        const cookies = await page.cookies();
        console.log("Pulled cookies");
        writeJson(cookies, "cookies");

        // close browser
        await browser.close();
        console.log("Browser closed");
    } catch (error) {
        // close browser
        await browser.close();
        console.log("Browser closed");

        console.log(`ERROR --- reonomy() --- ${error}`);
    }
})();
