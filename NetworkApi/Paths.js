const API_Paths = {
    audio : "/v1/audiobooks/",//this is for old version support
    audiobook : '/v1/audiobooks/',
    video : '/v1/videos/',
    channel : '/v1/channels/',
    book : '/v1/books/',
    channelview : '/v1/channel_views/',
    course : '/v1/courses/',
    license: '/v1/hooks/users/',
    popular: '/v1/channels/popular/',
    startedcontent: '/v1/started_content/',
    pins:'/v1/pins',
    search: '/v1/search/',
    search_suggestions: '/v1/autocomplete/',
    reporting:'/v1/reporting',
    assessment:'/v1/assessments/',
    bff_sanity_domain:'/mobile/v1/authenticationUser/connections',
    bff_sanity_login:'/mobile/v1/authenticationUser/login',
    bff_sanity_log:'/mobile/v1/authenticationUser/logs',
    assignment_list:'/v1/goals',
    areas:'/v1/subjects',
    interests:'/v1/interests',
    recommendations:'/v1/recommendations',
    changePassword: '/api/public/request_change_password',
    contentrating:'/v1/ratings',
}

export default {
  ...API_Paths
};
