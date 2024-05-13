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
  // we need to return values
  if (arguments[0].toLowerCase().includes("select ")) {

    // we need to lowercase all of the keys in each result row (to match what the pg library did)
    let records = await this.all(arguments[0],arguments[1]);
    let lowercase_records = records.map((obj) => {
      // https://stackoverflow.com/a/54985484
      return Object.fromEntries(Object.entries(obj).map(([k,v]) => [k.toLowerCase(),v]))
    })
    return {rows: lowercase_records}
  }

  // no parameters passed
  if (arguments.length == 1 || typeof arguments[1] === 'function') {
    return this.exec(arguments[0],arguments[1])
  }
  
  return this.run(arguments[0],arguments[1])
};

// test
//console.log(await db.query("SELECT * FROM users WHERE id=$1",[1]))

export default db;