const { end } = require("../db/connection");
const { fetchPropertyReviews, insertPropertyReviewFromApp, removePropertyReview } = require("../models/reviewsModels");

function getPropertyReviews(req,res,next){
    const property_id = req.params.id;
    return fetchPropertyReviews(property_id)
    .then((reviews)=>{
        res.status(200).send({reviews:reviews[0],average_rating:reviews[1]});
    })
    .catch((err) => {
        next(err);
      });
}

function postPropertyReview(req,res,next){
    const user_id = req.body.guest_id;
    const rating = req.body.rating;    
    const comment = req.body.comment;
    const property_id = Number(req.params.id);

    return insertPropertyReviewFromApp({user_id,property_id,rating,comment})
    .then((review)=>{
        review[0].guest_id = review[0].user_id;
        delete review[0].user_id;
        res.status(201).send(review[0]);
    })
    .catch((err) => {
        next(err);
      });
}

function deletePropertyReview(req,res,next){
    const review_id = req.params.id;
    return removePropertyReview(review_id)
    .then(()=>{
        res.status(204).end();
    })
    .catch((err)=>{
        next(err);
    })
}
module.exports = {getPropertyReviews, postPropertyReview, deletePropertyReview};