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
  
  async function fetchSpecificOrganization(searchTerm) {
    const query = 'SELECT * FROM organization WHERE organizationName like $1';
    const result = await db.query(query, [`%${searchTerm}%`]);
    return result.rows;
  }
  
  async function addOrganization(data) {
    const { organizationName, email, phoneNumber, streetName, city, usState, zipCode, organizationType } = data;
    const query = 'INSERT INTO organization (organizationName, email, phoneNumber, streetName, city, usState, zipCode, organizationType) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)';
    await db.query(query, [organizationName, email, phoneNumber, streetName, city, usState, zipCode, organizationType]);
  }
  
  //sorting by (name A-Z and type)
  async function getOrganization(orderBy) {
    let column = 'organizationid'; // default ordering
    switch (orderBy) {
      case 'organizationid':
        column = 'organizationid';
        break;
      case 'organizationname':
          column = 'organizationname';
          break;
      case 'email':
        column = 'email';
        break;
      case ' phonenumber':
        column = ' phonenumber';
        break;
              case 'streetname':
        column = 'streetname';
        break;
      case 'city':
        column = 'city';
        break;
      case 'usstate':
          column = 'usstate';
          break;
      case ' zipcode':
          column = ' zipcode';
          break;
      case ' organizationtype':
            column = ' organizationtype';
            break;
      // Add more cases as needed
    }
  
    const query = `
    SELECT * from member
    ORDER BY ${column};
`;

  
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (err) {
      console.error(err);
      return [];
    }
  }
  //end of sort
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