import db from "./db.js";


async function fetchDonationInflows(limit = 5) {
  const query = `
    SELECT di.*, o.organizationName 
    FROM donationinflow di 
    LEFT JOIN organization o ON di.organizationid = o.organizationid 
    LIMIT $1
  `;
  const { rows } = await db.query(query, [limit]);
  return rows;
}

async function fetchDonationInflowById(donationInflowId) {
  const query = `
    SELECT di.*, o.organizationName 
    FROM donationinflow di 
    LEFT JOIN organization o ON di.organizationid = o.organizationid 
    WHERE di.donationinflowid = $1
  `;
  const { rows } = await db.query(query, [donationInflowId]);
  return rows;
}

async function fetchDonationInflowRaisedYearly() {
  const query = `
    SELECT EXTRACT(YEAR FROM donationdate) AS donationYear, SUM(amount) AS totalRaised
    FROM donationinflow
    GROUP BY EXTRACT(YEAR FROM donationdate)
  `;
  const { rows } = await db.query(query);
  return rows;
}

async function insertDonationInflow(donationData) {
  const { organizationid, category, amount, donationDate } = donationData;
  const query = `
    INSERT INTO donationinflow (organizationid, category, amount, donationdate) 
    VALUES ($1, $2, $3, $4) 
    RETURNING *;
  `;
  const { rows } = await db.query(query, [organizationid, category, amount, donationDate]);
  return rows[0];
}

async function updateDonationInflow(donationInflowId, donationData) {
  const { organizationid, category, amount, donationDate } = donationData;
  const query = `
    UPDATE donationinflow 
    SET organizationid = $1, category = $2, amount = $3, donationdate = $4 
    WHERE donationinflowid = $5 
    RETURNING *;
  `;
  const { rows } = await db.query(query, [organizationid, category, amount, donationDate, donationInflowId]);
  return rows[0];
}

async function deleteDonationInflow(donationInflowId) {
  const query = 'DELETE FROM donationinflow WHERE donationinflowid = $1 RETURNING *;';
  const { rows } = await db.query(query, [donationInflowId]);
  return rows[0]; // Return the deleted record
}

export {
  fetchDonationInflows,
  fetchDonationInflowById,
  fetchDonationInflowRaisedYearly,
  insertDonationInflow,
  updateDonationInflow,
  deleteDonationInflow,
};