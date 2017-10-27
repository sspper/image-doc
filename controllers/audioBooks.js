import axios from 'axios';
import config from '../Network/config.json';
import AppRoute from '../NetworkApi/Paths';
import { catchErrors } from '../handlers/ErrorHandler';
import { getheaders } from '../handlers/Utils';
import { log } from '../handlers/Logger';


function getSecondsFromTime(time) {
	//  'hh:mm:ss'   // your input string
	const a = time === undefined ? 0 : time.split(':');
	let seconds = 0;
	if (a.length === 3) {
		seconds = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]);
	} else if (a.length === 2) {
		seconds = (+a[0]) * 60 + (+a[1]);
	} else {
		seconds = a[0];
	}
	return seconds;
}

function formatChapters(chapters) {
	const formattedChapter = [];
	const duration = getSecondsFromTime(chapters[chapters.length - 1].timeCode);

	for (let i = 0; i < chapters.length; i += 1) {
		const nextChapter = chapters[i + 1] || chapters[i];
		const time = getSecondsFromTime(chapters[i].timeCode);

		formattedChapter.push({
			...chapters[i],
			start: i === 0 ? 0 : time,
			end: i === chapters.length - 1 ? duration : getSecondsFromTime(nextChapter.timeCode),
		});
	}

	return formattedChapter;
}

const fetchAudioBook = async (headers, audiobookid) => {
	const audioPath = `${config.data.endpoint}${AppRoute.audiobook}${audiobookid}`;
	try {
		log.i(`----fetchAudioBook Check------`);
		log.i(`Path: ${audioPath}`);
		log.i("Headers: ", headers);
		const audioBook = await axios.get(audioPath, { headers });
		return audioBook.data;
	} catch (error) {
		log.e("ERROR", error);
		return {
			message: error.message,
			status: error.status,
			errortype: 'custom'
		};
	}
};

const fetchAudioBookChapters = async (headers, audiobookid) => {
	const chaptersPath = `${config.data.endpoint}${AppRoute.audiobook}${audiobookid}/chapters`;

	try {
		log.i(`----fetchAudioBookChapters Check------`);
		log.i(`Path: ${chaptersPath}`);
		log.i("Headers: ", headers);
		const chapters = await axios.get(chaptersPath, { headers });
		return chapters.data;
	} catch (error) {
		log.e("ERROR", error);
		return {
			message: error.message,
			exceptioninbff: false,
			status: error.status,
			errortype: 'custom'
		};
	}
};

export const getAudioBook = async (req, res, next) => {
	const { authorization } = req.headers;
	const headers = await getheaders(authorization);

	const { id: audiobookid } = req.query;

	const [AudioDetails, audioBookChapters] = await Promise.all([
		fetchAudioBook(headers, audiobookid),
		fetchAudioBookChapters(headers, audiobookid),
	]);

	const { message: audioBookError } = AudioDetails;
	if (audioBookError) {
		next(AudioDetails);
	}

	const { message: chapterErrors } = audioBookChapters;
	if (chapterErrors) {
		next(audioBookChapters);
	}

	const Chapters = formatChapters(audioBookChapters);

	res.json({
		AudioDetails,
		Chapters,
	});
};


export const saveAudioBook = async (req, res) => {
	const { authorization } = req.headers;
	const headers = await getheaders(authorization);

	const { id: audiobookid } = req.query;

	const savePath = `${config.data.endpoint}${AppRoute.audiobook}${audiobookid}/save`;

	const { start: startCuePoint, end: endCuePoint } = req.body;
	log.i(`----saveAudioBook Check------`);
	log.i(`Path: ${savePath}`);
	log.i("Headers: ", headers);
	log.i("Body: ", { startCuePoint, endCuePoint });
	await axios.post(savePath, { startCuePoint, endCuePoint }, { headers });
	res.json('success');
};
