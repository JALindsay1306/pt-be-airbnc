const express = require ("express");
const bookingsRouter = require("./booking.router");
const favouritesRouter = require("./favourites.router");
const propertiesRouter = require("./properties.router");
const reviewsRouter = require("./reviews.router");
const usersRouter = require("./users.router");

const apiRouter = express.Router({mergeParams: true});

apiRouter.use("/bookings",bookingsRouter);
apiRouter.use("/favourites",favouritesRouter);
apiRouter.use("/properties",propertiesRouter);
apiRouter.use("/reviews",reviewsRouter);
apiRouter.use("/users",usersRouter);

module.exports = apiRouter;