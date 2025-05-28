require('dotenv').config({ path: `../.env.test` }); // Adjust path if .env.test is elsewhere
const { Pool } = require('pg');

async function testConnection() {
    // Use the same config logic as your connection.js for test environment
    const config = {
        host: process.env.PGHOST,
        port: process.env.PGPORT,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
    };

    console.log('Attempting to connect to PostgreSQL with config:', config);

    const pool = new Pool(config);

    try {
        const client = await pool.connect();
        console.log('Successfully connected to PostgreSQL!');
        const res = await client.query('SELECT current_user;');
        console.log('Current user:', res.rows[0].current_user);
        client.release();
        console.log('Connection released.');
    } catch (err) {
        console.error('Failed to connect or query PostgreSQL:', err);
        if (err.code === '28P01') {
            console.error('Authentication failed. Check PGUSER and PGPASSWORD in .env.test.');
        } else if (err.code === 'ECONNREFUSED') {
            console.error('Connection refused. PostgreSQL server might not be running or accessible.');
        }
    } finally {
        await pool.end(); // Close the pool after testing
        console.log('Pool ended.');
    }
}

testConnection();