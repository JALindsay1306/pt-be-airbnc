const {fetchBookings,insertBooking, removeBooking, editBooking, fetchBookingsByUser} = require("../models/bookingsModels");

function postBooking (req,res,next){
    const booking = {user_id:req.body.guest_id,property_id:req.params.id,check_in_date:req.body.check_in_date,check_out_date:req.body.check_out_date};
    return insertBooking(booking)
    .then(({rows})=>{
        return res.status(201).send({msg:"Booking successful",booking_id:rows[0].booking_id});    
    })
    .catch((err)=>{
        err.source = "postBooking";
        next(err);
    })
};

function getBookings (req,res,next){
    const property_id = Number(req.params.id);
    return fetchBookings(property_id)
    .then(({rows})=>{
        return res.status(200).send({bookings:[...rows],property_id:property_id});
    })
    .catch((err)=>{
        next(err);
    });
};

function deleteBooking (req,res,next){
    const booking_id = req.params.id;
    return removeBooking(booking_id)
    .then(()=>{
        return res.status(204).end();
    })
    .catch((err)=>{
        next(err);
    })
}

function patchBooking (req,res,next){
    const booking_changes = {...req.body};
    const booking_id = req.params.id;
    return editBooking(booking_id,booking_changes)
    .then(({rows})=>{
        return res.status(200).send(rows[0]);
    })
    .catch((err)=>{
        err.source = "postBooking";
        next(err);
    }) 
    
}

function getBookingsByUser (req,res,next) {
    const user_id = req.params.id
    return fetchBookingsByUser(user_id)
    .then(({rows})=>{
        return res.status(200).send({bookings:rows});    
    })
    .catch((err)=>{
        next(err);
    })
    
}
module.exports = {getBookingsByUser, patchBooking,deleteBooking,getBookings,postBooking};