const express = require ("express");
const { getUsers, patchUser } = require("../controllers/usersControllers");
const { getBookingsByUser } = require("../controllers/bookingsControllers");

const usersRouter = express.Router({mergeParams: true});

usersRouter.route("/:id").get(getUsers).patch(patchUser)
usersRouter.route("/:id/bookings").get(getBookingsByUser);

module.exports = usersRouter;