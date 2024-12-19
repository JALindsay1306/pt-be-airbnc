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

module.exports = {insertFavouritesFromApp,removeFavourite};