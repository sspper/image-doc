
var express = require('express');
var router = express.Router();
var http = require('http');
var bodyParser = require('body-parser');
var Buffer = require('buffer').Buffer;

import config from '../Network/config.json'

module.exports = {
	REQUEST_TYPE_GET: 'GET',
	REQUEST_TYPE_POST: 'POST',
	REQUEST_TYPE_DELETE: 'DELETE',

	loginConnectionData: function (requestMethod, path) {
		let url = config.data.organizationurl;
		let splitArray = url.split("http://");
		let orgUrl = splitArray.length == 2?splitArray[1]:splitArray[0];
		var conData = {
			host: orgUrl,
			//port: config.data.port,
			path: path,
			method: requestMethod,
			headers: {
				'Content-Type': 'application/json'
			}
		};
		return conData;
	},
	connectionData: function (requestMethod, authorizationKey, path) {
		let url = config.data.endpoint;
		let splitArray = url.split("http://");
		let endpointUrl = splitArray.length == 2?splitArray[1]:splitArray[0];
		var conData = {
			host: endpointUrl,
			//port: config.data.port,
			path: path,
			method: requestMethod,
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'Authorization': authorizationKey
			}
		};
		return conData;
	},
	request: function (conData, reqeustBody, callback) {
		var timeout = null;

		let localCondata = conData;
		if (reqeustBody.length > 0) {
			let { headers } = localCondata
			localCondata.headers = {
				...headers,
				'Content-Length': Buffer.byteLength(reqeustBody)
			}
		}
		var conReq = http.request(localCondata, function (conRes) {
			clearTimeout(timeout);
			var conBody = "";
			conRes.on('data', function (data) {
				conBody += data;
			});
			conRes.on('end', function () {
				if (conRes.statusCode == 200 || conRes.statusCode == 201) {
					callback.call(this, conBody);
				} else if (((conRes.statusCode == 401 || conRes.statusCode == 403)) ||
					((conRes.statusCode == 500 || conRes.statusCode == 412)) ||
					(conRes.statusCode == 500)) {
					var error = {
						errType: conRes.statusCode,
						message: conRes.statusMessage
					}
					callback.call(this, JSON.stringify(error));
				} else {
					callback.call(this, JSON.stringify(module.exports.getErrorMessage()));
				}
			});
			conRes.on('error', function (e) {
				var error = {
					errType: e.statusCode,
					message: e.message
				}
				callback.call(this, JSON.stringify(error));
			});
		});

		conReq.on('error', function (e) {
			clearTimeout(timeout);
			var errorMessage;
			if (e.code == 'ENOTFOUND') {
				errorMessage = "Address not found: " + e.host;
			} else {
				errorMessage = "" + e;
			}

			var error = {
				errType: 1000,
				message: errorMessage
			}
			callback.call(this, JSON.stringify(error));
		});

		timeout = setTimeout(function () {
			try {
				conReq.abort();
				var error = {
					errType: 1000,
					message: 'BFF: Request time out'
				}
				callback.call(this, error);
			} catch (e) {

			}
		}, config.data.requesttimeout);


		if (reqeustBody.length > 0) {
			conReq.write(reqeustBody);
		}
		conReq.end();
	},
	getErrorMessage: function () {
		var errMsg = {};
		return errMsg = {
			errType: '',
			message: "Looks like problem with Service"
		};
	},
	asyncConnection: function (object, callback) {
		let localCondata = object.conData
		let { body } = object
		if (body != '' && localCondata.method == "POST") {
			let { headers } = localCondata
			let bodytoWrite = JSON.stringify(body)
			localCondata.headers = {
				...headers,
				'Content-Length': Buffer.byteLength(bodytoWrite)
			}
		}

		var asyncRequest = http.request(localCondata, function (conRes) {
			var conBody = "";
			conRes.on('data', function (data) {
				conBody += data;
			});
			conRes.on('end', function () {
				if (conRes.statusCode == 200) {
					callback.call(this, null, conBody);
				} else {
					callback.call(this, null, JSON.stringify(module.exports.getErrorMessage()));
				}
			});
			conRes.on('error', function (e) {
				var error = {
					errType: 1000,
					message: e.message
				}
				callback.call(this, null, error);
			});
		});

		asyncRequest.on('error', function (e) {
			var errorMessage;
			if (e.code == 'ENOTFOUND') {
				errorMessage = "Address not found: " + e.host;
			} else {
				errorMessage = "" + e;
			}

			var error = {
				errType: 1000,
				message: errorMessage
			}
			callback.call(this, JSON.stringify(error));
		});

		if (object.body != '') {
			let bodyObj = JSON.stringify(object.body);
			asyncRequest.write(bodyObj);
		}
		asyncRequest.end();
	},

	request_Obj: function (conData, body) {
		var requestObj = {
			conData: conData,
			body: body
		};
		return requestObj;
	}
};
