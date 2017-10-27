var express = require('express');
var router = express.Router();
var https = require('https');
var http = require('http');
var bodyParser = require('body-parser');
var async = require('async');
var request = require('request');
var ip = require('ip');

var recentlyViewedObj = require('./recentlyViewedMockData.json')

var network = require('../NetworkApi/Network');
var delegationToken = require('../token-manager-library/delegation-tokens');
router.get('/recentlyViewed', function (req, res) {

	var authorizationKey = req.get('Authorization');
	var path = '/v1/started_content';
	const delegateToken = delegationToken.delegationToken(authorizationKey);
	delegateToken.then(function (delgateToken) {
		var conData = network.connectionData(network.REQUEST_TYPE_GET, delgateToken, path);
		var body = '';
		network.request(conData, body, function (response) {
			try {
				var resObj = JSON.parse(response);
				fetchCourseDetails(delgateToken, resObj, function (finalResObj) {
					res.json(finalResObj);
					//res.json(recentlyViewedObj);//mocked data
				})
			} catch (e) {
				res.json(JSON.stringify(response));
			}
		});
	}, function (err) {
		res.json(err.message);
	});
});

var getPathFromType = function (type) {

	var path = "";
	if (type.toLowerCase() == "course") {
		path = "/v1/courses/";
	}
	else if (type.toLowerCase() == "book") {
		path = "/v1/books/";
	}
	else if (type.toLowerCase() == "audiobook") {
		path = "/v1/audiobooks/";
	}
	return path;
}

var fetchCourseDetails = function (authKey, resObj, callback) {

	var courseIdUrlArr = [];
	var path = "/v1/courses/";
	//var connectionObj = { conData: '', body: '' };
	for (var i = 0; i < resObj.length; i++) {
		var connectionObj = { conData: '', body: '' };
		connectionObj.conData = network.connectionData(network.REQUEST_TYPE_GET, authKey, getPathFromType(resObj[i].type) + resObj[i].id);
		connectionObj.body = '';
		courseIdUrlArr.push(connectionObj);
	}
	async.map(courseIdUrlArr, network.asyncConnection, function (err, res) {
		var response = [];
		for (var i = 0; i < res.length; i++) {
			if (typeof res[i] == "object") {
				response.push(res[i]);
			}
			else {
				response.push(JSON.parse(res[i]));
			}
		}
		callback(response);
	});

}

module.exports = router
