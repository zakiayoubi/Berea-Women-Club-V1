import express from "express";
import pg from "pg";
import env from "dotenv";

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

app.get("/", (req, res) => {
  res.render("index.ejs");
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
