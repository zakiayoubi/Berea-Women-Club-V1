import db from "./db.js";


async function getMembers(orderBy) {
    let column = 'memberId'; // default ordering
    switch (orderBy) {
      case 'firstName':
        column = 'firstName';
        break;
      case 'lastName':
        column = 'lastName';
        break;
      case 'dateJoined':
        column = 'dateJoined';
        break;
      // Add more cases as needed
    }
  
    const query = `
      SELECT * FROM member 
      ORDER BY ${column} LIMIT 2;
    `;
  
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (err) {
      console.error(err);
      return [];
    }
  }

async function getMemberByID(memberId) {
    const query = 'SELECT * FROM member WHERE memberID = $1';
    try {
      const result = await db.query(query, [memberId]);
      if (result.rows.length > 0) {
        return result.rows; // Return the member details
      } else {
        return null; // No member found
      }
    } catch (error) {
      console.error('Error executing fetchMember query:', error);
      throw error;
    }
  }

async function getMemberDues(year, status) {
  const query = `
    SELECT m.*, mf.paydate, mf.status
    FROM member m
    JOIN membershipFee mf ON m.memberID = mf.memberID
    WHERE mf.paydate >= $1 AND mf.paydate <= $2 AND mf.status = $3
  `;
  
  // Constructing dates for the beginning and end of the year
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  try {
    const result = await db.query(query, [startDate, endDate, status]);
    console.log(result);
    return result.rows; // Return the fetched rows
  } catch (err) {
    console.error('Error executing fetchMemberDues query:', err);
    throw err; // Rethrow or handle as needed
  }
}

async function fetchNewMembers(year) {
    const query = `
        SELECT * from Member
        WHERE datejoined >= $1 AND datejoined <= $2
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
      (firstName, lastName, email, phoneNumber, streetName, city, usState, zipCode, dateOfBirth, memberType) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING memberID
    `;
    const memberValues = [
      memberData.firstName, memberData.lastName, memberData.email, 
      memberData.phoneNumber, memberData.streetName, memberData.city, 
      memberData.usState, memberData.zipCode, memberData.dateOfBirth, memberData.memberType
    ];
  
    const memberResult = await db.query(memberQuery, memberValues);
    return memberResult.rows[0].memberid; // Return the new member's ID
  }
  
  
async function addMembershipFee(memberId, payDate, status) {
    const feeQuery = "INSERT INTO membershipFee (memberID, payDate, status) VALUES ($1, $2, $3)";
    await db.query(feeQuery, [memberId, payDate, status]);
}

async function updateMemberInformation(memberData) {
    // await db.query('BEGIN'); // Start transaction
    // console.log(memberData);
  
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
          memberType = $10
        WHERE memberId = $11
      `;
      await db.query(updateMemberQuery, [memberData.firstName, memberData.lastName, memberData.email, 
        memberData.phoneNumber, memberData.streetName, memberData.city, 
        memberData.usState, memberData.zipCode, memberData.dateOfBirth, memberData.memberType, memberData.memberId]);

      const updateMembershipFeeQuery = `
        UPDATE membershipFee
        SET
          status = $1
        WHERE memberId = $2
      `;
      await db.query(updateMembershipFeeQuery, [memberData.status, memberData.memberId]);
  
      // await db.query('COMMIT'); // Commit transaction
      console.log('Member and membership information updated successfully');
    } catch (error) {
      await db.query('ROLLBACK'); // Rollback transaction on error
      console.error('Failed to update member and membership information:', error);
      throw error; // Rethrow the error to be handled by the caller
    }
  }

  async function deleteMember(memberId) {
    const deleteQuery = 'DELETE FROM member WHERE memberID = $1';

    try {
        // Execute the delete operation and check the result
        const result = await db.query(deleteQuery, [memberId]);

        // If no rows were deleted, it means the memberId did not exist
        if (result.rowCount === 0) {
            console.log('Member not found or already deleted.');
            return 'Member not found or already deleted.';
        }
        console.log(`Member with ID ${memberId} successfully deleted.`);
        return `Member with ID ${memberId} successfully deleted.`;
    } catch (error) {
        console.error('Error executing deleteMember query:', error);
        throw error; // Rethrow the error to be handled by the caller
    }
}




  async function fetchMemberEvents(firstname) {
    const query = `
      SELECT m.firstname, e.eventname 
      FROM event e 
      LEFT JOIN host h ON e.eventid = h.eventid 
      LEFT JOIN member m ON h.memberid = m.memberid 
      WHERE m.firstname = $1
    `;
    const { rows } = await db.query(query, [firstname]);
    return rows;
  }
  
  async function fetchEventMembers(eventname) {
    const query = `
      SELECT e.eventname, m.firstname 
      FROM event e 
      LEFT JOIN host h ON e.eventid = h.eventid 
      LEFT JOIN member m ON h.memberid = m.memberid 
      WHERE e.eventname = $1
    `;
    const { rows } = await db.query(query, [eventname]);
    return rows;
  }

export {
    getMembers,
    getMemberByID,
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
