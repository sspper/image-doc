import { versionSettings } from '../NetworkApi/VersionSettings';
import { log } from '../handlers/Logger';


export const appSettings = async (req, res, next) => {
    const appVer = req.body.appVersion;
    log.i(`----appSettings Check------`);
    log.i(`body ${appVer}`);
    const result = getApiVersion(appVer);
    log.i("appSettings result: ", result);
    res.json(result);
}

const getApiVersion = (appvers) => {
    const result = versionSettings.filter((item) => {
        return item.appversion.includes(appvers);
    });

    const [ versionArray=[] ] = result;
    const { apiVersion="", updateAvailable=false } = versionArray;
    const forceUpdate = apiVersion === ""?true:false;
    return responseJson(apiVersion, updateAvailable, forceUpdate);
}

const responseJson = (apiVersion, updateAvailable, forceUpdate) => {
    return ({
        apiVersion,
        forceUpdate,
        updateAvailable
    })
}