class User {
    constructor() {
        this.name = null;
        this.email = null;
        this.password = null;
    }

    setName(name){this.name = name; return this}
    setEmail(email){this.email = email; return this}
    setPassword(password){this.password = password; return this}
}

class Volunteer extends User {
    constructor() {
        super();
        this.interests = [];
    }

    addInterest(interest) {
        console.log(`Adding interest "${interest}" to ${this.name}`);
        if (!this.interests.includes(interest)) {
            if (this.interests.length >= 3) {
                console.log("Error: Volunteer has more than 3 interests");
                throw new Error("Volunteer can have at most 3 interests.");
            }
            this.interests.push(interest);
            console.log(`Interest added. Current interests of ${this.name}: ${this.interests}`);
        }

        return this;
    }

    removeInterest(interest) {
        console.log(`Removing interest "${interest}" from ${this.name}`);
        for (let i = this.interests.length - 1; i >= 0; i--) {
            if (this.interests[i] === interest) {
                this.interests.splice(i, 1);
            }
        }
        return this;
    }
}

class Organization extends User {
    constructor() {
        super();
        this.description = "";
    }

    setDescription(description){this.description = description; return this};

    createOpportunity() {
        console.log(`Starting opportunity builder for org ${this.name}`);

        // Return a new Opportunity already linked to this organization,
        // so the rest can be built fluently via setters.
        return new Opportunity().setOrganization(this);
    }
}

class Opportunity {
    constructor() {
        this.id = null;
        this.title = "";
        this.description = "";
        this.interest = "";
        this.location = "";
        this.date = "";
        this.organization = null;
        this.available = true;
    }

    // Builder pattern methods
    setId(id) { this.id = id; return this; }
    setTitle(title) { this.title = title; return this; }
    setDescription(description) { this.description = description; return this; }
    setInterest(interest) { this.interest = interest; return this; }
    setLocation(location) { this.location = location; return this; }
    setDate(date) { this.date = date; return this; }
    setOrganization(org) { this.organization = org; return this; }
    setAvailable(isAvailable) { this.available = isAvailable; return this; }

    isAvailable() { 
        return this.available; 
    }
}

