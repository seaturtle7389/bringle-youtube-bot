FROM node:20.18.0
ENV NODE_ENV=production
ENV APP_ENV=production
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install --production --silent
COPY . .
RUN chown -R node /usr/src/app
USER node
RUN npx sequelize-cli db:migrate --env production