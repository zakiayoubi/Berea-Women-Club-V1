import db from "./db.js";

async function fetchNewInflows(year) {
  const query = `
      SELECT di.*, o.organizationName, m.firstName, m.lastName
      FROM donationInflow di 
      LEFT JOIN organization o ON di.organizationID = o.organizationID
      LEFT JOIN member m ON di.memberID = m.memberID
      WHERE donationDate >= $1 AND donationDate <= $2 ORDER BY donationDate DESC;
  `;
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  try {
      const result = await db.query(query, [startDate, endDate]);
      return result.rows;
  } catch (err) {
      console.error('Error executing fetchNewInflows query:', err);
      throw err;
  }
};

async function fetchDonationInflows() {
  const query = `
      SELECT di.*, o.organizationname, m.firstName, m.lastName
      from donationInflow di
      LEFT JOIN organization o ON di.organizationID = o.organizationID
      LEFT JOIN member m ON di.memberID = m.memberID
      ORDER BY di.donationInflowId;
  `;
  const result = await db.query(query);
  return result.rows;
};


async function fetchDonationInflowById(donationInflowId) {
  const query = `
    select di.*, o.organizationname, m.firstName, m.lastName 
    from donationinflow di 
    LEFT JOIN organization o ON di.organizationID = o.organizationID 
    LEFT JOIN member m ON di.memberID = m.memberID
    WHERE di.donationinflowID = $1;
    
  `;
  const result = await db.query(query, [donationInflowId]);
  return result.rows;
};


async function fetchDonationInflowsTotal() {
  const query = `
    SELECT
      EXTRACT(YEAR FROM donationDate) AS donationYear,
      MIN(amount) AS donationMin,
      MAX(amount) AS donationMax,
      AVG(amount) AS donationAverage,
      SUM(amount) AS totalAmountRaised
    FROM
      donationInflow
    GROUP BY
      donationYear
    ORDER BY
      donationYear DESC;
  `;
  const result = await db.query(query);
  return result.rows;
};





async function getDonationInflowByName(searchTerm) {
  const query = `
      SELECT * FROM donationInflow
      WHERE recordName LIKE $1
      ORDER BY recordName;
  `;
  const searchPattern = `%${searchTerm}%`; // Allows for partial matching

  try {
      const result = await db.query(query, [searchPattern]);
        return result.rows; // Return the donation inflow details
  } catch (error) {
      console.error('Error executing getDonationInflowByName query:', error);
      throw error; // Rethrowing the error to handle it in the route
  }
}


async function addDonationInflow(newDonor) {
  const recordName = newDonor.recordName;
  const donor = newDonor.donor;
  const donorInput = newDonor.donorInput;
  const category = newDonor.category;
  const amount = newDonor.amount;
  const donationDate = newDonor.donationDate;
  const donorType = newDonor.donorType;

  let query;
  let values;
  let createdDonor;
  
  if (donorType === "organization") {
    createdDonor = "";
    query = `
    INSERT INTO donationInflow (recordName, organizationID, memberID, donationDate, category, amount, createdDonor)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `;
    values = [recordName, donor, null, donationDate, category, amount, createdDonor];

  } else if (donorType === "member") {
    createdDonor = "";
    query = `
    INSERT INTO donationInflow (recordName, organizationID, memberID, donationDate, category, amount, createdDonor)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `;
    values = [recordName, null, donor, donationDate, category, amount, createdDonor];

  } else {
    createdDonor = donorInput;
    query = `
    INSERT INTO donationInflow (recordName, organizationID, memberID, donationDate, category, amount, createdDonor)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `;
    values = [recordName, null, null, donationDate, category, amount, createdDonor];
  }

  try {
    const res = await db.query(query, values);
    return res// or another appropriate response depending on your need
  } catch (err) {
    console.error('Error inserting donation inflow:', err);
    throw err; // Re-throwing the error is often useful in a larger application context
  }
};


async function updateDonationInflow(donationInflowId, donationData) {

  const recordName = donationData.recordName;
  const donor = donationData.donor;
  const donorInput = donationData.donorInput;
  const category = donationData.category;
  const amount = donationData.amount;
  const donationDate = donationData.donationDate;
  const donorType = donationData.donorType;
  const donationId = donationInflowId;
 
  let query;
  let values;
  let createdDonor;

  if (donorType === "organization") {
    createdDonor = "";
    query = `
    UPDATE donationInflow
    SET recordName = $1,
        organizationID = $2,
        memberID = $3,
        donationDate = $4,
        category = $5,
        amount = $6,
        createdDonor = $7
    WHERE donationInflowId = $8
    `;
    values = [recordName, donor, null, donationDate, category, amount, createdDonor, donationId];

  } else if (donorType === "member") {
    createdDonor = "";
    query = `
    UPDATE donationInflow
    SET recordName = $1,
        organizationID = $2,
        memberID = $3,
        donationDate = $4,
        category = $5,
        amount = $6,
        createdDonor = $7
    WHERE donationInflowId = $8
    `;
    values = [recordName, null, donor, donationDate, category, amount, createdDonor, donationId];
  } else {
    createdDonor = donorInput;
    query = `
    UPDATE donationInflow
    SET recordName = $1,
        organizationID = $2,
        memberID = $3,
        donationDate = $4,
        category = $5,
        amount = $6,
        createdDonor = $7
    WHERE donationInflowId = $8
    `;
    values = [recordName, null, null, donationDate, category, amount, createdDonor, donationId];
  }
  
  try {
    const res = await db.query(query, values);
    return res// or another appropriate response depending on your need
  } catch (err) {
    console.error('Error inserting donation inflow:', err);
    throw err; // Re-throwing the error is often useful in a larger application context
  }
};


async function sortInflows(sortBy) {
  let orderBy = 'o.organizationName'; // default ordering
  switch (sortBy) {
    case 'recordName':
      orderBy = 'di.recordName';
      break;
    case 'organizationName':
      orderBy = 'o.organizationName';
      break;
    case 'category':
      orderBy = 'di.category';
      break;
    case 'amount':
      orderBy = 'di.amount DESC';
      break;
    case 'donationDate':
      orderBy = 'di.donationDate DESC';
      break;
  }

  const query = `
      SELECT di.*, o.organizationName FROM donationInflow di
      JOIN organization o ON di.organizationID = o.organizationID
      ORDER BY ${orderBy}
  `
  const result = await db.query(query);
  return result.rows;
};


async function deleteDonationInflow(donationInflowId) {
  const query = `
      DELETE FROM donationinflow
      WHERE donationinflowid = $1;
  `;
  return db.query(query, [donationInflowId]);
};

export {
  fetchDonationInflows,
  fetchDonationInflowById,
  updateDonationInflow,
  deleteDonationInflow,
  addDonationInflow,
  getDonationInflowByName,
  sortInflows,
  fetchDonationInflowsTotal, 
  fetchNewInflows,
};