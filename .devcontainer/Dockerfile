FROM mcr.microsoft.com/devcontainers/universal:2

RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
     && apt-get -y install --no-install-recommends postgresql-client nodejs npm

RUN npm install -g npm@latest