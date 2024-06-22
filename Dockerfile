FROM node:21-slim

RUN apt update && apt install -y openssl procps

RUN npm install -g @nestjs/cli

RUN npm install -g @prisma/client

WORKDIR /home/node/app

## cat /etc/passwd
USER node

CMD tail -f /dev/null