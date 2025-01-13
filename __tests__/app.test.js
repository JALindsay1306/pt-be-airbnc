const app = require("../app/app");
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
    describe("properties",()=>{
        describe("GET/api/properties",()=>{
            describe("happy path",()=>{
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
            });
            describe("sad path",()=>{
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
                    return request(app).get("/api/properties/?host_id=3")
                    .then(({body})=>{
                        body.properties.forEach((property)=>{
                            expect(property).toHaveProperty("image");
                            expect(property).toHaveProperty("alt_tag");
                        })
                    });
                });
                test("returns properties even if they have no images",()=>{
                    return request(app).get("/api/properties/?host_id=1&minprice=95&maxprice=105",)
                    .then(({body})=>{
                        expect(body.properties.length).toBe(1);
                    });
                });
            });
        });
        describe("GET/singleProperty",()=>{
            describe("happy path",()=>{
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
            });
            describe("sad path",()=>{
                test("when a property_id that does not exist is requested, return a 404 error",()=>{
                    return request(app).get("/api/properties/11321321")
                    .expect(404)
                    .then(({body})=>{
                        expect(body.msg).toBe("Property does not exist");
                    });
                });
                test("returned property has a property for an array of images",()=>{
                    return request(app).get("/api/properties/3")
                    .then(({body})=>{
                            expect(body.property).toHaveProperty("images");
                            expect(Array.isArray(body.property.images)).toBe(true);
                            body.property.images.forEach((image)=>{
                                expect(typeof image).toBe("object");
                                expect(image).toHaveProperty("image");
                                expect(image).toHaveProperty("alt_tag");
                            })
                        
                        });
                });
                test("returns a property even if it doesn't have any images",()=>{
                    return request(app).get("/api/properties/11",)
                    .then(({body})=>{
                        expect(body.property.property_id).toBe(11);
                    })
                });
                test("if an invalid ID is requested, an error is returned",()=>{
                    return request(app).get("/api/properties/eggs")
                    .expect(400)
                    .then(({body})=>{
                        expect(body.msg).toBe("Invalid input, please check and try again");
                    })
                }); 
            });
        });
    });
    describe("favourites",()=>{
        describe("POST/favourites",()=>{
            describe("happy path",()=>{
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
            });
            describe("sad path",()=>{
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
                    });
                });
                test("will not add a favourite if it already exists",async()=>{
                    await request(app).post("/api/properties/2/favourite").send({guest_id:3});
                    return request(app).post("/api/properties/2/favourite").send({guest_id:3})
                    .expect(400)
                    .then(({body})=>{
                        expect(body.msg).toBe("You have already favourited this property");
                    });
                });
            });   
        });
        describe("DELETE/favourites",()=>{
            describe("happy path",()=>{
                test("returns a status of 204",()=>{
                    return request(app).delete("/api/favourites/1")
                    .expect(204);
                });
                test("returns no content in the response body",()=>{
                    return request(app).delete("/api/favourites/2")
                    .then((response)=>{
                        expect(response.text).toBe("");
                    });
                });
                test("removes the favourite from the database",async()=>{
                    const {body} = await request(app).post("/api/properties/3/favourite").send({guest_id:6});
                    const newFavourite = body.favourite_id;
                    await request(app).delete(`/api/favourites/${newFavourite}`);
                    return db.query("SELECT * FROM favourites;")
                    .then(({rows})=>{
                        rows.forEach((favourite)=>{
                            expect(favourite.favourite_id).not.toBe(newFavourite);
                        });
                    });
                });
            });
            describe("sad path",()=>{
                test("returns an error when trying to delete a favourite that does not exist",()=>{
                    return request(app).delete("/api/favourites/1231234")
                    .expect(404)
                    .then(({body})=>{
                        expect(body.msg).toBe("favourite_id does not exist, cannot delete.")
                    });
                });
                test("if an invalid ID is requested, an error is returned",()=>{
                    return request(app).delete("/api/favourites/eggs")
                    .expect(400)
                    .then(({body})=>{
                        expect(body.msg).toBe("Invalid input, please check and try again");
                    })
                });
            });
        });
    });
    describe("reviews",()=>{
        describe("GET/propertyReviews",()=>{
            describe("happy path",()=>{
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
            });
            describe("sad path",()=>{
                test("returns an error message when given a non-existent property_id",()=>{
                    return request(app).get("/api/properties/23145312/reviews")
                    .expect(404)
                    .then(({body})=>{
                        expect(body.msg).toBe("No such property exists");
                    });
                });
                test("if an invalid ID is requested, an error is returned",()=>{
                    return request(app).get("/api/properties/eggs/reviews")
                    .expect(400)
                    .then(({body})=>{
                        expect(body.msg).toBe("Invalid input, please check and try again");
                    });
                }); 
            });
        });
        describe("POST/propertyReviews",()=>{
            describe("happy path",()=>{
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
                    });
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
            });
            describe("sad path",()=>{
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
                });
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
                    });
                });
            });
        });
        describe("DELETE/propertyReview",()=>{
            describe("happy path",()=>{
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
            });
            describe("sad path",()=>{
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
                    });
                });
            });
        });
    });
    describe("users",()=>{
        describe("GET/users",()=>{
            describe("happy path",()=>{
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
                    });
                })
                test("returned object user_id is the same as the one requested",()=>{
                    return request(app).get("/api/users/1")
                    .then(({body})=>{
                        expect(body.user.user_id).toBe(1);
                    });
                });
            });
            describe("sad path",()=>{
                test("if a non-existent user_id is requested, returns an error message and 404 code",()=>{
                    return request(app).get("/api/users/213154")
                    .expect(404)
                    .then(({body})=>{
                        expect(body.msg).toBe("user_id does not exist");
                    });
                });
                test("if an invalid ID is requested, an error is returned",()=>{
                    return request(app).get("/api/users/sausages")
                    .expect(400)
                    .then(({body})=>{
                        expect(body.msg).toBe("Invalid input, please check and try again");
                    });
                });
            });
        });
        describe("PATCH/users",()=>{
            describe("happy path",()=>{
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
                    });
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
            });
            describe("sad path",()=>{
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
            });
        });
    });
    describe("bookings",()=>{
        describe("POST/bookings",()=>{
            describe("happy path",()=>{
                test("returns a status code of 201",()=>{
                    const booking = {guest_id:2,check_in_date:"2026-01-12",check_out_date:"2026-01-15"};
                    return request(app).post("/api/properties/1/booking").send(booking)
                    .expect(201)
                });
                test("if valid, returns a success message and booking id",()=>{
                    const booking = {guest_id:2,check_in_date:"2026-02-12",check_out_date:"2026-02-15"};
                    return request(app).post("/api/properties/1/booking").send(booking)
                    .then(({body})=>{
                        expect(body).toHaveProperty("msg");
                        expect(body.msg).toEqual("Booking successful");
                        expect(body).toHaveProperty("booking_id");
                    });
                });
                test("succesfully inserts booking into database",async()=>{
                    const booking = {guest_id:2,check_in_date:"2026-02-12",check_out_date:"2026-02-15"};
                    await request(app).post("/api/properties/3/booking").send(booking);
                    return db.query(`
                        SELECT
                        booking_id,
                        user_id,
                        property_id,
                        TO_CHAR(check_in_date, 'YYYY-MM-DD') AS check_in_date,
                        TO_CHAR(check_out_date, 'YYYY-MM-DD') AS check_out_date
                        FROM 
                        bookings;`)
                    .then(({rows})=>{
                        const newBooking = rows[rows.length-1];
                        expect(newBooking.property_id).toBe(3);
                        expect(newBooking.user_id).toBe(2);
                        expect(newBooking.check_in_date).toBe("2026-02-12");
                        expect(newBooking.check_out_date).toBe("2026-02-15");
                    });
                });
            });
            describe("sad path",()=>{
                test("returns an error if booking clashes with an existing booking",()=>{
                    const booking = {guest_id:4,check_in_date:"2025-12-03",check_out_date:"2025-12-08"};
                    return request(app).post("/api/properties/1/booking").send(booking)
                    .expect(400)
                    .then(({body})=>{
                        expect(body.msg).toBe("These dates clash with an existing booking, please adjust")
                    });
                });
                test("returns an error if check_out_date is set before check_in_date",()=>{
                    const booking = {guest_id:4,check_in_date:"2026-12-03",check_out_date:"2026-12-01"};
                    return request(app).post("/api/properties/1/booking").send(booking)
                    .expect(400)
                    .then(({body})=>{
                        expect(body.msg).toBe("Check_out_date cannot be before check_in_date")
                    });
                });
                test("returns an error if input data is missing",()=>{
                    const booking = {guest_id:4,check_in_date:"2026-12-03"};
                    return request(app).post("/api/properties/6/booking").send(booking)
                    .expect(400)
                    .then(({body})=>{
                        expect(body.msg).toBe("Missing input data, please ensure all fields are filled out")
                    });
                })
                test("returns an error if passed a non-existent user_id",()=>{
                    const booking = {guest_id:23256, check_in_date:"2027-12-03",check_out_date:"2027-12-06"};
                    return request(app).post("/api/properties/1/booking").send(booking)
                    .expect(404)
                    .then(({body})=>{
                        expect(body.msg).toBe("Key (user_id)=(23256) is not present in table \"users\".");
                    });
                });
                test("returns an error if passed a non-existent property_id",()=>{
                    const booking = {guest_id:6, check_in_date:"2027-12-03",check_out_date:"2027-12-06"};
                    return request(app).post("/api/properties/15325/booking").send(booking)
                    .expect(404)
                    .then(({body})=>{
                        expect(body.msg).toBe("Key (property_id)=(15325) is not present in table \"properties\".");
                    });
                });
                test("returns an error if passed an invalid user_id",()=>{
                    const booking = {guest_id:"cheese", check_in_date:"2027-12-03",check_out_date:"2027-12-06"};
                    return request(app).post("/api/properties/1/booking").send(booking)
                    .expect(400)
                    .then(({body})=>{
                        expect(body.msg).toBe("Invalid input, please check and try again");
                    });
                });
                test("returns an error if passed an invalid property_id",()=>{
                    const booking = {guest_id:4, check_in_date:"2027-12-03",check_out_date:"2027-12-06"};
                    return request(app).post("/api/properties/bacon/booking").send(booking)
                    .expect(400)
                    .then(({body})=>{
                        expect(body.msg).toBe("Invalid input, please check and try again");
                    });
                });
            });
        });
        describe("GET/bookings",()=>{
            describe("happy path",()=>{
                test("returns a status code of 200",()=>{
                    return request(app).get("/api/properties/1/bookings")
                    .expect(200);
                });
                test("returns an object with a property of bookings, which contains an array of objects",()=>{
                    return request(app).get("/api/properties/3/bookings")
                    .then(({body})=>{
                        console.log(body)
                        expect(Array.isArray(body.bookings)).toBe(true);
                        body.bookings.forEach((booking)=>{
                            expect(typeof booking).toBe("object");
                        });
                    });
                });
                test("returned object also contains a property with property_id matching the one that was searched for",()=>{
                    return request(app).get("/api/properties/1/bookings")
                    .then(({body})=>{
                        expect(body.property_id).toBe(1);
                    });
                });
                test("returned bookings have the required properties - booking_id, check_in_date,check_out_date,created_at",()=>{
                    return request(app).get("/api/properties/1/bookings")
                    .then(({body})=>{
                        body.bookings.forEach((booking)=>{
                            expect(booking).toHaveProperty("booking_id");
                            expect(booking).toHaveProperty("check_in_date");
                            expect(booking).toHaveProperty("check_out_date");
                            expect(booking).toHaveProperty("created_at");
                        });
                    });
                });
                test("returned bookings are linked to the required property",async()=>{
                    const bookingsQuery = await db.query(`SELECT * FROM bookings;`);
                    const allBookings = bookingsQuery.rows;
                    const { body } = await request(app).get("/api/properties/1/bookings");
                    
                    body.bookings.forEach((booking) => {
                        const matchingBooking = allBookings.find(b => b.booking_id === booking.booking_id);
                        expect(matchingBooking).toBeDefined();
                        expect(matchingBooking.property_id).toBe(1);
                    });
                });
                test("quantity of returned bookings is correct",()=>{
                    return request(app).get("/api/properties/9/bookings")
                    .then(({body})=>{
                        expect(body.bookings.length).toBe(3);
                    });
                });
            });
            describe("sad path",()=>{
                test("returns an error if passed a non existent property_id",()=>{
                    return request(app).get("/api/properties/23232/bookings")
                    .expect(404)
                    .then(({body})=>{
                        expect(body.msg).toBe("Key (property_id)=(23232) is not present in table \"properties\".");
                    });
                });
                test("returns an error if passed an invalid property_id",()=>{
                    return request(app).get("/api/properties/burger/bookings")
                    .expect(400)
                    .then(({body})=>{
                        expect(body.msg).toBe("Invalid input, please check and try again");
                    });
                });
                test("If the property has no bookings, returns an empty array",()=>{
                    return request(app).get("/api/properties/11/bookings")
                    .expect(200)
                    .then(({body})=>{
                        expect(body.bookings.length).toBe(0);
                    });
                });
            });
        });
        describe("DELETE/bookings",()=>{
            describe("happy path",()=>{
                test("returns a status code of 204",()=>{
                    return request(app).delete("/api/bookings/1")
                    .expect(204);
                });
                test("returns no body",()=>{
                    return request(app).delete("/api/bookings/2")
                    .then(({body})=>{
                        expect(body).toEqual({});
                    });
                });
                test("removes booking from the database",async()=>{
                    const bookingsQuery = await db.query(`SELECT * FROM bookings;`);
                    const allBookings = bookingsQuery.rows;
                    const lastBookingID = allBookings[allBookings.length-1].booking_id;
                    await request(app).delete(`/api/bookings/${lastBookingID}`);
                    return db.query(`SELECT * FROM bookings;`)
                    .then(({rows})=>{
                        expect(rows.length).toBe(allBookings.length-1);
                        const matchingBooking = rows.find(booking => booking.booking_id === lastBookingID);
                        expect(matchingBooking).not.toBeDefined();
                    });
                });
            });
            describe("sad path",()=>{
                test("returns an error if given non-existent booking_id",()=>{
                    return request(app).delete("/api/bookings/23145")
                    .expect(404)
                    .then(({body})=>{
                        expect(body.msg).toBe("Key (booking_id)=(23145) is not present in table \"bookings\".");
                    });
                });
                test("returns an error if an invalid booking_id is given",()=>{
                    return request(app).delete("/api/bookings/baklava")
                    .expect(400)
                    .then(({body})=>{
                        expect(body.msg).toBe("Invalid input, please check and try again");
                    });
                });
            });
        });
        describe("PATCH/booking",()=>{
            describe("happy path",()=>{
                test("returns a status code of 200",()=>{
                    const changes = {check_out_date:"2026-02-02"};
                    return request(app).patch("/api/bookings/4").send(changes)
                    .expect(200);
                });
                test("returns an object",()=>{
                    const changes = {check_out_date:"2027-02-02"};
                    return request(app).patch("/api/bookings/4").send(changes)
                    .then(({body})=>{
                        expect(typeof body).toBe("object");
                    });
                });
                test("returned object has all booking properties - booking_id, user_id, property_id, check_in_date,check_out_date,created_at",()=>{
                    const changes = {check_out_date:"2027-04-02"};
                    return request(app).patch("/api/bookings/4").send(changes)
                    .then(({body})=>{
                            expect(body).toHaveProperty("booking_id");
                            expect(body).toHaveProperty("user_id");
                            expect(body).toHaveProperty("property_id");
                            expect(body).toHaveProperty("check_in_date");
                            expect(body).toHaveProperty("check_out_date");
                            expect(body).toHaveProperty("created_at");
                    });
                });
                test("passed property change has been actioned",()=>{
                    const changes = {check_out_date:"2028-04-02"};
                    return request(app).patch("/api/bookings/4").send(changes)
                    .then(({body})=>{
                            expect(body.check_out_date).toEqual(changes.check_out_date);
                    });
                });
                test("can alter more than one property at once",()=>{
                    const changes = {check_in_date:"2028-04-03",check_out_date:"2028-05-02"};
                    return request(app).patch("/api/bookings/4").send(changes)
                    .then(({body})=>{
                            expect(body.check_out_date).toEqual(changes.check_out_date);
                            expect(body.check_in_date).toEqual(changes.check_in_date);
                    });
                });
            });
            describe("sad path",()=>{
                test("returns an error when passing values that are the same as the current ones",()=>{
                    const changes = {check_in_date: "2025-12-22"};
                    return request(app).patch("/api/bookings/10").send(changes)
                    .expect(400)
                    .then(({body})=>{
                        expect(body.msg).toBe("Values entered should be different from the existing ones")
                    });
                });
                test("returns an error when attempting to change check in or out dates so that out is before in",()=>{
                    const changes = {check_out_date: "2024-11-22"};
                    return request(app).patch("/api/bookings/10").send(changes)
                    .expect(400)
                    .then(({body})=>{
                        expect(body.msg).toBe("Check_out_date cannot be before check_in_date");
                    });
                });
                test("returns an error when attempting to change check in or out dates to clash with another booking",()=>{
                    const changes = {check_in_date: "2025-12-23"};
                    return request(app).patch("/api/bookings/12").send(changes)
                    .expect(400)
                    .then(({body})=>{
                        expect(body.msg).toBe("These dates clash with an existing booking, please adjust");
                    });
                });
                test("returns an error when given a non-existent booking_id",()=>{
                    const changes = {check_in_date: "2025-12-23"};
                    return request(app).patch("/api/bookings/1222").send(changes)
                    .expect(404)
                    .then(({body})=>{
                        expect(body.msg).toBe("Booking not found");
                    });
                });
                test("returns an error when given an invalid booking_id",()=>{
                    const changes = {check_in_date: "2025-12-23"};
                    return request(app).patch("/api/bookings/tomato").send(changes)
                    .expect(400)
                    .then(({body})=>{
                        expect(body.msg).toBe("Invalid input, please check and try again");
                    });
                });
                test("returns an error when attempting to alter a locked property",()=>{
                    const changes = {user_id: 10};
                    return request(app).patch("/api/bookings/10").send(changes)
                    .expect(400)
                    .then(({body})=>{
                        expect(body.msg).toBe("user_id cannot be altered, only check in and check out dates can be changed");
                    });
                });
                test("returns an error when attempting to alter a non-existent property",()=>{
                    const changes = {booking_star_sign: 10};
                    return request(app).patch("/api/bookings/10").send(changes)
                    .expect(400)
                    .then(({body})=>{
                        expect(body.msg).toBe("The requested property to update does not exist");
                    });
                });
                test("returns an error when attempting to update property with invalid data",()=>{
                    const changes = {check_out_date:true};
                    return request(app).patch("/api/bookings/4").send(changes)
                    .expect(400)
                    .then(({body})=>{
                        expect(body.msg).toBe("Invalid input, please check and try again")
                    });
                });
                test("returns an error when attempting to update a property with no data",()=>{
                    const changes = {check_out_date:""};
                    return request(app).patch("/api/bookings/4").send(changes)
                    .expect(400)
                    .then(({body})=>{
                        expect(body.msg).toBe("Missing input data, please ensure all fields are filled out")
                    });
                });
                test("returns an error when attempting to update no property",()=>{
                    const changes = {};
                    return request(app).patch("/api/bookings/4").send(changes)
                    .expect(400)
                    .then(({body})=>{
                        expect(body.msg).toBe("Missing input data, please ensure all fields are filled out")
                    });
                });
            });
        });
        describe("GET/Usersbookings",()=>{
            describe("happy path",()=>{
                test("returns a status code of 200",()=>{
                    return request(app).get("/api/users/6/bookings")
                    .expect(200);
                });
                test("returns an object with the property 'bookings'",()=>{
                    return request(app).get("/api/users/6/bookings")
                    .then(({body})=>{
                        expect(typeof body).toBe("object");
                        expect(body).toHaveProperty("bookings");
                    });
                });
                test("bookings contains an array of objects",()=>{
                    return request(app).get("/api/users/6/bookings")
                    .then(({body})=>{
                        expect(Array.isArray(body.bookings)).toBe(true);
                        body.bookings.forEach((booking)=>{
                            expect(typeof booking).toBe("object");
                        });
                    });
                });
                test("each object within the bookings array has the booking properties - booking_id,check_in_date,check_out_date,property_id",()=>{
                    return request(app).get("/api/users/6/bookings")
                    .then(({body})=>{
                        body.bookings.forEach((booking)=>{
                            expect(booking).toHaveProperty("booking_id");
                            expect(booking).toHaveProperty("check_in_date");
                            expect(booking).toHaveProperty("check_out_date");
                            expect(booking).toHaveProperty("created_at");
                        });
                    });
                });
                test("each object has properties passed from the property - property_id,property_name,host,image",()=>{
                    return request(app).get("/api/users/6/bookings")
                    .then(({body})=>{
                        body.bookings.forEach((booking)=>{
                            expect(booking).toHaveProperty("property_id");
                            expect(booking).toHaveProperty("property_name");
                            expect(booking).toHaveProperty("host");
                            expect(booking).toHaveProperty("image");
                        });
                    });
                });
                test("returned bookings are correct for requested user",()=>{
                    return request(app).get("/api/users/6/bookings")
                    .then(({body})=>{
                        body.bookings.forEach((booking)=>{
                            expect(booking.host).toEqual("Rachel Cummings")
                        });
                    });
                });
                test("the number of returned bookings is correct as expected",async()=>{
                    const fakeBookings = [
                        {guest_id:5,check_in_date:"2029-02-02",check_out_date:"2029-02-03"},
                        {guest_id:5,check_in_date:"2029-02-04",check_out_date:"2029-02-05"},
                        {guest_id:5,check_in_date:"2029-02-06",check_out_date:"2029-02-07"},
                        {guest_id:5,check_in_date:"2029-02-08",check_out_date:"2029-02-09"},
                        {guest_id:5,check_in_date:"2029-02-10",check_out_date:"2029-02-11"},]

                    for(let i =0; i < 5; i++){
                        await request(app).post(`/api/properties/${i+2}/booking`).send(fakeBookings[i])
                    };
                    return request(app).get("/api/users/5/bookings")
                    .then(({body})=>{
                        expect(body.bookings.length).toBe(5)
                    });
                });
                test("host name is correct for each property",async()=>{
                    const allPropertiesFetch = await db.query(`
                        SELECT 
                            CONCAT(users.first_name, ' ', users.surname) AS host
                        FROM 
                            properties
                        JOIN
                            users
                        ON
                            properties.user_id = users.user_id;`);
                    const allProperties = allPropertiesFetch.rows;
                    return request(app).get("/api/users/6/bookings")
                    .then(({body})=>{
                        body.bookings.forEach((booking)=>{
                            allProperties.forEach((property)=>{
                                if (booking.property_id === property.property_id){
                                    expect(booking.host).toEqual(property.host);
                                };
                            });
                        });
                    });
                });
                test("returned images are correct for each property",async()=>{
                    const imageGrab = await db.query("SELECT * FROM images;")
                    const allImages = imageGrab.rows;

                    return request(app).get("/api/users/6/bookings")
                    .then(({body})=>{
                        body.bookings.forEach((booking)=>{
                            if(booking.image){
                                allImages.forEach((image)=>{
                                    if(image.image_url === booking.image){
                                        expect(image.property_id).toEqual(booking.property_id);
                                    };
                                });
                            };
                        });
                    });
                });
                test("if the user has no bookings, an empty array is returned under 'bookings'",()=>{
                    return request(app).get("/api/users/3/bookings")
                    .expect(200)
                    .then(({body})=>{
                        expect(Array.isArray(body.bookings)).toBe(true);
                        expect(body.bookings.length).toBe(0);
                    });
                });
            });
            describe("sad path",()=>{
                test("if a valid non-existent user_id is requested, an error is returned",()=>{
                    return request(app).get("/api/users/2345/bookings")
                    .expect(404)
                    .then(({body})=>{
                        expect(body.msg).toBe("Key (user_id)=(2345) is not present in table \"users\".");
                    });
                });
                test("if a non-valid user_id is requested, an error is returned",()=>{
                    return request(app).get("/api/users/linguine/bookings")
                    .expect(400)
                    .then(({body})=>{
                        expect(body.msg).toBe("Invalid input, please check and try again");
                    });
                });
            });
        });
    });
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