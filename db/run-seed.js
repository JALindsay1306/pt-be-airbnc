const data = require("./data/dev");
const seed = require("./seed");

const db = require("./connection.js");

seed(data).then(() => db.end());
