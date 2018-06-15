const router = require('express').Router();
const bcrypt = require('bcryptjs');
const randomstring = require("randomstring");
const rateLimitWindowMaxRequests = 5;

const ObjectId = require('mongodb').ObjectId;
const { generateAuthToken, requireAuthentication } = require('../lib/auth');
const { rateLimit, saveUserTokenBucket } = require('../lib/rate-limit');
const validation = require('../lib/validation');

// const { getBusinessesByOwnerID } = require('./businesses');
// const { getReviewsByUserID } = require('./reviews');
// const { getPhotosByUserID } = require('./photos');


function validateUserObject(user) {
  return user && user.userID && user.name && user.email && user.password;
}

function insertNewUser(user, apiKey, mongoDB) {
  return bcrypt.hash(user.password, 8)
    .then(hashedPassword => {
      const userDocument = {
        userID: user.userID,
        name: user.name,
        email: user.email,
        password: hashedPassword,
        apikey: apiKey
      };
      const usersCollection = mongoDB.collection('users');
      return usersCollection.insertOne(userDocument);
    })
    .then((result) => {
      return Promise.resolve(result.insertedId);
    });
}

router.post('/', function (req, res) {
  const mongoDB = req.app.locals.mongoDB;
  if (validateUserObject(req.body)) {
    const apiKey = randomstring.generate();
    insertNewUser(req.body, apiKey, mongoDB)
      .then((id) => {
        res.status(201).json({
          _id: id,
          links: {
            user: `/users/${id}`,
            apikey: `${apiKey}`
          }
        });
        const tokenBucket = {
            tokens:rateLimitWindowMaxRequests,
            last: Date.now()
          }
        return saveUserTokenBucket(apiKey, tokenBucket);
      })
      .then(() => {

      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({
          error: "Failed to insert new user."
        });
      });
  } else {
    res.status(400).json({
      error: "Request doesn't contain a valid user."
    })
  }
});


router.post('/login', rateLimit, function(req, res) {
  const mongodb = req.app.locals.mongoDB;
  if (req.body && req.body.userID && req.body.password) {
    getUserByID(req.body.userID, mongodb, true)
      .then(user => {
        if (user) {
          return bcrypt.compare(req.body.password, user.password);
        } else {
          return Promise.reject(401);
        }
      })
      .then(loginSuccessful => {
        if (loginSuccessful) {
          return generateAuthToken(req.body.userID);
        } else {
          return Promise.reject(401);
        }
      })
      .then(token => {
        res.status(200).json({
          token: token
        });
      })
      .catch(err => {
        if  (err === 401) {
          res.status(401).json({
            error: "Invalid user ID and/or password."
          });
        } else {
          console.log(err);
          res.status(500).json({
            error: "Unable to verify credentials. Try again later."
          });
        }
      })
  } else {
    res.status(400).json({
      error: " Request body needs user ID and password."
    });
  }
});



function generateUserIDQuery(userID) {
  if (ObjectId.isValid(userID)) {
    return { _id: new ObjectId(userID) };
  } else {
    return { userID: userID };
  }
}

function getUserByID(userID, mongoDB, includePassword) {
  const usersCollection = mongoDB.collection('users');
  const projection = includePassword ? {} : {password: 0};
  const query = generateUserIDQuery(userID);
  return usersCollection
    .find(query)
    .project(projection)
    .toArray()
    .then((results) => {
      return Promise.resolve(results[0]);
    });
}


router.get('/:userID', rateLimit, requireAuthentication, function (req, res, next) {
  const mongoDB = req.app.locals.mongoDB;
  // only allows users to be referenced by `userID`
  if (req.user !== req.params.userID) {
    res.status(403).json({
      error: "Unauthorized to access the specified resource."
    });
  } else {
      getUserByID(req.params.userID, mongoDB)
        .then((user) => {
          if (user) {
            res.status(200).json(user);
          } else {
            next();
          }
        })
        .catch((err) => {
          res.status(500).json({
            error: "Failed to fetch user."
          });
        });
    }
});


/////////////////////////////////////////////////////////////////// UPDATE HOTELS
function updateHotel(mysqlPool, hotel, hotelID, ownerid) {

  return new Promise( (resolve, reject) => {
    mysqlPool.query('UPDATE Hotels SET ? WHERE id = ? AND ownerid = ?', [ hotel, hotelID, ownerid ],
                    function(err, result) {
                      if(err) { reject(err); }
                      else    { resolve(result.affectedRows > 0); }
                    });
  });
}

router.put('/:user/:hotelID', rateLimit, requireAuthentication, function(req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;

  var hotelID = parseInt(req.params.hotelID);
  var userID = req.params.user;

  if (req.user !== userID) {
    res.status(403).json({
      error: "Unauthorized to access to resource"
    });
  }
  else {
    if( validation.validateAgainstSchema(req.body, hotelSchema) ) {
      req.body.ownerid = req.user;
      updateHotel(mysqlPool, req.body, hotelID, userID)
        .then( (updateSuccesful) => {
          if(updateSuccesful) {
            res.status(200).json({ links: { hotel: `/hotels/${hotelID}` } });
          }
        })
        .catch( (err) => {
          console.log("err: ", err);
          res.status(500).json({ error: "Error inserting hotel into DB.  Please try again later." });
        });
    }
    else {
      res.status(400).json({
        error: "Request body is not a valid hotel object."
      });
    }
  }
});
/////////////////////////////////////////////////////////////////// UPDATE HOTELS




/////////////////////////////////////////////////////////////////// DELETE HOTELS
function deleteHotel(mysqlPool, hotelID) {
  return new Promise( (resolve, reject) => {
    mysqlPool.query('DELETE FROM Hotels WHERE id = ?', [ hotelID ],
                    function(err, result) {
                      if(err) { reject(err); }
                      else    { resolve(result.affectedRows > 0); }
                    });
  });
}

router.delete('/:user/:hotelID', rateLimit, requireAuthentication, function( req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;

  var userID = req.params.user;
  var hotelID = parseInt(req.params.hotelID);

  if (req.user !== userID) {
    res.status(403).json({
      error: "Unauthorized to access to resource"
    });
  }
  else {
    deleteHotel(mysqlPool, hotelID)
      .then( (deleteSuccessful) => {
        if (deleteSuccessful) { res.status(204).end(); }
        else { next(); }
      })
      .catch( (err) => {
        res.status(500).json({
          error: "Unable to delete hotel.  Please try again later."
        });
      });
  }
});
/////////////////////////////////////////////////////////////////// DELETE HOTELS


/*
 * Route to list all of a user's reviews.
 */
// router.get('/:userID/reviews', rateLimit, requireAuthentication, function (req, res) {
//   const mysqlPool = req.app.locals.mysqlPool;
//   if (req.user !== req.params.userID) {
//     res.status(403).json({
//       error: "Unauthorized to access the specified resource."
//     });
//   } else {
//     // const userID = parseInt(req.params.userID);
//     getReviewsByUserID(req.params.userID, mysqlPool)
//       .then((reviews) => {
//         if (reviews) {
//           res.status(200).json({ reviews: reviews });
//         } else {
//           next();
//         }
//       })
//       .catch((err) => {
//         res.status(500).json({
//           error: "Unable to fetch reviews.  Please try again later."
//         });
//       });
//   }
// });
//
// /*
//  * Route to list all of a user's photos.
//  */
// router.get('/:userID/photos', rateLimit, requireAuthentication, function (req, res) {
//   const mysqlPool = req.app.locals.mysqlPool;
//   if (req.user !== req.params.userID) {
//     res.status(403).json({
//       error: "Unauthorized to access the specified resource."
//     });
//   } else {
//     // const userID = parseInt(req.params.userID);
//     getPhotosByUserID(req.params.userID, mysqlPool)
//       .then((photos) => {
//         if (photos) {
//           console.log(photos);
//           photos.forEach(function(photo) {
//             photo.data = photo.data.toString('utf8');
//           });
//           res.status(200).json({ photos: photos });
//         } else {
//           next();
//         }
//       })
//       .catch((err) => {
//         res.status(500).json({
//           error: "Unable to fetch photos.  Please try again later."
//         });
//       });
//   }
// });

exports.router = router;
