exports.createusersQuery = `
CREATE TABLE users (
user_id SERIAL PRIMARY KEY,
first_name VARCHAR NOT NULL,
surname VARCHAR NOT NULL,
email VARCHAR NOT NULL,
phone_number VARCHAR NOT NULL,
role VARCHAR(5) NOT NULL,
avatar VARCHAR,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
    property_type_id INT REFERENCES property_types(property_type_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
    location VARCHAR NOT NULL,
    price_per_night INT NOT NULL,
    description VARCHAR,
    user_id INT REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE
);`;

exports.createFavouritesQuery = `
CREATE TABLE favourites (
    favourite_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
    property_id INT REFERENCES properties(property_id)
    ON DELETE CASCADE ON UPDATE CASCADE);`;

exports.installGist = `
CREATE EXTENSION IF NOT EXISTS btree_gist;`

exports.createBookingsQuery = `
CREATE TABLE bookings (
    booking_id SERIAL PRIMARY KEY,
    property_id INT REFERENCES properties(property_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
    user_id INT REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_dates CHECK (check_out_date > check_in_date),
    EXCLUDE USING gist (
    property_id WITH =,
    daterange(check_in_date, check_out_date, '[)') WITH &&
    )
    );`;

exports.createReviewsQuery = `
CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
    property_id INT REFERENCES properties(property_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
    rating INT NOT NULL,
    comment VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT rating CHECK (rating >= 1 AND rating <= 5),
    CONSTRAINT unique_user_property_review UNIQUE (user_id, property_id));`;

exports.createImagesQuery = `
CREATE TABLE images (
    image_id SERIAL PRIMARY KEY,
    property_id INT REFERENCES properties(property_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
    image_url VARCHAR NOT NULL,
    alt_tag VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`;