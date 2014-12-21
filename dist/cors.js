
/*
Copyright 2014 Joukou Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
 */
"use strict";

/**
Simple wrapper to pre-configure the restify-cors-middleware module.
@module joukou-api/cors
@author Isaac Johnston <isaac.johnston@joukou.com>
@copyright &copy; 2009-2014 Joukou Ltd. All rights reserved.
 */

/**
@module joukou-fbpp/cors
@author Fabian Cook <fabian.cook@joukou.com>
 */
var cors, env;

cors = require('restify-cors-middleware');

env = require('./env');

module.exports = cors({
  origins: '*',
  allowHeaders: ['authorization', 'accept', 'accept-version', 'content-type', 'request-id', 'origin', 'x-api-version', 'x-request-id'],
  exposeHeaders: ['api-version', 'content-length', 'content-md5', 'content-type', 'date', 'request-id', 'response-time']
});
