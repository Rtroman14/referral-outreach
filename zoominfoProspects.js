require("dotenv").config();

const puppeteer = require("puppeteer");

const Repo = require("./src/Repo");
const ZoomInfo = require("./src/ZoomInfo");
const _ = require("./src/Helpers");
const writeJson = require("./src/writeJson");
const jobTitles = require("./src/jobTitles");

const { BASE_ID, RECORD_ID } = require("./config");
const state = "Ohio";

// const reonomyCompanies = require(`./files/${BASE_ID}/${RECORD_ID}`);
const db = new Repo(`files/${BASE_ID}_${RECORD_ID}.json`);

let allProspects = [];
let headers = false;
let browser;
let zoomInfoPage;
("https://app.zoominfo.com/#/apps/search/v2/results/person?query=eyJmaWx0ZXJzIjp7InBhc3RQb3NpdGlvbiI6W3siZCI6IkN1cnJlbnQgQ29tcGFueSIsInYiOiIxIn1dLCJpc0NlcnRpZmllZCI6W3siZCI6IkluY2x1ZGUgTm9uLUNlcnRpZmllZCBDb21wYW5pZXMiLCJ2IjpmYWxzZX1dLCJzb3J0UGVvcGxlIjpbeyJkIjoiUmVsZXZhbmNlIiwidiI6IlJlbGV2YW5jZSIsImlzRGVmU3J0Ijp0cnVlfV0sInNvcnRQZW9wbGVPcmRlciI6W3siZCI6IiIsInYiOiJkZXNjIn1dLCJzb3J0Q29tcGFueSI6W3siZCI6IlJlbGV2YW5jZSIsInYiOiIiLCJpc0RlZlNydCI6dHJ1ZX1dLCJzb3J0Q29tcGFueU9yZGVyIjpbeyJkIjoiIiwidiI6ImRlc2MifV0sInNvcnRTY29vcCI6W3siZCI6IiIsInYiOiIiLCJpc0RlZlNydCI6dHJ1ZX1dLCJzb3J0U2Nvb3BPcmRlciI6W3siZCI6IiIsInYiOiJkZXNjIn1dLCJib2FyZE1lbWJlcnMiOlt7ImQiOiJFeGNsdWRlIEJvYXJkIE1lbWJlcnMiLCJ2IjowfV0sInBhcnRpYWxQcm9maWxlcyI6W3siZCI6IkV4Y2x1ZGUgUGFydGlhbCBQcm9maWxlcyIsInYiOnRydWV9XSwiZXhjbHVkZURlZnVuY3RDb21wYW5pZXMiOlt7ImQiOiJFeGNsdWRlIERlZnVuY3QgQ29tcGFuaWVzIiwidiI6dHJ1ZX1dLCJuZWdhdGlvbiI6W3siZCI6IiIsInYiOmZhbHNlfV0sImNvbnRhY3RJbmZvIjpbeyJkIjoiQW55IEluZm8iLCJ2IjoiIn1dLCJleGNsdWRlRXhwb3J0ZWRDb250YWN0cyI6W3siZCI6IiIsInYiOmZhbHNlfV0sImV4Y2x1ZGVFeHBvcnRlZENvbXBhbmllcyI6W3siZCI6IiIsInYiOmZhbHNlfV0sImV4Y2x1ZGVJbXBvcnRlZENvbXBhbmllcyI6W3siZCI6IiIsInYiOmZhbHNlfV0sImV4Y2x1ZGVJbXBvcnRlZENvbnRhY3RzIjpbeyJkIjoiIiwidiI6ZmFsc2V9XSwiY29uZmlkZW5jZVJhbmdlIjpbeyJkIjoiODUtOTkiLCJ2IjpbODUsOTldfV0sIm91dHB1dEN1cnJlbmN5Q29kZSI6W3siZCI6IiIsInYiOiJVU0QifV0sImlucHV0Q3VycmVuY3lDb2RlIjpbeyJkIjoiIiwidiI6IlVTRCJ9XSwiY29tcGFueU5hbWVVcmxUaWNrZXIiOlt7ImQiOiJzdW1tYSBtZWRpYSIsInYiOiJzdW1tYSBtZWRpYSJ9XX0sInNlYXJjaFR5cGUiOjAsImljcFN0YXR1cyI6ZmFsc2UsImRlZmF1bHRJY3BQcm9maWxlIjpudWxsLCJza2lwSGlzdG9yeSI6ZmFsc2UsInBhZ2UiOjF9");

(async () => {
    try {
        let companies = await db.getAll();
        if (!companies) {
            throw new Error("No companies");
        }
        companies = companies.filter((company) => !company.scraped && company.website !== "");
        console.log("Companies to fetch:", companies.length);
        if (!companies.length) {
            throw new Error("No companies");
        }

        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        await ZoomInfo.configBrowser(page);

        await page.setRequestInterception(true);
        page.on("request", (request) => {
            const requestUrl = request.url();

            if (requestUrl === "https://app.zoominfo.com/anura/zoominfo/hPeopleSearch") {
                headers = request.headers();
                body = request.postData();
            }

            request.continue();
        });

        await page.goto(zoomInfoPage, { waitUntil: "networkidle2" });
        await page.waitForSelector("#search-results", { visible: false });
        // await page.waitForTimeout(15000);
        console.log("Navigated to page");

        if (!headers) {
            throw new Error("No headers");
        }

        for (let company of companies) {
            let batchCompanyProspects = [];

            const companyProspects = ZoomInfo.searchCompany(headers, {
                personTitleSearch: jobTitles.prospect.join(" OR "),
                companyNameSearch: company.website,
                state,
                page: 1,
            });
            const companyReferrer = ZoomInfo.searchCompany(headers, {
                personTitleSearch: jobTitles.referrer.join(" OR "),
                companyNameSearch: company.website,
                state,
                page: 1,
            });

            const [prospects, referrers] = await Promise.all([companyProspects, companyReferrer]);
            if (prospects?.data?.length) {
                let personIDs = [];

                if (prospects.maxResults === prospects.totalResults) {
                    personIDs = prospects.data.map((prospect) => prospect.personID);
                } else {
                    personIDs = await ZoomInfo.allPersonIDs(headers, {
                        personTitleSearch: jobTitles.prospect.join(" OR "),
                        companyNameSearch: company.website,
                        state,
                    });
                }

                batchCompanyProspects = await ZoomInfo.bulkViewContacts(headers, personIDs);
            }

            if (referrers?.data?.length) {
                console.log(referrers);
                const [allReferrers] = referrers.data.map((referrer) => ({
                    firstName: referrer.firstName,
                    lastName: referrer.lastName,
                    jobTitle: referrer.jobTitle,
                }));

                batchCompanyProspects = batchCompanyProspects.map((prospect) => ({
                    ...prospect,
                    "Referrer First Name": allReferrers.firstName,
                    "Referrer Last Name": allReferrers.lastName,
                }));
            }

            allProspects = [...allProspects, ...batchCompanyProspects];

            await db.update(company.id, { scraped: true });
        }

        writeJson(allProspects, `Prospects for ${BASE_ID}`);

        // close browser
        await browser.close();
        console.log("Browser closed");
    } catch (error) {
        writeJson(allProspects, `Prospects for ${BASE_ID}`);

        // close browser
        await browser.close();
        console.log("Browser closed");

        console.log(`ERROR --- zoomInfo() --- ${error}`);
    }
})();
