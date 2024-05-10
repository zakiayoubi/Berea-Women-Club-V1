import pg from "pg";
import env from "dotenv";

env.config();

import fs from "fs";
const dirPath = "./.data"
if(!fs.existsSync(dirPath)) { 
  fs.mkdirSync(dirPath);
}
const dbFile = `${dirPath}/bwc.db`;
const exists = fs.existsSync(dbFile);

import sqlite3 from "sqlite3";
import { open } from "sqlite";

//SQLite wrapper for async / await connections https://www.npmjs.com/package/sqlite
let db;
open({
    filename: dbFile,
    driver: sqlite3.Database
  })
  .then(async dbConn => {
    db = dbConn;

    try {
      if (!exists) {

        // Run tables.sql
        await db.run(
          "CREATE TABLE Messages (id INTEGER PRIMARY KEY AUTOINCREMENT, message TEXT)"
        );
        // Insert data
        await db.run(
          "INSERT INTO Messages (message) VALUES (?)", "tmp"
        );
      }
      console.log(await db.all("SELECT * from Messages"));
    } catch (dbError) {
      console.error(dbError);
    }
  });

export default db;
