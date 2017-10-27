import axios from 'axios';
import AppRoute from '../NetworkApi/Paths';
import config from '../Network/config.json';
import { catchErrors } from '../handlers/ErrorHandler';
import { getheaders } from '../handlers/Utils';
import { log } from '../handlers/Logger';


export const getStartedContent = async (headers) => {
	const startedContentPath = `${config.data.endpoint}${AppRoute.startedcontent}`;
	log.i(`Path: ${startedContentPath}`);
	const resumeLearningResult = await axios.get(startedContentPath, { headers });

	const getEachItemForResumeLearning = async (eachitem, headers) => {
		const { id, type } = eachitem;
		const eachItemResult = await
     axios.get(`${config.data.endpoint}${AppRoute[type]}${id}`, { headers });
		return eachItemResult.data;
	};

	const contents = resumeLearningResult.data.map(item =>
    getEachItemForResumeLearning(item, headers)
  );

	const startedContentsresult = await Promise.all(contents);

	return startedContentsresult;
};

export const getRecentlyViewedList = async (req, res) => {
	const { authorization } = req.headers;
	const headers = await getheaders(authorization);
	log.i(`----getRecentlyViewedList Check------`);
	log.i("Headers: ", headers);
	const recentlyViewed = await getStartedContent(headers);
	res.json(recentlyViewed);
};
