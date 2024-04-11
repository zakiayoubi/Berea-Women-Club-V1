import db from "./db.js";



async function fetchDonationOutflows() {
    const query = `
      SELECT do.*, o.organizationName 
      FROM donationOutflow do 
      LEFT JOIN organization o ON do.organizationID = o.organizationID
    `;
    const { rows } = await db.query(query);
    return rows;
  }
  
  async function fetchDonationOutflowById(donationOutflowId) {
    const query = `
      SELECT do.*, o.organizationName 
      FROM donationOutflow do 
      LEFT JOIN organization o ON do.organizationID = o.organizationID 
      WHERE donationOutflowId = $1
    `;
    const { rows } = await db.query(query, [donationOutflowId]);
    return rows;
  }
  
  async function fetchDonationOutflowOrderedBy(orderCriteria) {
    let orderBy = 'do.donationOutflowId';
    switch (orderCriteria) {
      case 'amount':
        orderBy = 'do.amount DESC';
        break;
      case 'category':
        orderBy = 'do.category';
        break;
      case 'date':
        orderBy = 'do.donationDate';
        break;
    }
    const query = `
      SELECT do.*, o.organizationName 
      FROM donationOutflow do 
      LEFT JOIN organization o ON do.organizationID = o.organizationID 
      ORDER BY ${orderBy}
    `;
    const { rows } = await db.query(query);
    return rows;
  }
  
  async function fetchAmountDonatedYearly() {
    const query = `
      SELECT EXTRACT(YEAR FROM donationDate) AS donationYear, SUM(amount) AS totalDonated
      FROM donationOutflow
      GROUP BY EXTRACT(YEAR FROM donationDate)
    `;
    const { rows } = await db.query(query);
    return rows;
  }
  async function insertDonationOutflow(donationData) {
    const { organizationID, amount, category, donationDate } = donationData;
    const query = `
      INSERT INTO donationOutflow (organizationID, amount, category, donationDate) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *;
    `;
    const { rows } = await db.query(query, [organizationID, amount, category, donationDate]);
    return rows[0];
  }
  
  async function updateDonationOutflow(donationOutflowId, donationData) {
    const { organizationID, amount, category, donationDate } = donationData;
    const query = `
      UPDATE donationOutflow 
      SET organizationID = $1, amount = $2, category = $3, donationDate = $4 
      WHERE donationOutflowId = $5 
      RETURNING *;
    `;
    const { rows } = await db.query(query, [organizationID, amount, category, donationDate, donationOutflowId]);
    return rows[0];
  }
  
  async function deleteDonationOutflow(donationOutflowId) {
    const query = 'DELETE FROM donationOutflow WHERE donationOutflowId = $1 RETURNING *;';
    const { rows } = await db.query(query, [donationOutflowId]);
    return rows[0]; // Return the deleted record
  }

  export {
    fetchDonationOutflows,
    fetchDonationOutflowById,
    fetchDonationOutflowOrderedBy,
    fetchAmountDonatedYearly,
    insertDonationOutflow,
    updateDonationOutflow,
    deleteDonationOutflow,
  };
  