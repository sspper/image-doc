import axios from 'axios';
import config from '../Network/config.json';
import AppRoute from '../NetworkApi/Paths';
import { catchErrors } from '../handlers/ErrorHandler';
import { getheaders } from '../handlers/Utils';
import { log } from '../handlers/Logger';

export const fetchSearchResults = async (req, res) => {
	const { searchString: q, page, per_page, filter = '' } = req.query;

	const { authorization } = req.headers;
	const headers = await getheaders(authorization);

	const params = { q, page, per_page, filter };
	const searchPath = `${config.data.endpoint}${AppRoute.search}`;
	log.i(`----fetchSearchResults Check------`);
	log.i(`Path: ${searchPath}`);
	log.i("Headers: ", { params, headers });
	const searchResult = await axios.get(searchPath, { params, headers });
	res.json(searchResult.data);
};

//Search suggestions
export const fetchSearcSuggestionhResults = async (req, res) => {
	const { searchSuggestionString: q = '' } = req.query;
	const { authorization } = req.headers;
	const headers = await getheaders(authorization);
	const params = { q };
	const searchSuggestionPath = `${config.data.endpoint}${AppRoute.search_suggestions}`;
	log.i(`----fetchSearcSuggestionhResults Check------`);
	log.i(`Path: ${searchSuggestionPath}`);
	log.i("Headers: ", { params, headers });
	const searchSuggestionResult = await axios.get(searchSuggestionPath, { params, headers });
	let searchSuggestionResults = searchSuggestionResult.data.terms ? searchSuggestionResult.data.terms : [];
	res.json(searchSuggestionResults);
};