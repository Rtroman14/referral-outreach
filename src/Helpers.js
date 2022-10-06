class Helpers {
    delay = (ms) => new Promise((res) => setTimeout(res, ms));

    getText = async (doc, selector) => {
        if (await doc.querySelector(selector)) {
            return await doc.querySelector(selector).innerText;
        }

        return "";
    };

    phoneSection = (section) => {
        let contacts = [];

        const phoneNumbers = section.querySelectorAll(".MuiGrid-item");

        if (phoneNumbers.length) {
            for (const phoneNumber of phoneNumbers) {
                let contact = {};

                const phoneIcon = phoneNumber.querySelector(".MuiSvgIcon-root");

                if (phoneIcon.innerHTML.length >= 850 && phoneIcon.innerHTML.length <= 900) {
                    contact["Phone Number"] = this.getText(phoneNumber, ".MuiTypography-root");
                    contact.Email = "";
                    contact.Outreach = "Text";

                    contacts.push(contact);
                }
            }
        }

        return contacts;
    };

    formatAddress = (address) => {
        let propertyAddress = {};
        let propertyState;
        let currentState;

        // format address
        if (address.split(",").length === 3) {
            currentState = address.split(", ")[2].split(" ")[0];
            propertyState = currentState.length > 2 ? propertyState : currentState;

            propertyAddress.Street = address.split(", ")[0];
            propertyAddress.City = address.split(", ")[1]; // DOUBLE CHECK
            propertyAddress.Zip = address.split(" ").pop();
        } else if (address.length === 2) {
            propertyAddress.State = address;
        } else {
            currentState = address.split(" ")[1];
            propertyState = currentState.length > 2 ? propertyState : currentState;

            propertyAddress.Street = "";
            propertyAddress.City = address.split(", ")[0];
            propertyAddress.Zip = address.split(" ").pop();
        }
        propertyAddress.State = propertyState;

        return {
            propertyAddress,
            propertyState,
        };
    };

    contactInfo = (section, contact) => {
        let contacts = [];

        for (const contactInfoSection of section) {
            const sectionTitle = this.getText(contactInfoSection, "p.MuiTypography-root");

            if (sectionTitle === "Phone Numbers") {
                const phoneNumberContacts = this.phoneSection(contactInfoSection);

                for (const phoneNumberContact of phoneNumberContacts) {
                    contact = { ...contact, ...phoneNumberContact };

                    contacts.push(contact);
                }
            }
            if (sectionTitle === "Emails") {
                const emails = contactInfoSection.querySelectorAll(".MuiGrid-item");

                if (emails.length) {
                    for (const email of emails) {
                        contact["Email"] = this.getText(email, ".MuiTypography-root");
                        contact["Phone Number"] = "";
                        contact.Outreach = "Email";

                        contacts.push(contact);
                    }
                }
            }
        }

        return contacts;
    };

    pageMetadata = (url, metadata) => {
        if (url.includes("page=")) {
            metadata.pageNumber = Number(url.split("page=").pop());
            metadata.nextPage = metadata.pageNumber + 1;
            metadata.nextUrl = `${url.split("page=")[0]}page=${metadata.nextPage}`;
        } else {
            metadata.nextUrl = `${url.split("page=")[0]}?page=${metadata.nextPage}`;
        }

        return metadata;
    };

    filteredContacts = (contacts) => {
        if (contacts) {
            return contacts.filter((contact) => {
                if (contact.is_signatory) {
                    return contact;
                }
                if (contact.relation !== "contact" && (contact.has_phone || contact.has_email)) {
                    return contact;
                }
            });
        } else {
            return [];
        }
    };

    filteredOwners = (owners) => {
        if (owners) {
            return owners.filter((owner) => {
                if (owner.has_phone || owner.has_email) {
                    return owner;
                }
                // TODO: owners filter by: entity_type === 'person' ???
            });
        } else {
            return [];
        }
    };

    wait = (second) => new Promise((res) => setTimeout(res, second * 1000));

    formatContact = (prospect) => ({
        "Full Name": prospect.name || "",
        "First Name": prospect.firstName || "",
        "Last Name": prospect.lastName || "",
        Title: prospect.title || "",
        Street: prospect.location?.Street || "",
        City: prospect.location?.City || "",
        State: prospect.location?.State || "",
        Zip: prospect.location?.Zip || "",
        "Phone Number": prospect.mobilePhone || "",
        Email: prospect.email || "",
        "Company Name": prospect.companyName || "",
        Url:
            `https://app.zoominfo.com/#/apps/profile/person/${prospect.personID}/contact-profile` ||
            "",
        Source: "ZoomInfo",
        id: String(prospect.personID),
    });
}

module.exports = new Helpers();
