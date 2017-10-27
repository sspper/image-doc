import axios from 'axios';
import AppRoute from '../NetworkApi/Paths';
import config from '../Network/config.json';
import { getheaders } from '../handlers/Utils';
import { log } from '../handlers/Logger';

export const addRating = async (req, res) => {
	const { authorization } = req.headers;
	const headers = await getheaders(authorization);
	console.log("===>"+req.body);
	const ratingpath = `${config.data.endpoint}${AppRoute.contentrating}`;
	log.i(`----addRating Check------`);
	log.i(`Path: ${ratingpath}`);
	log.i("Headers: ", headers);
	const ratingresponse = await axios.post(ratingpath, req.body, { headers });

	res.json(ratingresponse.data);
};

export const removeRating = async (req, res) => {
    const { assetid } = req.query;

	const { authorization } = req.headers;
	const headers = await getheaders(authorization);

	const ratingpath = `${config.data.endpoint}${AppRoute.contentrating}/${assetid}`;
	log.i(`----removeRating Check------`);
	log.i(`Path: ${ratingpath}`);
	log.i("Headers: ", headers);
	const ratingresponse = await axios.delete(ratingpath, { headers });
	res.json(ratingresponse.data);
};

