-- member queries:

-- member landing page query
SELECT * from member LIMIT 10;

-- order by queries:

-- order by first name
SELECT * from member ORDER BY firstname LIMIT 10;

-- order by lastname
SELECT * from member ORDER BY lastname LIMIT 10;

--order by datejoined
SELECT * from member 
ORDER BY 
    m.dateJoined DESC 
LIMIT 10;

-- dues queries:

SELECT m.*, mf.paydate, mf.status
FROM member m
JOIN membershipFee mf ON m.memberID = mf.memberID
WHERE mf.paydate >= '2023-01-01' AND mf.paydate <= '2023-12-31' AND mf.status = 'paid';

-- new member queries:
SELECT * FROM member WHERE datejoined >= '2024-01-01' AND datejoined <= '2024-12-31';
-- count how many joined in a particular year: 
SELECT count(*) FROM member WHERE datejoined >= '2024-01-01' AND datejoined <= '2024-12-31';
-- total members:
SELECT count(*) FROM member;


-- adding a new member query:

INSERT INTO member (firstName, lastName, email, phoneNumber, 
streetName, city, usState, zipCode, dateOfBirth, dateJoined)
VALUES (placeholder, placeholder, ...);


INSERT INTO membershipFee (memberID, payDate, paymentYear, status)
VALUES (15, '2022-10-25', 'not paid');

-- editing a member information: 

UPDATE member
SET
  firstName = 'NewFirstName',
  lastName = 'NewLastName',
  email = 'newemail@example.com',
  phoneNumber = 'NewPhoneNumber',
  streetName = 'NewStreetName',
  city = 'NewCity',
  usState = 'NewState',
  zipCode = NewZipCode,
  dateOfBirth = 'NewDateOfBirth' 
WHERE memberID = SpecificMemberID;


UPDATE membershipFee
SET
  status = 'paid'
WHERE memberID = SpecificMemberID;

-- deleting a member
Delete FROM member WHERE memberID = SpecificMemberID;

------------------------------------------------------------------------------

-- organization queries:

SELECT * FROM organization LIMIT 10;
SELECT count(*) FROM organization;
SELECT * FROM organization WHERE organizationID = specificID;

INSERT INTO organization (organizationName, email, phoneNumber, 
streetName, city, usState, zipCode, organizationType) VALUES (...)

UPDATE organanization 
SET
    streetName = 'new name'
WHERE organizationID = specificID;

DELETE FROM organanization WHERE organizationID = specificID;

-----------------------------------------------------------------------------

-- event queries: 
SELECT * FROM event;
SELECT * FROM event WHERE eventID = SpecificEventID;
SELECT * FROM event ORDER BY eventDate DESC;
SELECT * FROM event ORDER BY eventType;
SELECT * FROM event ORDER BY amountRaised;
SELECT * FROM event ORDER BY eventCost;
-- amount raised per year
SELECT EXTRACT(YEAR FROM eventDate) AS eventYear, SUM(amountRaised) AS totalRaised
FROM event
GROUP BY EXTRACT(YEAR FROM eventDate);

-- amount raised per month of a given year
SELECT 
  EXTRACT(YEAR FROM eventDate) AS eventYear,
  EXTRACT(MONTH FROM eventDate) AS eventMonth, 
  SUM(amountRaised) AS totalRaised
FROM event
WHERE EXTRACT(YEAR FROM eventDate) = 2023
GROUP BY 
  EXTRACT(YEAR FROM eventDate), 
  EXTRACT(MONTH FROM eventDate)
ORDER BY 
  EXTRACT(YEAR FROM eventDate), 
  EXTRACT(MONTH FROM eventDate);

-- cost has a similar query to money raised. 


INSERT INTO event (eventName, eventLocation, streetName, city, usState, zipCode, eventDate, amountRaised, eventCost, eventType)
VALUES ('Event Name', 'Event Location', 'Street Name', 'City', 'State', ZipCode, 'EventDate', AmountRaised, EventCost, 'EventType');


UPDATE event
SET
  eventName = 'New Event Name',
  eventLocation = 'New Event Location',
  streetName = 'New Street Name',
  city = 'New City',
  usState = 'New State',
  zipCode = NewZipCode,
  eventDate = 'NewEventDate', -- Use YYYY-MM-DD format
  amountRaised = NewAmountRaised,
  eventCost = NewEventCost,
  eventType = 'New EventType'
WHERE eventID = SpecificEventID;


DELETE FROM event WHERE eventID = SpecificEventID;


-----------------------------------------------------------

-- host table queries

-- all events  a member have attend:
SELECT m.firstname, e.eventname FROM event e LEFT JOIN host h ON e.eventid = h.eventid LEFT JOIN member m ON h.memberid = m.memberid WHERE m.firstname = 'Melanie';

-- all the members attended an event
SELECT e.eventname, m.firstname FROM event e LEFT JOIN host h ON e.eventid = h.eventid LEFT JOIN member m ON h.memberid = m.memberid WHERE e.eventname = 'Charity Gala';

---------------------------------------------------------------

--donation inflow queries

SELECT di.*, o.organizationName FROM donationinflow di LEFT JOIN organization o ON di.organizationid = o.organizationid;
SELECT di.*, o.organizationName FROM donationinflow di 
LEFT JOIN organization o ON di.organizationid = o.organizationid WHERE donationinflow = specificid;

SELECT di.*, o.organizationName 
FROM donationinflow di LEFT JOIN organization o ON di.organizationid = o.organizationid
ORDER BY amount DESC;


SELECT di.*, o.organizationName FROM donationinflow di 
LEFT JOIN organization o 
ON di.organizationid = o.organizationid ORDER BY category;


SELECT di.*, o.organizationName 
FROM donationinflow di LEFT JOIN organization o ON di.organizationid = o.organizationid 
ORDER BY donationdate;

SELECT di.*, m.firstName, m.lastName FROM donationinflow di LEFT JOIN member m ON di.memberid = m.memberid;
SELECT di.*, m.firstName, m.lastName FROM donationinflow di 
LEFT JOIN member m ON di.memberid = m.memberid WHERE donationinflow = specificid;

SELECT di.*, m.firstName, m.lastName 
FROM donationinflow di LEFT JOIN member m ON di.memberid = m.memberid
ORDER BY amount DESC;


SELECT di.*, m.firstName, m.lastName FROM donationinflow di 
LEFT JOIN member m 
ON di.memberid = m.memberid ORDER BY category;


SELECT di.*, m.firstName, m.lastName
FROM donationinflow di LEFT JOIN member o ON di.memberid = m.memberid 
ORDER BY donationdate;

-- amount raised per year: 
SELECT EXTRACT(YEAR FROM donationdate) AS donationdate, SUM(amount) AS totalRaised
FROM donationinflow
GROUP BY EXTRACT(YEAR FROM donationdate);


-- amount raise per month of a given year: 
SELECT 
  EXTRACT(YEAR FROM donationdate) AS donationYear,
  EXTRACT(MONTH FROM donationdate) AS donationMonth, 
  SUM(amount) AS totalRaised
FROM donationinflow
WHERE EXTRACT(YEAR FROM donationdate) = 2023
GROUP BY 
  EXTRACT(YEAR FROM donationdate), 
  EXTRACT(MONTH FROM donationdate)
ORDER BY 
  EXTRACT(YEAR FROM donationdate), 
  EXTRACT(MONTH FROM donationdate);

-- adding a donation inflow:
INSERT INTO donationInflow (organizationID, category, amount, donationDate)
VALUES (1, 'Education', 500.00, '2023-04-07'); -- Example values

-- updating a donation inflow: 
UPDATE donationInflow
SET amount = 600.00 -- new amount
WHERE donationInflowId = 2; -- example

-- deleting a donation inflow:
DELETE FROM donationInflow
WHERE donationInflowId = 3; -- Assuming you want to delete the record with donationInflowId 3


---------------------------------------------------------
-- Query to join donationOutflow with organization and select all fields
SELECT do.*, o.organizationName FROM donationOutflow do LEFT JOIN organization o ON do.organizationID = o.organizationID;

-- Query to join donationOutflow with organization and select all fields, filtering by a specific ID
SELECT do.*, o.organizationName FROM donationOutflow do 
LEFT JOIN organization o ON do.organizationID = o.organizationID WHERE donationOutflowId = specificId;

-- Query to join donationOutflow with organization, ordering by the amount in descending order
SELECT do.*, o.organizationName 
FROM donationOutflow do LEFT JOIN organization o ON do.organizationID = o.organizationID
ORDER BY amount DESC;

-- Query to join donationOutflow with organization, ordering by category
SELECT do.*, o.organizationName FROM donationOutflow do 
LEFT JOIN organization o 
ON do.organizationID = o.organizationID ORDER BY category;

-- Query to join donationOutflow with organization, ordering by donation date
SELECT do.*, o.organizationName 
FROM donationOutflow do LEFT JOIN organization o ON do.organizationID = o.organizationID 
ORDER BY donationDate;

-- Amount donated per year
SELECT EXTRACT(YEAR FROM donationDate) AS donationYear, SUM(amount) AS totalDonated
FROM donationOutflow
GROUP BY EXTRACT(YEAR FROM donationDate);

-- Amount donated per month of a given year
SELECT 
  EXTRACT(YEAR FROM donationDate) AS donationYear,
  EXTRACT(MONTH FROM donationDate) AS donationMonth, 
  SUM(amount) AS totalDonated
FROM donationOutflow
WHERE EXTRACT(YEAR FROM donationDate) = 2023
GROUP BY 
  EXTRACT(YEAR FROM donationDate), 
  EXTRACT(MONTH FROM donationDate)
ORDER BY 
  EXTRACT(YEAR FROM donationDate), 
  EXTRACT(MONTH FROM donationDate);


-- Insert a new donation outflow record
INSERT INTO donationOutflow (organizationID, donationDate, amount, category)
VALUES (1, '2023-04-07', 750.00, 'Healthcare'); -- Example values

-- Update an existing donation outflow record
UPDATE donationOutflow
SET 
  amount = 800.00, 
  category = 'Education' -- New amount and category
WHERE donationOutflowId = 4; -- Assuming you want to update this specific record

-- Delete a donation outflow record
DELETE FROM donationOutflow
WHERE donationOutflowId = 5; -- Assuming you want to delete this specific record

---------------------------------------------
--total money raised in a year: 

WITH EventTotals AS (
    SELECT SUM(amountRaised) AS totalAmountRaised
    FROM event
    WHERE EXTRACT(YEAR FROM eventDate) = 2023
),
DonationInflowTotals AS (
    SELECT SUM(amount) AS totalDonationInflows
    FROM donationInflow
    WHERE EXTRACT(YEAR FROM donationDate) = 2023
)
SELECT 
    (SELECT totalAmountRaised FROM EventTotals) AS TotalRaisedFromEvents,
    (SELECT totalDonationInflows FROM DonationInflowTotals) AS TotalDonationInflows,
    ((SELECT totalAmountRaised FROM EventTotals) + 
    (SELECT totalDonationInflows FROM DonationInflowTotals)) AS TotalRaised
