const fs = require("fs");

module.exports = (data, fileName) => {
    fs.writeFile(`./files/${fileName}.json`, JSON.stringify(data), (err) => {
        if (err) {
            console.log(`Error writing ${fileName}.json`, err);
        } else {
            console.log(`Successfully wrote ${fileName}.json`);
        }
    });
};
