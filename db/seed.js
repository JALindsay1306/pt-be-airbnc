const { createusersQuery, createPropertiesQuery, createPropertyTypesQuery, createFavouritesQuery, createBookingsQuery, createReviewsQuery } = require("./queries");
const manageTables = require("./manage-tables");
const { createUserRef, createRef, formatData } = require("./utils");

const {
  insertUsers,
  insertPropertyTypes,
  insertProperties,
  insertFavourites,
  insertBookings,
  insertReviews,
  insertImages,
} = require("./data-inserts.js");

const seed = async ({ usersData, propertyTypesData, propertiesData, favouritesData, bookingsData, reviewsData, imagesData }) => {
  await manageTables();

  const { rows: insertedUsers } = await insertUsers(usersData);
  const { rows: insertedPropertyTypes } = await insertPropertyTypes(propertyTypesData);
  const usersRef = createUserRef(insertedUsers);
  const propertyTypesRef = createRef("property_type", "property_type_id",insertedPropertyTypes);
  
  const formattedProperties = formatData([usersRef,propertyTypesRef], ["host_name","property_type"], ["user_id","property_type_id"], propertiesData);
  const { rows: insertedProperties } = await insertProperties(formattedProperties);
  const propertiesRef = createRef("name", "property_id", insertedProperties);

  const formattedFavourites = formatData([usersRef,propertiesRef],["guest_name","property_name"],["user_id","property_id"],favouritesData)
  await insertFavourites (formattedFavourites);

  const formattedBookings = formatData([usersRef,propertiesRef],["guest_name","property_name"],["user_id","property_id"],bookingsData)
  await insertBookings (formattedBookings);

  const formattedReviews = formatData([usersRef,propertiesRef],["guest_name","property_name"],["user_id","property_id"],reviewsData)
  await insertReviews (formattedReviews);

  const formattedImages = formatData([propertiesRef],["property_name"],["property_id"],imagesData)
  await insertImages (formattedImages);

};

module.exports = seed;
