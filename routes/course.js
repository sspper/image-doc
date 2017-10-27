
var express = require('express');
var router = express.Router();
var https = require('https');
var http = require('http');
var bodyParser = require('body-parser');
var network = require('../NetworkApi/Network');
var async = require('async');
var request = require('request');
var courseKind;

var network = require('../NetworkApi/Network');
var delegationToken = require('../token-manager-library/delegation-tokens');

function callCourse(request, callback) {
	var path;
	var courseID = request.get('CourseId');
	var authorizationKey = request.get('Authorization');
	if (courseKind == 'courseDetails')
		path = '/v1/courses/' + courseID;
	else if (courseKind == 'courseVideos')
		path = '/v1/courses/' + courseID + '/videos';
	else if (courseKind == 'video')
		path = '/v1/videos/' + courseID;

	const delegateToken = delegationToken.delegationToken(authorizationKey);
	delegateToken.then(function (delgateToken) {
		var conData = network.connectionData(network.REQUEST_TYPE_GET, delgateToken, path);
		var body = '';
		network.request(conData, body, function (response) {
			try {
				callback.call(this, response);
			} catch (e) {
				var error = {
					type: 1000,
					message: "" + e
				}
				callback.call(this, error);
			}
		});
	}, function (err) {
		callback.call(this, JSON.stringify(network.getErrorMessage()));
	});
}

function saveVideo(request, callback) {
	var path;
	var videoID = request.get('VideoId');
	var authorizationKey = request.get('Authorization');
	path = '/v1/videos/' + videoID + '/save';
	var dataBody = {
		"range": {
			"start": request.body.start,
			"end": request.body.end
		},
		"startCuePoint":request.body.start,
		"endCuePoint":request.body.end,
		"course_id": request.body.course_id,
		"cue_point": request.body.cue_point,
		"duration": request.body.duration
	};
	var stringData = JSON.stringify(dataBody);
	const delegateToken = delegationToken.delegationToken(authorizationKey);
	delegateToken.then(function (delgateToken) {
		var conData = network.connectionData(network.REQUEST_TYPE_POST, delgateToken, path);
		network.request(conData, stringData, function (response) {
			try {
				callback.call(this, response);
			} catch (e) {
				var error = {
					type: 1000,
					message: "" + e
				}
				callback.call(this, error);
			}
		});
	}, function (err) {
		res.json(err.message);
	});
}

//For getting course details.
router.get('/courseDetails', function (request, response) {
	courseKind = 'courseDetails';
	callCourse(request, function (result) {
		response.json(result);
	});
});

//For getting course details.
router.get('/courses', function (request, response) {
	courseKind = 'courseDetails';
	callCourse(request, function (result) {
		var resultObj = JSON.parse(result);
		if (resultObj.errType == undefined) {
			const delegateToken = delegationToken.delegationToken(request.get('Authorization'));
			delegateToken.then(function (delgateToken) {
				fetchVideos(request, delgateToken, function (res) {
					resultObj.videos = [];
					resultObj.videos = res;
					response.json(resultObj);
				});
			}, function (err) {
				response.json(err.message);
			});
		} else {
			response.json(resultObj);
		}
	});
});

function fetchVideos(request, delgateToken, callback) {
	courseKind = 'courseVideos';
	callCourse(request, function (result) {
		var resultArray = JSON.parse(result);
		if (resultArray.length > 0) {
			var courseID = request.get('CourseId');
			var authorizationKey = request.get('Authorization');
			var conDataArray = [];
			for (var id = 0; id < resultArray.length; id++) {
				try {
					var connectionObj = {
						conData: '',
						body: ''
					};
					var path = '/v1/courses/' + courseID + '/videos/' + resultArray[id].id;
					connectionObj.conData = network.connectionData(network.REQUEST_TYPE_GET, delgateToken, path);
					connectionObj.body = '';
					conDataArray.push(connectionObj);
				} catch (e) {
				}
			}
			async.map(conDataArray, network.asyncConnection, function (err, res) {
				try {
					for (var j = 0; j < res.length; j++) {
						if (resultArray[j].id == JSON.parse(res[j]).id) {
							resultArray[j].fileUrl = JSON.parse(res[j]).urls.hls;
						}
					}
				} catch (e) {
					resultArray = [];
				}
				callback(resultArray);
			});
		} else {
			callback(resultArray);
		}
	});
}

//To save video details
router.post('/videoSave', function (request, response) {
	courseKind = 'video';
	saveVideo(request, function (result) {
		response.json(result);
	});
});

module.exports = router;