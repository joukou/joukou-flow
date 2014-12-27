
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

/**
@module joukou-fbpp/index
@author Fabian Cook <fabian.cook@joukou.com>
 */

/**
@typedef { object } Promise
@property { function } then
@property { function } fail
 */
var Q, env, flowhub, uuid;

flowhub = require('flowhub-registry');

env = require('./env');

Q = require('q');

uuid = require('node-uuid');

exports.register = function(userId, secret) {
  var deferred, runtime;
  if (secret == null) {
    secret = void 0;
  }
  deferred = Q.defer();
  runtime = new flowhub.Runtime({
    label: 'Joukou',
    id: '367e01c1-0264-40aa-84ec-8dbe28ea39ec',
    user: userId,
    protocol: 'websocket',
    address: env.getWebSocketConnectionString(),
    type: 'noflo-nodejs',
    secret: secret
  });
  runtime.register(function(res) {
    var callback;
    if (res.status >= 400) {
      return deferred.reject(res);
    }
    callback = function() {
      return runtime.ping();
    };
    setTimeout(callback, 5 * 60 * 1000);
    return deferred.resolve(runtime);
  });
  return deferred.promise;
};
