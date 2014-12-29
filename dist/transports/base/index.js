
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
var BaseTransport, CommandResponse, Q, env, jwt, _;

Q = require('q');

_ = require('lodash');

jwt = require('jsonwebtoken');

env = require('../../env');

CommandResponse = require('../../runtime/command-response');

BaseTransport = (function() {
  function BaseTransport() {}

  BaseTransport.prototype.resolveCommandResponse = function(response, context) {
    var queue;
    if (context == null) {
      context = null;
    }
    queue = context.getSendQueue();
    context.clearSendQueue();
    if (!(response instanceof CommandResponse)) {
      response = new CommandResponse(response.command, response.payload, response.protocol);
    }
    if (queue != null ? queue.length : void 0) {
      response.setSendQueue(queue);
    }
    return response;
  };

  return BaseTransport;

})();

module.exports = BaseTransport;
