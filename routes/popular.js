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

var popularChannelObj = require('./channelMockdata.json')

router.get('/popularChannels', function (req, res) {

	var authorizationKey = req.get('Authorization');
	var path = '/v1/channels/popular';
	const delegateToken = delegationToken.delegationToken(authorizationKey);
	delegateToken.then(function (delgateToken) {
		var conData = network.connectionData(network.REQUEST_TYPE_GET, delgateToken, path);
		var body = '';
		network.request(conData, body, function (response) {
			try {
				var resObj = JSON.parse(response);
				 res.json(resObj);
				 //res.json(popularChannelObj);//mocked data
			} catch (e) {
				res.json(JSON.stringify(response));
			}
		});
	},function(err){
        res.json(err.message);
    });
});

module.exports = router