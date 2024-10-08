import db from "./db.js";

async function fetchEventByName(searchTerm) {
  const query = 'SELECT * FROM event WHERE LOWER(eventName) LIKE $1';
  const result = await db.query(query, [`%${searchTerm.toLowerCase()}%`]);
  return result.rows;
};

async function fetchEventAttendees(eventId) {
  const query = `
    SELECT h.memberId, CONCAT(m.firstName, ' ', m.lastName) AS name
    FROM eventAttendee h 
    JOIN member m on m.memberid = h.memberid
    WHERE h.eventId = $1;
  `;
  const result = await db.query(query, [eventId]);
  return result.rows;
}

// ----------------------host table ---------------------------
async function updateEventAttendees(memberId, eventId) {
  const query = `
      UPDATE eventAttendee set 
      memberID = $1
      WHERE eventID = $2

  `;
  const result = await db.query(query, [memberId, eventId]);
  return result.rows;
}


async function addEventAttendees(eventId, memberId) {
  const query = `
    INSERT OR REPLACE INTO eventAttendee(eventID, memberID) VALUES ($1, $2);
  `;
  const result = await db.query(query, [eventId, memberId]);
  return result.rows;
};

async function deleteEventAttendees(eventId) {
  const query = 'DELETE FROM eventAttendee WHERE eventID = $1';
  const result = await db.query(query, [eventId]);
  return result.rows;
};


// -------------------------------------------------
async function fetchNewEvents(year) {
  const query = `
      SELECT *
      FROM event 
      WHERE eventDate >= $1 AND eventDate <= $2 ORDER BY eventDate DESC;
  `;
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  try {
      const result = await db.query(query, [startDate, endDate]);
      return result.rows;
  } catch (err) {
      console.error('Error executing fetchNewEvents query:', err);
      throw err;
  }
};


async function fetchAllEvents() {
  return await db.all('SELECT * FROM event ORDER BY eventDate DESC')
};
  
  async function fetchEventById(eventID) {
    const result = await db.query('SELECT * FROM event WHERE eventID = $1', [eventID]);
    return result.rows;
  };
  
  async function fetchEventMoneyRaised() {
    const query = `
    SELECT
        EXTRACT(YEAR FROM eventDate) AS eventYear,
        SUM(amountRaised) AS totalAmountRaised,
        SUM(eventCost) AS totalEventCost
    FROM
        event
    GROUP BY
        EXTRACT(YEAR FROM eventDate)
    ORDER BY
        eventYear DESC;

    `;
    const result = await db.query(query);
    return result.rows;
  };
  
  async function fetchEventMonthlyCosts(year) {
    const query = `
      SELECT 
        EXTRACT(MONTH FROM eventDate) AS eventMonth, 
        SUM(eventCost) AS totalCost
      FROM event
      WHERE EXTRACT(YEAR FROM eventDate) = $1
      GROUP BY EXTRACT(MONTH FROM eventDate)
      ORDER BY EXTRACT(MONTH FROM eventDate)
    `;
    const result = await db.query(query, [year]);
    return result.rows;
  };
  async function fetchYearlyEventCosts(year) {
    const query = `
      SELECT 
        SUM(eventCost) AS totalCost
      FROM event
      WHERE EXTRACT(YEAR FROM eventDate) = $1
    `;
    const result = await db.query(query, [year]);
    return result.rows; // Assuming you want to return a single value for total cost
  };
  
  async function fetchYearlyMoneyRaised(year) {
    const query = `
      SELECT 
        SUM(amountRaised) AS totalRaised
      FROM event
      WHERE EXTRACT(YEAR FROM eventDate) = $1
    `;
    const result = await db.query(query, [year]);
    return result.rows; // Assuming you want to return a single value for total raised
  };
  
  
  async function insertEvent(eventData) {
    const { eventName, eventLocation, streetName, city, usState, zipCode, eventDate, amountRaised, eventCost, eventType} = eventData;
    const query = `
      INSERT INTO event (eventName, eventLocation, streetName, city, usState, zipCode, eventDate, amountRaised, eventCost, eventType)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;
    const result = await db.run(query, [eventName, eventLocation, streetName, city, usState, zipCode, eventDate, amountRaised, eventCost, eventType]);
    return db.get("SELECT * FROM event where eventID=?", result.lastID)
  };
  
  async function updateEvent(eventId, eventData) {
    const { eventName, eventLocation, streetName, city, usState, zipCode, eventDate, amountRaised, eventCost, eventType } = eventData;
    const query = `
      UPDATE event
      SET
        eventName = $1,
        eventLocation = $2,
        streetName = $3,
        city = $4,
        usState = $5,
        zipCode = $6,
        eventDate = $7,
        amountRaised = $8,
        eventCost = $9,
        eventType = $10
      WHERE eventID = $11
      ;
    `;
    const rows = await db.query(query, [eventName, eventLocation, streetName, city, usState, zipCode, eventDate, amountRaised, eventCost, eventType, eventId]);
    return rows[0];
  };
  
  async function deleteEvent(eventID) {
    const { rowCount } = await db.query('DELETE FROM event WHERE eventID = $1', [eventID]);
    return rowCount;
  };
  
  export {
    fetchNewEvents,
    fetchAllEvents,
    fetchEventById,
    fetchEventMoneyRaised,
    insertEvent,
    updateEvent,
    deleteEvent,
    fetchEventMonthlyCosts,
    fetchYearlyEventCosts,
    fetchYearlyMoneyRaised,
    fetchEventByName,
    addEventAttendees,
    fetchEventAttendees,
    updateEventAttendees,
    deleteEventAttendees,
  };