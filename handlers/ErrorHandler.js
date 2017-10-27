import { log } from './Logger';

/*
  Catch Errors Handler
  With async/await, we need some way to catch errors
  Instead of using try{} catch(e) {} in each controller, we wrap the function in
  catchErrors(), catch any errors they throw, and pass it along to our express middleware with next()
*/

exports.catchErrors = (fn) => {
  return function(req, res, next) {
    return fn(req, res, next).catch(next);
  };
};

/*
  Not Found Error Handler\
  If we hit a route that is not found, we mark it as 404 and pass it along to the next error handler to display
*/
exports.notFound = (req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
};


/*
  Development Error Hanlder
  In development we show good error messages so if we hit a syntax error or any other previously un-handled error, we can show good info on what happened
*/


exports.errors = (err, req, res, next) => {

  

  let statuscode = err.status
  let statusText = ''
  let message = err.message
  let exceptioninbff = err.exceptioninbff
  let errortype = err.errortype || 'custom'
  // Error from LBE not in Mobile BFF
  if(err.response){
    statuscode = err.response.status
    statusText = err.response.statusText
    exceptioninbff = false
    errortype = 'custom'
  }
  let delegationErrors = ['MasterTokenExpired' , 'FetchError', 'CreateError','TokenBlacklistError']
  if ( delegationErrors.includes(message)){
     errortype = 'delegationerror';
  }

  const errorDetails = {
      message,
      statuscode: statuscode || 500,
      statusText,
      exceptioninbff,
      errortype,
      stackHighlighted: err.stack
  };

  // This Line should be replaced with proper Logger Function
  // To Log error in console of BFF TBD
  log.e("ErrorHandler: ",errorDetails);
  // console.error(errorDetails );
  res.status(statuscode || 500);
  res.format({
    // Based on the `Accept` http header
    'application/json': () => {
      res.json(errorDetails)

    },
    'text/html': () => {
      res.render('error', errorDetails);
    }
  });
};
