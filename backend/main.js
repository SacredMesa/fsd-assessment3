// Libraries
const morgan = require('morgan');
const express = require('express');

const mysql = require('mysql2/promise');
const {MongoClient} = require('mongodb');
const AWS = require('aws-sdk')
const cors = require('cors')
const dotenv = require('dotenv');
dotenv.config();
const sha1 = require('sha1');
const multer = require('multer');
const fs = require('fs');

// Instances
const app = express();

app.use(morgan('combined'));
app.use(cors());

// Environment
const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000

// Mongo Settings
const MONGO_URL = process.env.MONGO_URL;
const MONGO_DB = process.env.MONGO_DB;
const MONGO_COLLECTION = process.env.MONGO_COLLECTION;

const mongoClient = new MongoClient(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const makeData = (params, image) => {
    return {
        title: params.title,
        comments: params.comments,
        image: image
    }
}

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

// AWS
const s3 = new AWS.S3({
    endpoint: new AWS.Endpoint('sfo2.digitaloceanspaces.com'),
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
})

// File Handling
const upload = multer({
    dest: process.env.TMP_DIR || '/opt/tmp/uploads'
})

const readFile = (path) => new Promise(
    (resolve, reject) =>
        fs.readFile(path, (err, buff) => {
            if (null != err)
                reject(err)
            else
                resolve(buff)
        })
)

const putObject = (file, buff, s3) => new Promise(
    (resolve, reject) => {
        const params = {
            Bucket: 'fsdworkshop',
            Key: file.filename,
            Body: buff,
            ACL: 'public-read',
            ContentType: file.mimetype,
            ContentLength: file.size
        }
        s3.putObject(params, (err, result) => {
            if (null != err)
                reject(err)
            else
                resolve(result)
        })
    }
)

// Proxy
app.use(express.static(__dirname + '/frontend'));

// Request Handlers

let authUser, authPass = ''

app.post('/login', express.json(),
    async (req, res) => {

        let user = req.body.username;
        let password = sha1(req.body.password)

        let authentication = await tryLogin(user, password)

        if (authentication.length == 0) {
            console.log("USER NOT FOUND")
            return res.status(401).json(authentication)
        } else if (authentication[0].password !== password) {
            console.log("PASSWORD IS WRONG")
            return res.status(401).json(authentication)
        } else {
            authUser = authentication[0].user;
            authPass = authentication[0].password;
            return res.status(200).json(authentication)
        }
    }
)

app.post('/share', upload.single('picture'), async (req, res, next) => {
    console.info('>>> body: ', req.body)
    console.info('>>> file: ', req.file)

    res.on('finish', () => {
        fs.unlink(req.file.path, () => {})
    })

    const doc = makeData(req.body, req.file.filename)

    console.log("THIS THE FINAL DATA TO ENTER", doc)

    readFile(req.file.path)
        .then(buff =>
            putObject(req.file, buff, s3)
        )
        .then(() =>
            mongoClient.db(MONGO_DB).collection(MONGO_COLLECTION)
                .insertOne(doc)
        )
        .then(results => {
            console.info('insert results: ', results)
            res.status(200)
            res.json({ id: results.ops[0]._id })
        })
        .catch(error => {
            console.error('insert error: ', error)
            res.status(500)
            res.json({ error })
        })

    return res.status(200);
})

// Start Server
const p0 = (async () => {
    console.info('Pinging SQL database...')
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release()
    return true;
})()

const p1 = (async () => {
    console.info('Pinging Mongo database...')
    await mongoClient.connect()
})()

Promise.all([p0, p1])
    .then(() => {
        app.listen(PORT, () => {
            console.info(`Application started on port ${PORT} at ${new Date()}`)
        })
    })
    .catch(e => console.error('Cannot connect to database', e))
