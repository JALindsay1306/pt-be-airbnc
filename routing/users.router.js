const express = require ("express");
const { getUsers, patchUser } = require("../controllers/usersControllers");
const { getBookingsByUser } = require("../controllers/bookingsControllers");
const { getFavouritesByUser } = require("../controllers/favouritesControllers");

const usersRouter = express.Router({mergeParams: true});

usersRouter.route("/:id").get(getUsers).patch(patchUser)
usersRouter.route("/:id/bookings").get(getBookingsByUser);
usersRouter.route("/:id/favourites").get(getFavouritesByUser);

module.exports = usersRouter;