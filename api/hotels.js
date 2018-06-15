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
const hotelSchema = {
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

/////////////////////////////////////////////////////////////////// GET HOTELS
function getHotels(mysqlPool) {
  return new Promise( (resolve, reject) => {
    mysqlPool.query('SELECT * FROM Hotels',
                    function(err, result) {
                        if(err) { reject(err); }
                        else    { resolve(result); }
                    })
  });
};

router.get('/', rateLimit, function (req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;

  getHotels(mysqlPool)
    .then( (hotels) => {
      if(hotels) { res.status(200).json(hotels); }
      else       { next(); }
    })
    .catch((err) => {
      res.status(500).json({
        error: "Unable to fetch hotels.  Please try again later."
      });
    });
});
/////////////////////////////////////////////////////////////////// GET HOTELS

/////////////////////////////////////////////////////////////////// INSERT HOTELS
function insertHotel(mysqlPool, hotel) {
  return new Promise( (resolve, reject) => {

    hotel.id = null;
    hotel.rating = null;
    hotel.cost = null;

    mysqlPool.query('INSERT INTO Hotels SET ?', [ hotel ],
                    function(err, result) {
                      if(err) { reject(err); }
                      else    { resolve(result.insertID); }
                    });
  });
}

router.post('/', rateLimit, requireAuthentication, function(req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;

  if (req.user !== req.body.ownerid) {
    res.status(403).json({
      error: "Unauthorized to access to post under that ownerid, use your own(Make sure you entered your token)"
    });
  }
  else {
    if( validation.validateAgainstSchema(req.body, hotelSchema) ) {
      insertHotel(mysqlPool, req.body)
        .then( (id) => {
          res.status(201).json({
            id: id,
            links: {
              hotel: `/hotels/${id}`
            }
          });
        })
        .catch( (err) => {
          console.log("err ", err);
          res.status(500).json({

            error: "Error inserting hotel into DB.  Please try again later."
          });
        });
    }
    else {
      res.status(400).json({
        error: "Request body is not a valid hotel object."
      });
    }
  }
});
/////////////////////////////////////////////////////////////////// INSERT HOTELS




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
function deleteHotel(mysqlPool, hotelID, ownerid) {
  return new Promise( (resolve, reject) => {
    mysqlPool.query('DELETE FROM Hotels WHERE id = ? and ownerid = ?', [ hotelID, ownerid ],
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
    deleteHotel(mysqlPool, hotelID, userID)
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


exports.router = router;
