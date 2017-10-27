import { catchErrors } from '../handlers/ErrorHandler';
import { getheaders } from '../handlers/Utils';
import { getFavList } from './playlists';
import { getPopularChannels } from './popularChannels';
import { getStartedContent } from './resumeLearning';
import { assignmentList } from './assignments';
import { log } from '../handlers/Logger';

const fetchPopularChannels = async (headers) => {
	const popularchannels = await getPopularChannels(headers);
	return popularchannels;
};

const fetchStartedContent = async (headers) => {
	const startedcontents = await getStartedContent(headers);
	return startedcontents;
};

const getFavorite = async (headers) => {
	const playlists = await getFavList(headers, 1, 10);
	return playlists;
};

const getAssignments = async (headers) => {
	const assigments = await assignmentList("all", headers);
	return assigments;
};

export const getHomeData = async (req, res, next) => {

	const { authorization } = req.headers;
	const headers = await getheaders(authorization);
	log.i(`----getHomeData Check------`);
	log.i("Headers: ", headers);
	const result = await Promise.all([
		fetchPopularChannels(headers),
		fetchStartedContent(headers),
		getFavorite(headers),
		getAssignments(headers)]);

	res.json(result);
};