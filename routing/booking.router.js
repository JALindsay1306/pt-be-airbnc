const express = require("express");
const { postBooking, getBookings, deleteBooking, patchBooking } = require("../controllers/bookingsControllers");

const bookingsRouter = express.Router({mergeParams: true});

bookingsRouter.route("/").post(postBooking).get(getBookings);

bookingsRouter.route("/:id").patch(patchBooking).delete(deleteBooking);

module.exports = bookingsRouter;