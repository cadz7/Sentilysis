const async = require('async');
/**
  movie name
  tweets
  sentiment score - mean
  sentiment score - std dev
*/
const movieDB = require('moviedb')('e93e4d950ca2bba46bef29cb449feeb3');
const twitterService = require('./twitter-service');

const movieService = {
  fetchNewMoviesPeriodically: function() {
    console.log('fetchNewMoviesPeriodically called');
    const self = this;
    self.fetchMovieScores();
    setInterval(function() {
      console.log('self.fetchMovieScores called');
      self.fetchMovieScores();
    }, 120000);
  },
  fetchMovieScores: function() {
    console.log('fetchMovieScores called');
    movieDB.miscNowPlayingMovies({}, function(err, response) {
      // List of movies along with sentiment.
      response.results = response.results.slice(0, 4);
      async.map(response.results, function(movie, callback) {
        twitterService.getTweets(movie.title);
      }, function(err, result) {
        if (err) throw err;
      });
    });
  }
};

module.exports = movieService;
