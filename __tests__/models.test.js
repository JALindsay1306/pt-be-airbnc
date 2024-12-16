const { fetchProperties, createFavourite } = require("../db/models");
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
            });
        });
    });
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
            });
        });
    });
    test("by default, returned objects are sorted in descending order by number of favourites",async()=>{
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
                        };
                    };
                });
            });
            properties.forEach((property) => {
                if (!favouritesCount[property.property_id]) {
                    favouritesCount[property.property_id] = 0;
                };
            });
            for(let i = 1; i<properties.length;i++){
                expect(favouritesCount[properties[i].property_id]).toBeLessThanOrEqual(favouritesCount[properties[i-1].property_id])
            };
        });
    });
    test("correctly return properties under a maximum price when passed",()=>{
        return fetchProperties(120)
        .then((properties)=>{
            properties.forEach((property)=>{
                expect(property.price_per_night).toBeLessThanOrEqual(120);
            });
        });
    });
    test("returns no properties if max price is set too low",()=>{
        return fetchProperties(1)
        .then((properties)=>{
            expect(properties.length).toBe(0);
        });
    });
    test("correctly return properties over a minimum price when passed",()=>{
        return fetchProperties(undefined,150)
        .then((properties)=>{
            properties.forEach((property)=>{
                expect(property.price_per_night).toBeGreaterThanOrEqual(150);
            });
        });
    });
    test("returns no properties if min price is set too high",()=>{
        return fetchProperties(undefined,99999)
        .then((properties)=>{
            expect(properties.length).toBe(0);
        });
    });
    test("min and max work when both called together",()=>{
        return fetchProperties(120,150)
        .then((properties)=>{
            properties.forEach((property)=>{
                expect(property.price_per_night).toBeGreaterThanOrEqual(150);
                expect(property.price_per_night).toBeLessThanOrEqual(120);
            });
        });
    });
    test("when passed a parameter to sort by, the returned properties are sorted in this way",()=>{
        return fetchProperties(undefined,undefined,"price_per_night")
        .then((properties)=>{
            const propertiesPricePerNight = [];
            for(let i=0;i<properties.length;i++){
                propertiesPricePerNight.push(properties[i].price_per_night);
            };
            const propertiesPricePerNightSorted = [...propertiesPricePerNight];
            propertiesPricePerNightSorted.sort((a, b) => a - b);
            expect(propertiesPricePerNight).toEqual(propertiesPricePerNightSorted);
        })
    });
    test("when passed a sorting order, returned properties are sorted in that order, (defaulting to asc for price_per_night, desc for popularity)",()=>{
        return fetchProperties(undefined,undefined,"price_per_night","DESC")
        .then((properties)=>{
            const propertiesPricePerNight = [];
            for(let i=0;i<properties.length;i++){
                propertiesPricePerNight.push(properties[i].price_per_night);
            };
            const propertiesPricePerNightSorted = [...propertiesPricePerNight];
            propertiesPricePerNightSorted.sort((a, b) => b - a);
            expect(propertiesPricePerNight).toEqual(propertiesPricePerNightSorted);
        });
    });
    test("filters by Host ID when passed in",async()=>{
        const user3 = await db.query(`SELECT * FROM users WHERE user_id = 3;`)
        const hostName = user3.rows[0].first_name + " " + user3.rows[0].surname;
        return fetchProperties(undefined,undefined,undefined,undefined,3)
        .then((properties)=>{
            properties.forEach((property)=>{
                expect(property.host).toBe(hostName);
            })
        })
    })
});

describe("createFavourite",()=>{
    let originalFavourites;
    beforeAll(async()=>{
        originalFavourites = await db.query(`
            SELECT * FROM favourites;`);
            originalFavourites = originalFavourites.rows;
    });
    
    test("returns a unique favouriteID",async()=>{
        const newFavourite = await createFavourite(1,2);
        let updatedFavourites = await db.query(`
            SELECT * FROM favourites;`);
        updatedFavourites = updatedFavourites.rows;
        console.log(updatedFavourites)
        originalFavourites.forEach((favourite)=>{
            expect(favourite.favourite_id).not.toEqual(newFavourite);
        })
        expect(updatedFavourites[updatedFavourites.length-1].favourite_id).toEqual(newFavourite);
    })
})