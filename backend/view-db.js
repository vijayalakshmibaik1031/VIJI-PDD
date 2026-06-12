// Database Viewer Script
// Run with: node view-db.js

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: { rejectUnauthorized: false },
});

console.log('🔍 VIEWING RAILWAY POSTGRESQL DATABASE\n');

const tables = ['employees', 'managers', 'authorities', 'complaints', 'merged_groups'];

// completed must be declared outside the forEach to avoid closure-in-loop bug
let completed = 0;

tables.forEach((tableName) => {
  pool.query(`SELECT * FROM ${tableName} ORDER BY created_at DESC`, (err, res) => {
    if (err) {
      console.error(`✗ Error reading ${tableName}:`, err.message);
    } else {
      console.log(`\n📊 ${tableName.toUpperCase()} (${res.rows.length} records)`);
      if (res.rows.length === 0) {
        console.log('   (Empty)');
      } else {
        res.rows.slice(0, 5).forEach((row) => {
          console.log(`   ${JSON.stringify(row).substring(0, 100)}...`);
        });
        if (res.rows.length > 5) {
          console.log(`   ... and ${res.rows.length - 5} more`);
        }
      }
    }

    completed++;
    if (completed === tables.length) {
      console.log('\n✅ Database view complete!');
      pool.end();
    }
  });
});
