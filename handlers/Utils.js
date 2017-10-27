import delegateToken from '../token-manager-library/delegateToken';

export const getheaders = async (jwttoken) => {
	const delegatedToken = await delegateToken.delegationToken(jwttoken);
	const headers = {
		Accept: 'application/json',
		'Content-Type': 'application/json',
		Authorization: delegatedToken.authorization,
	};
	return headers;
};
