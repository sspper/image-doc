# See: https://nodejs.org/en/docs/guides/nodejs-docker-webapp/
FROM node:boron

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/

# Bundle app source for install
COPY . /usr/src/app

RUN npm i --registry https://nexus.rocs.io:8081/repository/npm-public/ || npm i
RUN npm i -g babel-cli

# Bundle finalized app source
COPY . /usr/src/app

EXPOSE 3000
CMD [ "npm", "start" ]