
import { PGlite } from "@electric-sql/pglite";

async function testPglite() {
  try {
    const db = new PGlite();
    await db.exec(`
      CREATE TABLE IF NOT EXISTS test (
        id SERIAL PRIMARY KEY,
        name TEXT
      );
      INSERT INTO test (name) VALUES ('VORA Test');
    `);
    const res = await db.query("SELECT * FROM test;");
    console.log("PGlite Query Result:", JSON.stringify(res));
    process.exit(0);
  } catch (err) {
    console.error("PGlite Error:", err);
    process.exit(1);
  }
}

testPglite();
