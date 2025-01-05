const db = require("./connection.js");
const {
    createusersQuery,
    createPropertyTypesQuery,
    createPropertiesQuery,
    createFavouritesQuery,
    createBookingsQuery,
    createReviewsQuery,
    createImagesQuery,
    installGist,
} = require("./queries");

async function manageTables() {
    await db.query(`DROP TABLE IF EXISTS bookings;`);

    await db.query(`DROP TABLE IF EXISTS favourites;`);
  
    await db.query(`DROP TABLE IF EXISTS images;`);

    await db.query(`DROP TABLE IF EXISTS reviews;`);

    await db.query(`DROP TABLE IF EXISTS properties;`);

    await db.query(`DROP TABLE IF EXISTS property_types;`);
    
    await db.query(`DROP TABLE IF EXISTS bookings;`)
    
    await db.query(`DROP TABLE IF EXISTS users CASCADE;`);

    await db.query(createusersQuery);

    await db.query(createPropertyTypesQuery);

    await db.query(createPropertiesQuery);

    await db.query(createFavouritesQuery);

    await db.query(installGist);

    await db.query(createBookingsQuery);

    await db.query(createReviewsQuery);

    await db.query(createImagesQuery);
}

module.exports = manageTables;
