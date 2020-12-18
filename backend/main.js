// Libraries
const morgan = require('morgan');
const express = require('express');

const mysql = require('mysql2/promise');
const {MongoClient} = require('mongodb');
const cors = require('cors')
const dotenv = require('dotenv');
dotenv.config();

const crypto = require('crypto')
const shaHash = crypto.createHash('sha1')

// Instances
const app = express();

app.use(morgan('combined'));
app.use(cors());

// Environment
const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000

// Mongo Settings
const MONGO_URL = 'mongodb://localhost:27017';
const MONGO_DB = 'bgg';
const MONGO_COLLECTION = 'bgg-reviews';

const mongoClient = new MongoClient(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// SQL Connection Pool
const pool = mysql.createPool({
    host: process.env.MYSQL_SERVER,
    port: process.env.MYSQL_SERVER_PORT,
    user: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_SCHEMA,
    connectionLimit: process.env.MYSQL_CONN_LIMIT
});

// SQL Queries
const SQL_LOGIN_AUTH = "SELECT * FROM user WHERE user_id=?"

const makeQuery = (sqlQ, pool) => {
    return async (args) => {
        const conn = await pool.getConnection();
        try {
            let results = await conn.query(sqlQ, args || []);
            return results[0];
        } catch (e) {
            console.error("Error getting SQL Data: ", e);
        } finally {
            conn.release();
        }
    }
}

const tryLogin = makeQuery(SQL_LOGIN_AUTH, pool)

// Proxy
app.use(express.static('/frontend'));

// Request Handlers
app.get("/", (req, res) => {

    res.status(200);
    res.type('application/json');
    res.render("")
})

app.post('/login', express.urlencoded({extended: true}),
    async (req, res) => {

        let user = req.body.username;
        let password = await shaHash.update(req.body.password).digest('hex');

        console.log("BODY IS: ", req.body)
        console.log("USER IS: ", user, "PASSWORD IS: ", password)

        let authentication = await tryLogin(user, password)

        console.log("AUTHENTICATION ISSS: ", authentication)

        if (authentication.length == 0) {
            console.log("USER NOT FOUND")
            return res.status(401).json(authentication)
        } else if (authentication[0].password !== password) {
            console.log("PASSWORD IS WRONG")
            return res.status(401).json(authentication)
        } else {
            return res.status(200).json(authentication)
        }
    }
)

// Start Server
app.listen(PORT, () => {
    console.info(`Application started on port ${PORT} at ${new Date()}`)
})
