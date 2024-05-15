import db from "./db.js";

async function fetchNewInflows(year) {
  const query = `
      SELECT di.*, o.organizationName
      FROM donationInflow di JOIN organization o ON di.organizationID = o.organizationID
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
      SELECT di.*, o.organizationname from donationInflow di
      JOIN organization o ON di.organizationID = o.organizationID
      ORDER BY di.donationInflowId;
  `;
  const result = await db.query(query);
  return result.rows;
};


async function fetchDonationInflowById(donationInflowId) {
  const query = `
    select di.*, o.organizationname from donationinflow di JOIN organization o ON 
    di.organizationID = o.organizationID WHERE di.donationinflowID = $1;
    
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
  const category = newDonor.category;
  const amount = newDonor.amount;
  const donationDate = newDonor.donationDate;
  const donorType = newDonor.donorType;
  const createdDonor = "";

  console.log("Inside addDonationInflow we havvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvve", newDonor)
  
  if (donorType === "organization") {
    const query = `
    INSERT INTO donationInflow (recordName, organizationID, memberID, donationDate, category, amount, createdDonor)
    VALUES ($1, $2, $3, $4, $5, $6)
  `;
    const values = [recordName, donor, null, donationDate, category, amount, createdDonor];

  } else if (donorType === "member") {
    const query = `
    INSERT INTO donationInflow (recordName, organizationID, memberID, donationDate, category, amount, createdDonor)
    VALUES ($1, $2, $3, $4, $5, $6)
  `;
    const values = [recordName, null, donor, donationDate, category, amount, createdDonor];

  } else {
    const query = `
    INSERT INTO donationInflow (recordName, organizationID, donationDate, category, amount)
    VALUES ($1, $2, $3, $4, $5, $6)
  `;
    const values = [recordName, null, null, donationDate, category, amount];
  }

  const query = `
  INSERT INTO donationInflow (recordName, organizationID, memberID, donationDate, category, amount, createdDonor)
  VALUES ($1, $2, $3, $4, $5, $6, $7)
`;
  const values = [recordName, donor, null, donationDate, category, amount, createdDonor];



  // const query = `
  //   INSERT INTO donationInflow (recordName, organizationID, donationDate, category, amount)
  //   VALUES ($1, $2, $3, $4, $5)
  // `;
  // const values = [recordName, organizationID, donationDate, category, amount];

  try {
    console.log("loooooooooooooooooooooooooooooooooook at thatttttttttttttttttttttttttttttttttt", query, values)
    const res = await db.query(query, values);
    console.log("thiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiis", res)
    
    return res// or another appropriate response depending on your need
  } catch (err) {
    console.error('Error inserting donation inflow:', err);
    throw err; // Re-throwing the error is often useful in a larger application context
  }
};


async function updateDonationInflow(donationInflowId, donationData) {
  const { organizationID, category, amount, donationDate, recordName } = donationData;
  const query = `
    UPDATE donationinflow
    SET 
    recordName = $1,
    organizationID = $2,
    donationdate = $3, 
    category = $4, 
    amount = $5
    WHERE donationInflowId = $6
    ;
  `;
  const { rows } = await db.query(query, [recordName, organizationID, donationDate, category, amount, donationInflowId]);
  return rows[0];
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