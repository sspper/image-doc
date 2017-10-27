import axios from 'axios';
import ip from 'ip';
import AppRoute from '../NetworkApi/Paths';
import config from '../Network/config.json';
import { catchErrors } from '../handlers/ErrorHandler';
import { getheaders } from '../handlers/Utils';
import { log } from '../handlers/Logger';

const leftPad = number => ((number < 10 && number >= 0) ? '0' : '') + number;


const minTOHours = (minut) => {
	try {
		const minutes = parseInt(minut);
		let sign = '';
		if (minutes < 0) {
			sign = '-';
		}
		const hours = leftPad(Math.floor(Math.abs(minutes) / 60));
		const minuteses = leftPad(Math.abs(minutes) % 60);
		return `${sign + hours}m ${minuteses}s`;
	} catch (e) {
		return '';
	}
};

const playlistObjectToReturn = (playlistitem, responseitem) => {
	const ipAddress = ip.address();
	const defaultUrl = `http:/${ipAddress.trim()}:3000/image_notfound.png`;
	const { itemId, id: pinId, createdAt, itemType } = playlistitem;
	const { channelId, rating } = responseitem;
	const { context:{courseId=null}={} } = playlistitem; 
	const { coverImageUrl, imageUrl, durationInMinutes, duration, title, description, completionStatus = '',videoCount,authors } = responseitem;

	const finalduration = durationInMinutes || duration || 0;
	const convertedduration = minTOHours(finalduration);
	
	return {
		itemId,
		pinId,
		createdAt,
		itemType,
		visualUrl: coverImageUrl || imageUrl || defaultUrl,
		title,
		description,
		completionStatus,
		duration: convertedduration,
		channelId,
		courseId,
		videoCount,
		authors,
		rating
	};
};

export const getPlaylistData = async (playlist, headers) => {
	const { itemType, itemId, context } = playlist;

	// converting each Item tpe to lowercase for forming a path from paths.js
	const itemtype = itemType.toLowerCase();

	try {
		let itemPath = '';
		if (itemtype === 'video') {
			itemPath = `${config.data.endpoint}/v1/courses/${context.courseId}/videos/${itemId}`;
		} else {
			// apart from video every url is of same path types so interpolated the string
			itemPath = `${config.data.endpoint}${AppRoute[itemtype]}${itemId}`;
		}

		/*
			 * After forming paths will do the network call
			 * If its channelView I will take the channelid from first request
		 */
		const playItemResponse = await axios.get(itemPath, { headers });

		if (itemtype === 'channelview') {
			const { channelId } = playItemResponse.data;
			const channelPath = `${config.data.endpoint}${AppRoute.channel}${channelId}`;
			const channelresponse = await axios.get(channelPath, { headers });
			const finalchannelData = {
				...channelresponse.data,
				channelId,
			};
			return playlistObjectToReturn(playlist, finalchannelData);
		}

		return playlistObjectToReturn(playlist, playItemResponse.data);
	} catch (error) {
		let err = {
			error: error.message,
			exceptioninbff: false,
			playlistobject: playlist,
		}
		log.i("ERROR: ", err);
		return err;
	}
};

export const getFavList = async (headers, perPage, pageCount) => {
	const playlistPath = `${config.data.endpoint}${AppRoute.pins}?page=${perPage}&per=${pageCount}`;
	log.i(`----getFavList Check------`);
	log.i(`Path: ${playlistPath}`);
	log.i("Headers: ", headers);
	const playlistresult = await axios.get(playlistPath, { headers });

	const playlists = await Promise.all(
		playlistresult.data.map(playlist => getPlaylistData(playlist, headers))
	);
	return playlists;
};

export const getFavourites = async (req, res) => {
	const { page, per: pageCount } = req.query;

	const { authorization } = req.headers;
	const headers = await getheaders(authorization);

	const favourites = await getFavList(headers, page, pageCount);
	res.json(favourites);
};

export const unpinPlaylist = async (req, res) => {
	const { id } = req.params;

	const { authorization } = req.headers;
	const headers = await getheaders(authorization);

	const unpinpath = `${config.data.endpoint}${AppRoute.pins}/${id}`;
	log.i(`----unpinPlaylist Check------`);
	log.i(`Path: ${unpinpath}`);
	log.i("Headers: ", headers);
	const unpinresponse = await axios.delete(unpinpath, { headers });
	res.json(unpinresponse.data);
};

export const pinPlaylist = async (req, res) => {
	const { id } = req.params;
	const { itemType } = req.query;

	const { authorization } = req.headers;
	const headers = await getheaders(authorization);


	const itemtype = itemType.toLowerCase();
	const pinpath = `${config.data.endpoint}${AppRoute[itemtype]}${id}/pins`;
	log.i(`----pinPlaylist Check------`);
	log.i(`Path: ${pinpath}`);
	log.i("Headers: ", headers);
	const pinresponse = await axios.post(pinpath, req.body, { headers });

	res.json(pinresponse.data);
};