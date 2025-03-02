const db = require("../db/connection.js");
const format = require("pg-format");


function fetchPropertyReviews (property_id) {
    let average_rating;
    if(isNaN(parseInt(property_id))){return Promise.reject({code: "22P02"})}
    return db.query('SELECT * FROM properties;')
    .then(({rows})=>{
        const properties=rows;
        let doesPropertyExist = false;
        properties.forEach((property)=>{
            if(property.property_id==property_id){
                doesPropertyExist = true};
            })
            if(!doesPropertyExist){
                return Promise.reject({status: 404, msg: 'No such property exists'});
            }  
    
    return db.query(format(`SELECT AVG(rating) AS average_rating
    FROM reviews
    WHERE property_id = %L;`,property_id))
    })
    .then(({rows})=>{
        average_rating = rows[0].average_rating;
    return db.query(format(`
        SELECT 
                reviews.review_id,
                reviews.comment,
                reviews.rating,
                reviews.created_at,
                CONCAT(users.first_name, ' ', users.surname) AS guest,
                users.avatar AS guest_avatar
            FROM 
                reviews
            INNER JOIN 
                users 
            ON 
                reviews.user_id = users.user_id
            WHERE 
                reviews.property_id = %L
            ORDER BY
                reviews.created_at DESC;`,property_id))
    })
    .then(({rows})=>{
        return [rows,Number(average_rating)];
    })
};

function insertPropertyReviewFromApp(review){
        return db.query(
            format(
                `SELECT * FROM reviews WHERE user_id = %L AND property_id = %L;`,
                review.user_id, review.property_id
            )
        )
        .then(({ rows }) => {
            if (rows.length > 0) {
                return db.query(
                    format(
                        `UPDATE reviews 
                         SET rating = %L, comment = %L, created_at = NOW()
                         WHERE user_id = %L AND property_id = %L 
                         RETURNING *;`,
                        review.rating, review.comment, review.user_id, review.property_id
                    )
                );
            } else {
                return db.query(
                    format(
                        `INSERT INTO reviews (user_id, property_id, rating, comment) 
                         VALUES (%L, %L, %L, %L) RETURNING *;`, 
                        review.user_id, review.property_id, review.rating, review.comment
                    )
                );
            }
        })
        .then(({rows})=>{
            return rows;
        })
};

function removePropertyReview(review_id){
    return db.query(format(`
        SELECT *
        FROM
        reviews
        WHERE
        review_id = %L;`,review_id))
    .then(({rows})=>{
            if(rows.length===0){
                return Promise.reject({status:404,msg:"review_id does not exist, cannot delete review"})
            }        
        return db.query(format(`
            DELETE FROM 
                reviews
            WHERE
                review_id = %L;`,review_id))
    })
};
module.exports = {fetchPropertyReviews, insertPropertyReviewFromApp, removePropertyReview};