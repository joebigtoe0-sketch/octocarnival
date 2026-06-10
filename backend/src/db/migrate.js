require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const { query } = require('./index');

async function migrate() {
  const migDir = path.join(__dirname, 'migrations');
  const files  = fs.readdirSync(migDir).filter(f => f.endsWith('.sql')).sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migDir, file), 'utf8');
    console.log(`Running migration: ${file}`);
    await query(sql);
    console.log(`Done: ${file}`);
  }
  console.log('All migrations complete.');
  process.exit(0);
}

migrate().catch(err => { console.error(err); process.exit(1); });
