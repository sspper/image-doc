import axios from 'axios';
import AppRoute from '../NetworkApi/Paths';
import config from '../Network/config.json';
import { getPlaylistData } from '../controllers/playlists';
import { catchErrors } from '../handlers/ErrorHandler';
import { getheaders } from '../handlers/Utils';
import { log } from '../handlers/Logger';

export const fetchAssignmentList = async (req, res, next) => {
    const { authorization } = req.headers;
    const { state } = req.params;
    const headers = await getheaders(authorization);
    log.i(`----fetchAssignmentList------`);
    const assignments = await assignmentList(state, headers);
    res.json(assignments);
}

export const assignmentList = async (state, headers) => {
    const path = `${config.data.endpoint}${AppRoute.assignment_list}?state=${state}`;
    log.i(`path = ${path}`);
    const assignments = await axios.get(path, { headers });
    return assignments.data;
}

export const fetchAssignmentListDetails = async (req, res, next) => {
    const { authorization } = req.headers;
    const { state } = req.params;
    const { id } = req.query;
    const headers = await getheaders(authorization);
    log.i(`----fetchAssignmentList------`);
    let assignments = await assignmentList(state, headers);
    log.i(`----fetchAssignmentListDetails------`);
    for (let i = 0; i < assignments.length; i++) {
        if (!id || id == assignments[i].id) {
            const items = await fetchContentItems(assignments[i].contentItems, headers)
            assignments[i].items = items;
        }
    }
    res.json(assignments);
}

export const fetchContentItems = async (contentItemArr, headers) => {

    const contentItems = await Promise.all(contentItemArr.map(item => {
        return getPlaylistData({ itemType: item.contentType, itemId: item.contentId }, headers)
    }))
    return contentItems;

}

