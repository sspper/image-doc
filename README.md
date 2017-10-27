# ArtisanMobileBFF
Artisan Mobile application BFF

## Running BFF in your local system

```bash
$ cd ArtisanMobileBFF
$ npm install
$ npm start

```

## BFF usage

```bash
## Login:
Method: post
Request body:
{
    "username":"admin@artisan.com",
    "password":"test1234",
    "domain": "learning-platform"
}
Headers: Content-Type   application/json
Request url: http://10.144.20.124:3000/authenticationUser/login


## Connections:
Method: post
Request body:
{
    "domain": "learning-platform"  
}
Headers: Content-Type   application/json
Request url: http://10.144.20.124:3000/authenticationUser/connections

## Favorite list
Check out the code and do npm install to get dependency node modules.

Method: GET
Headers:
Content-Type   application/json
Authorization  id from login response
Request URL: http://10.144.20.124:3000/favorite/favoriteList?page=1&per=20

##Course details
Method: get
Headers: 
Content-Type   application/json
Authorization  id from login response
Request url: http://10.144.20.124:3000/course/courseDetails

##Course Videos
Method: get
Headers: 
Content-Type   application/json
Authorization  id from login response
Request url: http://10.144.20.124:3000/course/courseVideos

```



