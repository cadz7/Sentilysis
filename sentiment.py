from flask import Flask
from flask import jsonify
from flask import request
import numpy
import os
import pprint
from textblob import TextBlob
import time
import urllib2
import xmltodict, json

app = Flask(__name__)

@app.errorhandler(500)
def internal_error(exception):
  app.logger.exception(exception)
  return exception

@app.route('/tweet_analyze', methods=['POST'])
def hello_world():
  tweet_list = json.loads(request.form['tweetList'])  
  tweet_polarity_scores = map(lambda tweet: TextBlob(tweet['text']).sentiment.polarity, tweet_list)
  numpy_tweet_polarities = numpy.array(tweet_polarity_scores)
  tweet_list_mean = numpy.mean(numpy_tweet_polarities, axis=0)
  tweet_list_std = numpy.std(numpy_tweet_polarities, ddof=1)  
  return str([tweet_list_mean, tweet_list_std])

if __name__ == '__main__':
  app.run(debug=True)