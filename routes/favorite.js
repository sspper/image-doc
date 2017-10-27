var express = require('express');
var router = express.Router();
var https = require('https');
var http = require('http');
var bodyParser = require('body-parser');
var async = require('async');
var request = require('request');
var ip = require('ip');

var network = require('../NetworkApi/Network');
var delegationToken = require('../token-manager-library/delegation-tokens');
import AppRoute from '../NetworkApi/Paths';

var page;
var pageCount;
var authorizationKey;

function homePlayListReq(authKey, callback) {
	page = '1';
	pageCount = '10';
	authorizationKey = authKey;

	getFavList(function (result) {
		callback(result);
	});
}

function getFavList(callback) {
	var path = '/v1/pins?page=' + page + '&per=' + pageCount;
	const delegateToken =  delegationToken.delegationToken(authorizationKey);
	delegateToken.then(function (delgateToken) {
		var conData = network.connectionData(network.REQUEST_TYPE_GET, delgateToken, path);
		network.request(conData, '', function (response) {
		try{
			var resObj = JSON.parse(response);
			if(resObj.errType == undefined && resObj.length > 0){
				favDetails.init(resObj, delgateToken, function (mainResponse) {
					try {
						callback.call(this, mainResponse);
					}catch(e){}
				});
			}else if(resObj.errType == undefined && resObj.length === 0){
				let emptyListMsg = {
					errType: '',
					message: "Playlist is empty"
				};
				callback.call(this, emptyListMsg);
			}else{
				callback.call(this, JSON.stringify(network.getErrorMessage()));
			}
		}catch(e){
			callback.call(this, JSON.stringify(network.getErrorMessage()));
		}
	});
    },
	function(err){
		callback.call(this, err.message);
    });
}

router.get('/favoriteList', function (req, res) {
	page = req.query.page;
	pageCount = req.query.per;
	authorizationKey = req.get('Authorization');

	getFavList(function (result) {
		res.json(result);
	});
});

router.delete('/unpin/:id', function (req, res) {
	var authorizationKey = req.get('Authorization');
	var path = '/v1/pins/' + req.params.id;
	const delegateToken =  delegationToken.delegationToken(authorizationKey);
	delegateToken.then(function (delgateToken) {
		var conData = network.connectionData(network.REQUEST_TYPE_DELETE, delgateToken, path);
		var body = '';
		network.request(conData, body, function (response) {
			res.json(response);
		});
    },function(err){
        res.json(err.message);
    });
});

 function getNetworkObject(requestMethod, authkey, path) {
	var connectionObj = {
		conData: '',	
		body: ''
	};
	connectionObj.conData = network.connectionData(requestMethod, authkey, path)
	connectionObj.body = '';      

	return connectionObj;
 }

router.post('/pin/:id', function (req, res) {
	var authorizationKey = req.get('Authorization');
	var itemType = req.query.itemType;
	var path = '';
	var body = req.body == null && req.body == ""?'':JSON.stringify(req.body);
	if (itemType.toLowerCase() == "course") {
		path = AppRoute.course + req.params.id + '/pins';
	} else if (itemType.toLowerCase() == "channelview") {
		path = AppRoute.channelview + req.params.id + '/pins';
	} else if (itemType.toLowerCase() == "video") {
		path = AppRoute.video + req.params.id + '/pins';
	} else if (itemType.toLowerCase() == "book") {
		path = AppRoute.book + req.params.id + '/pins';
	} else if (itemType.toLowerCase() == "audiobook") {
		path = AppRoute.audio + req.params.id + '/pins';
	} else if (itemType.toLowerCase() == "channel") {
		path = AppRoute.channel + req.params.id + '/pins';
	}

	const delegateToken =  delegationToken.delegationToken(authorizationKey);
	delegateToken.then(function (delgateToken) {
		var conData = network.connectionData(network.REQUEST_TYPE_POST, delgateToken, path);
		network.request(conData, body, function (response) {
		try {
			var resObj = JSON.parse(response);
			res.json(resObj);
		} catch (e) {
			res.json(network.getErrorMessage());
		}
	});
    },function(err){
        res.json(err.message);
    });
});

var favDetails = {
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
		favDetails.reset();
		this.responseObj = resObj;
		this.tempCallback = callback;
		this.authKey = authorizationKey;
		this.count = 0;
		this.execute();
	},
	execute: function () {
		var objArray = [];
		var path;
		var channelPath = [];
		var channelPathIndex = [];
		if(favDetails.responseObj.length > 0){
			favDetails.responseObj.filter((asset,index) => {
				let item = asset.itemType.toLowerCase();
				switch(item){
					case "audiobook":{
						path = AppRoute.audio + asset.itemId;
						objArray.push(getNetworkObject(network.REQUEST_TYPE_GET, favDetails.authKey, path));
					}
					break;
					case "video":{
						path = "/v1/courses/"+asset.context.courseId+"/videos/"+asset.itemId;
						objArray.push(getNetworkObject(network.REQUEST_TYPE_GET, favDetails.authKey, path));
					}
					break;
					case "channel":{
						path = AppRoute.channel + asset.itemId;
						objArray.push(getNetworkObject(network.REQUEST_TYPE_GET, favDetails.authKey, path));
					}
					break;
					case "book":{
						path = AppRoute.book + asset.itemId;
						objArray.push(getNetworkObject(network.REQUEST_TYPE_GET, favDetails.authKey, path));
					}
					break;
					case "channelview":{
						path = AppRoute.channelview + asset.itemId;
						channelPathIndex.push(index);
						channelPath.push(getNetworkObject(network.REQUEST_TYPE_GET, favDetails.authKey, path));
					}
					break;
					case "course":{
						path = AppRoute.course + asset.itemId;
						objArray.push(getNetworkObject(network.REQUEST_TYPE_GET, favDetails.authKey, path));
					}
					break;
				}
			});
			if(channelPath.length>0){
				async.map(channelPath, network.asyncConnection, function (err, res) {
					let channelItem;
					res.map( (channelDetails, index) => {
						channelItem =JSON.parse(channelDetails);
						if(channelItem.channelId !== null || channelItem.channelId !== undefined){
							let path = AppRoute.channel + channelItem.channelId;
							objArray.splice(channelPathIndex[index], 0, getNetworkObject(network.REQUEST_TYPE_GET, favDetails.authKey, path) );
						}
					});
					async.map(objArray, network.asyncConnection, function (err, resData) {
						favDetails.tempCallback.call(this, favDetails.mergeData(favDetails.responseObj, resData, favDetails.authKey));
					});
				});
			}else{
				async.map(objArray, network.asyncConnection, function (err, res) {
					favDetails.tempCallback.call(this, favDetails.mergeData(favDetails.responseObj, res, favDetails.authKey));
				});
			}
		}
	},
	mergeData: function (favObj, items, authKey) {
		var mergeObj = [];
		try {
			for (var j = 0; j < favObj.length; j++) {
				try {
					var itemObj = JSON.parse(items[j]);
					if (itemObj.errType == undefined) {
						mergeObj.push(favDetails.responseCreator(favObj[j], itemObj, authKey));
					}
				} catch (e) {
					
				}
			}
		} catch (e) {
			mergeObj = {};
			mergeObj = network.getErrorMessage();
		}

		return JSON.stringify(mergeObj);
	},
	responseCreator: function (pinsObj, itemObj, authKey) {
		
		var resItem = favDetails.responsePrototype();
		resItem.pinId = pinsObj.id;
		resItem.itemId = pinsObj.itemId;
		resItem.createdAt = pinsObj.createdAt;
		var ipAddress = ip.address();
		var defaultUrl = "http:/" + ipAddress.trim() + ":3000/image_notfound.png";
		if ((pinsObj.itemType.toLowerCase())=="audiobook") {
			resItem.itemType = "Audiobook";
			resItem.visualUrl = itemObj.coverImageUrl == null ? defaultUrl : itemObj.coverImageUrl.indexOf("http") > -1 ? itemObj.coverImageUrl : "http:" + itemObj.coverImageUrl;
			resItem.completionStatus = itemObj.completionStatus;
			resItem.duration = minTOHours(parseInt(itemObj.durationInMinutes == undefined ? 0 : itemObj.durationInMinutes));
		}
		else if ((pinsObj.itemType.toLowerCase())==="channel") {
			resItem.itemType = "Channel";
			resItem.visualUrl = itemObj.imageUrl == null ? defaultUrl : itemObj.imageUrl.indexOf("http") > -1 ? itemObj.imageUrl : "http:" + itemObj.imageUrl;
			resItem.duration = minTOHours(parseInt(itemObj.duration == undefined ? 0 : itemObj.duration));
		}else if ((pinsObj.itemType.toLowerCase())==="course") {
			resItem.itemType = "Course";
			resItem.visualUrl = itemObj.imageUrl == null ? defaultUrl : itemObj.imageUrl.indexOf("http") > -1 ? itemObj.imageUrl : "http:" + itemObj.imageUrl;
			resItem.completionStatus = itemObj.completionStatus;
			resItem.duration = minTOHours(parseInt(itemObj.duration == undefined ? 0 : itemObj.duration));
		}else if ((pinsObj.itemType.toLowerCase())==="video") {
			resItem.itemType = "Video";
			resItem.courseId = pinsObj.context.courseId != undefined?pinsObj.context.courseId:null;
			resItem.visualUrl = itemObj.imageUrl == null ? defaultUrl : itemObj.imageUrl.indexOf("http") > -1 ? itemObj.imageUrl : "http:" + itemObj.imageUrl;
			resItem.completionStatus = itemObj.completionStatus;
			resItem.duration = minTOHours(parseInt(itemObj.duration == undefined ? 0 : itemObj.duration));
		}else if ((pinsObj.itemType.toLowerCase())==="book") {
			resItem.itemType = "Book";
			resItem.visualUrl = itemObj.coverImageUrl == null ? defaultUrl : itemObj.coverImageUrl.indexOf("http") > -1 ? itemObj.coverImageUrl : "http:" + itemObj.coverImageUrl;
			resItem.duration = minTOHours(parseInt(itemObj.durationInMinutes == undefined ? 0 : itemObj.durationInMinutes));
		}else if ((pinsObj.itemType.toLowerCase())==="channelview") {
			resItem.itemType = "ChannelView";
			resItem.visualUrl = itemObj.imageUrl;
			resItem.description = itemObj.description;
			resItem.channelId = itemObj.id; 
			resItem.duration = minTOHours(parseInt(itemObj.durationInMinutes == undefined ? 0 : itemObj.durationInMinutes));
		}
		
		resItem.title = itemObj.title;
		resItem.pinId = pinsObj.id;
		return resItem;
	
		
	},
	responsePrototype: function () {
		var resItem = {
			"itemId": "",
			"itemType": "",
			"createdAt": "",
			"title": "",
			"duration": "",
			"visualUrl": "",
			"pinId": "",
			"channelId": "",
			"description": "",
			"completionStatus": ""
		};
		return resItem;
	}
};

function minTOHours(minutes) {
	try {
		var sign = '';
		if (minutes < 0) {
			sign = '-';
		}
		var hours = leftPad(Math.floor(Math.abs(minutes) / 60));
		var minutes = leftPad(Math.abs(minutes) % 60);
		return sign + hours + 'm ' + minutes + 's';
	} catch (e) {
		return "";
	}
}
function leftPad(number) {
	return ((number < 10 && number >= 0) ? '0' : '') + number;
}
module.exports = router;
module.exports.homePlayListReq = homePlayListReq;