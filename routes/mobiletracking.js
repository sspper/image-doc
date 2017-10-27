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
const uuidV1 = require('uuid/v1');
var jwtDecode = require('jwt-decode');

router.post('/events', function (req, res) {
    var authorizationKey = req.get('Authorization');
    const delegateToken = delegationToken.delegationToken(authorizationKey);
    delegateToken.then(function (delgateToken) {
        let bodyArray = req.body;
        if (bodyArray != "" && bodyArray.length > 0) {
            var objArray = [];
            for (let key = 0; key < bodyArray.length; key++) {
                var connectionObj = {
                    conData: '',
                    body: ''
                };
                connectionObj.body = prepareEventObject(delgateToken, bodyArray[key].eventType, bodyArray[key].pagePath, bodyArray[key].pageType, bodyArray[key].itemId, bodyArray[key].previousPath, bodyArray[key].userAgent, bodyArray[key].duration);
                connectionObj.conData = {
                    host: "event-gateway.dev.uts-squad.com",
                    path: "/v1/events",
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    }
                };
                objArray.push(connectionObj);
            }
            async.map(objArray, network.asyncConnection, function (err, response) {
                let returnObj = [];
                for(let k=0;k<objArray.length;k++){
                    returnObj.push(objArray[k].body);
                }
                res.json(returnObj);
            });
        } else {
            res.json("");
        }
    }, function (err) {
        res.json(err.message);
    });
});
let pageSchema = "pageView~20161121130000~v1.0";
let durationschema = "durationTracking~20161121130000~v1.0";
function prepareEventObject(token, schema, pagePath, pageType, itemId, previousPath, userAgent, duration) {
    let jsonObj = getEventJson();
    let uuid = uuidV1();
    let jwtdecoded = jwtDecode(token);
    var date = new Date();
    jsonObj.id = uuid;
    jsonObj.corrId = uuid;
    jsonObj.time = date.toISOString();
    jsonObj.orgId = jwtdecoded.organization_id;
    jsonObj.byUserId = jwtdecoded.org_user_id;
    jsonObj.msgBody.msgBodyPost.pagePath = pagePath;
    jsonObj.msgBody.msgBodyPost.objectId = itemId;
    jsonObj.msgBody.msgBodyPost.sessionId = jwtdecoded['x-jti'];
    jsonObj.msgBody.msgBodyPost.pageType = pageType;
    jsonObj.msgBody.msgBodyPost.userAgent = userAgent;
    if (schema == "pageview") {
        jsonObj.msgSchema = pageSchema;
        jsonObj.msgBody.msgBodyPost.previousPath = previousPath;
    } else {
        jsonObj.msgSchema = durationschema;
        jsonObj.msgBody.msgBodyPost.duration = duration;
    }
    return jsonObj;
}


function getEventJson() {
    let jsonObj = { "schema": "root~v2.0", "time": "", "source": "learner:server:mobiletracking", "id": "", "corrId": "", "tags": [], "msgClass": "event", "msgSchema": "", "orgId": "", "byUserId": "", "msgBody": { "msgBodyPost": { "pagePath": "", "objectId": "", "sessionId": "", "pageType": "", "userAgent": "", "meta": {} } } };
    return jsonObj;
}

module.exports = router;