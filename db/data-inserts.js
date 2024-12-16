const db = require("./connection.js");
const format = require("pg-format");

function insertUsers(users) {
    return db.query(
        format(
            `INSERT INTO users (first_name,surname,email,phone_number,role,avatar) VALUES %L RETURNING *`,
            users.map(({first_name,surname,email,phone_number,role,avatar})=>[first_name,surname,email,phone_number,role,avatar])
        )
    );
};

function insertPropertyTypes(propertyTypes){
    return db.query (
        format(
            `INSERT into property_types (property_type,description) VALUES %L RETURNING *`,
            propertyTypes.map(({property_type,description})=>[property_type,description])
        )
    )
}

function insertProperties(properties){
    return db.query (
        format(
            `INSERT into properties (name,property_type_id,location, price_per_night,description,user_id) VALUES %L RETURNING *`,
            properties.map(({name,property_type_id,location,price_per_night,description,user_id})=>[name,property_type_id,location,price_per_night,description,user_id])
        )
    )
}

function insertFavourites(favourites){
    return db.query (
        format(
            `INSERT into favourites (user_id,property_id) VALUES %L RETURNING *`,
            favourites.map(({user_id,property_id})=>[user_id,property_id])
        )
    ).then((result) => {
        return result; 
    }).catch((err) => {
        if (err.code === '23503') { 
            return {
                status: 400,
                message: "Invalid user_id or property_id. Please ensure they exist in the database."
            };
        }
    });
}

function insertBookings(bookings){
    return db.query (
        format(
            `INSERT into bookings (property_id,user_id,check_in_date,check_out_date) VALUES %L RETURNING *`,
            bookings.map(({property_id,user_id,check_in_date,check_out_date})=>[property_id,user_id,check_in_date,check_out_date])
        )
    )
}

function insertReviews(reviews){
    return db.query (
        format(
            `INSERT into reviews (user_id,property_id,rating,comment) VALUES %L RETURNING *`,
            reviews.map(({user_id,property_id,rating,comment})=>[user_id,property_id,rating,comment])
        )
    )
}
module.exports = {insertUsers,insertPropertyTypes,insertProperties,insertFavourites,insertBookings,insertReviews};