import axios from 'axios';
import { catchErrors } from '../handlers/ErrorHandler';
import config from '../Network/config.json';
import AppRoute from '../NetworkApi/Paths';
import { getheaders } from '../handlers/Utils';
import { log } from '../handlers/Logger';

export const getPopularChannels = async (headers) => {
	const popularPath = `${config.data.endpoint}${AppRoute.popular}`;
	log.i(`Path: ${popularPath}`);
	const popularresult = await axios.get(popularPath, { headers });
	return popularresult.data;
};

export const getPopularChannelsList = async (req, res) => {
	const { authorization } = req.headers;
	const headers = await getheaders(authorization);
	log.i(`----getPopularChannelsList Check------`);
	log.i("Headers: ", headers);
	const popularchannels = await getPopularChannels(headers);
	res.json(popularchannels);
};
