import axios from "axios";
import config from "../Network/config.json";
import AppRoute from "../NetworkApi/Paths";
import { catchErrors } from "../handlers/ErrorHandler";
import { getheaders } from "../handlers/Utils";
import { log } from "../handlers/Logger";

const DefaultCount = 2;

export const getAreas = async (req, res) => {
  const { authorization } = req.headers;
  const headers = await getheaders(authorization);
  const { interest } = req.query;
  log.i(`----getAreas Check------`);
  log.i("Headers: ", headers);
  log.i("Params: ", req.query);
  const path = `${config.data.endpoint}${AppRoute.areas}`;
  const areasList = await fetchAreas(headers);
  let interestsList = [];
  if (interest) {
    interestsList = await fetchInterests(headers);
  }
  res.json({ areas: areasList, interest: interestsList });
};

const fetchAreas = async headers => {
  const path = `${config.data.endpoint}${AppRoute.areas}`;
  log.i(`Path: ${path}`);
  const areasList = await axios.get(path, { headers });
  return areasList.data;
};
export const addInterests = async (req, res) => {
  log.i(`----addInterests Check------`);
  const { authorization } = req.headers;
  const headers = await getheaders(authorization);
  const { body: { uuids = [] } = {} } = req;
  log.i("Headers: ", headers);
  log.i("body: ", uuids);
  const path = `${config.data.endpoint}${AppRoute.interests}`;
  const interestAddResponse = await axios.post(path, { uuids }, { headers });
  res.json(interestAddResponse.data);
};
export const retrieveInterests = async (req, res) => {
  log.i(`----retrieveInterests Check------`);
  const { authorization } = req.headers;
  const headers = await getheaders(authorization);
  log.i("Headers: ", headers);
  const interestsList = await fetchInterests(headers);
  res.json({ interests: interestsList });
};

export const fetchInterests = async headers => {
  log.i(`----fetchInterests------`);
  const path = `${config.data.endpoint}${AppRoute.interests}`;
  log.i(`Path: ${path}`);
  const interestsList = await axios.get(path, { headers });
  return processInterestData(interestsList.data);
};

const processInterestData = data => {
  return data.map(value => value.uuid);
};

//Endpoint for recommendations
//Query params: page,pageCount
//If we don't send pageCount query param it sends default pageCount which is 2
//If we don't send page query param it send all the items.
export const recommendations = async (req, res) => {
  log.i(`----recommendations------`);
  const { authorization } = req.headers;
  const headers = await getheaders(authorization);
  log.i("Headers: ", headers);
  const { page = 0, pageCount = 0 } = req.query;
  log.i("Query params: ", req.query);
  const recommendationList = await fetchrecommendations(headers);
  let totalPages = calTotalPages(recommendationList, pageCount);
  if (page > totalPages) {
    return res.json({ recommendations: [], totalCount: totalPages });
  } else {
    const list = await fetchRecommendedItems(recommendationList, headers,page,pageCount,totalPages);
    return res.json({ recommendations: list, totalPages ,page});
  }
};

//axios call for fetching recommendations
export const fetchrecommendations = async headers => {
  const path = `${config.data.endpoint}${AppRoute.recommendations}`;
  log.i(`Path: ${path}`);
  const recommendationList = await axios.get(path, { headers });
  return recommendationList.data;
};

//base method to fetch all the items for recommended items
export const fetchRecommendedItems = async (data, headers,page,pageCount,totalPages) => {
  const areas = await fetchAreas(headers);
  let newData = [];
  let start = 0;
  let end = data.length;
  if(page > 0 && totalPages > 1){
    end = (pageCount || DefaultCount) * page;
    start = end - (pageCount || DefaultCount);
    end = totalPages == page? data.length: end;
  }
  log.i("Range ", {start:start,end:end});
  for (let i = start; i < end; i++) {
    let { id, items } = data[i];
    const interest = fetchRecommendationInterestInfo(areas, id);
    let result = await recommendationsPromise(items, headers);
    data[i].items = result;
    data[i] = { items: result, ...interest };
    newData.push(data[i]);
  }
  return newData;
};

//returns the interest info based on interest id
const fetchRecommendationInterestInfo = (data, id) => {
  let interest = undefined;
  for (let item = 0; item < data.length; item++) {
    const { subjects } = data[item];
    interest = subjects.find(item => item.id === id);
    if (interest) {
      break;
    }
  }
  return interest;
};

// promise to fetch all interest
const recommendationsPromise = async (itemArray, headers) => {
  const newItems = await Promise.all(
    itemArray.map(item => {
      return eachRecommendedItem(item, headers);
    })
  );
  return newItems;
};

//fetch all items of a specific interest
const eachRecommendedItem = async (each, headers) => {
  const { type, id } = each;
  const path = `${config.data.endpoint}${AppRoute[type.toLowerCase()]}${id}`;
  const response = await axios.get(path, { headers });
  return response.data;
};

const calTotalPages = (list, pageCount) => {
  if (!list || list.length <= 0) {
    return 0;
  }
  let tPages = list.length / (pageCount || DefaultCount);
  return Math.ceil(tPages);
};