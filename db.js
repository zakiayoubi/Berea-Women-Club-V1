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
const db = await open({
    filename: dbFile,
    driver: sqlite3.Database
  });

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

  // const test = await db.get("SELECT * FROM users")
  // console.log(test)
} catch (dbError) {
  console.error(dbError);
}

/* 
  Add in a query method that approximates the one from the pg library.
  Hack to make porting faster (hopefully) 
*/
db.query = async function() {
  if (arguments[0].toLowerCase().includes("select ")) {
    return {rows: await this.all(arguments[0],arguments[1])}
  }
  return this.exec(arguments[0],arguments[1])
};

// test
//console.log(await db.query("SELECT * FROM users WHERE id=$1",[1]))

export default db;