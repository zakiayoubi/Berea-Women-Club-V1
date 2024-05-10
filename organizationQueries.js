import db from "./db.js";



async function fetchAllOrganizations() {
    const query = 'SELECT * FROM organization';
    const results = await db.query(query);
    return results.rows;
  };

async function sortOrganizations(sortBy) {
    let orderBy = 'organizationID'; // default ordering
    switch (sortBy) {
      case 'organizationName':
        orderBy = 'organizationName';
        break;
      case 'organizationType':
        orderBy = 'organizationType';
        break;
    }
    const result = await db.query(`SELECT * FROM organization ORDER BY ${orderBy}`);
    return result.rows;
  };
  
  async function fetchOrganizationCount() {
    const query = 'SELECT count(*) FROM organization';
    const result = await db.query(query);
    return result.rows[0]; // Return the count directly
  };

  async function fetchOrganizationByName(searchTerm) {
    const query = 'SELECT * FROM organization WHERE organizationName ILIKE $1';
    const result = await db.query(query, [`%${searchTerm}%`]);
    return result.rows;
  };
  
  async function fetchSpecificOrganization(id) {
    const query = 'SELECT * FROM organization WHERE organizationID = $1';
    const result = await db.query(query, [id]);
    return result.rows;
  };
  
  async function addOrganization(data) {
    const { organizationName, email, phoneNumber, streetName, city, usState, zipCode, organizationType } = data;
    const query = 'INSERT INTO organization (organizationName, email, phoneNumber, streetName, city, usState, zipCode, organizationType) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)';
    await db.query(query, [organizationName, email, phoneNumber, streetName, city, usState, zipCode, organizationType]);
  };
  
  async function updateOrganization(id, data) {
    const { organizationName, email, phoneNumber, streetName, city, usState, zipCode, organizationType } = data;
    const query = `
      UPDATE organization 
      SET 
        organizationName = $1, 
        email = $2, 
        phoneNumber = $3, 
        streetName = $4, 
        city = $5, 
        usState = $6, 
        zipCode = $7, 
        organizationType = $8
      WHERE organizationID = $9 
      ;
    `;
    const result = await db.query(query, [organizationName, email, phoneNumber, streetName, city, usState, zipCode, organizationType, id]);
    return result.rows;
  };
  
  async function deleteOrganization(id) {
    const query = 'DELETE FROM organization WHERE organizationID = $1';
    await db.query(query, [id]);
  };

  export {
    fetchAllOrganizations,
    sortOrganizations,
    fetchOrganizationCount,
    fetchOrganizationByName,
    fetchSpecificOrganization,
    addOrganization,
    updateOrganization,
    deleteOrganization,
  };