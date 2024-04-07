import express from "express";
import pg from "pg";
import env from "dotenv";
import bodyParser from "body-parser";

const app = express();
const port = 3000;
env.config()


const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect();

app.use(express.json());
app.use(express.static("public"));
app.set('view engine', 'ejs'); // Set the view engine to EJS



app.get("/", (req, res) => {
  res.render("index.ejs", );
});

// Member landing page query
app.get('/members', async (req, res) => {
  const orderBy = req.query.orderBy || 'memberID'; // You can pass 'firstName', 'lastName', or 'dateJoined' as query parameters
  console.log(orderBy);
  let queryText = `
    SELECT m.*, mt.memberType
    FROM member m
    LEFT JOIN membershipType mt ON m.memberID = mt.memberID
  `;

  if (orderBy) {
    queryText += ` ORDER BY ${orderBy}`;
  }

  queryText += ' LIMIT 2';

  try {
    const result = await db.query(queryText);
    console.log(result);
    res.render("member.ejs", {
      members: result.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/dues', async (req, res) => {
  const year = req.query.year || 2024;
  const status = req.query.status || "paid"
  try {
    const result = await db.query(`
      SELECT m.*, mt.memberType, mf.paydate, mf.status
      FROM member m
      JOIN membershipType mt ON m.memberID = mt.memberID 
      JOIN membershipFee mf ON m.memberID = mf.memberID
      WHERE mf.paydate >= '${year}-01-01' AND mf.paydate <= '${year}-12-31' AND mf.status = '${status}'
    `);
    res.render("member.ejs", {
      members: result.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/new-members', async (req, res) => {
  const year = req.query.year || '2024'; // Default to 2024 or take year from query params
  try {
    const result = await db.query(
      `
      SELECT m.*, mt.memberType
      FROM member m
      LEFT JOIN membershipType mt ON m.memberID = mt.memberID WHERE datejoined >= '${year}-01-01' AND datejoined <= '${year}-12-31'
    `);
    const numMembers = await db.query(
      "SELECT COUNT(*) FROM member;"
    );
    const numMembersYear = await db.query(
      `SELECT COUNT(*) FROM member WHERE datejoined >= '${year}-01-01' AND datejoined <= '${year}-12-31'`
    );
    console.log(numMembers.rows);
    console.log(numMembersYear.rows);
    res.render("member.ejs", {
    members: result.rows,
    totalMembers: numMembers.rows,
    totalMembersYear: numMembersYear.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// add a new member
app.post("/addMember", async (req, res) => {
  const newMember = req.body; // This contains the data sent in the request
  console.log(newMember);
  try {
    // Step 1: Insert the new member and get back the auto-generated memberID
    const memberResult = await db.query("INSERT INTO member (firstName, lastName, email, phoneNumber, streetName, city, usState, zipCode, dateOfBirth) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING memberID", 
    [newMember.firstName, newMember.lastName, newMember.email, newMember.phoneNumber, newMember.streetName, newMember.city, newMember.usState, newMember.zipCode, newMember.dateOfBirth]);

    // memberID is returned as the first row of the result
    const memberId = memberResult.rows[0].memberid;
    console.log(memberId);

    // Step 2: Use the retrieved memberID to insert the membership type
    await db.query("INSERT INTO membershipType (memberType, memberID) VALUES ($1, $2)", [
      newMember.memberType, memberId
    ]);

    await db.query("INSERT INTO membershipFee (memberID, status) VALUES ($1, $2)", [
      memberId, newMember.status
    ]);

    res.status(200).send('Member and membership type added successfully');
    console.log('Member and membership type added successfully');
  } catch (error) {
    console.error('Error adding member and membership type:', error);
    res.status(500).send('Error adding member and membership type');
  }
});

app.put("/update-member", async (req, res) => {
  // Extracting memberID from URL parameters

  // Extracting member information from the request body
  const { firstName, lastName, email, phoneNumber, streetName, city, usState, zipCode, dateOfBirth, memberType, paymentStatus, memberID } = req.body;

  // Begin transaction
  try {
    await db.query('BEGIN');

    // Update the member information
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
        dateOfBirth = $9
      WHERE memberID = $10
    `;
    await db.query(updateMemberQuery, [firstName, lastName, email, phoneNumber, streetName, city, usState, zipCode, dateOfBirth, memberID]);

    // Update the membership type
    const updateMembershipTypeQuery = `
      UPDATE membershipType
      SET
        memberType = $1
      WHERE memberID = $2
    `;
    await db.query(updateMembershipTypeQuery, [memberType, memberID]);

    // Update the membership fee status
    const updateMembershipFeeQuery = `
      UPDATE membershipFee
      SET
        status = $1
      WHERE memberID = $2
    `;
    await db.query(updateMembershipFeeQuery, [paymentStatus, memberID]);

    // Commit transaction
    await db.query('COMMIT');

    res.json({ message: "Member and membership information updated successfully" });
  } catch (error) {
    // Rollback transaction on error
    await db.query('ROLLBACK');
    console.error("Failed to update member and membership information:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.delete("/delete-member", async(req, res) => {
  const memberId = req.body.memberId;
  try {
    await db.query(`Delete FROM member WHERE memberID = ${memberId};`)
  } catch (error) {
    console.log("Error deleting the member", error);
    res.status(500).send("Internal Server Error");
  }
});

// -------------------------------------------------------------------
// organization queries
app.get('/organizations', async (req, res) => {
  try {
    const allOrganizations = await db.query('SELECT * FROM organization LIMIT 5');
    const numOrganizations = await db.query('SELECT count(*) FROM organization');
    res.render("organizations.ejs", {
      organizations: allOrganizations.rows,
      totalOrganization: numOrganizations.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

app.get('/organizations/:id', async (req, res) => {
  const specificID = req.params.id;
  try {
    const result = await db.query('SELECT * FROM organization WHERE organizationID = $1', [specificID]);
    if (result.length > 0) {
      res.render("organization.ejs", {
        org: result.rows
      });
    } else {
      res.status(404).send('Organization not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

app.post('/add-organizations', async (req, res) => {
  const { organizationName, email, phoneNumber, streetName, city, usState, zipCode, organizationType } = req.body;
  try {
    const result = await db.query('INSERT INTO organization (organizationName, email, phoneNumber, streetName, city, usState, zipCode, organizationType) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *', [organizationName, email, phoneNumber, streetName, city, usState, zipCode, organizationType]);
    res.status(201).json("you successfully added an organization");
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});


app.put('/organizations/:id', async (req, res) => {
  const specificID = req.params.id;
  const { organizationName, email, phoneNumber, streetName, city, usState, zipCode, organizationType } = req.body;

  try {
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

    const result = await db.query(query, [organizationName, email, phoneNumber, streetName, city, usState, zipCode, organizationType, specificID]);

    if (result.length > 0) {
      res.json(result[0]);
    } else {
      res.status(404).send('Organization not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

app.delete('/organizations/:id', async (req, res) => {
  const specificID = req.params.id;
  try {
    const { rowCount } = await db.query('DELETE FROM organization WHERE organizationID = $1', [specificID]);
    if (rowCount > 0) {
      res.status(204).send();
    } else {
      res.status(404).send('Organization not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// -----------------------------------------------------------

app.get('/events', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM event');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Get event by ID
app.get('/events/:id', async (req, res) => {
  const eventID = req.params.id;
  try {
    const { rows } = await db.query('SELECT * FROM event WHERE eventID = $1', [eventID]);
    res.json(rows.length > 0 ? rows[0] : {});
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Get events sorted by various criteria
app.get('/events/sorted', async (req, res) => {
  const sortBy = req.query.sortBy; // 'date', 'type', 'raised', 'cost'
  let orderBy = 'eventID'; // default ordering
  
  switch (sortBy) {
    case 'date':
      orderBy = 'eventDate DESC';
      break;
    case 'type':
      orderBy = 'eventType';
      break;
    case 'raised':
      orderBy = 'amountRaised';
      break;
    case 'cost':
      orderBy = 'eventCost';
      break;
  }

  try {
    const { rows } = await db.query(`SELECT * FROM event ORDER BY ${orderBy}`);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Get amount raised per year
app.get('/events/amount-raised/yearly', async (req, res) => {
  try {
    const query = `
      SELECT EXTRACT(YEAR FROM eventDate) AS eventYear, SUM(amountRaised) AS totalRaised
      FROM event
      GROUP BY EXTRACT(YEAR FROM eventDate)
    `;
    const { rows } = await db.query(query);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Get amount raised per month of a given year
app.get('/events/amount-raised/monthly/:year', async (req, res) => {
  const year = parseInt(req.params.year);
  try {
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
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Insert an event
app.post('/events', async (req, res) => {
  const { eventName, eventLocation, streetName, city, usState, zipCode, eventDate, amountRaised, eventCost, eventType } = req.body;
  try {
    const query = `
      INSERT INTO event (eventName, eventLocation, streetName, city, usState, zipCode, eventDate, amountRaised, eventCost, eventType)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    const { rows } = await db.query(query, [eventName, eventLocation, streetName, city, usState, zipCode, eventDate, amountRaised, eventCost, eventType]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Update an event
app.put('/events/:id', async (req, res) => {
  const eventID = req.params.id;
  const { eventName, eventLocation, streetName, city, usState, zipCode, eventDate, amountRaised, eventCost, eventType } = req.body;
  try {
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
    const { rows } = await pool.db(query, [eventName, eventLocation, streetName, city, usState, zipCode, eventDate, amountRaised, eventCost, eventType, eventID]);
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).send('Event not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Delete an event
app.delete('/events/:id', async (req, res) => {
  const eventID = req.params.id;
  try {
    const { rowCount } = await db.query('DELETE FROM event WHERE eventID = $1', [eventID]);
    if (rowCount > 0) {
      res.status(204).send();
    } else {
      res.status(404).send('Event not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});


// Route: All Events a Member Has Attended
app.get('/member-events/:firstname', async (req, res) => {
  const firstname = req.params.firstname;
  try {
    const { rows } = await db.query(`
      SELECT m.firstname, e.eventname 
      FROM event e 
      LEFT JOIN host h ON e.eventid = h.eventid 
      LEFT JOIN member m ON h.memberid = m.memberid 
      WHERE m.firstname = $1
    `, [firstname]);
    res.render('member-events', { events: rows, member: firstname });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Route: All Members Attended an Event
app.get('/event-members/:eventname', async (req, res) => {
  const eventname = req.params.eventname;
  try {
    const { rows } = await db.query(`
      SELECT e.eventname, m.firstname 
      FROM event e 
      LEFT JOIN host h ON e.eventid = h.eventid 
      LEFT JOIN member m ON h.memberid = m.memberid 
      WHERE e.eventname = $1
    `, [eventname]);
    res.render('event-members', { members: rows, event: eventname });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Donation Inflow Overview
app.get('/donation-inflows', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT di.*, o.organizationName 
      FROM donationinflow di 
      LEFT JOIN organization o ON di.organizationid = o.organizationid
    `);
    res.render('donation-inflows', { inflows: rows });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Donation Inflow by Specific ID
app.get('/donation-inflows/:id', async (req, res) => {
  const specificId = req.params.id;
  try {
    const { rows } = await db.query(`
      SELECT di.*, o.organizationName 
      FROM donationinflow di 
      LEFT JOIN organization o ON di.organizationid = o.organizationid 
      WHERE di.donationinflowid = $1
    `, [specificId]);
    res.render('donation-inflow-detail', { inflow: rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});


// Amount Raised Per Year
app.get('/donation-inflows/amount-raised/yearly', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT EXTRACT(YEAR FROM donationdate) AS donationYear, SUM(amount) AS totalRaised
      FROM donationinflow
      GROUP BY EXTRACT(YEAR FROM donationdate)
    `);
    res.render('amount-raised-yearly', { yearlyTotals: rows });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});


app.get('/donation-outflows', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT do.*, o.organizationName 
      FROM donationOutflow do 
      LEFT JOIN organization o ON do.organizationID = o.organizationID
    `);
    res.render('donation-outflows', { outflows: rows });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Donation Outflow by Specific ID
app.get('/donation-outflows/:id', async (req, res) => {
  const specificId = req.params.id;
  try {
    const { rows } = await db.query(`
      SELECT do.*, o.organizationName 
      FROM donationOutflow do 
      LEFT JOIN organization o ON do.organizationID = o.organizationID 
      WHERE donationOutflowId = $1
    `, [specificId]);
    res.render('donation-outflow-detail', { outflow: rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Donation Outflows Ordered by Amount
app.get('/donation-outflows/amount', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT do.*, o.organizationName 
      FROM donationOutflow do 
      LEFT JOIN organization o ON do.organizationID = o.organizationID
      ORDER BY amount DESC
    `);
    res.render('donation-outflows-amount', { outflows: rows });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Donation Outflows Ordered by Category
app.get('/donation-outflows/category', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT do.*, o.organizationName 
      FROM donationOutflow do 
      LEFT JOIN organization o ON do.organizationID = o.organizationID 
      ORDER BY category
    `);
    res.render('donation-outflows-category', { outflows: rows });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Donation Outflows Ordered by Donation Date
app.get('/donation-outflows/date', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT do.*, o.organizationName 
      FROM donationOutflow do 
      LEFT JOIN organization o ON do.organizationID = o.organizationID 
      ORDER BY donationDate
    `);
    res.render('donation-outflows-date', { outflows: rows });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Amount Donated Per Year
app.get('/donation-outflows/yearly', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT EXTRACT(YEAR FROM donationDate) AS donationYear, SUM(amount) AS totalDonated
      FROM donationOutflow
      GROUP BY EXTRACT(YEAR FROM donationDate)
    `);
    res.render('donation-outflows-yearly', { yearlyTotals: rows });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
