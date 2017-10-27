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

function formatChapters(chaps) {
    const formattedChapter = [];
    const chapters = chaps[0];
    const duration = getSecondsFromTime(chapters[chapters.length-1].timeCode);
    
    for (let i = 0; i < chapters.length; i += 1) {
    const nextChapter = chapters[i + 1] || chapters[i]
    const time = getSecondsFromTime(chapters[i].timeCode)

    formattedChapter.push({
      ...chapters[i],
      start: i === 0 ? 0 : time,
      end: i === chapters.length - 1 ? duration : getSecondsFromTime(nextChapter.timeCode),
    })
  }

  return formattedChapter;
}

function getSecondsFromTime(time){
   //  'hh:mm:ss'   // your input string
    var a = time == undefined ? 0 : time.split(':'); 
    var seconds = 0;
    if(a.length == 3){
        seconds = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]); 
    }else if(a.length == 2){
        seconds = (+a[0]) * 60 + (+a[1]); 
    }else{
        seconds = a[0];
    }
   return seconds;
 }

router.get('/Audiobook', function (req, res) {
    var audioBookId = req.get('audioBookId'); 
    var authorizationKey = req.get('Authorization');
    const delegateToken = delegationToken.delegationToken(authorizationKey);  

    delegateToken.then(function (delgateToken) {        
        let objArray = [];
        
        let detailsPath = '/v1/audiobooks/' + audioBookId;
        let details = network.request_Obj(network.connectionData(network.REQUEST_TYPE_GET,delgateToken, detailsPath), '');               
        objArray.push(details);
        
        let chapatersPath = '/v1/audiobooks/' + audioBookId + '/chapters';
        let chapters = network.request_Obj(network.connectionData(network.REQUEST_TYPE_GET,delgateToken, chapatersPath), '');
        objArray.push(chapters);

        async.map(objArray, network.asyncConnection, function (error, response) {
            let formattedChapters = formatChapters([JSON.parse(response[1])])
            let resArray = {"AudioDetails":[JSON.parse(response[0])],"Chapters":formattedChapters};
            res.json(resArray);
        });
    }, function (err) {
        res.json(err.message);
    });
});

router.post('/AudiobookSave', function (req, res) {
    
    let audioBookId,authorizationKey,path,body;    
    
    audioBookId = req.get('audioBookId'); 
    authorizationKey = req.get('Authorization');
    path = AppRoute.audio + audioBookId +'/save';
    body = {
		"startCuePoint": req.body.start,
		"endCuePoint": req.body.end
	};
    const delegateToken = delegationToken.delegationToken(authorizationKey);  
    delegateToken.then(function (delgateToken) {     
        let conData = network.connectionData(network.REQUEST_TYPE_POST, delgateToken, path);
		network.request(conData,JSON.stringify(body), function (response) {
			try {
			   res.json("success");
		    } catch (e) {
			    res.json(network.getErrorMessage());
		    }
		}); 
    }, function (err) {
        res.json(err.message);
    });
});

module.exports = router;