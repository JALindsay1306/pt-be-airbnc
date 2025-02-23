const data = require("./data/dev");
const seed = require("./seed");

const db = require("./connection.js");
db.connect((err, client, release) => {
    if (err) {
      console.error('Error connecting to the database:', err.stack);
    } else {
      console.log('Connected to the database');
    }
  });
seed(data).then(() => db.end());
