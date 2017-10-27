import axios from 'axios';
import JwtHelper from 'jsonwebtoken';
import config from '../Network/config.json';
import AppRoute from '../NetworkApi/Paths';
import { catchErrors } from '../handlers/ErrorHandler';
import { getheaders } from '../handlers/Utils';
import { log } from '../handlers/Logger';
import { assessment } from './assessments.js'
const make = async (path, headers) => {
	try {
		log.i(`Path: ${path}`);
		const result = await axios.get(path, { headers });
		return result.data;
	} catch (e) {
		let error = {
			message: e.message,
			exceptioninbff: false,
			status: e.status,
			statusText: e.statustext,
			errortype: 'custom'
		};
		log.e("ERROR: ", error);
		return error;
	}
};
const getDataForEachVideo = async (eachVideo, courseId, headers) => {
	const { id: videoid } = eachVideo;
	const eachVideopath = `${config.data.endpoint}${AppRoute.course}${courseId}/videos/${videoid}`;
	try {
		const result = await axios.get(eachVideopath, { headers });
		return result.data;
	} catch (e) {
		let error = {
			message: e.message,
			exceptioninbff: false,
			stack: e.stack,
			errortype: 'custom',
		}
		log.e("ERROR: ", error);
		return error;
	}
};
export const getCourse = async (req, res, next) => {
	const { courseid: courseId, authorization } = req.headers;
	const headeroptions = await getheaders(authorization);
	log.i(`----getCourse Check------`);
	log.i("Headers: ", headeroptions);
	const coursePath = `${config.data.endpoint}${AppRoute.course}${courseId}`;
	const videoPath = `${config.data.endpoint}${AppRoute.course}${courseId}/videos`;
	const [course, videos] = await Promise.all([
		make(coursePath, headeroptions),
		make(videoPath, headeroptions),
	]);

	const { message: courseError, assessmentTestId } = course;
	if (courseError) {
		next(course);
	}
	
	let assessmentDetails;
	if(assessmentTestId){
		assessmentDetails = await assessment(assessmentTestId,headeroptions);
	}
	const { message: videoError } = videos;
	if (!videoError) {
		const videolist = await Promise.all(
			videos.map(eachVideo => getDataForEachVideo(eachVideo, courseId, headeroptions))
		);
		const courseResult = {
			...course,
			assessmentDetails,
			videos: videolist,
		};
		res.json(courseResult);
	} else {
		res.json(course);
	}
};

export const saveVideo = async (request, res) => {
	const { videoid: VideoId, authorization } = request.headers;
	const headers = await getheaders(authorization);
	const path = `${config.data.endpoint}${AppRoute.video}${VideoId}/save`;
	const data = {
		startCuePoint: request.body.start,
		endCuePoint: request.body.end,
		courseId: request.body.course_id
	};
	log.i(`----saveVideo Check------`);
	log.i(`Path: ${path}`);
	log.i("Headers: ", headers);
	log.i("Body: ", data);
	const saveVideoResult = await axios.post(path, data, { headers });
	res.json(saveVideoResult.data);
};
