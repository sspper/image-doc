var express = require('express');
var router = express.Router();
var https = require('https');
var http = require('http');
var bodyParser = require('body-parser');
var async = require('async');
var request = require('request');
var ip = require('ip');

var network = require('../NetworkApi/Network');
var book = require('./books');
var delegationToken = require('../token-manager-library/delegation-tokens');

var responseJson = {
        "channelDetails":{},
        "defaultView":{
            "id":"", 
            "default":"", 
            "filterIds":"", 
            "pin":"", 
            "type":"", 
            "books":[],
            "course":[],
            "audioBook":[]
        }
    };
    
router.get('/channelInfo/:channelId/:channelViewId', function (req, res) {
    var authorizationKey = req.get('Authorization');

    const delegateToken =  delegationToken.delegationToken(authorizationKey);
    delegateToken.then(function (delgateToken) {
        var path = '/v1/channels/' + req.params.channelId;
        var conData = network.connectionData(network.REQUEST_TYPE_GET,delgateToken, path);
        var channelViewID = req.params.channelViewId;
        network.request(conData, '' , function (response) {
            var channelView;
            var channelViewResponse
            try {
                var resObj = JSON.parse(response);                
                for(var i=0;i<resObj.channelViews.length;i++){
                    channelView = resObj.channelViews[i];
                    if(channelViewID==0 && channelView.default==true){
                        channelViewID = channelView.id;
                        responseJson.defaultView.id = channelView.id;
                        responseJson.defaultView.default = channelView.default;
                        responseJson.defaultView.filterIds = channelView.filterIds;
                        responseJson.defaultView.pin = channelView.pin;
                        responseJson.defaultView.type = channelView.type;
                        break;
                    }else if(channelViewID==channelView.id){
                        channelViewID = channelView.id;
                        channelView.default = true;
                        responseJson.defaultView.id = channelView.id;
                        responseJson.defaultView.default = channelView.default;
                        responseJson.defaultView.filterIds = channelView.filterIds;
                        responseJson.defaultView.pin = channelView.pin;
                        responseJson.defaultView.type = channelView.type;
                        break;
                    }
                }
                responseJson.channelDetails = resObj;
                if(channelView.default == false){
                    //Returning details if we dont find default view
                    res.json(responseJson);
                }else{
                    getChannelView(req,res,delgateToken,channelViewID,function (channelViewResponse){
                        channelViewResponse = JSON.parse(channelViewResponse);
                        var objArray = [];
                        if(channelViewResponse.bookCount>0){
                            var connectionObj_book = {
                                conData : '', 
                                body:''
                            };
                            var path = '/v1/channel_views/' + channelViewID+'/books';
                            objArray.push(network.request_Obj(network.connectionData(network.REQUEST_TYPE_GET,delgateToken, path),''));
                            
                            let audioPath = '/v1/channel_views/' + channelViewID+'/audiobooks';
                            objArray.push(network.request_Obj(network.connectionData(network.REQUEST_TYPE_GET,delgateToken, audioPath),''));
                        }
                        if(channelViewResponse.courseCount>0){
                            var connectionObj_course = {
                                conData : '', 
                                body:''
                            };
                            //var authorizationKey = req.get('Authorization');
                            var path = '/v1/courses?channel_view_id=' + channelViewID;
                            connectionObj_course.conData = network.connectionData(network.REQUEST_TYPE_GET,delgateToken, path);
                            connectionObj_course.body ='';
                            objArray.push(connectionObj_course);
                        }

                        if(objArray.length==0){
                            res.json(responseJson);
                        }else{
                            async.map(objArray, network.asyncConnection, function (error, response) {
                                mergeResponse(response,function(){
                                    res.json(responseJson);
                                });
                            });
                        }
                    });
                }            
            } catch (e) {
                
            }
        });
    },function(err){
        res.json(err.message);
    });
});

router.get('/channelView/:channelViewId', function (req, res) {
    //Here i am not sending following values
    /* "id": "",
    "default": "",
    "filterIds": "",
    "pin": "",
    "type": "" */ 
    //because these values we will get from previous call /channelInfo/:channelId

    var authorizationKey = req.get('Authorization');
    const delegateToken =  delegationToken.delegationToken(authorizationKey);
    delegateToken.then(function (delgateToken) {
        var channelViewID = req.params.channelViewId;
        delete responseJson.channelDetails;
        getChannelView(req, res, delgateToken, channelViewID, function (channelViewResponse){
            channelViewResponse = JSON.parse(channelViewResponse);
            var objArray = [];

            if(channelViewResponse.bookCount>0){
                var connectionObj_book = {
                    conData : '', 
                    body:''
                };
                var path = '/v1/channel_views/' + channelViewID+'/books';
                connectionObj_book.conData = network.connectionData(network.REQUEST_TYPE_GET,delgateToken, path);
                connectionObj_book.body ='';
                objArray.push(connectionObj_book);
            }

            if(channelViewResponse.courseCount>0){
                var connectionObj_course = {
                    conData : '', 
                    body:''
                };
                var path = '/v1/courses?channel_view_id=' + channelViewID;
                connectionObj_course.conData = network.connectionData(network.REQUEST_TYPE_GET,delgateToken, path);
                connectionObj_course.body ='';
                objArray.push(connectionObj_course);
            }

            if(objArray.length==0){
                res.json(responseJson);
            }else{
                async.map(objArray, network.asyncConnection, function (error, response) {
                        mergeResponse(response,function(){
                            res.json(responseJson);
                        });
                });
            }
        });
    },function(err){
        res.json(err.message);
    });    
});


function mergeResponse(items,callback){
    for(var i=0;i<items.length;i++){
        var responseData = items[i];

        var parsedData = JSON.parse(responseData);
        if(parsedData.length != 0) {
            if(parsedData[0].type=="Course"){
                responseJson.defaultView.course = JSON.parse(items[i]);
            }
            else if(parsedData[0].type=="Book"){
                responseJson.defaultView.books=JSON.parse(items[i]);
            }
            else if(parsedData[0].type=="AudioBook"){
                responseJson.defaultView.audioBook=JSON.parse(items[i]);
            }
        }
    }
    callback();
}


function getChannelView(req, res, delgateToken, channelViewID, callback) {
    var path = '/v1/channel_views/' + channelViewID;
    var conData = network.connectionData(network.REQUEST_TYPE_GET,delgateToken, path);
    network.request(conData, '' , function (response) {
        try {
            callback(response)
        } catch (e) {
            //res.json(JSON.stringify(response));
        }
    });
}

module.exports = router;