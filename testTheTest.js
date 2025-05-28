const app = require("./app/app");
const request = require("supertest");
const db = require("./db/connection");
const seed = require("./db/seed");
const data = require("./db/data/test");
const { fetchProperties } = require("./models/propertiesModels");
const { getSingleProperty } = require("./controllers/propertiesControllers");



seed(data);