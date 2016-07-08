'use strict';
const _ = require('lodash');
const fs = require('fs');
const redis = require('redis');
const client = redis.createClient(); //creates a new client
const Promise = require('bluebird');

const redisService = {
  checkRedisStatus: function() {
    client.keys('*', function (err, keys) {
      if (err) throw(err);
      _.forEach(keys, function(v, k) {
        fs.appendFile('logs/redis-logs', JSON.stringify(v, undefined, 4), function(err) {
          if (err) throw err;
        });
      });
    });
  },
  getHash: function(movieName) {
    return new Promise(function(resolve, reject) {
      client.hgetall(movieName, function(err, obj) {
        if (err) throw err;
        const movieObject = _.omit(obj, 'tweetList');
        resolve(movieObject);
      });
    });
  },
  // Extends the tweetList array with already existing tweets for the given movie.
  getMergedHash: function(movieName, tweetList) {
    return new Promise(function(resolve, reject) {
      client.hgetall('movies:' + movieName, function(err, obj) {
        let mergedTweetList = [];
        if (err) throw err;
        if (!obj) mergedTweetList = tweetList;
        else {
          const redisTweetList = JSON.parse(obj.tweetList);
          const dictTweetIDToTweetObject = {};
          _.forEach(redisTweetList, function(tweet) {
            dictTweetIDToTweetObject[tweet.id] = tweet;
          });
          const tweetsNotInRedis = _.filter(tweetList, function(tweet) {
            return !(tweet.id in dictTweetIDToTweetObject);
          });
          mergedTweetList = redisTweetList.concat(tweetsNotInRedis);
        }
        resolve({
          tweetList: mergedTweetList,
          historicScores: obj.historicScores ? JSON.parse(obj.historicScores) : null
        });
      });
    });
  },
  // result {object} : contains tweets and polarity of a movie.
  setHash: function(movieName, hash) {
    client.hmset('movies:' + movieName, hash);
  }
};

module.exports = redisService;
