'use strict';
const bodyParser = require('body-parser');
const express = require('express');
const newrelic = require('newrelic');
const redis = require('redis');
const client = redis.createClient(); //creates a new client

/* Services */
const movieService = require('./services/movie-service');
const redisService = require('./services/redis-service');

const app = express();
app.set('port', process.env.PORT || 4000);
app.set('view engine', 'jade');
app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

redisService.checkRedisStatus();
movieService.fetchNewMoviesPeriodically();

app.get('/', function(req, res) {
  res.render('index');
});

app.get('/movies', function(req, res) {
  client.keys('movies:*', function(err, keys) {
    if (err) throw(err);
    console.log('keys are:');
    Promise.all(keys.map(function(k) {
      return redisService.getHash(k)
        .then(function(result) {
          return result;
        });
    })).then(function(results) {
      res.send(results);
    });
  });
});
