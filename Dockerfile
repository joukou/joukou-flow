#!/bin/bash
# Copyright 2014 Joukou Ltd
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
FROM quay.io/joukou/nodejs-service
MAINTAINER Isaac Johnston <isaac.johnston@joukou.com>

ENV DEBIAN_FRONTEND noninteractive
ENV JOUKOU_API_PORT 2101
ENV JOUKOU_API_HOST 0.0.0.0

ADD src /var/nodejs/src
ADD coffeelint.json /var/nodejs/
ADD gulpfile.coffee /var/nodejs/
ADD gulpfile.js /var/nodejs/
ADD package.json /var/nodejs/
WORKDIR /var/nodejs
RUN npm install
RUN ./node_modules/.bin/gulp build
RUN chown -R nodejs:nodejs /var/nodejs

VOLUME [ "/sys/fs/cgroup" ]

# Expose ports
#   80    HTTP / WebSocket
EXPOSE 80