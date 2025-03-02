const  {insertFavouritesFromApp,removeFavourite, fetchFavouritesByUser}  = require("../models/favouritesModels");

function postFavourite(req,res,next) {
    const user_id = req.body.guest_id;
    const property_id = req.params.id;
    return insertFavouritesFromApp([{user_id,property_id}])
    .then(({rows})=>{
        const newFavourite = rows[0];
        res.status(201).json({msg: "Property favourited successfully.",
            favourite_id: newFavourite.favourite_id,})
    })
    .catch((err)=>{
        next(err);
    })
}

function deleteFavourite(req,res,next){
    const favourite_id = req.params.id;
    return removeFavourite(favourite_id)
    .then(()=>{
        return res.status(204).end();
    })
    .catch((err)=>{
        next(err);
    })
}

function getFavouritesByUser (req,res,next) {
    const user_id = req.params.id
    return fetchFavouritesByUser(user_id)
    .then(({rows})=>{
        console.log('Favourites data:', rows)
        return res.status(200).send({favourites:rows});    
    })
    .catch((err)=>{
        next(err);
    })
    
}
module.exports = {postFavourite,deleteFavourite,getFavouritesByUser};