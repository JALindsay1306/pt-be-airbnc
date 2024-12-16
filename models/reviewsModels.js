const db = require("../db/connection.js");
const format = require("pg-format");


function fetchPropertyReviews (property_id) {
    let average_rating;
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
    .catch((err)=>{
        return Promise.reject(err);
    })
};

function insertPropertyReviewFromApp(review){
    return db.query('SELECT * FROM reviews')
    .then(({rows})=>{
        let doesReviewExist = false;
        rows.forEach((existingReview)=>{
            if(review.user_id==existingReview.user_id&&review.property_id==existingReview.property_id){
                doesReviewExist = true;
            }
        })
        if(doesReviewExist){
                return Promise.reject({status: 400, msg: 'You have already reviewed this property, delete the existing review before adding another'});
            }
    return db.query('SELECT * FROM users;')
    })
    .then(({rows})=>{
        const users=rows;
        let doesUserExist = false;
        users.forEach((user)=>{
            if(user.user_id===review.user_id)
                {doesUserExist = true};
            })
            if(!doesUserExist){
                return Promise.reject({status: 404, msg: 'user_id does not exist, review cannot be posted'});
            }
            return db.query('SELECT * FROM properties;')
    })
    .then(({rows})=>{
        const properties=rows;
        let doesPropertyExist = false;
        properties.forEach((property)=>{
            if(property.property_id==review.property_id){
                doesPropertyExist = true};
        })
        if(!doesPropertyExist){
            return Promise.reject({status: 404, msg: 'property_id does not exist, review cannot be posted'});
        }
        return db.query (
            format(
                `INSERT into reviews (user_id,property_id,rating,comment) VALUES (%L) RETURNING *`,
                [review.user_id,review.property_id,review.rating,review.comment])
            )
        })
        .then(({rows})=>{
            return rows;
        })
        .catch((err)=>{
            return Promise.reject(err);
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
    .catch((err)=>{
        return Promise.reject(err);
    })
};
module.exports = {fetchPropertyReviews, insertPropertyReviewFromApp, removePropertyReview};