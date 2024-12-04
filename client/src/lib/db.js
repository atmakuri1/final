const { Pool } = require('pg');

class Database {
  constructor() {
    if (!Database.instance) {
      this.pool = new Pool({
        user: process.env.PG_USER,
        host: process.env.PG_HOST,
        database: process.env.PG_DATABASE,
        password: process.env.PG_PASSWORD,
        port: process.env.PG_PORT,
      });
      Database.instance = this;
    }
    return Database.instance;
  }

  getConnection() {
    return this.pool;
  }
}

const dbInstance = new Database();
Object.freeze(dbInstance); // Ensures singleton

module.exports = dbInstance;