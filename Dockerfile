FROM node:latest
ENV APP_DIR /usr/src/app/
RUN mkdir -p $APP_DIR
RUN mkdir -p $APP_DIR/bin
WORKDIR $APP_DIR

RUN npm install -g @angular/cli --silent --depth 1
RUN npm uninstall -g npm 
ADD https://www.npmjs.com/install.sh ./install.sh
RUN sh install.sh
COPY package.json $APP_DIR
COPY .angular-cli.json karma.conf.js protractor.conf.js tsconfig.json tslint.json $APP_DIR
RUN npm install --silent --depth 0

COPY ./src $APP_DIR
RUN npm build --prod
