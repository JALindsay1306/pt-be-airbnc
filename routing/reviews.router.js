const express = require ("express");
const { deletePropertyReview, getPropertyReviews, postPropertyReview } = require("../controllers/reviewsControllers");

const reviewsRouter = express.Router({mergeParams: true});

reviewsRouter.route("/").get(getPropertyReviews).post(postPropertyReview);
reviewsRouter.route("/:id").delete(deletePropertyReview);

module.exports = reviewsRouter;