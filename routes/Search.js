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

router.get('/searchResults', function (req, res) {
    var searchString = req.query.searchString;
    var page = req.query.page;
    var per_page = req.query.per_page;
    var filter = req.query.filter;
    var authorizationKey = req.get('Authorization');
    var path = '/v1/search?q=' + encodeURIComponent(searchString) + '&page=' + page + '&per_page=' + per_page + '&filter=' + filter    
    const delegateToken = delegationToken.delegationToken(authorizationKey);  //converting master token to delegate token.
    delegateToken.then(function (delgateToken) {        
        var conData = network.connectionData(network.REQUEST_TYPE_GET, delgateToken, path);
        network.request(conData, '', function (response) {
            try {
                res.json(response);
            } catch (e) {
                res.json(JSON.stringify(network.getErrorMessage()));
            }
        });
    }, function (err) {
        res.json(err.message);
    });
});

module.exports = router;