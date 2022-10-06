require("dotenv").config();

const puppeteer = require("puppeteer");
const moment = require("moment");

const writeJson = require("./src/writeJson");
const Repo = require("./src/Repo");
const Airtable = require("./src/Airtable");
const Reonomy = require("./src/Reonomy");
const _ = require("./src/Helpers");

const { BASE_ID, RECORD_ID, NUM_COMPANIES } = require("./config");
const BATCH_COMPANIES = 5;
const WAIT = 1.5;

let browser;
let allCompanyIDs = [];
let allCompanies = [];
let offset;
let headers = false;
let body = false;
let territoryRecord;

(async () => {
    const db = new Repo(`files/${BASE_ID}_${RECORD_ID}.json`);

    try {
        territoryRecord = await Airtable.getRecord(BASE_ID, RECORD_ID);

        if (!("Territory Url" in territoryRecord)) {
            await browser.close();
            throw new Error("'Territory Url' in AT not found.");
        }
        if (!("Location" in territoryRecord)) {
            await browser.close();
            throw new Error("'Location' in AT not found.");
        }
        if (territoryRecord.Status === "Complete") {
            await browser.close();
            throw new Error("This location has already been scraped!");
        }

        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        await Reonomy.configBrowser(page);

        await page.goto(territoryRecord["Territory Url"], {
            waitUntil: "networkidle2",
            timeout: 120000,
        });

        const isLoggedIn = await Reonomy.login(page);
        if (!isLoggedIn) {
            // close browser
            await browser.close();
            throw new Error("Browser closed");
        }

        await page.setRequestInterception(true);
        page.on("request", (request) => {
            const requestUrl = request.url();

            if (requestUrl === "https://api.reonomy.com/v2/search/pivot/owners?offset=0&limit=50") {
                headers = request.headers();
                body = request.postData();
            }

            request.continue();
        });

        await page.waitForSelector("#summary-cards-pagination", { visible: true, timeout: 120000 });
        console.log("Companies loaded");

        if (!body && !headers) {
            // close browser
            await browser.close();
            throw new Error("No body or headers");
        }

        // * Fetch offset
        if (!("Next Property ID" in territoryRecord)) {
            offset = 0;
        } else {
            offset = Number(territoryRecord["Next Property ID"]);
        }

        // * Fetch company IDs
        console.log("Fetching company IDs");
        let fetchCompanyIDs = true;
        while (fetchCompanyIDs) {
            const companies = await Reonomy.companies(headers, body, offset);
            if (companies.length) {
                const companyIDs = companies.map((company) => company.id);
                allCompanyIDs = [...allCompanyIDs, ...companyIDs];

                offset = offset + 50;
            }

            if (allCompanyIDs.length >= NUM_COMPANIES || !companies.length) {
                fetchCompanyIDs = false;
            }
        }

        // * Fetch companies
        if (allCompanyIDs.length) {
            console.log("Fetching companies");

            const iterations = Math.ceil(allCompanyIDs.length / BATCH_COMPANIES);

            for (let i = 1; i <= iterations; i++) {
                const allCompanyIDsBatch = allCompanyIDs.splice(0, BATCH_COMPANIES);

                const companyData = allCompanyIDsBatch.map((id) => Reonomy.company(headers, id));

                const companyDataRes = await Promise.all(companyData);

                allCompanies = [...allCompanies, ...companyDataRes];

                if (i % 5 === 0 || i === iterations) {
                    console.log("Total companies scraped:", allCompanies.length);
                }

                await _.wait(WAIT);
            }
        }

        const time = moment().format("M.D.YYYY-hh:mm");
        allCompanies = allCompanies.map((company) => ({
            id: company.id,
            name: company.name,
            website: company.websites.length ? company.websites[0].url : "",
            scraped: false,
        }));

        // writeJson(allCompanies, `${BASE_ID}_${RECORD_ID}`);
        await db.spread(allCompanies);

        await Airtable.updateRecord(BASE_ID, RECORD_ID, {
            Status: "In Progress",
            "Next Property ID": String(offset),
        });
        console.log("Next Property ID:", offset);

        await browser.close();
        console.log("Closed browser");
    } catch (error) {
        await browser.close();
        console.log("Browser closed");
        await db.spread(allCompanies);

        console.log(`ERROR - reonomy() --- ${error}`);
    }
})();
