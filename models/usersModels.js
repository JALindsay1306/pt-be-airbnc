const db = require("../db/connection.js");
const format = require("pg-format");

function fetchUsers (user_id) {
    return db.query(format(`
        SELECT * FROM
        users
        WHERE
        user_id = %L`,user_id))
    .then(({rows})=>{
        if(rows.length===0){
            return Promise.reject({status:404, msg: "user_id does not exist"});
        }
        return rows;
    })
    .catch((err)=>{
        return Promise.reject((err));
    })
};

function editUser (user_id, changes){
    if(Object.keys(changes).length===0){
        return Promise.reject({status:400,msg:"no data to update"});
    };
    return db.query(format(`
        SELECT * FROM users WHERE user_id = %L;`,user_id))
    .then(({rows})=>{
    if(rows.length===0){
        return Promise.reject({status:404,msg:"user_id does not exist"});
    }
    const acceptedProperties = ["first_name", "surname", "email", "phone_number", "role", "avatar"];
    const lockedProperties = ["user_id","created_at"];
    let error;
    const errorCheck = Object.keys(changes).some((property) =>{
        if(!acceptedProperties.includes(property)&&!lockedProperties.includes(property)){
            error = {status:400,msg:`this property does not exist`};
            return true;
        };
        if(lockedProperties.includes(property)){
            error = {status:400,msg:`${property} cannot be altered`};
            return true;
        };
        if(!changes[property]){
            error = {status:400,msg:`${property} cannot be empty, please ensure data is entered`};
            return true;
        }
        switch(property){
            case "first_name":
                if(typeof changes.first_name !== "string"){
                    error = {status:400,msg:`invalid data, first_name must be a string`};
                    return true;
                };
            break;
            case "surname":
                if(typeof changes.surname !== "string"){
                    error = {status:400,msg:`invalid data, surname must be a string`};
                    return true;
                };
            break;
            case "email":
                if(typeof changes.email !== "string"){
                    error = {status:400,msg:`invalid data, email must be a string`};
                    return true;
                };
            break;
            case "phone_number":
                if(typeof changes.phone_number !== "string"){
                    error = {status:400,msg:`invalid data, phone_number must be a string`};
                    return true;
                };
            break;
            case "avatar":
                if(typeof changes.avatar !== "string"){
                    error = {status:400,msg:`invalid data, avatar must be a string`};
                    return true;
                };
            break;
            default:
            break;
        }
    })
    if(errorCheck){
        return Promise.reject(error);
    }
    let queryText = `
        UPDATE
        users
        SET `
    
    for (const key in changes){
        queryText+= format(`%I = %L, `,key,changes[key]);
    }
    
    queryText = queryText.substr(0, queryText.length - 2);

    queryText+= format(
        ` WHERE user_id = %L
        RETURNING *;`, user_id);

    return db.query(queryText)
    })
    .then(({rows})=>{
        return rows;
    })
    .catch((err)=>{
        return Promise.reject(err);
    })

}

module.exports = {fetchUsers, editUser};