const { fetchProperties } = require("../db/models");
const db = require("../db/connection");
const data = require("../db/data/test");
const seed = require("../db/seed");

beforeAll(async () => {
    await seed(data);
});
afterAll(async () => {
    await db.end();
});

describe("fetchProperties",()=>{
    test("returns a promise",()=>{
        expect(fetchProperties()).toBeInstanceOf(Promise);
    });
    test("returned promise resolves to an array of objects",()=>{
        return fetchProperties()
        .then((properties)=>{
            expect(Array.isArray(properties)).toBe(true);
            properties.forEach((property)=>{
                expect(typeof property).toBe("object")
            })
        })
    })
    test("returned objects have property properties: property_id, property_name,location, price_per_night",()=>{
        return fetchProperties()
        .then((properties)=>{
            properties.forEach((property)=>{
                expect(property).toHaveProperty("property_id");
                expect(property).toHaveProperty("property_name");
                expect(property).toHaveProperty("location");
                expect(property).toHaveProperty("price_per_night");
            });
        });
    });
    test("returned objects have translated properties from foreign tables - property_type, host",()=>{
        return fetchProperties()
        .then((properties)=>{
            properties.forEach((property)=>{
                expect(property).toHaveProperty("property_type");
                expect(property).toHaveProperty("host");
            })
        })
    })
    test("returned objects are ordered by number of favourites",async()=>{
        const favouritesReturn = await db.query("SELECT * FROM favourites;");
        const favourites = favouritesReturn.rows;
        const favouritesCount = {};
        return fetchProperties()
        .then((properties)=>{
            properties.forEach((property)=>{
                favourites.forEach((favourite)=>{
                    if(favourite.property_id === property.property_id){
                        if(!favouritesCount[property.property_id]){
                            favouritesCount[property.property_id] = 1;
                        } else {
                            favouritesCount[property.property_id]++;
                        }
                    }
                })
            })
            properties.forEach((property) => {
                if (!favouritesCount[property.property_id]) {
                    favouritesCount[property.property_id] = 0;
                }
            });
            for(let i = 1; i<properties.length;i++){
                expect(favouritesCount[properties[i].property_id]).toBeLessThanOrEqual(favouritesCount[properties[i-1].property_id])
            }
        })
    })
})