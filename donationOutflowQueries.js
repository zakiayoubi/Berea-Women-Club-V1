import db from "./db.js";

async function fetchNewOutflows(year) {
  const query = `
      SELECT dof.*, o.organizationName
      FROM donationOutflow dof JOIN organization o ON dof.organizationID = o.organizationID
      WHERE donationDate >= $1 AND donationDate <= $2 ORDER BY donationDate DESC;
  `;
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  try {
      const result = await db.query(query, [startDate, endDate]);
      return result.rows;
  } catch (err) {
      console.error('Error executing fetchNewOutflows query:', err);
      throw err;
  }
};


async function fetchDonationOutflows() {
  const query = `
      SELECT dof.*, o.organizationname 
      FROM donationoutflow dof JOIN organization o ON dof.organizationID = o.organizationID
      ORDER BY dof.donationOutflowId;
  `;

  const result = await db.query(query);
  return result.rows;
};


async function fetchDonationOutflowsTotal() {
  const query = `
    SELECT
      EXTRACT(YEAR FROM donationDate) AS donationYear,
      MIN(amount) AS donationMin,
      MAX(amount) AS donationMax,
      AVG(amount) AS donationAverage,
      SUM(amount) AS totalAmountRaised
    FROM
      donationOutflow
    GROUP BY
      donationYear
    ORDER BY
      donationYear DESC;
  `;
  const result = await db.query(query);
  return result.rows;
};


async function fetchDonationOutflowById(donationOutflowId) {
  const query = `
    select dof.*, o.organizationname from donationoutflow dof JOIN organization o ON 
    dof.organizationID = o.organizationID WHERE dof.donationOutflowID = $1;
    
  `;
  const result = await db.query(query, [donationOutflowId]);
  return result.rows;
};




async function getDonationOutflowByName(searchTerm) {
  const query = `
      SELECT * FROM donationOutflow
      WHERE recordName LIKE $1
      ORDER BY recordName;
  `;
  const searchPattern = `%${searchTerm}%`; // Allows for partial matching

  try {
      const result = await db.query(query, [searchPattern]);
        return result.rows; // Return the donation outflow details
  } catch (error) {
      console.error('Error executing getDonationOutflowByName query:', error);
      throw error; // Rethrowing the error to handle it in the route
  }
}


async function addDonationOutflow(newOrg) {
  const recordName = newOrg.recordName;
  const organizationID = newOrg.organization;
  const contactPerson = newOrg.contactPerson;
  const category = newOrg.category;
  const amount = newOrg.amount;
  const donationDate = newOrg.donationDate;

  const query = `
    INSERT INTO donationOutflow (recordName, organizationID, contactPerson, donationDate, category, amount)
    VALUES ($1, $2, $3, $4, $5, $6)
  `;
  const values = [recordName, organizationID, contactPerson, donationDate, category, amount];

  try {
    const res = await db.query(query, values);
    return res; // or another appropriate response depending on your need
  } catch (err) {
    console.error('Error inserting donation Outflow:', err);
    throw err; // Re-throwing the error is often useful in a larger application context
  }
};


async function updateDonationOutflow(donationOutflowId, donationData) {
  const { organizationID, contactPerson, category, amount, donationDate, recordName } = donationData;
  const query = `
    UPDATE donationOutflow
    SET 
    recordName = $1,
    organizationID = $2,
    contactPerson = $3,
    donationdate = $4, 
    category = $5, 
    amount = $6
    WHERE donationOutflowId = $7
    ;
  `;
  const { rows } = await db.query(query, [recordName, organizationID, contactPerson, donationDate, category, amount, donationOutflowId]);
  return rows;
};


async function sortOutflows(sortBy) {
  let orderBy = 'o.organizationName'; // default ordering
  switch (sortBy) {
    case 'recordName':
      orderBy = 'dof.recordName';
      break;
    case 'organizationName':
      orderBy = 'o.organizationName';
      break;
    case 'contactPerson':
      orderBy = 'dof.contactPerson';
      break;
    case 'category':
      orderBy = 'dof.category';
      break;
    case 'amount':
      orderBy = 'dof.amount DESC';
      break;
    case 'donationDate':
      orderBy = 'dof.donationDate DESC';
      break;
  }

  const query = `
      SELECT dof.*, o.organizationName FROM donationOutflow dof
      JOIN organization o ON dof.organizationID = o.organizationID
      ORDER BY ${orderBy}
  `
  const result = await db.query(query);
  return result.rows;
};


async function deleteDonationOutflow(donationOutflowId) {
  const query = `
      DELETE FROM donationOutflow
      WHERE donationOutflowid = $1;
  `;
  return db.query(query, [donationOutflowId]);
};

export {
  fetchDonationOutflows,
  fetchDonationOutflowById,
  updateDonationOutflow,
  deleteDonationOutflow,
  addDonationOutflow,
  getDonationOutflowByName,
  sortOutflows,
  fetchDonationOutflowsTotal,
  fetchNewOutflows,
};