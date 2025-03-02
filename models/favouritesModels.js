const db = require("../db/connection.js");
const format = require("pg-format");


function insertFavouritesFromApp(favourites){
    return db.query('SELECT * FROM users;')
    .then(({rows})=>{
        const users=rows;
        let doesUserExist = false;
        users.forEach((user)=>{
            if(user.user_id===favourites[0].user_id)
            {doesUserExist = true};
        })
        if(!doesUserExist){
            return Promise.reject({status: 404, msg: 'User_ID does not exist, could not create favourite'});
        }
        
        return db.query('SELECT * FROM properties;')
    })
    .then(({rows})=>{
        const properties=rows;
        let doesPropertyExist = false;
        properties.forEach((property)=>{
            if(property.property_id==favourites[0].property_id){
                doesPropertyExist = true};
        })
        if(!doesPropertyExist){
            return Promise.reject({status: 404, msg: 'Property_ID does not exist, could not create favourite'});
        }

    return db.query(format('SELECT * FROM favourites WHERE property_id = %L AND user_id = %L;',favourites[0].property_id,favourites[0].user_id))
    })
    .then(({rows})=>{
       if (rows.length>0){
            return Promise.reject({status: 400, msg: 'You have already favourited this property'});
       }
        return db.query (
            format(
                `INSERT into favourites (user_id,property_id) VALUES %L RETURNING *`,
                favourites.map(({user_id,property_id})=>[user_id,property_id])
            )
        )
    })
    .then((result) => {
        return result; 
    })
}

function removeFavourite (favourite_id) {
    if(isNaN(parseInt(favourite_id))){return Promise.reject({code: "22P02"})}
    return db.query(format('SELECT * FROM favourites WHERE favourite_id = %L;',favourite_id))
    .then(({rows})=>{
        if(rows.length===0){
            return Promise.reject({status: 404, msg:"favourite_id does not exist, cannot delete."})
        }
    return db.query(format('DELETE FROM favourites WHERE favourite_id = %L;',favourite_id))
    })
}

function fetchFavouritesByUser(user_id) {
    return db.query(format(`SELECT * FROM users WHERE user_id = %L`, user_id))
        .then(({ rows }) => {
            if (rows.length === 0) {
                return Promise.reject({ code: "23503", detail: `Key (user_id)=(${user_id}) is not present in table \"users\".` });
            }
            return db.query(format(`
                WITH RecentImages AS (
                    SELECT 
                        property_id, 
                        image_url, 
                        alt_tag,
                        ROW_NUMBER() OVER (PARTITION BY property_id ORDER BY created_at DESC) AS rn
                    FROM images
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
                    favourites
                JOIN 
                    properties ON favourites.property_id = properties.property_id
                JOIN 
                    users ON properties.user_id = users.user_id
                JOIN 
                    property_types ON properties.property_type_id = property_types.property_type_id
                LEFT JOIN 
                    RecentImages ON properties.property_id = RecentImages.property_id AND RecentImages.rn = 1
                WHERE 
                    favourites.user_id = %L
                GROUP BY 
                    properties.property_id, 
                    property_types.property_type, 
                    users.first_name, 
                    users.surname, 
                    RecentImages.image_url, 
                    RecentImages.alt_tag;
            `, user_id));
        })
        .then(({ rows }) => rows)
        .catch((err)=>{
            console.log(err)
        })
}

module.exports = {insertFavouritesFromApp,removeFavourite, fetchFavouritesByUser};