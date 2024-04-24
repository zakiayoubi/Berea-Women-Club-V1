import db from "./db.js";

async function fetchDonationOutflows() {
  const query = `
      select dof.*, o.organizationname from donationoutflow dof JOIN organization o ON 
      dof.organizationID = o.organizationID ORDER BY dof.donationOutflowId;
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
  const category = newOrg.category;
  const amount = newOrg.amount;
  const donationDate = newOrg.donationDate;

  const query = `
    INSERT INTO donationOutflow (recordName, organizationID, donationDate, category, amount)
    VALUES ($1, $2, $3, $4, $5)
  `;
  const values = [recordName, organizationID, donationDate, category, amount];

  try {
    const res = await db.query(query, values);
    return res.rows[0]; // or another appropriate response depending on your need
  } catch (err) {
    console.error('Error inserting donation Outflow:', err);
    throw err; // Re-throwing the error is often useful in a larger application context
  }
};


async function updateDonationOutflow(donationOutflowId, donationData) {
  const { organizationID, category, amount, donationDate, recordName } = donationData;
  const query = `
    UPDATE donationOutflow
    SET 
    recordName = $1,
    organizationID = $2,
    donationdate = $3, 
    category = $4, 
    amount = $5
    WHERE donationOutflowId = $6
    ;
  `;
  const { rows } = await db.query(query, [recordName, organizationID, donationDate, category, amount, donationOutflowId]);
  return rows[0];
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
};