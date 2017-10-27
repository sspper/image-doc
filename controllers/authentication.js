
import axios from 'axios';
import JwtHelper from 'jsonwebtoken';
import config from '../Network/config.json';
import AppRoute from '../NetworkApi/Paths';
import { catchErrors } from '../handlers/ErrorHandler';
import { getheaders } from '../handlers/Utils';
import { log, fetchLogs, toggleLogs, showlogs } from '../handlers/Logger';
import { fetchInterests } from './onBoarding'
import TokenManagerLibrary from '@skillsoft/token-manager-library'
import { samlKillSwitch } from '../NetworkApi/VersionSettings';

/*
	This Method checks if saml is one of the loginType.
	Then app requires auth0domain url and appid to form the saml url
	The auth0doman and appid is available in config of BFF, so we are doing
	this check.
 */

const checkForSAML = (domainresponse) => {

	let isSaml = domainresponse.some(samlobject => (samlobject.strategy === 'samlp' && samlobject.status === 'active'))
	if (isSaml) {
		let { auth0domain, appid } = config.data
		return [
			...domainresponse,
			{
				auth0domain,
				appid
			}
		]
	} else {
		return domainresponse
	}
}

/*
	check the version from the headers if it is false that means we are not supporting saml
	once if saml is not supported, we are filtering saml from the array and sends only auth0.
*/
const filterDomainObject = ( headers, domainObject ) => {
	const { appversion } = headers;	
	if ( samlKillSwitch(appversion) ) {
		return domainObject.filter( (eachConnection ) => eachConnection.strategy !== 'samlp' );
	}
	return checkForSAML(domainObject);
}

/*
	This is a get Request to lbe it will take
	domain from the app request { domain: percipio}
	and send request , result wil be as object and error will
	thrown from the middleware
 */
export const domainConnection = async (req, res, next) => {
	const { domain } = req.body;
	const { organizationurl } = config.data;
	const path = `${organizationurl}/api/subdomains/${domain}/connections`;
	log.i(`----Domain Check------`);
	log.i(`Path: ${path}`);
	log.i("Headers: ", req.headers);
	const domainobject = await axios.get(path, req.headers);
	const domainresult = filterDomainObject(req.headers, domainobject.data);
	res.format({
		'application/json': () => {
			res.json(domainresult);
		},
		'text/html': () => {
			fetchLogs((data) => {
				let showlogin = false;
				let showRender = false;
				let domainname = '';
				if (domainresult.length == 0) {
					showRender = true;
				} else {
					domainresult.map(function (response) {
						if (response.strategy === 'auth0') {
							showRender = true;
							showlogin = true;
							domainname = response.name;
						}
					});
				}
				if (showRender) {
					res.render('authentication', {
						logs: data,
						domain: domainname,
						logres: showlogs, showlogin: showlogin,
						domainpath: AppRoute.bff_sanity_domain,
						loginpath: AppRoute.bff_sanity_login,
						logspath: AppRoute.bff_sanity_log
					});
				}
			});
		}
	})
};


const getauthoData = async (req, res, next) => {
	const { username, password, domainname: realm } = req.body;
	const { appid: client_id, appSecretId:client_secret } = config.data;
	const params = {
		grant_type:'http://auth0.com/oauth/grant-type/password-realm',  
		username,
		password,
		audience: 'http://percipio.com/global',  
		scope: 'openid',
		client_id, 
		client_secret,
		realm
	};
	const authopath = `${config.data.auth0domain}/oauth/token`;
	try {
		log.i(`----Login Check------`);
		log.i(`Path: ${authopath}`);
		log.i("Headers: ", req.headers);
		log.i("Body: ", { ...params, password: ''}); //emptying password for logging only
	
		let auth0Result = await axios.post(authopath, params, req.headers);
		const percipioToken = await convertPercipioToken(auth0Result.data);
		auth0Result.data = {...auth0Result.data, id_token:percipioToken.id_token}
		return auth0Result.data;
	} catch (err) {
		log.e("ERROR", err);
		const error = err.response && err.response.data;
		next({
			message: error.message || error.error_description,
			exceptioninbff: false,
			errortype: 'nocustom',
		});
	}
};

//Converting Auth0 token to Percipio token
const convertPercipioToken = async(auth0Obj) => {
	const percipioInfo = await TokenManagerLibrary.exchange({
        ...auth0Obj,
        tokenManagerUrl: config.data.auth0proxyurl,
    });
	return ({ id_token: percipioInfo.percipioToken });
};

/*
	Converting Auth0 token to Percipio token of SAML
	This method is for supporting backward compatibility v1.0.3.
	This functionality is handling in `validateSAMLloginResponse` method.
*/
export const getPercipioToken = async (req, res) => {
	const { auth0Obj: auth0Obj } = req.body;
	const percipioToken = await convertPercipioToken(auth0Obj);
	res.json(percipioToken);
};

//Validating SAML login response and checks for License and onBorading
export const validateSAMLloginResponse = async (req, res) => {
	const { auth0Obj: auth0Obj } = req.body;
	//Auth0 token to Percipio token
	const { id_token: percipioToken } = await convertPercipioToken(auth0Obj);
	//Validating license and onBoarding
	const [licenceresult, onBoarding] = await Promise.all([
		getLicence(percipioToken),
		onBoardingCheck(percipioToken)
	]);

	const auth0result = {
		id:percipioToken,
		...licenceresult,
		onBoarding
	};

	res.json(auth0result);
};

export const logStatus = async (req, res) => {
	if (req.body.checkbox === undefined) {
		toggleLogs(false);
	} else {
		toggleLogs(true)
	}
	res.render('authentication', {
		logres: showlogs,
		domainpath: AppRoute.bff_sanity_domain,
		loginpath: AppRoute.bff_sanity_login,
		logspath: AppRoute.bff_sanity_log
	});

}

const getLicence = async (jwttoken) => {
	// Decoding jwt token to decoded token and get the organistion id
	const decodedtoken = await JwtHelper.decode(jwttoken);
	let { org_user_id } = decodedtoken;
	if (org_user_id === undefined) {
		Object.keys(decodedtoken).forEach(function (key) {
			if (key.includes('org_user_id')) {
				org_user_id = decodedtoken[key];
			}
		});
	}

	try {
		// creating a licencpath and pass the decodedorgid and authorization id
		const licensepath = `${config.data.endpoint}${AppRoute.license}${org_user_id}/connect`;
		const headers = await getheaders(jwttoken);
		log.i(`----Licence Check------`);
		log.i(`Path: ${licensepath}`);
		log.i("Headers: ", headers);
		log.i("Body: ", "");
		const licenceresult = await axios.post(licensepath, {}, { headers });
		return licenceresult.data
	} catch (e) {
		log.e("ERROR: ", e);
		return (e.response.data)
	}
}

export const loginRequest = async (req, res, next) => {
	let auth = await getauthoData(req, res, next);
	const { id_token: jwttoken, access_token, token_type } = auth;
	const [licenceresult, onBoarding] = await Promise.all([
		getLicence(jwttoken),
		onBoardingCheck(jwttoken)
	]);
	const auth0result = {
		id: jwttoken,
		token: access_token,
		type: token_type,
		...licenceresult,
		onBoarding
	};

	res.format({
		'application/json': () => {
			res.json(auth0result);
		},
		'text/html': () => {
			fetchLogs((data) => {
				res.render('authentication', {
					showlogin: true,
					logs: data,
					logres: showlogs,
					domainpath: AppRoute.bff_sanity_domain,
					loginpath: AppRoute.bff_sanity_login,
					logspath: AppRoute.bff_sanity_log
				})
			})
		},
	})
}

/*
	This method is for supporting backward compatibility v1.0.3.
	This functionality is handling in `validateSAMLloginResponse` method.
*/
export const getLicenceCheck = async (req, res, next) => {
	let { token: jwttoken } = req.body
	let licenceresult = await getLicence(jwttoken)
	res.json(licenceresult)

}

const onBoardingCheck = async (token) => {
	try {
		const headers = await getheaders(token);
		let interestsList = await fetchInterests(headers);
		return interestsList && interestsList.length > 0 ? false : true;
	} catch (e) {
		log.e("Catch ERROR: ", e);
		return false;
	}
}

//Forgot/Request_change password
export const reqChangePassword = async (req, res) => {
	const path = `${config.data.organizationurl}${AppRoute.changePassword}`;
	log.i(`----Forgot/change Password------`);
	log.i(`Path: ${path}`);
	log.i("Body: ", req.body);
	const passwordResult = await axios.post(path, req.body, {});
	res.json(passwordResult.data);
};