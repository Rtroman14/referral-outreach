const Reonomy = require("./src/Reonomy");

// const reonomyCompanies = require(`./files/${BASE_ID}/${RECORD_ID}`);
// const db = new Repo(`files/${BASE_ID}_${RECORD_ID}.json`);

(async () => {
    try {
        // * -------------- jsonDB --------------
        // const test = new Repo("files/new-file.json");
        // const test = new Repo("files/new-file.json");

        // const res = await test.getAll();
        // console.log(res);

        // test.spread([{ firstName: "Ryan", lastName: "Roman2" }]);
        // await test.update("234", { scraped: true });
        // const roman = await test.getUserBy({ lastName: "Roman" });
        // console.log(roman);

        // * -------------- job titles --------------

        const headers = {
            accept: "*/*",
            "accept-language": "en-US,en;q=0.9",
            authorization:
                "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlJUWkdOamN3TlVVMFJFTTJORGt6UlRNd1JVSTVSVGs1TlVZeE56UkRNVUUzUlVNd09UTkVOdyJ9.eyJpc3MiOiJodHRwczovL2F1dGgucmVvbm9teS5jb20vIiwic3ViIjoiYXV0aDB8ZTdjMTM4M2MtNjQ0MC00MjU1LWEzZjAtYTllZmZmY2NiYmE0IiwiYXVkIjpbImh0dHBzOi8vYXBwLnJlb25vbXkuY29tL3YyLyIsImh0dHBzOi8vcmVvbm9teS1wcmQuYXV0aDAuY29tL3VzZXJpbmZvIl0sImlhdCI6MTY2NTA5MzM2MywiZXhwIjoxNjY1MTc5NzYzLCJhenAiOiJVVHFqSVpmNWpxRTBSb1JDSlBEMjE2YVQ5Q1dacnEyQyIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwifQ.JH9-r-du3yvfrCuscs7ZSb80U23UmephrHAg0Xe9exGLtwX462G_kKcdg5aZt4Lc9RkFyhT3TAmSjC5MnnoZmSJ23-XSdvZqMrOyEmtzrChISnfuKgHptcYLgcvgJhsdCSxceCo5sIysABeLQ1ald4YcGFULjNgH9oIjn0dFk6h4rcDQPgDtaV2fcuf25qmSmshz2wzl9E9N1lT5ddOKPjBdf5NolyUhINxcL8ixy5Hng7BLVMGM1Hvkz5cTGw4lyJcX8AAS_hXXClHakkYkZsjbu-Eav1XB7-1Qbs5tEHs-kK9LjqH-fMk8NuMVZspHAoZRFcUAxMHrJtYzF1_hxA",
            "cache-control": "no-cache",
            "content-type": "application/json",
            pragma: "no-cache",
            "sec-ch-ua": '"Chromium";v="106", "Google Chrome";v="106", "Not;A=Brand";v="99"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"macOS"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
            Referer: "https://app.reonomy.com/",
            "Referrer-Policy": "strict-origin-when-cross-origin",
        };

        const body =
            '{"metadata":{},"settings":{"land_use_code":["204","2024","205","2023","210","2025","217","2004","2005","220","257","276","278","282","284","2001","2002","2017","2030","2045","2050","2051","2053","221","262","2013","240","2026","2047","242","243","285","2016","2048","261","2012","2014","2015","266","268","2018","2019","2020","2021","2022","2027","2041","270","273","2007","2008","2009","2010","283","2006","286","2029"],"locations":[{"kind":"msa","text":"Cleveland-Elyria, OH"}],"owner_type":"company","sort":[{"name":"search_properties","order":"desc"}]}}';

        const res = await Reonomy.companies(headers, body, 0);
        console.log(res);
    } catch (error) {
        console.log(error);
    }
})();
