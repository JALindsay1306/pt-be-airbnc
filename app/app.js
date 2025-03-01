const express = require("express");
const { handleMissingInputDataError, handleBookingClash, handleValidNonExistentIDError,handleDuplicateError,handleInvalidInputError, handlePathNotFound,handleCustomError, handleMissingDataError, handleOutOfConstraintError} = require("../errors/handleErrors");
const apiRouter = require("../routing/api.router");
const cors = require('cors');
const app = express();
app.use(express.json()); 

app.use(cors());

app.use("/api",apiRouter);


app.use(handleMissingDataError);
app.use(handleOutOfConstraintError);
app.use(handleInvalidInputError);
app.use(handleDuplicateError);
app.use(handleValidNonExistentIDError);
app.use(handleBookingClash);
app.use(handleMissingInputDataError);
app.use(handleCustomError);

app.all("/*",handlePathNotFound)


module.exports = app;