FROM node:10

LABEL version="1.0.0"
LABEL repository="http://github.com/paambaati/codeclimate-action"
LABEL homepage="http://github.com/paambaati/codeclimate-action"
LABEL maintainer="GP <me@httgp.com>"

LABEL com.github.actions.name="Code Climate Action"
LABEL com.github.actions.description="Sends Node.js code coverage to Code Climate"
LABEL com.github.actions.icon="upload-cloud"
LABEL com.github.actions.color="black"

RUN apk add --no-cache curl bash git

ADD entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT [ "/entrypoint.sh" ]
CMD [ "yarn coverage" ]