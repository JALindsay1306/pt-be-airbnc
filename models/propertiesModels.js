const format = require("pg-format");
const db = require("../db/connection.js");

function fetchProperties (maxPrice,minPrice=0,sortBy,sortOrder,host_id,property_type) {
    if (maxPrice && !Number.isInteger(parseInt(maxPrice))) {
        return Promise.reject({status: 400, msg:'Invalid value for maxPrice. It must be an integer.' });
    }
    if (minPrice && !Number.isInteger(parseInt(minPrice))) {
        return Promise.reject({status:400,msg: 'Invalid value for minPrice. It must be an integer.' });
    }
    if (sortBy && sortBy !== "price_per_night" && sortBy !== "popularity") {
        return Promise.reject({status:400,msg: 'Data can only be sorted by price_per_night or popularity.' });
    }
    if (sortOrder && sortOrder !== "ASC" && sortOrder !== "DESC") {
        return Promise.reject({status:400,msg: 'sortorder must be ASC or DESC.' });
    }
    if(sortBy==="price_per_night"&&!sortOrder){
        sortOrder = "ASC";
    } else if (!sortOrder){
        sortOrder = "DESC";
    }
    let queryText = `
    WITH RecentImages AS (
        SELECT 
        property_id, 
        image_url, 
        alt_tag,
        ROW_NUMBER() OVER (PARTITION BY property_id ORDER BY created_at DESC) AS rn
    FROM 
        images
    )
    SELECT 
        properties.property_id, 
        properties.name AS property_name, 
        property_types.property_type, 
        properties.location, 
        properties.price_per_night, 
        CONCAT(users.first_name, ' ', users.surname) AS host,
        COALESCE(RecentImages.image_url, 'default_image_url_here') AS image,
        COALESCE(RecentImages.alt_tag, 'No image available') AS alt_tag
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
    LEFT JOIN 
        favourites 
    ON 
        favourites.property_id = properties.property_id
    LEFT JOIN
        RecentImages
    ON
        properties.property_id = RecentImages.property_id AND RecentImages.rn = 1
    WHERE 
    `
    if (maxPrice){
        queryText+= format(`
            price_per_night <= %L AND `,
        parseInt(maxPrice)
        )
    }

    queryText += format(` 
     price_per_night >= %L
    `, parseInt(minPrice));

    if(host_id){
        queryText+= format(`
             AND properties.user_id = %L`,host_id);
    }
    if(property_type){
        queryText+= format(`
            AND property_type= %L`,property_type);
    }
    queryText += `
    GROUP BY 
        properties.property_id,
        property_types.property_type,
        users.first_name,
        users.surname,
        RecentImages.image_url,
        RecentImages.alt_tag
    `
    if(sortBy === "price_per_night"){
        queryText+=`
        ORDER BY price_per_night`
    } else {
        queryText+= `
        ORDER BY 
        COUNT(favourites.property_id)`;
    };

    queryText+= format(` %s;`,sortOrder);
    return db.query(queryText)
    .then(({ rows }) => {
        return rows;
      })
};

function fetchOneProperty(property_id){
        let returnedProperty = {};
        return db.query(format(`
        SELECT 
            properties.property_id, 
            properties.name AS property_name, 
            property_types.property_type, 
            properties.location, 
            properties.price_per_night,
            properties.description,
            CONCAT(users.first_name, ' ', users.surname) AS host,
            users.avatar AS host_avatar,
            COUNT(favourites.property_id) as favourite_count
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
        LEFT JOIN 
            favourites 
        ON 
            favourites.property_id = properties.property_id
        WHERE 
            properties.property_id = %L
        GROUP BY
            properties.property_id, 
            properties.name, 
            property_types.property_type, 
            properties.location, 
            properties.price_per_night, 
            properties.description, 
            users.first_name, 
            users.surname,
            users.avatar;`,property_id))
    .then(({rows})=>{
        if(rows.length===0){
            return Promise.reject({status:404,msg:"Property does not exist"});
        }
        returnedProperty.property = {...rows[0]};
        return db.query(format(`
            SELECT
            image_url AS image,
            alt_tag
            FROM
            images
            WHERE
            property_id = %L;`,property_id))
    })
    .then(({rows})=>{
        returnedProperty.property.images = [...rows];
        return returnedProperty;
    })
};


module.exports = {fetchProperties, fetchOneProperty};