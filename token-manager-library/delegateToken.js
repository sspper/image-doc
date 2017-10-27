// Converting Master token to delegate token.
import {values} from 'lodash'
import TokenManagerLibrary from '@skillsoft/token-manager-library'
import config from '../Network/config.json'

const delegationServiceId = {
    learner: config.data.lbeid,
    org: config.data.organizationsid,
    roles: config.data.organizationsid
}

export class DelegationError {
    constructor(error) {
        const {message} = error
        this.error = error
        this.message = message
    }
}


module.exports = {
    delegationToken: async function (authorizationToken) {
        const tokenManagerInstance = new TokenManagerLibrary(config.data.auth0proxyurl, [...new Set(values(delegationServiceId))], authorizationToken)

        const serviceId = delegationServiceId['learner']

        if (!serviceId) {
            throw new Error(`Unknown delegation token requested for: ${serviceId}`);
        }

        try {
            const token = await tokenManagerInstance.delegationTokenFor(serviceId)
            return {
              authorization: token,
            }
        } catch (err) {
            throw new DelegationError(err)
        }
    }
};
