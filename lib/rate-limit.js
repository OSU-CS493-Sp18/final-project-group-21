const redis = require('redis');

const redisHost = process.env.REDIS_HOST;
const redisPort = process.env.REDIS_PORT || '6379';
const redisClient = redis.createClient(redisPort, redisHost);

const rateLimitWindowMilliseconds = 60000;
const rateLimitWindowMaxRequests = 5;

function rateLimit(req, res, next) {
  console.log("entered rateLimit");
  let userHasSufficientTokens = true;
  getUserTokenBucket(req.query.apikey)
    .then(tokenBucket => {
      const timestamp = Date.now();
      const elapsedMilliseconds = timestamp - tokenBucket.last;
      const refreshRate = rateLimitWindowMaxRequests / rateLimitWindowMilliseconds;
      tokenBucket.tokens += elapsedMilliseconds * refreshRate;
      tokenBucket.tokens = Math.min(rateLimitWindowMaxRequests, tokenBucket.tokens);
      console.log("tokenBucket.tokens = ", tokenBucket.tokens);
      if (tokenBucket.tokens <  1) {
        userHasSufficientTokens = false;
      } else {
        tokenBucket.tokens -= 1;
      }
      tokenBucket.last = timestamp;
      return saveUserTokenBucket(req.query.apikey, tokenBucket);
    })
    .then(() => {
      if (userHasSufficientTokens) {
        next();
      } else {
        res.status(429).json({
          error: "Too many requests per minute."
        });
      }
    })
    .catch(err => {
      if (err === 401) {
        res.status(401).json({
          error: "API Key is invalid."
        });
      } else {
        next();
      }
    });
}

function saveUserTokenBucket (apiKey, tokenBucket) {
  return new Promise((resolve, reject) => {
    redisClient.hmset(apiKey, tokenBucket, function(err, resp) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    })
  });
}

function getUserTokenBucket(apiKey) {
  return new Promise((resolve, reject) => {
    redisClient.hgetall(apiKey, function(err, tokenBucket) {
      if (err) {
        reject(err);
      } else {
        if (tokenBucket) {
          tokenBucket.tokens = parseFloat(tokenBucket.tokens);
        } else {
            reject(401);
          }
        }
      resolve(tokenBucket);
    });
  });
}

exports.rateLimit = rateLimit;
exports.saveUserTokenBucket = saveUserTokenBucket;
