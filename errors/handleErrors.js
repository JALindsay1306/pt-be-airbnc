function handlePathNotFound (req,res){
    res.status(404).send({msg:"Path not found"});
};

function handleCustomError (err,req,res,next){
    if(err.status){
        res.status(err.status).send({msg:err.msg});
    };
};

function handleMissingDataError (err, req, res, next) {
    if(err.code === '42P01') {
        res.status(500).send({ msg: "Data Missing"})
    };
    next(err);
};

function handleOutOfConstraintError(err,req,res,next){
    if(err.code === '23514'){
        if(err.source === "postBooking"){
            res.status(400).send({msg:"Check_out_date cannot be before check_in_date"});
        } else {
        res.status(400).send({msg: "Input data outside of allowed constraints"})
    }};
    next(err);
}

function handleInvalidInputError(err,req,res,next){
    if (err.code === "22P02"|| err.code === "22007"){
        res.status(400).send({msg:"Invalid input, please check and try again"});
    };
    next(err);
}

function handleDuplicateError(err,req,res,next){
    if (err.code === "23505"){
        res.status(400).send({msg:"This combination of ids already exists, please delete the original before replacing."});
    };
    next(err);
}

function handleValidNonExistentIDError(err,req,res,next){
    if (err.code === "23503"){
        res.status(404).send({msg:err.detail});
    };
    next(err);
}

function handleBookingClash(err,req,res,next){
    if(err.code === "23P01"){
        res.status(400).send({msg:"These dates clash with an existing booking, please adjust"})
    };
    next(err);
};

function handleMissingInputDataError(err,req,res,next){
    if (err.code === "23502"){
        res.status(400).send({msg:"Missing input data, please ensure all fields are filled out"})
    };
    next(err);
}
module.exports = {handleMissingInputDataError,handleBookingClash,handleValidNonExistentIDError,handleDuplicateError,handleInvalidInputError, handleCustomError,handlePathNotFound, handleMissingDataError, handleOutOfConstraintError};