const router = require('express').Router();
const bcrypt = require('bcryptjs');
const randomstring = require("randomstring");
const rateLimitWindowMaxRequests = 5;

const ObjectId = require('mongodb').ObjectId;
const { generateAuthToken, requireAuthentication } = require('../lib/auth');
const { rateLimit, saveUserTokenBucket } = require('../lib/rate-limit');
const validation = require('../lib/validation');

const reviewSchema = {
  type: { required: true },
  id: { required: false },
  cost: { required: true },
  rating: { required: true },
  review: { required: true },
  userid: { required: true },
  businessid: { required: true },
};

///////////////////////////////////// GET RESTAURANTS
function getReviews(mysqlPool) {
  return new Promise( (resolve, reject) => {
    mysqlPool.query('SELECT * FROM Reviews',
                    function(err, result) {
                        if(err) { reject(err); }
                        else    { resolve(result); }
                    })
  });
};

router.get('/', function (req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;

  getReviews(mysqlPool)
    .then( (reviews) => {
      if(reviews) { res.status(200).json(reviews); }
      else       { next(); }
    })
    .catch((err) => {
      res.status(500).json({
        error: "Unable to fetch reviews.  Please try again later."
      });
    });
});
///////////////////////////////////// GET RESTAURANTS


/////////////////////////////////////////// WRITE REVIEW
function insertReview(mysqlPool, review, userid) {

  review.id = null;

  return new Promise( (resolve, reject) => {
    mysqlPool.query('INSERT INTO Reviews SET ?', [ review ],
                    function(err, result) {
                      if(err) { reject(err); }
                      else    { resolve(result.insertID); }
                    });
  });
}

router.post('/', rateLimit, requireAuthentication, function(req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;

  if(req.user !== req.body.userid) {
    // res.status(403).json({ error: "Unauthorized to access to post under specified userid, use your ownerid" });
    req.body.userid = req.user;
  }
  else {
    if( validation.validateAgainstSchema(req.body, reviewSchema) ) {
      checkForDuplicateReview(mysqlPool, req.body.type, req.body.userid, req.body.businessid)
        .then( (count) => {
          if(count) {
            res.status(500).json({ error: "Error already reviewed this business" });
          }
          else {
            insertReview(mysqlPool, req.body, req.body.userid)
              .then( (id) => {
                res.status(201).json({
                  id: id
                  // links: { review: `/reviews/${id}`}
                });
              })
              .catch( (err) => {
                console.log("err ", err);
                res.status(500).json({ error: "Error inserting review into DB.  Please try again later." });
              });
          }
        })
    }
    else {
      res.status(400).json({ error: "Request body is not a valid review object." });
    }
  }
});
/////////////////////////////////////////// WRITE REVIEW


/////////////////////////////////////////////////////////////////// UPDATE Reviews
function updateReview(mysqlPool, review, reviewID, userid) {

  return new Promise( (resolve, reject) => {
    mysqlPool.query('UPDATE Reviews SET ? WHERE id = ? AND userid = ?', [ review, reviewID, userid ],
                    function(err, result) {
                      if(err) { reject(err); }
                      else    { resolve(result.affectedRows > 0); }
                    });
  });
}

router.put('/:user/:reviewID', rateLimit, requireAuthentication, function(req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;

  var reviewID = parseInt(req.params.reviewID);
  var userID = req.params.user;

  if (req.user !== userID) {
    res.status(403).json({
      error: "Unauthorized to access to resource"
    });
  }
  else {
    if( validation.validateAgainstSchema(req.body, reviewSchema) ) {
      req.body.userid = req.user;
      updateReview(mysqlPool, req.body, reviewID, userID)
        .then( (updateSuccesful) => {
          if(updateSuccesful) {
            res.status(200).json({ links: { review: `/reviews/${reviewID}` } });
          }
        })
        .catch( (err) => {
          console.log("err: ", err);
          res.status(500).json({ error: "Error updating review in DB.  Please try again later." });
        });
    }
    else {
      res.status(400).json({
        error: "Request body is not a valid review object."
      });
    }
  }
});
/////////////////////////////////////////////////////////////////// UPDATE reviews


/////////////////////////////////////////////////////////////////// DELETE RestaurantS
function deleteReview(mysqlPool, reviewID, userid) {
  return new Promise( (resolve, reject) => {
    mysqlPool.query('DELETE FROM Reviews WHERE id = ? and userid = ?', [ reviewID, userid ],
                    function(err, result) {
                      if(err) { reject(err); }
                      else    { resolve(result.affectedRows > 0); }
                    });
  });
}

router.delete('/:user/:reviewID', rateLimit, requireAuthentication, function( req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;

  var userID = req.params.user;
  var reviewID = parseInt(req.params.reviewID);

  if (req.user !== userID) {
    res.status(403).json({
      error: "Unauthorized to access to resource"
    });
  }
  else {
    deleteReview(mysqlPool, reviewID, userID)
      .then( (deleteSuccessful) => {
        if (deleteSuccessful) { res.status(204).end(); }
        else { next(); }
      })
      .catch( (err) => {
        res.status(500).json({
          error: "Unable to delete review.  Please try again later."
        });
      });
  }
});
/////////////////////////////////////////////////////////////////// DELETE RestaurantS


/////////////////////////////////////////////////////////////////// get businessreviews by id
function getReviewsById(mysqlPool, type, id) {
  return new Promise(function(resolve, reject) {
      mysqlPool.query('SELECT * FROM Reviews WHERE type = ? AND businessid = ?', [ type, id ],
                      function(err, result) {
                        if(err) { reject(err); }
                        else    { resolve({reviews: result}); }
                      });
  });
}

router.get('/:type/:id', rateLimit, requireAuthentication, function(req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;

  var type = req.params.type;
  var id = parseInt(req.params.id);
  // if (req.user !== userID) {
  //   res.status(403).json({
  //     error: "Unauthorized to access to resource"
  //   });
  // }
  // else {
    getReviewsById(mysqlPool, type, id)
      .then( (reviews) => {
        if(reviews) { res.status(200).json(reviews); }
        else       { next(); }
      })
      .catch( (err) => {
        res.status(500).json({
          error: "Unable to pull reviews.  Please try again later."
        });
      });
  // }

});
/////////////////////////////////////////////////////////////////// get businessreviews by id


/////////////////////////////////////////////////////////////////// check if review already exists for business by user
function checkForDuplicateReview(mysqlPool, type, userid, businessid) {

  return new Promise( (resolve, reject) => {
    mysqlPool.query('SELECT COUNT(*) AS count FROM Reviews WHERE type = ? AND userid = ? AND businessid = ?', [ type, userid, businessid ],
                    function( err, result) {
                      if(err) { reject(err); }
                      else    { resolve(result[0].count); }
                    });
  });
}


/////////////////////////////////////////////////////////////////// check if review already exists for business by user

exports.router = router;
