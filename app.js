const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const healthRoute = require('./routes/healthRoute');
app.use('/', healthRoute);

app.listen(port, (err) => {
    if (err) {
        return console.log('Something bad happened', err);
    }
    console.log(`Server is listening on ${port}`);
});

app.get('/', (req, res) => {
    console.log(req.query); 
    res.send('Hello World!');
})

// module.exports = app;