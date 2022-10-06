require("dotenv").config();

const Airtable = require("airtable");

class AirtableApi {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error("Using Airtable requires an API key.");
        }

        this.apiKey = apiKey;
    }

    async config(baseID) {
        try {
            return new Airtable({ apiKey: this.apiKey }).base(baseID);
        } catch (error) {
            console.log("NO API KEY PROVIDED ---", error);
        }
    }

    async getRecord(baseID, recordID) {
        try {
            const base = await this.config(baseID);

            const res = await base("Reonomy").find(recordID);

            return { ...res.fields, id: recordID };
        } catch (error) {
            console.log("ERROR getRecord() ---", error);
            return false;
        }
    }

    async getRecordsByView(baseID, view) {
        try {
            const base = await this.config(baseID);

            const res = await base("Prospects").select({ view }).all();

            const contacts = res.map((contact) => {
                return {
                    ...contact.fields,
                    recordID: contact.getId(),
                };
            });

            return contacts;
        } catch (error) {
            console.log("ERROR GETRECORDSBYVIEW() ---", error);
            return false;
        }
    }

    async getFilteredRecords(baseID, filter) {
        try {
            const base = await this.config(baseID);

            const res = await base("Prospects")
                .select({ filterByFormula: `({${filter.field}} = "${filter.value}")` })
                .all();

            const contacts = res.map((contact) => ({
                ...contact.fields,
                recordID: contact.getId(),
            }));

            return contacts.length ? contacts : [];
        } catch (error) {
            console.log("ERROR GETCONTACTSBYFILTER() ---", error);
            return [];
        }
    }

    async updateRecord(baseID, recordID, updatedFields) {
        try {
            const base = await this.config(baseID);

            await base("Reonomy").update(recordID, updatedFields);

            return true;
        } catch (error) {
            console.log("ERROR UPDATERECORD() ---", error.message);
            return false;
        }
    }

    async createRecords(records, baseID) {
        try {
            const base = await this.config(baseID);

            const res = await base("Prospects").create(records);

            return res;
        } catch (error) {
            console.log("ERROR CREATERECORDS() ---", error);
            return false;
        }
    }

    async batchUpload(prospects, baseID) {
        try {
            const batchAmount = 10;
            const batchesOfTen = Math.ceil(prospects.length / batchAmount);

            for (let batch = 1; batch <= batchesOfTen; batch++) {
                // get first 10 contacts
                let tenProspects = prospects.slice(0, batchAmount);
                // remove first 10 contacts from array
                prospects = prospects.slice(batchAmount);

                const createdRecords = await this.createRecords(tenProspects, baseID);

                // code for errors
                if (!createdRecords) return false;
            }

            return true;
        } catch (error) {
            console.log("ERROR BATCHUPLOAD() ---", error);
            return false;
        }
    }

    async fetchArchiveBases(baseIDs, outreach) {
        console.log("Fetching AT Base(s)...");
        let allContacts = [];

        const fetchArchiveBasesReq = baseIDs.map((baseID) =>
            this.getFilteredRecords(baseID, {
                field: "Outreach",
                value: outreach,
            })
        );
        const archivedContacts = await Promise.all(fetchArchiveBasesReq);

        for (let archivedContact of archivedContacts) {
            allContacts = [...allContacts, ...archivedContact];
        }

        console.log("Fetched archived base(s):", allContacts.length);

        return allContacts;
    }
}

module.exports = new AirtableApi(process.env.AIRTABLE_API);
