const { Pool } = require("pg");

const ENV = process.env.NODE_ENV || "development";
// const path = `${__dirname}/../.env.${ENV}`;

// require("dotenv").config({ path });
const config = {};
if (ENV === "production") {
  config.connectionString = process.env.DATABASE_URL;
  config.max = 2;
  config.ssl = { rejectUnauthorized: false };
} else {
    config.host = process.env.PGHOST;
    config.port = process.env.PGPORT;
    config.database = process.env.PGDATABASE;
}



if (!process.env.PGDATABASE && !process.env.DATABASE_URL) {
  throw new Error("PGDATABASE or DATABASE_URL not set");
}

module.exports = new Pool(config);
