import db from "./db.js";


async function fetchAllEvents() {
    const result = await db.query('SELECT * FROM event');
    return result.rows;
  }
  
  async function fetchEventById(eventID) {
    const result = await db.query('SELECT * FROM event WHERE eventID = $1', [eventID]);
    return result.rows;
  }
  
  async function sortEvents(sortBy) {
    let orderBy = 'eventID'; // default ordering
    switch (sortBy) {
      case 'date':
        orderBy = 'eventDate DESC';
        break;
      case 'type':
        orderBy = 'eventType';
        break;
      case 'raised':
        orderBy = 'amountRaised DESC';
        break;
      case 'cost':
        orderBy = 'eventCost DESC';
        break;
    }
    const result = await db.query(`SELECT * FROM event ORDER BY ${orderBy}`);
    return result.rows;
  }

  
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
    const { rows } = await db.query(query, [year]);
    return rows;
  }
  
  async function insertEvent(eventData) {
    const { eventName, eventLocation, streetName, city, usState, zipCode, eventDate, amountRaised, eventCost, eventType } = eventData;
    const query = `
      INSERT INTO event (eventName, eventLocation, streetName, city, usState, zipCode, eventDate, amountRaised, eventCost, eventType)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    const { rows } = await db.query(query, [eventName, eventLocation, streetName, city, usState, zipCode, eventDate, amountRaised, eventCost, eventType]);
    return rows[0];
  }
  
  async function updateEvent(eventID, eventData) {
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
      RETURNING *;
    `;
    const { rows } = await db.query(query, [eventName, eventLocation, streetName, city, usState, zipCode, eventDate, amountRaised, eventCost, eventType, eventID]);
    return rows;
  }
  
  async function deleteEvent(eventID) {
    const { rowCount } = await db.query('DELETE FROM event WHERE eventID = $1', [eventID]);
    return rowCount;
  }
  export {
    fetchAllEvents,
    fetchEventById,
    sortEvents,
    fetchEventMoneyRaised,
    insertEvent,
    updateEvent,
    deleteEvent,
  };