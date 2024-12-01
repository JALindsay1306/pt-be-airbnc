const { fetchProperties } = require("./models");

function getProperties (req,res) {
    return fetchProperties()
    .then((properties)=>{
        res.send({properties});
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send({ error: "Internal Server Error" });
      });
}

module.exports = {getProperties};