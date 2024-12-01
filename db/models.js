const db = require("./connection.js");

function fetchProperties () {
    const queryText = `
    SELECT 
        properties.property_id, 
        properties.name AS property_name, 
        property_types.property_type, 
        properties.location, 
        properties.price_per_night, 
        CONCAT(users.first_name, ' ', users.surname) AS host
    FROM 
        properties
    INNER JOIN 
        users 
    ON 
        properties.user_id = users.user_id
    INNER JOIN 
        property_types 
    ON 
        properties.property_type_id = property_types.property_type_id
    JOIN 
        favourites 
    ON 
        favourites.property_id = properties.property_id
    GROUP BY 
        properties.property_id,
        property_types.property_type,
        users.first_name,
        users.surname
    ORDER BY 
        COUNT(favourites.property_id) DESC;`

    return db.query(queryText)
    .then(({ rows }) => {
        if (rows.some(row => row.price_per_night === null)) {
          throw new Error("Invalid data in the database");
        }
        return rows;
      })
      .catch((err) => {
        console.error(err);
        throw new Error("Internal Server Error");
      });
};

module.exports = {fetchProperties};