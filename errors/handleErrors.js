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
        res.status(400).send({msg: "Input data outside of allowed constraints"})
    };
    next(err);
}

function handleInvalidInputError(err,req,res,next){
    if (err.code === "22P02"){
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
module.exports = {handleValidNonExistentIDError,handleDuplicateError,handleInvalidInputError, handleCustomError,handlePathNotFound, handleMissingDataError, handleOutOfConstraintError};