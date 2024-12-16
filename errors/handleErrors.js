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

module.exports = {handleCustomError,handlePathNotFound, handleMissingDataError, handleOutOfConstraintError};