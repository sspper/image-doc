import axios from 'axios';
import config from '../Network/config.json';
import AppRoute from '../NetworkApi/Paths';
import { catchErrors } from '../handlers/ErrorHandler';
import { getheaders } from '../handlers/Utils';


 const getEachQuestion = async (challengeid, questionnum, headers) => {
	const path = `${config.data.endpoint}${AppRoute.assessment}challenges/${challengeid}/questions/${questionnum}`;
	const questiondetails = await axios.get(path,{headers});
	return questiondetails;
 }

export const getQuestion  = async (req, res) => {
	const { authorization } = req.headers;
	const {challengeid,questionnum} = req.query;
	const headers = await getheaders(authorization);

	const response = await getEachQuestion(challengeid,questionnum,headers)
	res.json(response.data);
}

export const getAnswers = async (req, res) => {
	let response = {
		previous:'',
		current:'',
		next:''
	}
	const { authorization } = req.headers;
	const {challengeid} = req.query;
	const headers = await getheaders(authorization);
	const {previous,current,next} = req.params;

	if(previous)
		response.previous = await getEachQuestion(challengeid,previous,headers);
	if(current)
		response.current = await getEachQuestion(challengeid,current,headers);
	if(next)
		response.next = await getEachQuestion(challengeid,next,headers);

	res.json(response);
}

export const submission = async (req, res) => {
	const { authorization } = req.headers;
	const headers = await getheaders(authorization);
	const {challengeid,questionnum}= req.query;
	const path = `${config.data.endpoint}${AppRoute.assessment}challenges/${challengeid}/questions/${questionnum}/submission`
	const response = await axios.post(path,req.body,{headers});
	//res.json(response.data);
	const newrewp = await getCorrection(challengeid,questionnum,headers);
	res.json(newrewp.data);
}

 const getCorrection = async (challengeid, questionnum, headers) => {
	const path = `${config.data.endpoint}${AppRoute.assessment}challenges/${challengeid}/questions/${questionnum}/correction`;
	const questiondetails = await axios.get(path,{headers});
	return questiondetails;
 }



//Creating challenge
export const createChallenge  = async (req, res) => {
	const { authorization } = req.headers;
	const headers = await getheaders(authorization);
	const {assessmentid} = req.query;

	const challenge = await createNewChallenge(assessmentid, headers,req);
	res.json(challenge);
}

const createNewChallenge = async (assessmentid,headers,req) =>{
	const path = `${config.data.endpoint}${AppRoute.assessment}${assessmentid}/challenges`;
	const challenge = await axios.post(path,req.body,{headers});
	return challenge.data;
}


//Getting challenge details
export const getChallengeDetails = async (req, res) => {
	const { authorization } = req.headers;
	const headers = await getheaders(authorization);
	const { challengeid } = req.query;

	const challengeDetails = await getChallenge(challengeid,headers);
	res.json(challengeDetails);
};

const getChallenge = async (challengeid,headers) =>{
	const path = `${config.data.endpoint}${AppRoute.assessment}challenges/${challengeid}`
	const challengeDetails = await axios.get(path,{headers});
	return challengeDetails.data;
}

//Getting Assessment details
export const getAssessmentDetails = async (req, res) => {
	let response = {
		assessment:'',
		challenge:'',
	}
	const { authorization } = req.headers;
	const headers = await getheaders(authorization);
	const { id } = req.query;
	
	response.assessment = await assessment(id, headers);
	const { activeChallengeId } = response.assessment;
	if(activeChallengeId === null){
		const {id:assessmentid} = response.assessment;
		response.challenge = await createNewChallenge(assessmentid,headers,req);
	} else {
		response.challenge = await getChallenge(activeChallengeId,headers);
	}

	res.json(response);
}

export const assessment = async (assessmentId, headers) => {
	const path = `${config.data.endpoint}${AppRoute.assessment}${assessmentId}`

	const assessmentDetails = await axios.get(path,{headers});
	return assessmentDetails.data;
}


export const getAssessment = async (req, res) => {
	let response = null
	const { authorization } = req.headers;
	const headers = await getheaders(authorization);
	const { id: assessmentId } = req.query;
	response  = await assessment(assessmentId, headers);

	res.json(response);
}