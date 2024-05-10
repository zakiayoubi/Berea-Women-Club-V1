-- https://www.postgresqltutorial.com/

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100)
);
INSERT INTO users VALUES(1,'admin@admin.com','$2b$10$5p22LZ1xgeg8MbtDRKSzTuE/NpeGddcEVvi47mGiPbHpcJq3EbGsK');


CREATE TABLE IF NOT EXISTS member (
    memberID INTEGER PRIMARY KEY,
    firstName VARCHAR(100),
    lastName VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    phoneNumber VARCHAR(20), -- Changed to VARCHAR to accommodate formatting
    streetName VARCHAR(150),
    city VARCHAR(50),
    usState VARCHAR(50),
    zipCode INT,
    dateOfBirth DATE,
    dateJoined DATE DEFAULT CURRENT_DATE,
    memberType VARCHAR(50) DEFAULT 'member',
    UNIQUE (firstName, lastName)
);

CREATE TABLE IF NOT EXISTS membershipFee (
    feeID INTEGER PRIMARY KEY,
    memberID INT,
    paymentYear INT,
    payDate DATE,
    status VARCHAR(10),
    FOREIGN KEY (memberID) REFERENCES member(memberID) ON DELETE CASCADE,
    CONSTRAINT status_check CHECK (status IN ('Paid', 'Not Paid')),
    CONSTRAINT unique_year_member UNIQUE (memberID, paymentYear),
    CONSTRAINT paydate_status_check CHECK (
        (status = 'Paid' AND payDate IS NOT NULL) OR
        (status = 'Not Paid' AND payDate IS NULL)
    )
);



CREATE TABLE IF NOT EXISTS organization (
    organizationID INTEGER PRIMARY KEY,
    organizationName VARCHAR(150) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    phoneNumber VARCHAR(20),
    streetName VARCHAR(150),
    city VARCHAR(50),
    usState VARCHAR(50),
    zipCode INT,
    organizationType VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS donationInflow (
    donationInflowId INTEGER PRIMARY KEY,
    recordName VARCHAR(100) UNIQUE,
    organizationID INT, -- Added this column for the foreign key reference
    donationDate DATE DEFAULT CURRENT_DATE,
    category VARCHAR(100),
    amount NUMERIC(12, 2),
    
    FOREIGN KEY (organizationID) REFERENCES organization(organizationID)
);

CREATE TABLE IF NOT EXISTS donationOutflow ( -- Corrected table name and consistency
    donationOutflowId INTEGER PRIMARY KEY,    
    recordName VARCHAR(100) UNIQUE,
    organizationID INT, -- Added this column for the foreign key reference
    donationDate DATE DEFAULT CURRENT_DATE,
    category VARCHAR(100),
    amount NUMERIC(12, 2),
    FOREIGN KEY (organizationID) REFERENCES organization(organizationID)
);

CREATE TABLE IF NOT EXISTS event (
    eventID INTEGER PRIMARY KEY,
    eventName VARCHAR(150) UNIQUE,
    eventLocation VARCHAR(150),
    streetName VARCHAR(150),
    city VARCHAR(50),
    usState VARCHAR(50),
    zipCode INT,
    eventDate DATE DEFAULT CURRENT_DATE,
    amountRaised NUMERIC(12, 2),
    eventCost NUMERIC(12, 2),
    eventType VARCHAR(100)
);

-- Associative entity that connects member to event
CREATE TABLE IF NOT EXISTS host (
    eventID INT,
    memberID INT,
    PRIMARY KEY (eventID, memberID),
    FOREIGN KEY (eventID) REFERENCES event(eventID),
    FOREIGN KEY (memberID) REFERENCES member(memberID)
);

