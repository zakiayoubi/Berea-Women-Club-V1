import db from "./db.js";


async function getMemberById(memberId) {

  const query = `
  SELECT * from member
  WHERE memberId = ${memberId};
`;

  try {
    const result = await db.query(query);
    return result.rows;
  } catch (err) {
    console.error(err);
  }
}

async function getMemberDuesById(memberId) {

  const query = `
  SELECT * from membershipFee
  WHERE memberId = ${memberId};
`;

  try {
    const result = await db.query(query);
    return result.rows;
  } catch (err) {
    console.error(err);
  }
}


async function getMembers(orderBy) {
    let column = 'memberid'; // default ordering
    switch (orderBy) {
      case 'firstname':
        column = 'firstname';
        break;
      case 'lastname':
        column = 'lastname';
        break;
      case 'datejoined':
        column = 'datejoined DESC';
        break;
      case 'membertype':
        column = 'membertype';
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

  async function getMemberByName(searchTerm) {
    const query = `SELECT m.*, mf.paymentyear, mf.paydate, mf.status
      FROM member m LEFT JOIN membershipFee mf ON m.memberID = mf.memberID WHERE firstName LIKE $1 OR lastName LIKE $2`;
    const searchPattern = `%${searchTerm}%`; 
  
    try {
      const result = await db.query(query, [searchPattern, searchPattern]);
      return result.rows; // Return the member details
    } catch (error) {
      console.error('Error executing getMemberByName query:', error);
      throw error;
    }
  }
  

async function getMemberDues(year, status) {
  const query = `
    SELECT m.*, mf.paymentyear, mf.paydate, mf.status
    FROM member m
    LEFT JOIN membershipFee mf ON m.memberID = mf.memberID
    WHERE mf.paymentyear = $1 AND mf.status = $2
  `;

  try {
    const result = await db.query(query, [year, status]);
    return result.rows; // Return the fetched rows
  } catch (err) {
    console.error('Error executing fetchMemberDues query:', err);
    throw err; // Rethrow or handle as needed
  }
}

async function fetchNewMembers(year) {
    const query = `
        SELECT *
        FROM member 
        WHERE datejoined >= $1 AND datejoined <= $2 ORDER BY firstName
    `;
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    try {
        const result = await db.query(query, [startDate, endDate]);
        return result.rows;
    } catch (err) {
        console.error('Error executing fetchNewMembers query:', err);
        throw err;
    }
}

async function fetchTotalMembers() {
    const query = "SELECT COUNT(*) FROM member;";

    try {
        const result = await db.query(query);
        return result.rows[0];
    } catch (err) {
        console.error('Error executing fetchTotalMembers query:', err);
        throw err;
    }
}

async function fetchTotalMembersYear(year) {
    const query = `
        SELECT COUNT(*) FROM member WHERE datejoined >= $1 AND datejoined <= $2
    `;
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    try {
        const result = await db.query(query, [startDate, endDate]);
        return result.rows[0];
    } catch (err) {
        console.error('Error executing fetchTotalMembersYear query:', err);
        throw err;
    }
}

async function addNewMember(memberData) {
    const memberQuery = `
      INSERT INTO member 
      (firstName, lastName, email, phoneNumber, streetName, city, usState, zipCode, dateOfBirth, dateJoined, memberType) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
    `;
    const memberValues = [
      memberData.firstName, memberData.lastName, memberData.email, 
      memberData.phone, memberData.street, memberData.city, 
      memberData.state, memberData.zip, memberData.dateOfBirth, memberData.dateJoined, memberData.membershipType
    ];
  
    const memberResult = await db.run(memberQuery, memberValues);
    return memberResult.lastID; // Return the new member's ID
  }
  


async function updateMemberInformation(memberData) {
    try {
      const updateMemberQuery = `
        UPDATE member
        SET
          firstName = $1,
          lastName = $2,
          email = $3,
          phoneNumber = $4,
          streetName = $5,
          city = $6,
          usState = $7,
          zipCode = $8,
          dateOfBirth = $9,
          dateJoined = $10,
          memberType = $11
        WHERE memberId = $12
      `;
      await db.query(updateMemberQuery, [memberData.firstName, memberData.lastName, memberData.email, 
        memberData.phoneNumber, memberData.streetName, memberData.city, 
        memberData.usState, memberData.zipCode, memberData.dateOfBirth, memberData.dateJoined, memberData.memberType, memberData.memberId]);

    } catch (error) {
      console.error('Failed to update member information:', error);
      throw error; // Rethrow the error to be handled by the caller
    }
  }


  async function addMembershipFee(memberId, paymentYear, paymentDate, status) {
    // Validate inputs
    if (status === 'Paid' && paymentDate === null) {
        throw new Error('Payment date must be provided when status is "Paid".');
    }
    if (status === 'Not Paid' && paymentDate !== null) {
        throw new Error('Payment date must be null when status is "Not Paid".');
    }

    const feeQuery = "INSERT INTO membershipFee (memberID, paymentYear, payDate, status) VALUES ($1, $2, $3, $4)";
    const dueValues = [memberId, paymentYear, paymentDate, status];

    try {
        await db.query(feeQuery, dueValues);
    } catch (error) {
        // Handle database errors (e.g., unique constraint violations)
        throw new Error('Database error: ' + error.message);
    }
}



  
  

  async function deleteMember(memberId) {
    const selectQuery = 'SELECT * FROM member WHERE memberID = $1';

    try {
        // First check if the member exists
        const selectResult = await db.query(selectQuery, [memberId]);
        
        // If no rows are found, the member does not exist
        if (selectResult.rowCount === 0) {
            console.log('Member not found.');
            return 'Member not found.';
        }

        // If the member exists, proceed to delete
        const deleteQuery = 'DELETE FROM member WHERE memberID = $1';
        const deleteResult = await db.query(deleteQuery, [memberId]);

        // Check if the delete operation was successful
        if (deleteResult.rowCount === 0) {
            console.log('Error deleting member.');
            return 'Error deleting member.';
        }

        console.log(`Member with ID ${memberId} successfully deleted.`);
        return `Member with ID ${memberId} successfully deleted.`;
    } catch (error) {
        console.error('Error executing deleteMember function:', error);
        throw error; // Rethrow the error to be handled by the caller
    }
}


  async function fetchMemberEvents(id) {
    const query = `
      SELECT m.firstname, e.eventname 
      FROM event e 
      LEFT JOIN host h ON e.eventid = h.eventid 
      LEFT JOIN member m ON h.memberid = m.memberid 
      WHERE m.memberId = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows;
  }
  
  async function fetchEventMembers(id) {
    const query = `
      SELECT e.eventname, m.firstname 
      FROM event e 
      LEFT JOIN host h ON e.eventid = h.eventid 
      LEFT JOIN member m ON h.memberid = m.memberid 
      WHERE e.eventID = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows;
  }

export {
    getMemberById,
    getMemberDuesById,
    getMembers,
    getMemberByName,
    getMemberDues,
    fetchNewMembers,
    fetchTotalMembers,
    fetchTotalMembersYear,
    addNewMember,
    addMembershipFee,
    updateMemberInformation,
    deleteMember,
    fetchMemberEvents,
    fetchEventMembers,
  };
