const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DATABASE,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

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