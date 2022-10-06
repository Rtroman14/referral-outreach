const fs = require("fs");
const crypto = require("crypto");

class Repo {
    constructor(filename) {
        if (!filename) {
            throw new Error("Creating a repository requires a filename");
        }

        this.filename = filename;

        try {
            fs.accessSync(this.filename);
        } catch {
            fs.writeFileSync(this.filename, "[]");
        }
    }

    async getAll() {
        try {
            return JSON.parse(await fs.promises.readFile(this.filename));
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    async getUser(id) {
        const records = await this.getAll();

        return records.find((record) => record.id === id);
    }

    async getUserBy(filters) {
        const records = await this.getAll();

        for (let record of records) {
            let found = true;

            for (let key in filters) {
                if (record[key] !== filters[key]) {
                    found = false;
                }
            }

            if (found) {
                return record;
            }
        }
    }

    async create(newRecords) {
        // attributes === { email: "", password: "" }
        // attributes.id = this.randomId();

        const records = await this.getAll();
        const allRecords = [...records, ...newRecords];

        await this.writeAll(allRecords);

        return allRecords;
    }

    async spread(newRecords) {
        const records = await this.getAll();
        const allRecords = [...records, ...newRecords];

        await this.writeAll(allRecords);

        return allRecords;
    }

    async writeAll(records) {
        // writes to fill with 4 spaces to prettyPrint
        await fs.promises.writeFile(this.filename, JSON.stringify(records, null, 4));
    }

    async delete(id) {
        const records = await this.getAll();
        const filteredRecords = records.filter((record) => record.id !== id);

        await this.writeAll(filteredRecords);
    }

    async update(id, attributes) {
        const records = await this.getAll();
        const record = records.find((record) => record.id === id);

        if (!record) {
            throw new Error(`Record with id: ${id} not found.`);
        }

        Object.assign(record, attributes);
        await this.writeAll(records);
    }

    randomId() {
        return crypto.randomBytes(4).toString("hex");
    }
}

module.exports = Repo;
