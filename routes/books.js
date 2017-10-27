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

router.get('/channel_views/:id/books', function (req, res) {
    var authorizationKey = req.get('Authorization');
    const delegateToken = delegationToken.delegationToken(authorizationKey);
    delegateToken.then(function (delgateToken) {
        var path = '/v1/channel_views/' + req.params.id + '/books';
        var conData = network.connectionData(network.REQUEST_TYPE_GET, delgateToken, path);
        network.request(conData, '', function (response) {
            res.json(response);
        });
    }, function (err) {
        res.json(err.message);
    });
});

router.get('/book_overview/:id', function (req, res) {
    var authorizationKey = req.get('Authorization');
    const delegateToken = delegationToken.delegationToken(authorizationKey);
    delegateToken.then(function (delgateToken) {
        var path = '/v1/books/' + req.params.id;
        var conData = network.connectionData(network.REQUEST_TYPE_GET, delgateToken, path);
        network.request(conData, '', function (response) {
            res.json(response);
        });
    }, function (err) {
        res.json(err.message);
    });
});

/*This endpoint will record the chapter and cfi at which a user stopped reading a book. 
  It will allow the user to resume reading from where they stopped.*/
router.post('/:id/update', function (req, res) {
    var authorizationKey = req.get('Authorization');
    var body = req.body == null && req.body == ""?'':req.body;
    const delegateToken = delegationToken.delegationToken(authorizationKey);
    delegateToken.then(function (delgateToken) {
        var objArray = [];
        var updatepath = '/v1/books/' + req.params.id+'/update';
        var trackpath = '/v1/books/'+ req.params.id+'/track';
        var updateConData = network.connectionData(network.REQUEST_TYPE_POST, delgateToken, updatepath);
        var trackConData = network.connectionData(network.REQUEST_TYPE_POST, delgateToken, trackpath);
        var updateBody = {"last_cfi": body.start};
        var trackBody = {"start_cfi": body.start,"end_cfi":body.end};
        objArray.push(network.request_Obj(updateConData,updateBody));
        objArray.push(network.request_Obj(trackConData,trackBody));
        async.map(objArray, network.asyncConnection, function (err, response) {
            res.json("");
        });
    }, function (err) {
        res.json(err.message);
    });
});

module.exports = router;