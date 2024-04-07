-- https://www.postgresqltutorial.com/

CREATE TABLE member (
    memberID SERIAL PRIMARY KEY,
    firstName VARCHAR(100),
    lastName VARCHAR(100),
    email VARCHAR(100),
    phoneNumber VARCHAR(20), -- Changed to VARCHAR to accommodate formatting
    streetName VARCHAR(150),
    city VARCHAR(50),
    usState VARCHAR(50),
    zipCode INT,
    dateOfBirth DATE,
    dateJoined DATE DEFAULT CURRENT_DATE,
);

CREATE TABLE membershipFee (
    feeID SERIAL PRIMARY KEY,
    memberID INT,
    payDate DATE DEFAULT CURRENT_DATE,
    paymentYear INT GENERATED ALWAYS AS (EXTRACT(YEAR FROM payDate)) STORED,
    status VARCHAR(50),
    FOREIGN KEY (memberID) REFERENCES member(memberID),
    CONSTRAINT status_check CHECK (status IN ('paid', 'not paid')),
    CONSTRAINT unique_year_member UNIQUE (memberID, paymentYear)
);


CREATE TABLE membershipType (
    membershipID SERIAL PRIMARY KEY,
    memberType VARCHAR(150) DEFAULT 'member',
    memberID INT, -- Added this column to store the foreign key
    FOREIGN KEY (memberID) REFERENCES member(memberID)
);

CREATE TABLE organization (
    organizationID SERIAL PRIMARY KEY,
    organizationName VARCHAR(150) NOT NULL,
    email VARCHAR(100),
    phoneNumber VARCHAR(20), -- Changed to VARCHAR
    streetName VARCHAR(150),
    city VARCHAR(50),
    usState VARCHAR(50),
    zipCode INT,
    organizationType VARCHAR(100)
);

CREATE TABLE donationInflow (
    donationInflowId SERIAL PRIMARY KEY,
    organizationID INT, -- Added this column for the foreign key reference
    category VARCHAR(100),
    amount NUMERIC(12, 2),
    donationDate DATE DEFAULT CURRENT_DATE,
    FOREIGN KEY (organizationID) REFERENCES organization(organizationID)
);

CREATE TABLE donationOutflow ( -- Corrected table name and consistency
    donationOutflowId SERIAL PRIMARY KEY,
    organizationID INT, -- Added this column for the foreign key reference
    donationDate DATE DEFAULT CURRENT_DATE,
    amount NUMERIC(12, 2),
    category VARCHAR(100),
    FOREIGN KEY (organizationID) REFERENCES organization(organizationID)
);

CREATE TABLE event (
    eventID SERIAL PRIMARY KEY,
    eventName VARCHAR(150),
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
CREATE TABLE host (
    eventID INT,
    memberID INT,
    PRIMARY KEY (eventID, memberID),
    FOREIGN KEY (eventID) REFERENCES event(eventID),
    FOREIGN KEY (memberID) REFERENCES member(memberID)
);

