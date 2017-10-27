var express = require('express');
var router = express.Router();
import { showlogs } from '../handlers/Logger'
import AppRoute from '../NetworkApi/Paths';



/* GET home page. */
router.get('/', function(req, res, next) {
  console.log(AppRoute.bff_sanity_login);
  res.render('authentication',{logres:showlogs,domainpath:AppRoute.bff_sanity_domain,loginpath:AppRoute.bff_sanity_login,logspath:AppRoute.bff_sanity_log});
});

module.exports = router;
