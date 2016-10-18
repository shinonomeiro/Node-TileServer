// Dependencies

const express 		= require('express');
const dotenv 		= require('dotenv');
const compression	= require('compression');
const path 			= require('path');
const bodyParser 	= require('body-parser');
const mongoose 		= require('mongoose');

// Express server

const app = express();

// Config & middlewares

dotenv.load({ path: '.env' });

app.set(process.env.PORT || 'port', 3000);
app.set('views', path.join(__dirname, 'views'));
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var noCache = function(req, res, next) {
	res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
	res.header('Expires', '-1');
	res.header('Pragma', 'no-cache');
	next();
}

// DB

// mongoose.connect(process.env.MONGODB_URI);
// mongoose.connection.on('error', function() {
// 	console.error('MongoDB connection error');
// 	process.exit(1);
// });

// Controllers

const tileController = require('./controllers/tile');

// Routes

app.get('/', function(req, res) { 
	console.log('Request from %s', req.ip);
	res.status(200).send('Hello world!');
});
app.get('/location/:zoom/:tx/:ty', noCache, tileController.getTile);

// Errors

app.use(function(err, req, res, next) {
	console.error(err);
  	res.status(500).send(err.toString());
});

// Start server

app.listen(app.get('port'), () => {
	console.log('Express server now listening on port %d in %s mode', app.get('port'), app.get('env'));
});

module.exports = app;