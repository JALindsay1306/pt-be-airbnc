const express = require("express");
const { getProperties, getSingleProperty} = require("./controllers/propertiesControllers");
const { deleteFavourite, postFavourite } = require("./controllers/favouritesControllers");
const {handlePathNotFound,handleCustomError, handleMissingDataError, handleOutOfConstraintError} = require("./errors/handleErrors");
const { getPropertyReviews, postPropertyReview, deletePropertyReview } = require("./controllers/reviewsControllers");
const { getUsers, patchUser } = require("./controllers/usersControllers");
const app = express();
app.use(express.json()); 

app.get("/api/properties",getProperties);
app.get("/api/properties/:id",getSingleProperty);
app.delete("/api/favourites/:id",deleteFavourite);
app.get("/api/properties/:id/reviews",getPropertyReviews);
app.post("/api/properties/:id/reviews",postPropertyReview);
app.delete("/api/reviews/:id",deletePropertyReview);
app.get("/api/users/:id", getUsers);
app.patch("/api/users/:id", patchUser);
app.post("/api/properties/:id/favourite",postFavourite);
app.all("/*",handlePathNotFound)

app.use(handleMissingDataError);
app.use(handleOutOfConstraintError);
app.use(handleCustomError);


module.exports = app;