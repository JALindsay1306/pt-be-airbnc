exports.createusersQuery = `
CREATE TABLE users (
user_id SERIAL PRIMARY KEY,
first_name VARCHAR NOT NULL,
surname VARCHAR NOT NULL,
email VARCHAR NOT NULL,
phone_number VARCHAR NOT NULL,
role VARCHAR(5) NOT NULL,
avatar VARCHAR,
CHECK (role IN ('host','guest'))
);`;

exports.createPropertyTypesQuery = `
CREATE TABLE property_types (
    property_type_id SERIAL PRIMARY KEY,
    property_type VARCHAR NOT NULL,
    description VARCHAR
);`;

exports.createPropertiesQuery = `
CREATE TABLE properties (
    property_id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    property_type_id INT REFERENCES property_types(property_type_id),
    location VARCHAR NOT NULL,
    price_per_night INT NOT NULL,
    description VARCHAR,
    user_id INT REFERENCES users(user_id)
);`;

exports.createFavouritesQuery = `
CREATE TABLE favourites (
    favourite_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    property_id INT REFERENCES properties(property_id));`;

exports.createBookingsQuery = `
CREATE TABLE bookings (
    booking_id SERIAL PRIMARY KEY,
    property_id INT REFERENCES properties(property_id),
    user_id INT REFERENCES users(user_id),
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    CONSTRAINT check_dates CHECK (check_out_date > check_in_date)
    );`;

exports.createReviewsQuery = `
CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    property_id INT REFERENCES properties(property_id),
    rating INT NOT NULL,
    comment VARCHAR NOT NULL,
    CONSTRAINT rating CHECK (rating >= 1 AND rating <= 5));`;