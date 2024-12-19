const app = require("../app");
const request = require("supertest");
const db = require("../db/connection");
const seed = require("../db/seed");
const data = require("../db/data/test");
const { fetchProperties } = require("../models/propertiesModels");
const { getSingleProperty } = require("../controllers/propertiesControllers");


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
            });
        });        
        test("correctly passes through maxprice query to model function",()=>{
            return request(app).get("/api/properties/?maxprice=120").expect(200)
            .then(({body})=>{
                body.properties.forEach((property)=>{
                    expect(property.price_per_night).toBeLessThanOrEqual(120);
                })
            });
        });
        test("correctly passes through minprice query to model function",()=>{
            return request(app).get("/api/properties/?minprice=140").expect(200)
            .then(({body})=>{
                body.properties.forEach((property)=>{
                    expect(property.price_per_night).toBeGreaterThanOrEqual(140);
                })
            });
        });

        test("correctly passes through max and minprice query to model function when both used",()=>{
            return request(app).get("/api/properties/?maxprice=150&minprice=140").expect(200)
            .then(({body})=>{
                body.properties.forEach((property)=>{
                    expect(property.price_per_night).toBeGreaterThanOrEqual(140);
                    expect(property.price_per_night).toBeLessThanOrEqual(150);
                })
            });
        });
        test("returns no properties when max set out of bounds",()=>{
            return request(app).get("/api/properties/?maxprice=1").expect(200)
            .then(({body})=>{
                    expect(body.properties.length).toBe(0);;
                });
        });
        test("returns no properties when min set out of bounds",()=>{
            return request(app).get("/api/properties/?minprice=99999").expect(200)
            .then(({body})=>{
                expect(body.properties.length).toBe(0);;
            });
        });
        test("returns a 400 code with error message when passed a non-integer maxprice",async()=>{
            return request(app).get("/api/properties/?maxprice=sausages").expect(400)
            .then(({body})=>{
                expect(body.msg).toBe("Invalid value for maxPrice. It must be an integer.");
            });
        });
        test("returns a 400 code with error message when passed a non-integer minprice",async()=>{
            return request(app).get("/api/properties/?minprice=cookies").expect(400)
            .then(({body})=>{
                expect(body.msg).toBe("Invalid value for minPrice. It must be an integer.");
            });
        });
        test("correctly passes through sortBy argument to model function when used",()=>{
            return request(app).get("/api/properties/?sortby=price_per_night")
            .then(({body})=>{
                const propertiesPricePerNight = [];
                for(let i=0;i<body.properties.length;i++){
                    propertiesPricePerNight.push(body.properties[i].price_per_night);
                };
                const propertiesPricePerNightSorted = [...propertiesPricePerNight];
                propertiesPricePerNightSorted.sort((a, b) => a - b);
                expect(propertiesPricePerNight).toEqual(propertiesPricePerNightSorted);
            })
        })
        test("returns a 400 code with error message when passed an invalid sortBy string",async()=>{
            return request(app).get("/api/properties/?sortby=location").expect(400)
            .then(({body})=>{
                expect(body.msg).toBe("Data can only be sorted by price_per_night or popularity.");
            });
        });
        test("correctly passes through sortOrder value when provided",()=>{
            return request(app).get("/api/properties/?sortby=price_per_night&sortorder=DESC")
            .then(({body})=>{
                const propertiesPricePerNight = [];
                for(let i=0;i<body.properties.length;i++){
                    propertiesPricePerNight.push(body.properties[i].price_per_night);
                };
                const propertiesPricePerNightSorted = [...propertiesPricePerNight];
                propertiesPricePerNightSorted.sort((a, b) => b - a);
                expect(propertiesPricePerNight).toEqual(propertiesPricePerNightSorted);
            })
        })
        test("returns a 400 code with error message when passed an invalid sortorder string",async()=>{
            return request(app).get("/api/properties/?sortby=price_per_night&sortorder=down").expect(400)
            .then(({body})=>{
               expect(body.msg).toBe("sortorder must be ASC or DESC."); 
            });
        });
        test("correctly passes through host_id value when provided",async()=>{
            const user3 = await db.query(`SELECT * FROM users WHERE user_id = 3;`)
            const hostName = user3.rows[0].first_name + " " + user3.rows[0].surname;
            return request(app).get("/api/properties/?host_id=3")
            .then(({body})=>{
                body.properties.forEach((property)=>{
                    expect(property.host).toBe(hostName);
                })
            });
        });
        test("returned properties have a property for the most recently added image",()=>{
            
        })
        
    });
    describe("POST/favourites",()=>{
        test("returns a status code of 201",()=>{
            return request(app).post("/api/properties/1/favourite").send({guest_id:3}).expect(201);
        });
        test("headers set to JSON",()=>{
            return request(app).post("/api/properties/1/favourite").send({guest_id:3}).expect("Content-Type",/json/);
        });
        test("returns favourite_id, next in sequence",async()=>{
            const existingFavourites = (await db.query('SELECT * FROM favourites;')).rows;
            const lastFavouriteID = existingFavourites[existingFavourites.length-1].favourite_id;
            return request(app).post("/api/properties/1/favourite").send({guest_id:5})
            .then(({body})=>{
                expect(body.favourite_id).toEqual(lastFavouriteID+1);
            });
        });
        test("successfully inserted favourite into database",async()=>{
            const newFavourite = {user_id:2,property_id:2};
            newFavourite.favourite_id = (await request(app).post(`/api/properties/${newFavourite.property_id}/favourite`).send({guest_id: newFavourite.user_id})).body.favourite_id;
            return db.query(`SELECT * FROM favourites;`)
            .then(({rows})=>{
                expect(rows[rows.length-1].favourite_id).toEqual(newFavourite.favourite_id);
                expect(rows[rows.length-1].user_id).toEqual(newFavourite.user_id);
                expect(rows[rows.length-1].property_id).toEqual(newFavourite.property_id);
            });
        });
        test("returns an error when non-existent guest ID used",()=>{
            return request(app).post("/api/properties/1/favourite").send({guest_id:86708960})
            .expect(404)
            .then(({body})=>{
                expect(body.msg).toBe("User_ID does not exist, could not create favourite")
            });
        });
        test("returns an error when non-existent property ID used",()=>{
            return request(app).post("/api/properties/123242141/favourite").send({guest_id:2})
            .expect(404)
            .then(({body})=>{
                expect(body.msg).toBe("Property_ID does not exist, could not create favourite")
            })
        })
        test("will not add a favourite if it already exists",async()=>{
            await request(app).post("/api/properties/2/favourite").send({guest_id:3});
            return request(app).post("/api/properties/2/favourite").send({guest_id:3})
            .expect(400)
            .then(({body})=>{
                expect(body.msg).toBe("You have already favourited this property");
            })
        })
    })
    describe("DELETE/favourites",()=>{
        test("returns a status of 204",()=>{
            return request(app).delete("/api/favourites/1")
            .expect(204);
        });
        test("returns no content in the response body",()=>{
            return request(app).delete("/api/favourites/2")
            .then((response)=>{
                expect(response.text).toBe("");
            })
        });
        test("removes the favourite from the database",async()=>{
            const {body} = await request(app).post("/api/properties/3/favourite").send({guest_id:6});
            const newFavourite = body.favourite_id;
            await request(app).delete(`/api/favourites/${newFavourite}`);
            return db.query("SELECT * FROM favourites;")
            .then(({rows})=>{
                rows.forEach((favourite)=>{
                    expect(favourite.favourite_id).not.toBe(newFavourite);
                })
            })
        })
        test("returns an error when trying to delete a favourite that does not exist",()=>{
            return request(app).delete("/api/favourites/1231234")
            .expect(404)
            .then(({body})=>{
                expect(body.msg).toBe("favourite_id does not exist, cannot delete.")
            })
        })

    })
    describe("GET/singleProperty",()=>{
        test("returns a status of 200",()=>{
            return request(app).get("/api/properties/1")
            .expect(200);
        })
        test("returns 1 property",()=>{
            return request(app).get("/api/properties/1")
            .then(({body})=>{
                expect (Object.keys(body).length).toBe(1);
            })
        });
        test("returned property has required properties - property_id,property_name,location,price_per_night,description, host, favourite_count",()=>{
            return request(app).get("/api/properties/1")
            .then(({body})=>{
                expect (body.property).toHaveProperty("property_id");
                expect (body.property).toHaveProperty("property_name");
                expect (body.property).toHaveProperty("location");
                expect (body.property).toHaveProperty("price_per_night");
                expect (body.property).toHaveProperty("description");
                expect (body.property).toHaveProperty("host");
                expect (body.property).toHaveProperty("host_avatar");
                expect (body.property).toHaveProperty("favourite_count");
            });
        });
        test("returned property has property_id that was requested",()=>{
            return request(app).get("/api/properties/1")
            .then(({body})=>{
                expect (body.property.property_id).toBe(1);
            });
        });
        test("when a property_id that does not exist is requested, return a 404 error",()=>{
            return request(app).get("/api/properties/11321321")
            .expect(404)
            .then(({body})=>{
                expect(body.msg).toBe("Property does not exist");
            });
        });
    })
    describe("GET/propertyReviews",()=>{
        test("returns a status of 200",()=>{
            return request(app).get("/api/properties/3/reviews")
            .expect(200);
        })
        test("returns an object with the property 'reviews'",()=>{
            return request(app).get("/api/properties/3/reviews")
            .then(({body})=>{
                expect(body).toHaveProperty("reviews");
            })
        })
        test("returned reviews have required properties - review_id,comment,rating,created_at,guest,guest_avatar",()=>{
            return request(app).get("/api/properties/3/reviews")
            .then(({body})=>{
                body.reviews.forEach((review)=>{
                    expect(review).toHaveProperty("review_id");
                    expect(review).toHaveProperty("comment");
                    expect(review).toHaveProperty("rating");
                    expect(review).toHaveProperty("created_at");
                    expect(review).toHaveProperty("guest");
                    expect(review).toHaveProperty("guest_avatar");
                });
            });
        });
        test("returned properties are correctly filtered by given property id",async()=>{
            const {rows} = await db.query('SELECT * FROM reviews;');
            const allReviews = rows;
            return request(app).get("/api/properties/1/reviews")
            .then(({body})=>{
                body.reviews.forEach((review)=>{
                    allReviews.forEach((allReview)=>{
                        if(allReview.review_id===review.review_id){
                            expect(allReview.property_id).toBe(1);
                        };
                    });
                });
            });
        });
        test("correctly returns average rating",()=>{
            return request(app).get("/api/properties/3/reviews")
            .then(({body})=>{
                let totalRating = 0;
                let reviewCount = 0;
                body.reviews.forEach((review)=>{
                    totalRating += review.rating;
                    reviewCount++
                });
                expect(body.average_rating).toEqual(totalRating/reviewCount);
            });
        });
        test("when a property has no reviews, returns an empty body with a 200 status code",()=>{
            return request(app).get("/api/properties/2/reviews")
            .expect(200)
            .then(({body})=>{
                expect(body.reviews.length).toBe(0);
            });
        });
        test("returns an error message when given a non-existent property_id",()=>{
            return request(app).get("/api/properties/23145312/reviews")
            .expect(404)
            .then(({body})=>{
                expect(body.msg).toBe("No such property exists");
            })
        })
    });
    describe("POST/propertyReviews",()=>{
        test("returns a status code of 201",()=>{
            const newReview = {guest_id: 3, rating: 4, comment: "It was pretty good"};
            return request(app).post("/api/properties/3/reviews").send(newReview)
            .expect(201);
        });
        test("returns a new review object",()=>{
            const newReview = {guest_id: 5, rating: 4, comment: "It was pretty good"};
            return request(app).post("/api/properties/3/reviews").send(newReview)
            .then(({body})=>{
                expect(typeof body).toBe("object");
            })
        });
        test("new review_id is a continuation of existing ids",async()=>{
            const newReview = {guest_id: 5, rating: 5, comment: "It was pretty good"};
            const {rows} = await db.query('SELECT * FROM reviews;');
            const lastReviewID = rows[rows.length-1].review_id;
            return request(app).post("/api/properties/8/reviews").send(newReview)
            .then(({body})=>{
                expect(body.review_id).toBe(lastReviewID+1);
            });
        });
        test("review object contains required properties - review_id, property_id, guest_id, rating, comment, created_at",()=>{
            const newReview = {guest_id: 6, rating: 5, comment: "It was pretty good"};
            return request(app).post("/api/properties/8/reviews").send(newReview)
            .then(({body})=>{
                expect(body).toHaveProperty("review_id");
                expect(body).toHaveProperty("property_id");
                expect(body).toHaveProperty("guest_id");
                expect(body).toHaveProperty("rating");
                expect(body).toHaveProperty("comment");
                expect(body).toHaveProperty("created_at");
            });
        });
        test("created at date is current date",()=>{
            const newReview = {guest_id: 1, rating: 4, comment: "It was pretty good"};
            const currentDate = new Date().toISOString();
            return request(app).post("/api/properties/3/reviews").send(newReview)
            .then(({body})=>{
                const createdAt = body.created_at; 
                const timeDifference = Math.abs(new Date(createdAt) - new Date(currentDate));
                expect(timeDifference).toBeLessThan(60000);
                expect(new Date(createdAt).toISOString()).toBe(createdAt);
            });
        });
        test("returns an error if passed a non-existent property_id",()=>{
            const newReview = {guest_id: 1, rating: 4, comment: "It was pretty good"};
            return request(app).post("/api/properties/3765/reviews").send(newReview)
            .expect(404)
            .then(({body})=>{
                expect(body.msg).toBe('Key (property_id)=(3765) is not present in table "properties".');
            });
        });
        test("returns an error if passed a non-existent user_id",()=>{
            const newReview = {guest_id: 1342, rating: 4, comment: "It was pretty good"};
            return request(app).post("/api/properties/3/reviews").send(newReview)
            .expect(404)
            .then(({body})=>{
                expect(body.msg).toBe('Key (user_id)=(1342) is not present in table "users".');
            });
        });
        test("returns an error if this user has already reviewed this property",async()=>{
            const newReview = {guest_id: 5, rating: 4, comment: "It was pretty good"};
            await request(app).post("/api/properties/3/reviews").send(newReview);
            return request(app).post("/api/properties/3/reviews").send(newReview)
            .expect(400)
            .then(({body})=>{
                expect(body.msg).toBe("This combination of ids already exists, please delete the original before replacing.");
            });
        })
        test("returns an error if rating is outside of allowed range",async()=>{
            const newReview = {guest_id: 5, rating: 40, comment: "It was pretty good"};
            return request(app).post("/api/properties/9/reviews").send(newReview)
            .expect(400)
            .then(({body})=>{
                expect(body.msg).toBe("Input data outside of allowed constraints");
            });
        });
        test("if an invalid ID is requested, an error is returned",()=>{
            const newReview = {guest_id: 1, rating: 4, comment: "It was pretty good"};
            return request(app).post("/api/properties/eggs/reviews").send(newReview)
            .expect(400)
            .then(({body})=>{
                expect(body.msg).toBe("Invalid input, please check and try again");
            })
        });
    });
    describe("DELETE/propertyReview",()=>{
        test("returns a status code of 204",()=>{
            return request(app).delete("/api/reviews/1")
            .expect(204);
        });
        test("returns no body",()=>{
            return request(app).delete("/api/reviews/2")
            .then(({body})=>{
                expect(body).toEqual({});
            });
        });
        test("removes review from database",()=>{
            let existingReviews;
            let reviewsAfterDelete;
            return request(app).get("/api/properties/9/reviews")
            .then(({body})=>{
                existingReviews = body.reviews;
            return request(app).delete("/api/reviews/5")
            })
            .then(()=>{
                return request(app).get("/api/properties/9/reviews")
                .then(({body})=>{
                    reviewsAfterDelete = body.reviews;
                    expect(reviewsAfterDelete.length).toEqual(existingReviews.length-1);
                });
            
            });
        });
        test("returns an error if given a non-existent review_id",()=>{
            return request(app).delete("/api/reviews/5")
            .expect(404)
            .then(({body})=>{
                expect(body.msg).toBe("review_id does not exist, cannot delete review");
            });
        });
        test("if an invalid ID is requested, an error is returned",()=>{
            return request(app).delete("/api/reviews/bacon")
            .expect(400)
            .then(({body})=>{
                expect(body.msg).toBe("Invalid input, please check and try again");
            })
        });
    });
    describe("GET/users",()=>{
        test("returns a status code of 200",()=>{
            return request(app).get("/api/users/1")
            .expect(200);
        });
        test("returns a body of an object with a property 'user'",()=>{
            return request(app).get("/api/users/1")
            .then(({body})=>{
                expect(typeof body).toBe("object");
                expect(body).toHaveProperty("user");
            });
        });
        test("returned object has required user properties - user_id, first_name,  surname, email, phone_number, avatar, created_at",()=>{
            return request(app).get("/api/users/1")
            .then(({body})=>{
                expect(body.user).toHaveProperty("user_id");
                expect(body.user).toHaveProperty("first_name");
                expect(body.user).toHaveProperty("surname");
                expect(body.user).toHaveProperty("email");
                expect(body.user).toHaveProperty("phone_number");
                expect(body.user).toHaveProperty("avatar");
                expect(body.user).toHaveProperty("created_at");
            })
        })
        test("returned object user_id is the same as the one requested",()=>{
            return request(app).get("/api/users/1")
            .then(({body})=>{
                expect(body.user.user_id).toBe(1);
            });
        });
        test("if a non-existent user_id is requested, returns an error message and 404 code",()=>{
            return request(app).get("/api/users/213154")
            .expect(404)
            .then(({body})=>{
                expect(body.msg).toBe("user_id does not exist");
            })
        });
        test("if an invalid ID is requested, an error is returned",()=>{
            return request(app).get("/api/users/sausages")
            .expect(400)
            .then(({body})=>{
                expect(body.msg).toBe("Invalid input, please check and try again");
            })
        });
    });
    describe("PATCH/users",()=>{
        test("returns a status code of 201",()=>{
            const patchUser = {first_name:"John"};
            return request(app).patch("/api/users/1").send(patchUser)
            .expect(201);
        });
        test("returns an object with the property user, the included object's user_id should match the requested one",()=>{
            const patchUser = {first_name:"John"};
            return request(app).patch("/api/users/1").send(patchUser)
            .then(({body})=>{
                expect(body).toHaveProperty("user");
                expect(typeof body.user).toBe("object");
                expect(body.user.user_id).toBe(1);
            })
        })
        test("returned user has all required properties - user_id, first_name, surname, email, phone_number, role, avatar, created_at",()=>{
            const patchUser = {first_name:"Steve"};
            return request(app).patch("/api/users/1").send(patchUser)
            .then(({body})=>{
            expect(body.user).toHaveProperty("user_id");
                expect(body.user).toHaveProperty("first_name");
                expect(body.user).toHaveProperty("surname");
                expect(body.user).toHaveProperty("email");
                expect(body.user).toHaveProperty("phone_number");
                expect(body.user).toHaveProperty("role")
                expect(body.user).toHaveProperty("avatar");
                expect(body.user).toHaveProperty("created_at");
            });
        });
        test("returned user has properties updated where they have been passed in",()=>{
            const patchUser = {first_name:"Jeremy"};
            return request(app).patch("/api/users/1").send(patchUser)
            .then(({body})=>{
                expect(body.user.first_name).toBe("Jeremy");
            });
        });
        test("returned user has multiple properties updated where they have been passed in",()=>{
            const patchUser = {first_name:"Mr.", surname:"Blobby", phone_number:"01234553222"};
            return request(app).patch("/api/users/1").send(patchUser)
            .then(({body})=>{
                expect(body.user.first_name).toBe("Mr.");
                expect(body.user.surname).toBe("Blobby")
                expect(body.user.phone_number).toBe("01234553222");
            });
        });
        test("user_id remains unchanged",()=>{
            const patchUser = {first_name:"Jeremy"};
            return request(app).patch("/api/users/1").send(patchUser)
            .then(({body})=>{
                expect(body.user.user_id).toBe(1);
            });
        });
        test("returns an error when passed a user_id that does not exist",()=>{
            const patchUser = {first_name:"Jean"};
            return request(app).patch("/api/users/15654").send(patchUser)
            .expect(404)
            .then(({body})=>{
                expect(body.msg).toBe("user_id does not exist");
            });
        })
        test("returns an error when passed no data to update",()=>{
            const patchUser = {};
            return request(app).patch("/api/users/1").send(patchUser)
            .expect(400)
            .then(({body})=>{
                expect(body.msg).toBe("no data to update");
            });
        });
        test("returns an error when passed invalid data for specific properties",()=>{
            const patchUser = {first_name: true};
            return request(app).patch("/api/users/1").send(patchUser)
            .expect(400)
            .then(({body})=>{
                expect(body.msg).toBe("invalid data, first_name must be a string");
            });
        });
        test("returns an error when attempting to update fields with no data",()=>{
            const patchUser = {first_name:""};
            return request(app).patch("/api/users/1").send(patchUser)
            .expect(400)
            .then(({body})=>{
                expect(body.msg).toBe("first_name cannot be empty, please ensure data is entered");
            });
        });
        test("returns an error when attempting to update non-existent properties",()=>{
            const patchUser = {favourite_foods:["oranges","cider"]};
            return request(app).patch("/api/users/1").send(patchUser)
            .expect(400)
            .then(({body})=>{
                expect(body.msg).toBe("this property does not exist");
            });
        })
        test("returns an error when attempting to update locked properties",()=>{
            const patchUser = {user_id: 4};
            return request(app).patch("/api/users/1").send(patchUser)
            .expect(400)
            .then(({body})=>{
                expect(body.msg).toBe("user_id cannot be altered");
                const patchUser2 = {created_at: 4};
                return request(app).patch("/api/users/1").send(patchUser2)
            })
            .then(({body})=>{
                expect(body.msg).toBe("created_at cannot be altered");
            });
        });
        test("if an invalid ID is requested, an error is returned",()=>{
            const patchUser = {first_name:"Jean"};
            return request(app).patch("/api/users/sausages").send(patchUser)
            .expect(400)
            .then(({body})=>{
                expect(body.msg).toBe("Invalid input, please check and try again");
            })
        });

    })
    test("returns a 500 error if the database has incomplete data", async () => {
            await db.query(`
                DROP TABLE IF EXISTS properties CASCADE;
            `);

            return request(app).get("/api/properties").expect(500)
            .then(({body})=>{
               expect(body.msg).toBe("Data Missing"); 
            });            
    });
});