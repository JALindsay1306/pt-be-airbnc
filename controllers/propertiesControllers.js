const { fetchProperties, fetchOneProperty } = require("../models/propertiesModels");

function getProperties (req,res,next) {
    const queries = {
        maxPrice: req.query.maxPrice || req.query.maxprice || undefined,
        minPrice: req.query.minPrice || req.query.minprice || undefined,
        sortBy: req.query.sortBy || req.query.sortby || undefined,
        sortOrder: req.query.sortOrder || req.query.sortorder || undefined,
        host_id: req.query.host_id || req.query.host_id || undefined,
        property_type: req.query.property_type || req.query.property_type || undefined,
        };
   
    return fetchProperties(queries.maxPrice,queries.minPrice,queries.sortBy,queries.sortOrder,queries.host_id,queries.property_type)
    .then((properties)=>{
        res.status(200).send({properties});
    })
    .catch((err) => {
        next(err);
      });
}

function getSingleProperty (req,res,next) {
    const property_id = req.params.id;
    return fetchOneProperty(property_id)
    .then((properties)=>{
        res.status(200).send(properties);
    })
    .catch((err)=>{
        next(err);
    })
};
module.exports = {getProperties, getSingleProperty};