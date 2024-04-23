import db from "./db.js";

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
    const result = await db.query('SELECT * FROM event ORDER BY eventName');
    return result.rows;
  };
  
  async function fetchEventById(eventID) {
    const result = await db.query('SELECT * FROM event WHERE eventID = $1', [eventID]);
    return result.rows;
  };
  
  async function sortEvents(sortBy) {
    let orderBy = 'eventID'; // default ordering
    switch (sortBy) {
      case 'eventDate':
        orderBy = 'eventDate DESC';
        break;
      case 'eventType':
        orderBy = 'eventType';
        break;
      case 'amountRaised':
        orderBy = 'amountRaised DESC';
        break;
      case 'eventCost':
        orderBy = 'eventCost DESC';
        break;
    }
    const result = await db.query(`SELECT * FROM event ORDER BY ${orderBy}`);
    return result.rows;
  };

  
  async function fetchEventMoneyRaised(year) {
    const query = `
      SELECT 
        EXTRACT(MONTH FROM eventDate) AS eventMonth, 
        SUM(amountRaised) AS totalRaised
      FROM event
      WHERE EXTRACT(YEAR FROM eventDate) = $1
      GROUP BY EXTRACT(MONTH FROM eventDate)
      ORDER BY EXTRACT(MONTH FROM eventDate)
    `;
    const result = await db.query(query, [year]);
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
      RETURNING *;
    `;
    const { rows } = await db.query(query, [eventName, eventLocation, streetName, city, usState, zipCode, eventDate, amountRaised, eventCost, eventType]);
    return rows[0];
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
    sortEvents,
    fetchEventMoneyRaised,
    insertEvent,
    updateEvent,
    deleteEvent,
    fetchEventMonthlyCosts,
    fetchYearlyEventCosts,
    fetchYearlyMoneyRaised,
  };