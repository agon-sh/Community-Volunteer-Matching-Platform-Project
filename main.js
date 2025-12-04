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

class OpportunityService {
    constructor(opportunityRepository, userService) {
        this.opportunityRepository = opportunityRepository;
        this.userService = userService;
    }

    // Private method to validate organization accessing the opportunity
    _validateOrganizationAccess(opportunity, action, requireOwnership = true) {
        const current = this.userService.getCurrentUser();
        if (!current || !(current instanceof Organization)) {
            throw new Error(`Only a logged-in organization can ${action} opportunities.`);
        }
        if (requireOwnership && opportunity.organization && opportunity.organization !== current) {
            throw new Error(`You can only ${action} your own opportunities.`);
        }
        return current;
    }

    // Accept a pre-built Opportunity that was created via the builder pattern.
    // Only a logged-in Organization can post opportunities.
    postOpportunity(opportunity) {
        const current = this._validateOrganizationAccess(opportunity, "post", false);

        // Ensure the opportunity is owned by the current organization.
        if (!opportunity.organization) {
            opportunity.setOrganization(current);
        } else if (opportunity.organization !== current) {
            throw new Error("You can only post opportunities for your own organization.");
        }

        console.log(`Posting opportunity: ${opportunity.title} by ${current.name}`);
        return this.opportunityRepository.save(opportunity);
    }

    // Only the owning organization (currently logged in) can edit.
    editOpportunity(opportunity, updates = {}) {
        this._validateOrganizationAccess(opportunity, "edit");

        console.log(`Editing opportunity ID: ${opportunity.id}`);

        for (const key in updates) {
            opportunity[key] = updates[key];
        }

        return this.opportunityRepository.save(opportunity);
    }

    // Only the owning organization (currently logged in) can delete.
    deleteOpportunity(opportunity) {
        this._validateOrganizationAccess(opportunity, "delete");

        console.log(`Deleting opportunity ID: ${opportunity.id}`);
        this.opportunityRepository.delete(opportunity);
    }

    // Only the owning organization (currently logged in) can close applications.
    closeOpportunity(opportunity) {
        this._validateOrganizationAccess(opportunity, "close");

        console.log(`Closing opportunity ID: ${opportunity.id} (no longer available for applications)`);
        opportunity.setAvailable(false);
        return this.opportunityRepository.save(opportunity);
    }

    // Only the owning organization (currently logged in) can open applications.
    openOpportunity(opportunity) {
        this._validateOrganizationAccess(opportunity, "open");

        console.log(`Opening opportunity ID: ${opportunity.id} (now available for applications)`);
        opportunity.setAvailable(true);
        return this.opportunityRepository.save(opportunity);
    }
}

class OpportunityRepository {
    constructor() {
        this.opportunities = [];
        this.nextId = 1;
    }

    save(opportunity) {
        // new opportunity object being saved
        if (!opportunity.id) {
            opportunity.id = this.nextId++;
            this.opportunities.push(opportunity);
            console.log(`Opportunity saved with ID ${opportunity.id}`);
        } 
        // existing opportunity object being updated
        else {
            // Initialize the index to null
            let index = null;

            // Find the index of the opportunity in the array
            for (let i = 0; i < this.opportunities.length; i++) {
                if (this.opportunities[i].id === opportunity.id) {
                    index = i;
                    break;
                }
            }

            // If the opportunity is found, update it, otherwise add it to the array
            if (index !== null) {
                this.opportunities[index] = opportunity;
                console.log(`Opportunity ID ${opportunity.id} updated`);
            } else {
                this.opportunities.push(opportunity);
                console.log(`Opportunity added with ID ${opportunity.id}`);
            }
        }
        return opportunity;
    }

    delete(opportunity) {
        for (let i = this.opportunities.length - 1; i >= 0; i--) {
            if (this.opportunities[i].id === opportunity.id) {
                console.log(`Deleting opportunity ID ${opportunity.id}`);
                this.opportunities.splice(i, 1);
                return;
            }
        }
        throw new Error(`Could not find an opportunity with ID ${opportunity.id} to delete`)
    }

    getAll() {
        console.log("Retrieving all opportunities");
        return this.opportunities;
    }
}

class UserService {
    constructor(userRepository) {
        this.userRepository = userRepository;
        this.currentUser = null; // <-- logged in user
    }

    register(user) {
        if (!(user instanceof User)) {
            throw new Error("register expects an instance of User (Volunteer or Organization)");
        }

        if (!user.email) {
            throw new Error("User must have an email before registering.");
        }

        if (this.userRepository.getUserByEmail(user.email)) {
            throw new Error("User with that email already exists");
        }

        return this.userRepository.save(user);
    }

    login(attemptedEmail, attemptedPassword) {
        // Log out the current user if they are already logged in
        this.logout();

        const user = this.userRepository.getUserByEmail(attemptedEmail);
        if (!user) {
            console.log("Login failed: user not found");
            return false;
        }
        if (user.password !== attemptedPassword) {
            console.log("Login failed: wrong password");
            return false;
        }

        this.currentUser = user;
        console.log(`Logged in as ${user.name} (${user.email})`);
        return true;
    }

    logout() {
        if (this.currentUser) {
            console.log(`Logging out of ${this.currentUser.email}`);
        }
        this.currentUser = null;
    }

    deleteAccount() {
        if (!this.currentUser) {
            console.log("No user logged in");
            return;
        }
        const email = this.currentUser.email;
        this.userRepository.deleteByEmail(email);
        console.log(`Deleted account for ${email}`);
        this.currentUser = null;
    }

    getCurrentUser() {
        return this.currentUser;
    }
}

class UserRepository {
    constructor() {
        // key: email, value: User (Volunteer or Organization)
        this.users = {};
    }

    save(user) {
        console.log(`Saving user: ${user.email}`);
        this.users[user.email] = user;
        return user;
    }

    getUserByEmail(email) {
        return this.users[email] || null;
    }

    deleteByEmail(email) {
        console.log(`Deleting user: ${email}`);
        delete this.users[email];
    }
}

