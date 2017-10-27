import axios from 'axios';
import config from '../Network/config.json';
import AppRoute from '../NetworkApi/Paths';
import { catchErrors } from '../handlers/ErrorHandler';
import { getheaders } from '../handlers/Utils';
import { log } from '../handlers/Logger';


export const getBooks = async (req, res) => {
	const { id: bookid } = req.params;

	const { authorization } = req.headers;
	const headers = await getheaders(authorization);

	const bookpath = `${config.data.endpoint}${AppRoute.channelview}${bookid}/books`;
	log.i(`----getBooks Check------`);
	log.i(`Path: ${bookpath}`);
	log.i("Headers: ", headers);
	const bookslist = await axios.get(bookpath, { headers });
	res.json(bookslist.data);
};

export const getBookOverview = async (req, res) => {
	const { id: bookid } = req.params;

	const { authorization } = req.headers;
	const headers = await getheaders(authorization);

	const bookoverviewpath = `${config.data.endpoint}${AppRoute.book}${bookid}`;
	log.i(`----getBookOverview Check------`);
	log.i(`Path: ${bookoverviewpath}`);
	log.i("Headers: ", headers);
	const bookoverviewresult = await axios.get(bookoverviewpath, { headers });
	res.json(bookoverviewresult.data);
};

const trackbook = async ({ start: start_cfi, end: end_cfi }, headers, bookid) => {
	const trackpath = `${config.data.endpoint}${AppRoute.book}${bookid}/track`;
	log.i(`----trackbook Check------`);
	log.i(`Path: ${trackpath}`);
	log.i("Body: ", { start_cfi, end_cfi });
	const trakresult = await axios.post(trackpath, { start_cfi, end_cfi }, { headers });
	return trakresult.data;
};

const updatebook = async ({ start: last_cfi }, headers, bookid) => {
	const updatepath = `${config.data.endpoint}${AppRoute.book}${bookid}/update`;
	log.i(`----updatebook Check------`);
	log.i(`Path: ${updatepath}`);
	log.i("Body: ", { last_cfi });
	const updateresult = await axios.post(updatepath, { last_cfi }, { headers });
	return updateresult.data;
};


export const updateBook = async (req, res) => {
	const { id: bookid } = req.params;

	const { authorization } = req.headers;
	const headers = await getheaders(authorization);
	log.i(`----saveBook Check------`);
	log.i("Headers: ", headers);
	await Promise.all([
		trackbook(req.body, headers, bookid),
		updatebook(req.body, headers, bookid),
	]);
	res.json('');
};
