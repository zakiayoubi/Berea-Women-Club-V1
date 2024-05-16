-- https://www.postgresqltutorial.com/

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
    memberType VARCHAR(50) DEFAULT 'Member',
    password VARCHAR(100)
);
INSERT INTO member (memberID, firstName, lastName, email, password) VALUES(1,'Sarah','Heggen','sarah.heggen@gmail.com','$2b$10$5p22LZ1xgeg8MbtDRKSzTuE/NpeGddcEVvi47mGiPbHpcJq3EbGsK');

CREATE TABLE IF NOT EXISTS duesPayment (
    paymentID INTEGER PRIMARY KEY,
    memberID INT,
    forYear VARCHAR(9),
    paymentDate DATE,
    recordedBy INT,
    FOREIGN KEY (memberID) REFERENCES member(memberID),
    FOREIGN KEY (recordedBy) REFERENCES member(memberID),
    CONSTRAINT unique_year_member UNIQUE (memberID, forYear)
);

-- view that gets all members and last paid year (whether or not they have ever paid), 
-- and decides their current status
--
-- NOTE: Currently doesn't show the current status properly if they have paid for NEXT year but not this year
CREATE VIEW IF NOT EXISTS duesStatus AS 
    SELECT  m.memberID, 
            m.firstName,
            m.lastName,
            CASE WHEN MAX(d.forYear) IS NOT NULL THEN MAX(d.forYear) ELSE 'Never' END as lastPaidYear,
            -- spring
            CASE WHEN CAST(strftime('%m',CURRENT_DATE) as INTEGER) < 8 THEN
                CASE WHEN MAX(d.forYear) =  strftime('%Y', DATE(CURRENT_DATE,'-1 year')) || '-' || strftime('%Y', CURRENT_DATE) 
                     THEN 'Paid' else 'Not Paid' END
            -- fall
            ELSE
                CASE WHEN MAX(d.forYear) =  strftime('%Y', CURRENT_DATE) || '-' || strftime('%Y', DATE(CURRENT_DATE,'+1 year')) 
                     THEN 'Paid' else 'Not Paid' END
            END as status
            --CASE WHEN MAX(d.forYear) = strftime('%Y', CURRENT_DATE) THEN 'Paid' else 'Not Paid' end as status
    FROM member m
    LEFT JOIN duesPayment d on d.memberID = m.memberID
    GROUP BY m.memberID, m.firstName, m.lastName;

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
    memberID INT, -- Added this column for the foreign key reference
    donationDate DATE DEFAULT CURRENT_DATE,
    category VARCHAR(100),
    amount NUMERIC(12, 2),
    createdDonor VARCHAR(100),
    
    FOREIGN KEY (organizationID) REFERENCES organization(organizationID),
    FOREIGN KEY (memberID) REFERENCES member(memberID)
);

CREATE TABLE IF NOT EXISTS donationOutflow ( -- Corrected table name and consistency
    donationOutflowId INTEGER PRIMARY KEY,    
    recordName VARCHAR(100) UNIQUE,
    organizationID INT, -- Added this column for the foreign key reference
    organizationContact VARCHAR(100),
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
CREATE TABLE IF NOT EXISTS eventAttendee (
    eventID INT,
    memberID INT,
    PRIMARY KEY (eventID, memberID),
    FOREIGN KEY (eventID) REFERENCES event(eventID),
    FOREIGN KEY (memberID) REFERENCES member(memberID)
);

