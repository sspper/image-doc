var express = require('express');
var router = express.Router();
var https = require('https');
var http = require('http');
var bodyParser = require('body-parser');
var request = require('request');

var network = require('../NetworkApi/Network');
var basePath = '/v1/assessments/'
var delegationToken = require('../token-manager-library/delegation-tokens');

router.get('/challenges/:id/questions/:pos', function (req, res) {
	var authorizationKey = req.get('Authorization');
	var path = basePath+'/challenges/' + req.params.id + '/questions/' + req.params.pos;
	const delegateToken =  delegationToken.delegationToken(authorizationKey);
	delegateToken.then(function (delgateToken) {
	var conData = network.connectionData(network.REQUEST_TYPE_GET,delgateToken, path);
	var body ='';

	network.request(conData, body, function (response) {
		try {
			var resObj = JSON.parse(response);
			res.json(resObj);
		} catch (e) {
			res.json(JSON.stringify(response));
		}
	});
    },function(err){
        res.json(err.message);
    })
});

router.post('/challenges/:id/questions/:pos/submission', function (req, res) {
	var authorizationKey = req.get('Authorization');
	var path = basePath+'challenges/' + req.params.id + '/questions/' + req.params.pos + '/submission';
	const delegateToken =  delegationToken.delegationToken(authorizationKey);
	delegateToken.then(function (delgateToken) {
	var conData = network.connectionData(network.REQUEST_TYPE_POST,delgateToken, path);
	var body = JSON.stringify(req.body);
	network.request(conData, body , function (response) {
		try {
			var Obj = JSON.parse(response);
			if (Obj.errType == undefined) {
				var getPath = basePath+'challenges/' + req.params.id + '/questions/' + req.params.pos;
				var conDataGet = network.connectionData(network.REQUEST_TYPE_GET,authorizationKey, getPath);
				network.request(conDataGet, '', function (result) {
					try {
						var resObj = JSON.parse(result);
						res.json(resObj);
					} catch (e) {
						res.json(network.getErrorMessage());
					}
				});
			} else {
				res.json(Obj);
			}

		} catch (e) {
			res.json(JSON.stringify(response));
		}
	});
    },function(err){
        res.json(err.message);
    })
});

//Getting Assessment details 
router.get('/getAssessmentDetails', function (req, res) {
	var authorizationKey = req.get('Authorization');
	var assessmentId = req.get('AssessmentId');
	var path = basePath + assessmentId;
	const delegateToken =  delegationToken.delegationToken(authorizationKey);
	delegateToken.then(function (delgateToken) {
		var conData = network.connectionData(network.REQUEST_TYPE_GET,delgateToken, path);
		network.request(conData, '', function (result) {
		try {
			res.json(result);
		} catch (e) {
			res.json(JSON.stringify(result));
		}
	});
    },function(err){
        res.json(err.message);
    });
});

//Creating challenge
router.post('/createChallenge', function (req, res) {
	var authorizationKey = req.get('Authorization');
	var assessmentId = req.get('AssessmentId');
	var path = basePath + assessmentId + '/challenges';
	var body = '';
	const delegateToken =  delegationToken.delegationToken(authorizationKey);
	delegateToken.then(function (delgateToken) {
		var conData = network.connectionData(network.REQUEST_TYPE_POST,delgateToken, path);
		network.request(conData, body, function (response) {
		try {
			res.json(response);
		} catch (e) {
			var error = {
				type: 1000,
				message: network.getErrorMessage()
			}
			res.json(JSON.stringify(response));
		}
	});
    },function(err){
        res.json(err.message);
    });
});

//Getting challenge details
router.get('/getChallengeDetails', function (req, res) {
   var authorizationKey = req.get('Authorization');
   var challengeId = req.get('ChallengeId');
   var path = basePath+'challenges/'+challengeId;
   const delegateToken =  delegationToken.delegationToken(authorizationKey);
	delegateToken.then(function (delgateToken) {
		var conData = network.connectionData(network.REQUEST_TYPE_GET,delgateToken, path);
  		 var body = '';
   		network.request(conData, body, function (result) {
		try {
			res.json(result);
		} catch (e) {
			res.json(JSON.stringify(result));
		}
	});
    },function(err){
        res.json(err.message);
    });
});

module.exports = router;