import db from "./db.js";

async function fetchDonationInflows(limit = 5) {
  const query = `
    SELECT CAST(di.donationinflowid AS INTEGER) AS donationinflowid, di.*, o.organizationname 
    FROM donationinflow di 
    LEFT JOIN organization o ON di.organizationid = o.organizationid

    UNION

    SELECT CAST(di.donationinflowid AS INTEGER) AS donationinflowid, di.*, o.organizationname 
    FROM donationinflow di 
    LEFT JOIN organization o ON di.organizationid = o.organizationid;
  `;
  const { rows } = await db.query(query);
  return rows;
}


async function fetchDonationInflowById(donationInflowId) {
  const query = `
    SELECT di.*
    FROM donationinflow di 
    WHERE di.donationinflowid = $1
  `;
  const { rows } = await db.query(query, [donationInflowId]);
  return rows;
}




async function getDonationInflowByName(searchTerm) {
  const query = `
      SELECT * FROM donationInflow
      WHERE recordName LIKE $1
      ORDER BY recordName;
  `;
  const searchPattern = `%${searchTerm}%`; // Allows for partial matching

  try {
      const result = await db.query(query, [searchPattern]);
      if (result.rows.length > 0) {
          return result.rows; // Return the donation inflow details
      } else {
          return null; // No donation inflow found
      }
  } catch (error) {
      console.error('Error executing getDonationInflowByName query:', error);
      throw error; // Rethrowing the error to handle it in the route
  }
}


async function addDonationInflow(recordName, organizationID, category, amount, donationDate = new Date()) {
  const query = `
    INSERT INTO donationInflow (recordName, organizationID, category, amount, donationDate)
    VALUES ($1, $2, $3, $4, $5)
  `;
  const values = [recordName, organizationID, category, amount, donationDate];

  try {
    const res = await db.query(query, values);
    return res.rows[0]; // or another appropriate response depending on your need
  } catch (err) {
    console.error('Error inserting donation inflow:', err);
    throw err; // Re-throwing the error is often useful in a larger application context
  }
}


async function updateDonationInflow(donationInflowId, donationData) {
  const { category, amount, donationDate, recordName } = donationData;
  const query = `
    UPDATE donationinflow
    SET category = $1, amount = $2, donationdate = $3, recordName = $4
    WHERE donationinflowid = $5
    RETURNING *;
  `;
  const { rows } = await db.query(query, [category, amount, donationDate, recordName, donationInflowId]);
  return rows[0];
}



async function deleteDonationInflow(donationInflowId) {
  const query = `
      DELETE FROM donationinflow
      WHERE donationinflowid = $1;
  `;
  return db.query(query, [donationInflowId]);
}

async function fetchSortedDonationInflows(sortby) {
  const validColumns = ['donationInflowId', 'recordName', 'category', 'amount', 'donationDate'];
  let column = 'donationInflowId'; // Default sorting column

  if (validColumns.includes(sortby)) {
    column = sortby;
  } else {
    console.error('Invalid sort column');
    throw new Error('Invalid sort column');
  }

  const query = `
      SELECT * FROM donationInflow
      ORDER BY ${column};
  `;

  try {
      const { rows } = await db.query(query);
      return rows;
  } catch (err) {
      console.error('Error fetching sorted donation inflows:', err);
      throw err;
  }
}



export {
  fetchDonationInflows,
  fetchDonationInflowById,
  updateDonationInflow,
  deleteDonationInflow,
  addDonationInflow,
  getDonationInflowByName,
  fetchSortedDonationInflows,
};