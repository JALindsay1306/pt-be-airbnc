const express = require ("express");
const { getProperties, getSingleProperty } = require("../controllers/propertiesControllers");

const bookingsRouter = require("./booking.router");
const favouritesRouter = require("./favourites.router");
const reviewsRouter = require("./reviews.router");

const propertiesRouter = express.Router({mergeParams: true});

propertiesRouter.route("/").get(getProperties);
propertiesRouter.route("/:id").get(getSingleProperty);
propertiesRouter.use("/:id/reviews",reviewsRouter);
propertiesRouter.use("/:id/favourite",favouritesRouter);
propertiesRouter.use("/:id/booking",bookingsRouter)
propertiesRouter.use("/:id/bookings",bookingsRouter)

module.exports = propertiesRouter;

