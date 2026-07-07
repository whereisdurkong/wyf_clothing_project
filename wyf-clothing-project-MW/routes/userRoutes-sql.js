var express = require('express');
const router = express.Router();
var bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

var knex = require("knex")({
    client: 'mssql',
    connection: {
        user: process.env.USER,
        password: process.env.PASSWORD,
        server: process.env.SERVER,
        database: process.env.DATABASE,
        port: parseInt(process.env.APP_SERVER_PORT),
        options: {
            enableArithAbort: true,
            trustServerCertificate: true
        }
    }
});

// Register
router.post('/register', async function (req, res) {
    const currentTimestamp = new Date();
    const { name, email, password } = req.body;

    console.log('/register was triggered', name, email);
    try {
        const existing = await knex('users').where({ email: email }).first();
        if (existing) {
            return res.status(400).json({ msg: 'Email already in use' });
        }

        const hashed = await bcrypt.hash(password, 10);

        await knex('users').insert({
            name: name,
            email: email,
            password: hashed,
            created_at: currentTimestamp
        });

        console.log(`User registered: ${name}`);
        res.status(200).json({ message: 'User registered successfully' });
    } catch (err) {
        console.log('INTERNAL ERROR: ', err);
        res.status(500).json({ msg: 'Unable to register user' });
    }
});

// Login
router.post('/login', async function (req, res) {
    const { email, password } = req.body;

    console.log(`Login attempt for: ${email}`);
    try {
        const user = await knex('users').where({ email: email }).first();

        if (!user) {
            console.log('USER NOT FOUND');
            return res.status(404).json({ msg: 'User not found! Try again...' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            console.log('INCORRECT PASSWORD');
            return res.status(401).json({ msg: 'Incorrect password. Try again...' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log(`User ${user.email} logged in`);
        res.json({ message: 'Login successful', user });
    } catch (err) {
        console.log('ERROR LOGGING IN: ', err);
        res.status(500).json({ msg: 'Login failed' });
    }
});

// Get all users
router.get('/get-all-users', async (req, res) => {
    try {
        const users = await knex('users').select('id', 'name', 'email', 'created_at');
        console.log('Triggered /get-all-users');
        res.json(users);
    } catch (err) {
        console.log('INTERNAL ERROR: ', err);
        res.status(500).json({ msg: 'Unable to fetch users' });
    }
});

// Get user by id
router.get('/get-by-id', async (req, res) => {
    try {
        const user = await knex('users').where({ id: req.query.id }).first();
        console.log('Triggered /get-by-id');
        res.json(user);
    } catch (err) {
        console.log('INTERNAL ERROR: ', err);
        res.status(500).json({ msg: 'Unable to fetch user' });
    }
});

module.exports = router;