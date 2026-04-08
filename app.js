require('dotenv').config();
const express = require('express');
const app = express();

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.MONGODB_URI;
const PORT = process.env.PORT;
const mongoose = require('mongoose');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const healthRoute = require('./routes/healthRoute');
const userRoutes = require('./routes/userRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

app.use('/', healthRoute);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/transactions', transactionRoutes);

mongoose.connect(uri)
    .then(() => {
        console.log("Connected to MongoDB")
    }).then(() => {
        app.listen(PORT, () => {
            console.log("Express server up and running on port: ", PORT);
        })
    }).catch((err) => {
        console.log(err);
        process.exit(1)
    })

app.get('/', (req, res) => {
    console.log(req.query); 
    res.send('Hello World!');
})