/*
This file is to configure the apiversion for app.
If new mobileapp release is done, versionSettings need to update
with the new mobileapp version and respective api Version.
 */

export const versionSettings = [
    {
        appversion: ["1.0.2"],
        apiVersion: "v1",
        updateAvailable: true
    },
    {
        appversion: ["1.0.3"],
        apiVersion: "v1",
        updateAvailable: false
    }
];

// These are the APP versions we are not going to support for SAML users.
let samlNotSupportedAppVersions = [
    '1.0','1.0.0','1.0.1','1.0.2', undefined
];

export const samlKillSwitch  =  (appVersion) => {
    return samlNotSupportedAppVersions.includes(appVersion);
}