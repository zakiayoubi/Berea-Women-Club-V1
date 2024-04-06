-- member queries:

-- member landing page query
SELECT m.*, mt.memberType
FROM member m
LEFT JOIN membershipType mt ON m.memberID = mt.memberID LIMIT 10;



-- order by queries:

-- order by first name
SELECT m.*, mt.memberType
FROM member m
LEFT JOIN membershipType mt ON m.memberID = mt.memberID ORDER BY firstname LIMIT 10;

-- order by lastname
SELECT m.*, mt.memberType
FROM member m
LEFT JOIN membershipType mt ON m.memberID = mt.memberID ORDER BY lastname LIMIT 10;

--order by datejoined
SELECT 
    m.dateJoined,
    m.memberID,
    m.firstName,
    m.lastName,
    m.email,
    m.phoneNumber,
    m.streetName,
    m.city,
    m.usState,
    m.zipCode,
    m.dateOfBirth,
    mt.memberType
FROM 
    member m
LEFT JOIN 
    membershipType mt 
ON 
    m.memberID = mt.memberID 
ORDER BY 
    m.dateJoined DESC 
LIMIT 10;

-- dues queries:

SELECT m.*, mt.memberType, mf.paydate, mf.status
FROM member m
JOIN membershipType mt ON m.memberID = mt.memberID 
JOIN membershipFee mf ON m.memberID = mf.memberID
WHERE mf.paydate >= '2023-01-01' AND mf.paydate <= '2023-12-31' AND mf.status = 'paid';

-- new member queries:
SELECT * FROM member WHERE datejoined >= '2024-01-01' AND datejoined <= '2024-12-31';
-- count how many joined in a particular year: 
SELECT count(*) FROM member WHERE datejoined >= '2024-01-01' AND datejoined <= '2024-12-31';
-- total members:
SELECT count(*) FROM member;


-- queries for membershiptype:
SELECT m.*, mt.memberType
FROM member m
JOIN membershipType mt ON m.memberID = mt.memberID 
WHERE mt.memberType = 'officer';
-- count member types
SELECT count(*)
FROM member m
JOIN membershipType mt ON m.memberID = mt.memberID 
WHERE mt.memberType = 'officer';
