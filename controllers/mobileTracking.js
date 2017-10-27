import axios from 'axios';
import AppRoute from '../NetworkApi/Paths';
import config from '../Network/config.json';
import { catchErrors } from '../handlers/ErrorHandler';
import { getheaders } from '../handlers/Utils';
import { log } from '../handlers/Logger';

const triggerEachEvent = async (eachEvent, headers) => {
    const { eventType, pageType, itemId: objectId = '', pagePath, previousPath: exitPath, userAgent, duration = 0 ,customParams = {}} = eachEvent;
    const reportType = (eventType === 'pageview') ? 'page_view' : 'duration';
    const params = {
        pageType,
        objectId,
        exitPath,
        pagePath,
        userAgent,
        duration,
        reportType,
        pageUrl: pagePath,
        ...customParams
    };
    try {
        const utsresult = await axios.post(`${config.data.endpoint}${AppRoute.reporting}`, { ...params }, { headers });
        return utsresult.data;
    } catch (e) {
         log.e("ERROR: ", e);
        return {
            message: e.message,
            exceptioninbff: false,
            stack: e.stack,
            errortype: 'custom'
        };
    }
};

export const makeEvents = async (req, res, next) => {
    const { authorization } = req.headers;
    const { body } = req;
    const headers = await getheaders(authorization);
    if (!body) {
        next({
            message: 'Body cannot be Empty',
            exceptioninbff: true,
            errortype: 'custom'
        });
    } else {
        const resultList = await Promise.all(
            body.map(eachEvent => triggerEachEvent(eachEvent, headers))
        );
        res.json(resultList);
    }
};
