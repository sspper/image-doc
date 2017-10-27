import express from 'express'
import path from 'path'
import favicon from 'serve-favicon'
import logger from 'morgan'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'

import sanitychecks from './routes/index'
import authenticationUser from './routes/authenticationUser'
import course from './routes/course'
import favorite from './routes/favorite'
import assessments from './routes/assessments'
import search from './routes/Search'
import book from './routes/books'
import home from './routes/Home'
import recent from './routes/recent'
import popular from './routes/popular'
import channel from './routes/channel'
import mobiletracking from './routes/mobiletracking'
import AudioBook from './routes/AudioBook'
import {notFound, catchErrors, errors } from './handlers/ErrorHandler';

import v1 from './routers/v1'
import index from './routers/index';


const routePrefix = "/mobile";
const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/mobile',express.static('assets'));

// this is to support sanity check page
app.use(routePrefix+'/', sanitychecks);

// This routes are to support old routes 
app.use('/authenticationUser', authenticationUser);
app.use('/course', course);
app.use('/favorite', favorite);
app.use('/assessments', assessments);
app.use('/Search', search);
app.use('/Books', book);
app.use('/Home', home);
app.use('/recent', recent);
app.use('/popular', popular);
app.use('/channel', channel);
app.use('/mobiletracking', mobiletracking);
app.use('/AudioBook', AudioBook);


//This is to support new routes
app.use(routePrefix+'/v1',v1);
app.use(routePrefix+'/appsettings', index);



// If that above routes didnt work, we 404 them and forward to error handler
app.use(notFound);

/* ErrorHandler for all types */
app.use(errors);


module.exports = app;
