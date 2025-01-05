const db = require("../db/connection.js");
const format = require("pg-format");

function insertBooking (booking){
    return db.query(format(`
        INSERT INTO bookings (user_id,property_id,check_in_date,check_out_date) VALUES (%L) RETURNING booking_id;`,
        [booking.user_id,booking.property_id,booking.check_in_date,booking.check_out_date]))
}

function fetchBookings (property_id){
    return db.query(format(`SELECT * FROM properties WHERE property_id = %L`,property_id))
    .then(({rows})=>{
        if (rows.length ===0){
            return Promise.reject({code:"23503",detail:`Key (property_id)=(${property_id}) is not present in table \"properties\".`})
        }
    return db.query(format(`
        SELECT 
        booking_id,
        TO_CHAR(check_in_date, 'YYYY-MM-DD') AS check_in_date,
        TO_CHAR(check_out_date, 'YYYY-MM-DD') AS check_out_date,
        created_at
        FROM
        bookings
        WHERE
        property_id = %L;`,property_id))
    });
};

function removeBooking (booking_id){
    return db.query(format(`DELETE FROM bookings WHERE booking_id = %L`,booking_id))
    .then((response)=>{
        if (response.rowCount===0){
            return Promise.reject({code:"23503",detail:`Key (booking_id)=(${booking_id}) is not present in table \"bookings\".`});
        }else return;    
    })
};

function editBooking (booking_id,booking_changes){
    if (Object.keys(booking_changes).length === 0){
        return Promise.reject({code:"23502"});
    }
    return db.query(format(`
        SELECT 
        TO_CHAR(check_in_date, 'YYYY-MM-DD') AS check_in_date,
        TO_CHAR(check_out_date, 'YYYY-MM-DD') AS check_out_date
        FROM
        bookings
        WHERE
        booking_id = %L;`,booking_id))
    .then(({rows})=>{
        if(rows.length===0){
            return Promise.reject({code:"23503",detail:"Booking not found"})
        }
        if(rows[0].check_in_date === booking_changes.check_in_date||rows[0].check_out_date === booking_changes.check_out_date){
            return Promise.reject({status:400,msg:"Values entered should be different from the existing ones"})
        }
        let queryText = format(`
            UPDATE
            bookings
            SET 
            `)
        
        for (const key in booking_changes){
            if(key=="check_in_date"||key=="check_out_date"){
                if(!booking_changes[key]){
                    return Promise.reject({code:"23502"})
                }
                queryText+= format(`%I = %L, `,key,booking_changes[key]);
            } else{
                const properties = ["booking_id","user_id","property_id","created_at"];
                let errorMessage = "";
                if(properties.includes(key)){
                    errorMessage = `${key} cannot be altered, only check in and check out dates can be changed`;
                } else {
                    errorMessage = "The requested property to update does not exist"
                }
                return Promise.reject({status:400,msg:errorMessage});
            }}
        
        queryText = queryText.substr(0, queryText.length - 2);
    
        queryText+= format(
            ` WHERE booking_id = %L
            RETURNING 
            booking_id,
            user_id,
            property_id,
            TO_CHAR(check_in_date, 'YYYY-MM-DD') AS check_in_date,
            TO_CHAR(check_out_date, 'YYYY-MM-DD') AS check_out_date,
            created_at;`, booking_id);
        return db.query(queryText);
    })
}

function fetchBookingsByUser (user_id){
    return db.query(format(`SELECT * FROM users WHERE user_id = %L`,user_id))
    .then(({rows})=>{
        if (rows.length ===0){
            return Promise.reject({code:"23503",detail:`Key (user_id)=(${user_id}) is not present in table \"users\".`})
        }
    return db.query(format(`
        WITH RecentImages AS (
        SELECT 
            property_id, 
            image_url, 
            alt_tag,
        ROW_NUMBER() OVER (PARTITION BY property_id ORDER BY created_at DESC) AS rn
        FROM 
            images)

        SELECT 
            booking_id,
            TO_CHAR(check_in_date, 'YYYY-MM-DD') AS check_in_date,
            TO_CHAR(check_out_date, 'YYYY-MM-DD') AS check_out_date,
            bookings.property_id,
            properties.name AS property_name,
            CONCAT(users.first_name, ' ', users.surname) AS host,
            COALESCE(RecentImages.image_url, 'default_image_url_here') AS image,
            COALESCE(RecentImages.alt_tag, 'No image available') AS alt_tag,
            bookings.created_at
        FROM 
            bookings
        JOIN
            users
        ON
            bookings.user_id = users.user_id
        JOIN
            properties
        ON
            bookings.property_id = properties.property_id
        LEFT JOIN
            RecentImages
        ON
            bookings.property_id = RecentImages.property_id AND RecentImages.rn = 1
        WHERE
            users.user_id = %L;`,user_id))
    });
}

module.exports = {fetchBookingsByUser,editBooking,removeBooking,insertBooking,fetchBookings};