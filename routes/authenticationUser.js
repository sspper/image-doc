
var express = require('express');
var router = express.Router();
var https = require('https');
var bodyParser = require('body-parser');
var network = require('../NetworkApi/Network');
import config from '../Network/config.json'
import JwtHelper from 'jsonwebtoken'
import AppRoute from '../NetworkApi/Paths';
var delegationToken = require('../token-manager-library/delegation-tokens');

function connections(domain, callback) {

	var path = '/api/subdomains/' + domain + '/connections';
	var conData = network.loginConnectionData(network.REQUEST_TYPE_GET, path);

	network.request(conData, '', function (response) {
		try {
			callback.call(this, response);
		} catch (e) {
			var error = {
				type: 1000,
				message: e.message
			}
			callback.call(this, error);
		}
	});
}

const updateLicenseInfoForUser = (authToken, orgUserId, callback) => {
	const path = `${AppRoute.license}${orgUserId}/connect`;
	const delegateToken = delegationToken.delegationToken(authToken);
	delegateToken.then(function (delgateToken) {
		var conData = network.connectionData(network.REQUEST_TYPE_POST, delgateToken, path);
		var body = '';
		network.request(conData, body, function (response) {
			try {
				//Just upadting the user lincense info to backend not doing anything on response
				callback(JSON.parse(response))
			} catch (e) {
				//
			}
		});
	}, function (err) {
		//
	});
}

router.post('/connections', function (request, response) {
	connections(request.body.domain, function (result) {
		response.json(result);
	});
});

router.post('/login', function (request, response) {

	const { username, password, domain, domainname } = request.body;

	var dataBody = {
		"client_id": config.data.appid,
		"username": username,
		"password": password,
		"id_token": "",
		"connection": domainname,
		"grant_type": "password",
		"scope": "openid",
		"device": ""
	};
	var stringData = JSON.stringify(dataBody);
	let url = config.data.auth0domain;
	let splitArray = url.split("https://");
	let authUrl = splitArray.length == 2 ? splitArray[1] : splitArray[0];
	var data = {
		host: authUrl,
		port: 443,
		path: '/oauth/ro',
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		}
	};
	var req = https.request(data, function (res) {
		var body = "";
		res.on('data', function (data) {
			body += data;
		});
		res.on('end', function () {
			var authData = JSON.parse(body);
			var toReturn = {};
			if (authData.error) {
				toReturn = {
					id: "",
					token: "",
					type: "",
					error: authData.error_description
				}
				response.json(toReturn);
			} else {
				toReturn = {
					id: authData.id_token,
					token: authData.access_token,
					type: authData.token_type,
					error: ""
				}
				updateLicenseInfoForUser(authData.id_token, JwtHelper.decode(authData.id_token)["org_user_id"], (resp) => {
					response.json({ ...toReturn, ...resp })
				})
			}

		});
		res.on('error', function (e) {
			var error = {
				type: 1000,
				message: e.message
			}
			response.json(error);
		});
	});
	req.write(stringData);
	req.end();
});

module.exports = router;