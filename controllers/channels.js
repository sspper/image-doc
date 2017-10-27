import axios from 'axios';
import config from '../Network/config.json';
import AppRoute from '../NetworkApi/Paths';
import { catchErrors } from '../handlers/ErrorHandler';
import { getheaders } from '../handlers/Utils';
import { log } from '../handlers/Logger';


const defaultchannelviewresponse = (channelDetails, defaultChannelView, channelViewContents) => {
	const [books = [], audioBook = [], course = []] = channelViewContents;
	const response = {
		channelDetails,
		defaultView: {
			...defaultChannelView,
			books,
			course,
			audioBook,
		},
	};
	return response;
};

const getBooks = async (id, headers) => {
	const bookpath = `${config.data.endpoint}${AppRoute.channelview}${id}/books`;
	log.i(`----getBooks Check------`);
	log.i(`Path: ${bookpath}`);
	const bookresults = await axios.get(bookpath, { headers });
	return bookresults.data;
};

const getAudioBooks = async (id, headers) => {
	const audiopath = `${config.data.endpoint}${AppRoute.channelview}${id}/audiobooks`;
	log.i(`----getAudioBooks Check------`);
	log.i(`Path: ${audiopath}`);
	const bookresults = await axios.get(audiopath, { headers });
	return bookresults.data;
};

const getCourses = async (id, headers) => {
	const coursepath = `${config.data.endpoint}${AppRoute.course}?channel_view_id=${id}`;
	log.i(`----getCourses Check------`);
	log.i(`Path: ${coursepath}`);
	const courseresults = await axios.get(coursepath, { headers });
	return courseresults.data;
};

const fetchChannelViewData = async (id, headers) => {
	const channelviewpath = `${config.data.endpoint}${AppRoute.channelview}${id}`;
	log.i(`----fetchChannelViewData Check------`);
	log.i(`Path: ${channelviewpath}`);
	log.i("Headers: ", headers);
	const channelresult = await axios.get(channelviewpath, { headers });
	const { id: channelviewid } = channelresult.data;

	const results = await Promise.all([
		getBooks(channelviewid, headers),
		getAudioBooks(channelviewid, headers),
		getCourses(channelviewid, headers),
	]);
	return results;
};

export const getDefaultChannels = async (req, res) => {
	const { authorization } = req.headers;
	const headers = await getheaders(authorization);

	const { channelId } = req.params;

	const channelPath = `${config.data.endpoint}${AppRoute.channel}${channelId}`;
	log.i(`----getDefaultChannels Check------`);
	log.i(`Path: ${channelPath}`);
	log.i("Headers: ", headers);
	const channelResults = await axios.get(channelPath, { headers });
	const channelDetails = channelResults.data;

	// get the default channel view from the above Results
	const { channelViews } = channelDetails;
	const defaultChannelViews = channelViews.filter(channelview => (channelview.default === true));

	const [defaultChannelView] = defaultChannelViews;
	if (defaultChannelView) {
		const { id } = defaultChannelView;
		const finalresult = await fetchChannelViewData(id, headers);
		const channelviewdata = defaultchannelviewresponse(
			channelDetails, defaultChannelView, finalresult);
		res.json(channelviewdata);
	} else {
		res.json({
			channelDetails,
			defaultView: {},
		});
	}
};

export const getChannelViewData = async (req, res) => {
	const { authorization } = req.headers;
	const headers = await getheaders(authorization);

	const { channelViewId } = req.params;
	const finalresult = await fetchChannelViewData(channelViewId, headers);
	const [books, audioBook, course] = finalresult;
	res.json({
		defaultView: {
			books,
			course,
			audioBook,
		},
	});
};