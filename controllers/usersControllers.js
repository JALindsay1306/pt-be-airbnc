const { fetchUsers, editUser } = require("../models/usersModels");

function getUsers (req,res,next) {
    const user_id = req.params.id;
    return fetchUsers(user_id)
    .then((users)=>{
        return res.status(200).send({"user":users[0]});
    })
    .catch((err)=>{
        next(err);
    })
};

function patchUser(req,res,next){
    const changes = {...req.body};
    const user_id = req.params.id;
    return editUser(user_id, changes)
    .then((response)=>{
        res.status(201).send({user:response[0]});
    })
    .catch((err)=>{
        next(err)
    })
}

module.exports = {getUsers, patchUser};