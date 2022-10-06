require("dotenv").config();

const fetch = require("node-fetch");

class Reonomy {
    configBrowser = async (page) => {
        await page.setViewport({ width: 1366, height: 768 });

        // robot detection incognito - console.log(navigator.userAgent);
        await page.setUserAgent(
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36"
        );
    };

    companies = async (headers, body, offset) => {
        try {
            const res = await fetch(
                `https://api.reonomy.com/v2/search/pivot/owners?offset=${String(offset)}&limit=50`,
                {
                    headers,
                    method: "POST",
                    Referer: "https://app.reonomy.com/",
                    body,
                }
            );

            const { items } = await res.json();
            return items;
        } catch (error) {
            console.log("Reonomy.companies() --", error);
            return [];
        }
    };

    propertyStats = async (headers, propertyID) => {
        const res = await fetch(`https://api.reonomy.com/v2/property/${propertyID}/stats`, {
            headers,
            method: "GET",
            Referer: "https://app.reonomy.com/",
        });

        const data = await res.json();
        return data;
    };

    propertyContactIDs = async (headers, propertyID) => {
        const res = await fetch(`https://api.reonomy.com/v3/property-contacts/${propertyID}`, {
            headers,
            Referer: "https://app.reonomy.com/",
            method: "GET",
        });

        const data = await res.json();
        return data;
    };

    propertyContacts = async (headers, ids) => {
        const res = await fetch(`https://api.reonomy.com/v3/people/bulk`, {
            headers,
            Referer: "https://app.reonomy.com/",
            method: "POST",
            body: `{"ids":${JSON.stringify(ids)}}`,
        });

        const data = await res.json();
        return data;
    };

    login = async (page) => {
        try {
            // login
            await page.waitForSelector(`input[name="email"]`, { visible: true });
            await page.type(`input[name="email"]`, process.env.REONOMY_USERNAME, { delay: 100 }); // Types slower, like a user
            await page.type(`input[name="password"]`, process.env.REONOMY_PASSWORD, { delay: 100 }); // Types slower, like a user
            await page.click(`button[type="submit"]`);
            console.log("Logged in");

            return true;
        } catch (error) {
            console.log("Error logging in");
            return false;
        }
    };

    company = async (headers, companyID) => {
        try {
            const res = await fetch(`https://api.reonomy.com/v3/companies/${companyID}`, {
                headers,
                Referer: "https://app.reonomy.com/",
                referrerPolicy: "strict-origin-when-cross-origin",
                method: "GET",
            });

            const data = await res.json();
            return data;

            // * Website = data.websites[0].url
        } catch (error) {
            return false;
        }
    };
}

module.exports = new Reonomy();
