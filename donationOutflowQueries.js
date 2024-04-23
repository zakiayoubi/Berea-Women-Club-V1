import db from "./db.js";

async function fetchDonationOutflows(limit = 5) {
  const query = `
    SELECT CAST(di.donationoutflowid AS INTEGER) AS donationoutflowid, di.*, o.organizationname 
    FROM donationoutflow di 
    LEFT JOIN organization o ON di.organizationid = o.organizationid

    UNION

    SELECT CAST(di.donationoutflowid AS INTEGER) AS donationoutflowid, di.*, o.organizationname 
    FROM donationoutflow di 
    LEFT JOIN organization o ON di.organizationid = o.organizationid;
  `;
  const { rows } = await db.query(query);
  return rows;
}


async function fetchDonationOutflowById(donationOutflowId) {
  const query = `
    SELECT di.*
    FROM donationoutflow di 
    WHERE di.donationoutflowid = $1
  `;
  const { rows } = await db.query(query, [donationOutflowId]);
  return rows;
}




async function getDonationOutflowByName(searchTerm) {
  const query = `
      SELECT * FROM donationOutflow
      WHERE recordName LIKE $1
      ORDER BY recordName;
  `;
  const searchPattern = `%${searchTerm}%`; // Allows for partial matching

  try {
      const result = await db.query(query, [searchPattern]);
      if (result.rows.length > 0) {
          return result.rows; // Return the donation outflow details
      } else {
          return null; // No donation outflow found
      }
  } catch (error) {
      console.error('Error executing getDonationOutflowByName query:', error);
      throw error; // Rethrowing the error to handle it in the route
  }
}


async function addDonationOutflow(recordName, organizationID, category, amount, donationDate = new Date()) {
  const query = `
    INSERT INTO donationOutflow (recordName, organizationID, category, amount, donationDate)
    VALUES ($1, $2, $3, $4, $5)
  `;
  const values = [recordName, organizationID, category, amount, donationDate];

  try {
    const res = await db.query(query, values);
    return res.rows[0]; // or another appropriate response depending on your need
  } catch (err) {
    console.error('Error inserting donation outflow:', err);
    throw err; // Re-throwing the error is often useful in a larger application context
  }
}


async function updateDonationOutflow(donationOutflowId, donationData) {
  const { category, amount, donationDate, recordName } = donationData;
  const query = `
    UPDATE donationoutflow
    SET category = $1, amount = $2, donationdate = $3, recordName = $4
    WHERE donationoutflowid = $5
    RETURNING *;
  `;
  const { rows } = await db.query(query, [category, amount, donationDate, recordName, donationOutflowId]);
  return rows[0];
}



async function deleteDonationOutflow(donationOutflowId) {
  const query = `
      DELETE FROM donationoutflow
      WHERE donationoutflowid = $1;
  `;
  return db.query(query, [donationOutflowId]);
}

async function fetchSortedDonationOutflows(sortby) {
  const validColumns = ['donationOutflowId', 'recordName', 'category', 'amount', 'donationDate'];
  let column = 'donationOutflowId'; // Default sorting column

  if (validColumns.includes(sortby)) {
    column = sortby;
  } else {
    console.error('Invalid sort column');
    throw new Error('Invalid sort column');
  }

  const query = `
      SELECT * FROM donationOutflow
      ORDER BY ${column};
  `;

  try {
      const { rows } = await db.query(query);
      return rows;
  } catch (err) {
      console.error('Error fetching sorted donation outflows:', err);
      throw err;
  }
}



export {
  fetchDonationOutflows,
  fetchDonationOutflowById,
  updateDonationOutflow,
  deleteDonationOutflow,
  addDonationOutflow,
  getDonationOutflowByName,
  fetchSortedDonationOutflows,
};
