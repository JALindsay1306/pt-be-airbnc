const express = require("express");
const { deleteFavourite, postFavourite } = require("../controllers/favouritesControllers");

const favouritesRouter = express.Router({mergeParams: true});

favouritesRouter.route("/").post(postFavourite);
favouritesRouter.route("/:id").delete(deleteFavourite);

module.exports = favouritesRouter;