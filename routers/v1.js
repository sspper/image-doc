var express = require('express');
import {notFound, catchErrors, errors } from '../handlers/ErrorHandler';
import { getLicenceCheck, domainConnection, loginRequest, logStatus, getPercipioToken, validateSAMLloginResponse, reqChangePassword  } from '../controllers/authentication';
import { getCourse, saveVideo } from '../controllers/courses';
import { getFavourites, unpinPlaylist, pinPlaylist } from '../controllers/playlists';
import { getAssessmentDetails, getAssessment, getChallengeDetails, createChallenge, getQuestion, submission, getAnswers } from '../controllers/assessments';
import { fetchSearchResults, fetchSearcSuggestionhResults } from '../controllers/search';
import { getBooks, getBookOverview, updateBook } from '../controllers/books';
import { getHomeData } from '../controllers/home';
import { getRecentlyViewedList } from '../controllers/resumeLearning';
import { getPopularChannelsList } from '../controllers/popularChannels';
import { getDefaultChannels, getChannelViewData } from '../controllers/channels';
import { makeEvents } from '../controllers/mobileTracking';
import { getAudioBook, saveAudioBook } from '../controllers/audioBooks';
import { fetchAssignmentList ,fetchAssignmentListDetails} from '../controllers/assignments';
import { getAreas ,addInterests,retrieveInterests,recommendations } from '../controllers/onBoarding';
import { addRating, removeRating } from '../controllers/contentRating';


var v1 = express.Router();

//V1 Routes
v1.post('/authenticationUser/licenseCheck', catchErrors(getLicenceCheck));
v1.post('/authenticationUser/connections', catchErrors(domainConnection));
v1.post('/authenticationUser/login', catchErrors(loginRequest));
v1.post('/authenticationUser/logs', catchErrors(logStatus));
v1.post('/authenticationUser/getPercipioToken', catchErrors(getPercipioToken));
v1.post('/authenticationUser/validateSAMLloginResponse', catchErrors(validateSAMLloginResponse));
v1.post('/authenticationUser/reqChangePassword', catchErrors(reqChangePassword));
v1.get('/course/courses', catchErrors(getCourse));
v1.post('/course/videoSave', catchErrors(saveVideo));
v1.get('/favorite/favoriteList', catchErrors(getFavourites));
v1.delete('/favorite/unpin/:id', catchErrors(unpinPlaylist));
v1.post('/favorite/pin/:id', catchErrors(pinPlaylist));
v1.get('/assessments/getAssessmentDetails', catchErrors(getAssessmentDetails));
v1.get('/assessments/getAssessment', catchErrors(getAssessment));
v1.get('/assessments/getChallengeDetails', catchErrors(getChallengeDetails));
v1.post('/assessments/createChallenge', catchErrors(createChallenge));
v1.get('/assessments/getQuestion', catchErrors(getQuestion));
v1.post('/assessments/submission', catchErrors(submission));
v1.post('/assessments/getAnswers', catchErrors(getAnswers));
v1.get('/Search/searchResults', catchErrors(fetchSearchResults)); 
v1.get('/search/searchSuggestionResults', catchErrors(fetchSearcSuggestionhResults));
v1.get('/Books/channel_views/:id/books', catchErrors(getBooks));
v1.get('/Books/book_overview/:id', catchErrors(getBookOverview));
v1.post('/Books/:id/update', catchErrors(updateBook));
v1.get('/Home/homeChannelData', catchErrors(getHomeData));
v1.get('/recent/recentlyViewed', catchErrors(getRecentlyViewedList));
v1.get('/popular/popularChannels', catchErrors(getPopularChannelsList));
v1.get('/channel/channelInfo/:channelId', catchErrors(getDefaultChannels));
v1.get('/channel/channelView/:channelViewId', catchErrors(getChannelViewData));
v1.post('/mobiletracking/events', catchErrors(makeEvents));
v1.get('/AudioBook/Audiobook', catchErrors(getAudioBook));
v1.post('/AudioBook/AudiobookSave', catchErrors(saveAudioBook));
v1.get('/assignments/list/:state', catchErrors(fetchAssignmentList));
v1.get('/assignments/listDetails/:state', catchErrors(fetchAssignmentListDetails));
v1.get('/onboarding/getAreas', catchErrors(getAreas));
v1.post('/onboarding/addInterests', catchErrors(addInterests));
v1.get('/onboarding/retrieveInterests', catchErrors(retrieveInterests));
v1.get('/onboarding/recommendation', catchErrors(recommendations));
v1.post('/contentrating/addRating', catchErrors(addRating));
v1.delete('/contentrating/removeRating', catchErrors(removeRating));

module.exports = v1;