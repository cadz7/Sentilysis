const fs = require('fs');
const pythonServerRoute = 'http://localhost:5000/tweet_analyze';
const redisService = require('./redis-service');
const request = require('request');
const twitter = require('twitter');

const twitterClient = new twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_TOKEN_SECRET
});

const twitterService = {
  // result {object} : contains tweets and polarity of a movie.
  getTweets: function(movieName) {
    twitterClient.get('search/tweets', {q: movieName, count: 100, lang: 'en'}, function(err, tweets, response) {
      if (response.statuscode === 400) {
        console.log('400 from Twitter');
        fs.appendFile('logs/error-logs', JSON.stringify(err, undefined, 4), function(err) {
          if (err) throw err;
        });
      }
      redisService.getMergedHash(movieName, JSON.parse(response.body).statuses)
      .then(function(tweetHash) {
        console.log(movieName + ' length is ' + tweetHash.tweetList.length);
        request.post(pythonServerRoute,
         {form: {tweetList: JSON.stringify(tweetHash.tweetList)}},
          function(err, httpResponse, body) {
            if (err) throw err;
            const parsedMovieDetails = {
              name: movieName,
              polarity: JSON.parse(httpResponse.body)[0],
              subjectivity: JSON.parse(httpResponse.body)[1],
              score: (JSON.parse(httpResponse.body)[0] * 5) + 5,
              tweetList: JSON.stringify(tweetHash.tweetList),
              tweetListLength: tweetHash.tweetList.length,
            };
            const historicScore = {
              score: parsedMovieDetails.score,
              timestamp: new Date().getTime()
            };
            if (!tweetHash.historicScores) {
              parsedMovieDetails.historicScores = JSON.stringify([historicScore]);
              parsedMovieDetails.historicScoresLength = 1;
            } else {
              tweetHash.historicScores.push(historicScore);
              parsedMovieDetails.historicScores = JSON.stringify(tweetHash.historicScores);
              parsedMovieDetails.historicScoresLength = tweetHash.historicScores.length;
            }
            redisService.setHash(movieName, parsedMovieDetails);
          });
      });
    });
  }
};

module.exports = twitterService;
