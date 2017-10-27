var express = require('express');
import { appSettings } from '../controllers/appSettings';
import { catchErrors } from '../handlers/ErrorHandler';
var settings = express.Router();


settings.post('/', catchErrors(appSettings));

module.exports = settings;