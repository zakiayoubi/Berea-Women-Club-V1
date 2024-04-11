import db from "./db.js";



async function fetchAllOrganizations(limit = 5) {
    const query = 'SELECT * FROM organization LIMIT $1';
    const results = await db.query(query, [limit]);
    return results.rows;
  }
  
  async function fetchOrganizationCount() {
    const query = 'SELECT count(*) FROM organization';
    const result = await db.query(query);
    return result.rows[0]; // Return the count directly
  }
  
  async function fetchSpecificOrganization(id) {
    const query = 'SELECT * FROM organization WHERE organizationID = $1';
    const result = await db.query(query, [id]);
    return result.rows;
  }
  
  async function addOrganization(data) {
    const { organizationName, email, phoneNumber, streetName, city, usState, zipCode, organizationType } = data;
    const query = 'INSERT INTO organization (organizationName, email, phoneNumber, streetName, city, usState, zipCode, organizationType) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)';
    await db.query(query, [organizationName, email, phoneNumber, streetName, city, usState, zipCode, organizationType]);
  }
  
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
      RETURNING *;
    `;
    const result = await db.query(query, [organizationName, email, phoneNumber, streetName, city, usState, zipCode, organizationType, id]);
    return result.rows;
  }
  
  async function deleteOrganization(id) {
    const query = 'DELETE FROM organization WHERE organizationID = $1';
    await db.query(query, [id]);
  }

  export {
    fetchAllOrganizations,
    fetchOrganizationCount,
    fetchSpecificOrganization,
    addOrganization,
    updateOrganization,
    deleteOrganization,
  };