import db from "./db.js";

function baseQuery() {
  return `
      SELECT m.*, d.lastPaidYear, d.status
      FROM member m 
      LEFT JOIN duesStatus d ON m.memberID = d.memberID 
      `;
}

async function getMemberById(memberId) {
  return await db.get(baseQuery() + `WHERE m.memberId = ?`, [memberId]);
}

async function getMemberDuesById(memberId) {

  const query = `
    SELECT d.*, r.firstName, r.lastName
    FROM duesPayment d
    JOIN member r ON r.memberID = d.recordedBy
    WHERE d.memberID = ?
    ORDER BY d.forYear DESC;`;

  try {
    return await db.all(query, [memberId]);

  } catch (err) {
    console.error(err);
    return []
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
  
  const query = baseQuery() + `ORDER BY m.${column}`
  
  try {
    const result = await db.query(query);
    return result.rows;

  } catch (err) {
    console.error(err);
    return [];
  }
}

async function getMemberByName(searchTerm) {
  const query = baseQuery() + ` WHERE LOWER(m.firstName) LIKE $1 OR LOWER(m.lastName) LIKE $2`;
  //const query = baseQuery() + `ORDER BY ${column}`
  const searchPattern = `%${searchTerm.toLowerCase()}%`; 

  try {
    const result = await db.query(query, [searchPattern, searchPattern]);
    return result.rows; // Return the member details

  } catch (error) {
    console.error('Error executing getMemberByName query:', error);
    throw error;
  }
}
  

async function getMemberDues(year, status) {
  return []
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
    const query = baseQuery() + `WHERE m.datejoined >= $1 AND m.datejoined <= $2 ORDER BY m.firstName`;
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


  async function removeDues(memberId, duesFor) {
    db.run("DELETE FROM duesPayment WHERE memberID=? AND forYear=?",[memberId,duesFor])
  }

  async function recordDues(memberId, duesFor, paymentDate, currentUser) {
    const feeQuery = "INSERT INTO duesPayment (memberID, forYear, paymentDate, recordedBy) VALUES (?,?,?,?)";
    const dueValues = [memberId, duesFor, paymentDate, currentUser];

    try {
        await db.run(feeQuery, dueValues);

    } catch (error) {
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
    recordDues,
    removeDues,
    updateMemberInformation,
    deleteMember,
    fetchMemberEvents,
    fetchEventMembers,
  };
