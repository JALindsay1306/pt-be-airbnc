const app = require("../db/app");
const request = require("supertest");
const db = require("../db/connection");
const seed = require("../db/seed");
const data = require("../db/data/test");
const { fetchProperties } = require("../db/models");

beforeAll(async () => {
    await seed(data);
});
afterAll(async () => {
    await db.end();
});

describe("app",()=>{
    describe("GET/api/properties",()=>{
        
        test("returns a status code of 200",()=>{
            return request(app).get("/api/properties").expect(200);
        });
        test("headers set to JSON",()=>{
            return request(app).get("/api/properties").expect("Content-Type",/json/);
        });
        test("returns same data as independently tested fetchProperties",async()=>{
            const fetchedProperties = await fetchProperties();
            return request(app).get("/api/properties")
            .then(({body})=>{
                expect(body.properties).toEqual(fetchedProperties);
            })
        });
        test("returns a 500 error if the database has incomplete data", async () => {
            await db.query(`
                DROP TABLE IF EXISTS properties CASCADE;
            `);

            const response = await request(app).get("/api/properties");

            expect(response.status).toBe(500);
            expect(response.body.error).toBe("Internal Server Error");
        });
    });
});