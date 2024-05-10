import pg from "pg";
import env from "dotenv";

env.config();

import fs from "fs";
const dbDir = "./.data"
if(!fs.existsSync(dbDir)) { 
  fs.mkdirSync(dbDir);
}
const dbFile = `${dbDir}/bwc.db`;
const exists = fs.existsSync(dbFile);

import sqlite3 from "sqlite3";
sqlite3.verbose();
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
        // initialize the database
        process.stdout.write(`Initializing database at ${dbFile} ...`);
        let queries = fs.readFileSync("./db_init.sql", 'utf-8');
        await db.exec(queries);
        console.log(" done");
      } else {
        console.log(`Reading database at ${dbFile}`)
      }

    } catch (dbError) {
      console.error(dbError);
    }
  });

export default db;
