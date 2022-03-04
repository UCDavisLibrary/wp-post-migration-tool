FROM node:17

RUN mkdir service
WORKDIR /service

COPY package.json .
COPY package-lock.json .
RUN npm install --production

COPY lib lib
COPY index.js .

CMD ["node", "index.js"]