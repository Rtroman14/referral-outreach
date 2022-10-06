const fs = require("fs").promises;
const fetch = require("node-fetch");

const _ = require("./Helpers");

class ZoomInfo {
    configBrowser = async (page) => {
        await page.setViewport({ width: 1366, height: 768 });

        // robot detection incognito - console.log(navigator.userAgent);
        await page.setUserAgent(
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36"
        );

        const cookiesString = await fs.readFile("./files/cookies.json");
        const cookies = JSON.parse(cookiesString);
        await page.setCookie(...cookies);
        console.log("Set cookies");
    };

    hPeopleSearch = async (headers, body) => {
        const res = await fetch("https://app.zoominfo.com/anura/zoominfo/hPeopleSearch", {
            headers,
            referrer: "https://app.zoominfo.com/",
            referrerPolicy: "same-origin",
            body,
            method: "POST",
            mode: "cors",
            credentials: "include",
        });

        const data = await res.json();
        return data;
    };

    viewContacts = async (headers, contacts) => {
        try {
            const res = await fetch("https://app.zoominfo.com/anura/userData/viewContacts", {
                headers,
                referrer: "https://app.zoominfo.com/",
                referrerPolicy: "same-origin",
                body: `{"contacts":${contacts},"creditSource":"GROW"}`,
                method: "POST",
                mode: "cors",
                credentials: "include",
            });

            const data = await res.json();
            return data;
        } catch (error) {
            console.log(error);
            return [];
        }
    };

    login = async (page) => {
        // login
        await page.waitForSelector("#okta-signin-username", { visible: true });
        await page.type("#okta-signin-username", process.env.ZOOMINFO_USERNAME, { delay: 100 }); // Types slower, like a user
        await page.type("#okta-signin-password", process.env.ZOOMINFO_PASSWORD, { delay: 100 }); // Types slower, like a user
        await page.click("#okta-signin-submit");
        // await page.waitForNavigation({ waitUntil: "load" });
        console.log("Logged in");
    };

    fetchPersons = async (headers, body, page) => {
        body = JSON.parse(body);

        try {
            const res = await fetch("https://app.zoominfo.com/anura/zoominfo/hPeopleSearch", {
                headers,
                body: JSON.stringify({
                    ...body,
                    page: String(page),
                }),
                method: "POST",
            });

            const data = await res.json();
            return data;
        } catch (error) {
            console.log("ERROR - fetchPersons() ---", error);
            return [];
        }
    };

    allPersonIDs = async (headers, { personTitleSearch, companyNameSearch, state }) => {
        try {
            let personIDs = [];

            const fetchedPersons = await this.searchCompany(headers, {
                personTitleSearch,
                companyNameSearch,
                state,
                page: 1,
            });

            if (fetchedPersons.data.length) {
                personIDs = [...fetchedPersons.data.map((person) => person.personID)];
            }

            const iterations = Math.ceil(fetchedPersons.maxResults / 25);
            const maxPage = Math.min(...[iterations, 100]);

            for (let page = 2; page <= maxPage; page++) {
                const { data } = await this.searchCompany(headers, {
                    personTitleSearch,
                    companyNameSearch,
                    state,
                    page,
                });

                if (data?.length) {
                    personIDs = [...personIDs, ...data.map((person) => person.personID)];
                }
            }

            return personIDs;
        } catch (error) {
            console.log("ERROR - Reonomy.allPersonIDs() --", error);
            return [];
        }
    };

    bulkViewContacts = async (headers, personIDs) => {
        const batchPersons = 10;
        let allProspects = [];

        try {
            const iterations = Math.ceil(personIDs.length / batchPersons);

            for (let i = 1; i <= iterations; i++) {
                const personIDsBatch = personIDs.splice(0, batchPersons);
                const arrayPersonIDs = personIDsBatch.map((id) => ({ personId: id }));

                let { data: prospects } = await this.viewContacts(
                    headers,
                    JSON.stringify(arrayPersonIDs)
                );

                prospects = prospects?.map((prospect) => _.formatContact(prospect));

                if (prospects) {
                    allProspects = [...allProspects, ...prospects];
                }
            }

            return allProspects;
        } catch (error) {
            console.log("ERROR - Reonomy.bulkViewContacts() --", error);
            return [];
        }
    };

    searchCompany = async (headers, { personTitleSearch, companyNameSearch, state, page }) => {
        let body = {
            rpp: 25,
            sortBy: "Relevance,company_id",
            sortOrder: "desc,desc",
            personTitle: personTitleSearch,
            companyName: companyNameSearch,
            state,
            companyPastOrPresent: "1",
            excludeNoCompany: "true",
            excludeDefunctCompanies: true,
            returnOnlyBoardMembers: false,
            excludeBoardMembers: true,
            contactRequirements: "",
            confidenceScoreMin: 85,
            confidenceScoreMax: 99,
            isCertified: "include",
            inputCurrencyCode: "USD",
            outputCurrencyCode: "USD",
            page,
            feature: "People Search - UI",
        };

        try {
            const res = await fetch("https://app.zoominfo.com/anura/zoominfo/hPeopleSearch", {
                headers,
                body: JSON.stringify(body),
                method: "POST",
            });

            const data = await res.json();
            return data;
        } catch (error) {
            console.log("ERROR - Reonomy.searchCompany() ---", error);
            return false;
        }
    };
}

module.exports = new ZoomInfo();
