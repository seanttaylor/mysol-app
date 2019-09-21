FROM node:12.10.0-alpine
MAINTAINER sean.travis.taylor@gmail.com
WORKDIR ./app
RUN npm install
EXPOSE 8080
CMD ["npm", "start"]