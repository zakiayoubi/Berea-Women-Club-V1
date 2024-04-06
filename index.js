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

async function getMember() {
    try {
        const result = await db.query("SELECT * FROM member");
        console.log(result.rows);
    } catch (error) {
        console.log("Error retrieving members: ", error);
    }
        
}



async function addMember() {
    try {
      await db.query("INSERT INTO member (firstName, lastName, email, phoneNumber, streetName, city, usState, zipCode, dateOfBirth, memberType, paidDues) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)", 
      ['zaki', 'ayoubi', 'ayoubim@berea.edu', '555-0789', '789 Pine Road', 'Columbus', 'Ohio', 43210, '1975-12-03', 'Regular', false]);
      console.log('Member added successfully');
    } catch (error) {
      console.error('Error adding member:', error);
    }
  }

async function getDonationInflow() {
    try {
        const result = await db.query("SELECT * FROM donationInflow");
        console.log(result.rows);
    } catch (error) {
        console.log("Error retrieving donation Inflows: ", error);
    }
}

async function addDonationInflow() {
    try {
        await db.query("INSERT INTO donationInflow (organizationID, category, amount, donationDate) VALUES ($1, $2, $3, $4)", 
        [1, 'education']);
        console.log('donation inflow added successfully');
      } catch (error) {
        console.error('Error adding donation inflow:', error);
      }
}

// async function addOrganization() {
//     try {
//         await db.query("INSERT INTO organization (organizationName, email, phoneNumber, streetName, city, usState, zipCode, organizationType) VALUES ($1, $2, $3, $4)", 
//         [placeholder, placeholder, ...]);
//         console.log('orginazation added successfully');
//       } catch (error) {
//         console.error('Error adding organization:', error);
//       }
// }

app.get("/", (req, res) => {
  res.render("index.ejs");
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
