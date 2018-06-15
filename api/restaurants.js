const router = require('express').Router();
const bcrypt = require('bcryptjs');
const randomstring = require("randomstring");
const rateLimitWindowMaxRequests = 5;

const ObjectId = require('mongodb').ObjectId;
const { generateAuthToken, requireAuthentication } = require('../lib/auth');
const { rateLimit, saveUserTokenBucket } = require('../lib/rate-limit');
const validation = require('../lib/validation');

/*
 * Schema describing required/optional fields of a business object.
 */
const restaurantSchema = {
  name: { required: true },
  address: { required: true },
  city: { required: true },
  state: { required: true },
  zip: { required: true },
  phone: { required: true },
  website: { required: false },
  email: { required: false },
  ownerid: { required: true },
  rating: { required: false },
  cost: { required: false }
};

///////////////////////////////////// GET RESTAURANTS
function getRestaurants(mysqlPool) {
  return new Promise( (resolve, reject) => {
    mysqlPool.query('SELECT * FROM Restaurants',
                    function(err, result) {
                        if(err) { reject(err); }
                        else    { resolve(result); }
                    })
  });
};

router.get('/', function (req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;

  getRestaurants(mysqlPool)
    .then( (restaurants) => {
      if(restaurants) { res.status(200).json(restaurants); }
      else       { next(); }
    })
    .catch((err) => {
      res.status(500).json({
        error: "Unable to fetch restaurants.  Please try again later."
      });
    });
});
///////////////////////////////////// GET RESTAURANTS

/////////////////////////////////////////////////////////////////// INSERT RESTAURANTS
function insertRestaurant(mysqlPool, restaurant) {
  return new Promise( (resolve, reject) => {

    restaurant.id = null;
    restaurant.rating = null;
    restaurant.cost = null;

    mysqlPool.query('INSERT INTO Restaurants SET ?', [ restaurant ],
                    function(err, result) {
                      if(err) { reject(err); }
                      else    { resolve(result.insertID); }
                    });
  });
}

router.post('/', rateLimit, requireAuthentication, function(req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;

  if (req.user !== req.body.ownerid) {
    res.status(403).json({ error: "Unauthorized to access to post under that ownerid, use your own(Make sure you entered your token)"});
  }
  else {
    if( validation.validateAgainstSchema(req.body, restaurantSchema) ) {
      req.body.ownerid = req.user;
      insertRestaurant(mysqlPool, req.body)
        .then( (id) => {
          res.status(201).json({
            id: id,
            links: { restaurant: `/restaurants/${id}`}
          });
        })
        .catch( (err) => {
          console.log("err ", err);
          res.status(500).json({ error: "Error inserting restaurant into DB.  Please try again later." });
        });
    }
    else {
      res.status(400).json({ error: "Request body is not a valid restaurant object." });
    }
  }
});
/////////////////////////////////////////////////////////////////// INSERT RESTAURANTS

/////////////////////////////////////////////////////////////////// UPDATE RestaurantS
function updateRestaurant(mysqlPool, restaurant, restaurantID, ownerid) {

  return new Promise( (resolve, reject) => {
    mysqlPool.query('UPDATE Restaurants SET ? WHERE id = ? AND ownerid = ?', [ restaurant, restaurantID, ownerid ],
                    function(err, result) {
                      if(err) { reject(err); }
                      else    { resolve(result.affectedRows > 0); }
                    });
  });
}

router.put('/:user/:restaurantID', rateLimit, requireAuthentication, function(req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;

  var restaurantID = parseInt(req.params.restaurantID);
  var userID = req.params.user;

  if (req.user !== userID) {
    res.status(403).json({
      error: "Unauthorized to access to resource"
    });
  }
  else {
    if( validation.validateAgainstSchema(req.body, restaurantSchema) ) {
      req.body.ownerid = req.user;
      updateRestaurant(mysqlPool, req.body, restaurantID, userID)
        .then( (updateSuccesful) => {
          if(updateSuccesful) {
            res.status(200).json({ links: { restaurant: `/restaurants/${restaurantID}` } });
          }
        })
        .catch( (err) => {
          console.log("err: ", err);
          res.status(500).json({ error: "Error inserting restaurant into DB.  Please try again later." });
        });
    }
    else {
      res.status(400).json({
        error: "Request body is not a valid restaurant object."
      });
    }
  }
});
/////////////////////////////////////////////////////////////////// UPDATE RestaurantS

/////////////////////////////////////////////////////////////////// DELETE RestaurantS
function deleteRestaurant(mysqlPool, restaurantID, ownerid) {
  return new Promise( (resolve, reject) => {
    mysqlPool.query('DELETE FROM Restaurants WHERE id = ? and ownerid = ?', [ restaurantID, ownerid ],
                    function(err, result) {
                      if(err) { reject(err); }
                      else    { resolve(result.affectedRows > 0); }
                    });
  });
}

router.delete('/:user/:restaurantID', rateLimit, requireAuthentication, function( req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;

  var userID = req.params.user;
  var restaurantID = parseInt(req.params.restaurantID);

  if (req.user !== userID) {
    res.status(403).json({
      error: "Unauthorized to access to resource"
    });
  }
  else {
    deleteRestaurant(mysqlPool, restaurantID, userID)
      .then( (deleteSuccessful) => {
        if (deleteSuccessful) { res.status(204).end(); }
        else { next(); }
      })
      .catch( (err) => {
        res.status(500).json({
          error: "Unable to delete restaurant.  Please try again later."
        });
      });
  }
});
/////////////////////////////////////////////////////////////////// DELETE RestaurantS


/////////////////////////////////////////////////////////////////// get Restaurant by id and reviews
function getRestaurantById(mysqlPool, type, id) {
  return new Promise(function(resolve, reject) {
    // mysqlPool.query('SELECT * FROM Restaurants B, Reviews R WHERE B.id = ? AND R.businessid = ? AND R.type = ?', [ id, id, type],
    mysqlPool.query('SELECT userid, rating, cost, review FROM Reviews WHERE businessid = ? AND type = ?', [ id, type],
                    function(err, result) {
                      if(err) { reject(err); }
                      else    { resolve({reviews: result }); }
                    })
  });
}

router.get('/:type/:id', function(req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;

  var id = parseInt(req.params.id);
  var type = req.params.type;

  getRestaurantById(mysqlPool, type, id)
    .then( (restaurantInfo) => {
      if(restaurantInfo) {
        res.status(200).json( restaurantInfo );
      }
      else { next(); }
    })
    .catch( (err) => {
      console.log("err: ", err);
      res.status(500).json({
        error: "Unable to fetch restaurant info.  Please try again later."
      });
    });
});


/////////////////////////////////////////////////////////////////// get Restaurant by id and reviews

exports.router = router;
