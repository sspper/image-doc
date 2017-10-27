var express = require('express');
var router = express.Router();
var https = require('https');
var http = require('http');
var bodyParser = require('body-parser');
var async = require('async');
var request = require('request');
var ip = require('ip');

var popularChannelObj = require('./channelMockdata.json')
var recentlyViewedObj = require('./recentlyViewedMockData.json')

var network = require('../NetworkApi/Network');
var delegationToken = require('../token-manager-library/delegation-tokens');
var playlist = require('./favorite.js');

router.get('/channelList', function (req, res) {
    var authorizationKey = req.get('Authorization');
    var path = '/v1/channels';
    var conData = network.connectionData(network.REQUEST_TYPE_GET, authorizationKey, path);
    network.request(conData, '', function (response) {
        try {
            var resObj = JSON.parse(response);
            if (resObj.errType == undefined) {
               // console.log('channel list\n' + JSON.stringify(resObj));
                channelDetails.init(resObj, authorizationKey, function (mainResponse) {
                    try {
                        res.json(mainResponse);
                    } catch (e) {}
                });
            } else {
                try {
                    res.json(response);
                } catch (e) {}
            }
        } catch (e) {
            res.json(JSON.stringify(response));
        }
    });
});

var channelDetails = {
    responseObj: undefined,
	tempCallback: undefined,
	authKey: "",
	count: 0,
	mainResponse: [],
    reset: function () {
		this.responseObj = undefined;
		this.tempCallback = undefined;
		this.count = 0;
		this.authKey = "";
		this.mainResponse = [];
	},
	init: function (resObj, authorizationKey, callback) {
		channelDetails.reset();
		this.responseObj = resObj;
		this.tempCallback = callback;
		this.authKey = authorizationKey;
		this.count = 0;
		this.execute();
	},
    execute: function () {
		var objArray = [];
		for (i = 0; i < channelDetails.responseObj.length; i++) {
			var obj = channelDetails.responseObj[i].channelViews[0];
			var connectionObj = {
					conData : '', 
					body:''
				};
                
            path = '/v1/courses?channel_view_id=' + obj.id;
				connectionObj.conData = network.connectionData(network.REQUEST_TYPE_GET,channelDetails.authKey,path)
				connectionObj.body = '';		

			objArray.push(connectionObj);
		}
		async.map(objArray, network.asyncConnection, function (err, res) {
		//	console.log('res\n'+res);
			channelDetails.tempCallback.call(this, channelDetails.mergeData(channelDetails.responseObj, res));
		});
	},
    mergeData: function (courseObj, items) {
		var mergeObj = [];
		try {
			for (j = 0; j < courseObj.length; j++) {
				try {
					var itemObj = JSON.parse(items[j]);
				//	console.log("item "+JSON.stringify(itemObj));
					if (itemObj.errType == undefined && itemObj.length>0) {
						mergeObj.push(channelDetails.responseCreator(courseObj[j], itemObj));
					}
				} catch (e) {

				}
			}
		//	console.log("res "+JSON.stringify(mergeObj));
		} catch (e) {
			mergeObj = {};
			mergeObj = network.getErrorMessage();
		}
		return JSON.stringify(mergeObj);
	},
    responseCreator: function (pinsObj, itemObj) {
		var resItem = {"Course":[]};
		resItem.Course = itemObj;
		resItem.title = pinsObj.title;
		resItem.id = pinsObj.id;
		
		return resItem;
	}
};

router.get('/homeChannelData', function (req, res) {
    var authorizationKey = req.get('Authorization');
    var path = '/v1/channels/popular';
	var finalResArr = [];
    const delegateToken = delegationToken.delegationToken(authorizationKey);
	delegateToken.then(function (delgateToken) {
		//console.log("the delgateToken :"+delgateToken)
		var conData = network.connectionData(network.REQUEST_TYPE_GET, delgateToken, path);
		var body = '';
		network.request(conData, body, function (response) {
			try {
				  var resObj = JSON.parse(response);
				//res.json(resObj);
						finalResArr.push(resObj)
						path = '/v1/started_content';
							var conData = network.connectionData(network.REQUEST_TYPE_GET, delgateToken, path);
							var body = '';
							network.request(conData, body, function (response) {
								try {
									var resObj = JSON.parse(response);
									fetchCourseDetails(delgateToken, resObj, function (finalResObj) {
										finalResArr.push(finalResObj)
										 playlist.homePlayListReq(authorizationKey, (respmessage) => {
											var responseObj = JSON.parse(respmessage);
											finalResArr.push(responseObj);
											res.json(finalResArr);
                            			});	
									})
								} catch (e) {
									console.log("exception "+e.message)
									res.json(JSON.stringify(response));
								}
							});
				 //res.json(popularChannelObj);
			} catch (e) {
				res.json(JSON.stringify(response));
			}
		});
	},function(err){
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

module.exports = router;