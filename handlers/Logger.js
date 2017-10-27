import winston from 'winston'
import fs from 'fs'


var QA = "qa";
var Production = "production";
const logDir = 'log';
let logger = undefined;
export let showlogs = false;

//to read environment like:QA,Production etc.
export const env = () => {
   let type = "";
   if(process.argv.length >2){
      type = process.argv[2];
   }
   return typeof type == "string"?type.toLowerCase():"";
}
// colorize the output to the console
const consoleTransport = {
  timestamp: timeformat,
  colorize: true,
  level: 'info'
}
const fileTransport = {
  json: false,
  filename: `${logDir}/applog.log`,
  timestamp: timeformat,
  level: 'info',
  maxsize: 2000000,
  handleExceptions: true,
  humanReadableUnhandledException: true
}
/*
  This timeformat will take the current time and append to console.log and file
*/
const timeformat = () => (new Date()).toLocaleTimeString();
const init = () => {
  initLogger();
  env() == QA || showlogs == true?addTransport():"";
}
//initialize the logger
const initLogger = () => {
  if (logger) {
    logger.close();
  }
  logger = new (winston.Logger);
}
//Turn on the logs on console and file
const addTransport = () => {
  logger ? logger.add(winston.transports.Console, consoleTransport)
    .add(winston.transports.File, fileTransport) : "";
}
//Turn off the logs on console and file
const removeTransport = () => {
  logger ? logger.remove(winston.transports.Console, consoleTransport)
    .remove(winston.transports.File, fileTransport) : "";
}
//class which define the log types and msg
export let log = {
  e: (msg) => {
    checkFolder();
    logger.error(msg);
  },
  e: (msg,obj) => {
    checkFolder();
    logger.error(msg,obj);
  },
  i: (msg) => {
    checkFolder();
    logger.info(msg);
  },
  i: (msg,obj) => {
    checkFolder();
    logger.info(msg,obj);
  }
}
//Turn on/off logs
export const toggleLogs = (force) => {
  showlogs = force;
  if (force) {
    initLogger();
    addTransport();
  } else {
    initLogger();
  }
}
//check folder and create if not exists
const checkFolder = () => {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
    init();
  }
}
//fetch logs fromm file
export const fetchLogs = (callback) => {
  fs.readFile(`${logDir}/applog.log`, 'utf8', (err, data) => {
    if (err) {
      data = [];
      return callback(data);
    }
    callback(data);
  });
}
init();