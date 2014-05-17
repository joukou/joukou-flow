
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
var ComponentLoader, Q, RuntimeContext, env, jwt, models, pjson, protocols, uuid;

protocols = require('../protocols');

Q = require('q');

models = require('joukou-data').models;

jwt = require('jsonwebtoken');

env = require('../env');

uuid = require('node-uuid');

pjson = require('../../package.json');

ComponentLoader = require('../protocols/component/loader');

RuntimeContext = (function() {
  RuntimeContext.prototype.socket = false;

  RuntimeContext.prototype.authorized = false;

  RuntimeContext.prototype.user = null;

  RuntimeContext.prototype.context = null;

  RuntimeContext.prototype.type = 'joukou-flow';

  RuntimeContext.prototype.version = pjson.version;

  RuntimeContext.prototype.capabilities = ['protocol:runtime', 'protocol:graph', 'protocol:component', 'protocol:network', 'network:persist'];

  RuntimeContext.prototype.id = uuid.v4();

  RuntimeContext.prototype.label = 'Joukou Flow';

  RuntimeContext.prototype.graph = null;

  RuntimeContext.prototype.options = null;


  /**
  @constructor RuntimeContext
   */

  function RuntimeContext(options) {
    this.options = options != null ? options : {};
  }

  RuntimeContext.prototype.getComponentLoader = function() {
    return this.componentLoader = new ComponentLoader(this);
  };

  RuntimeContext.prototype.getProtocols = function() {
    var key, protocol;
    if (this.instances == null) {
      this.instances = {};
    }
    for (key in protocols) {
      if (!protocols.hasOwnProperty(key)) {
        continue;
      }
      if (this.instances[key]) {
        continue;
      }
      protocol = protocols[key];
      this.instances[key] = new protocol();
    }
    return this.instances;
  };

  RuntimeContext.prototype.getProtocol = function(protocol) {
    var type;
    if (this.instances == null) {
      this.instances = {};
    }
    if (this.instances[protocol]) {
      return this.instances[protocol];
    }
    type = protocols[protocol];
    if (!type) {
      return;
    }
    return this.instances[protocol] = new type();
  };

  RuntimeContext.prototype.getPersonas = function() {
    var deferred;
    if (!this.user) {
      deferred = Q.defer();
      process.nextTick(function() {
        return deferred.reject('Unauthorized');
      });
      return deferred.promise;
    }
    return models.persona.getForAgent(this.user.getKey());
  };

  RuntimeContext.prototype.receive = function(protocol, command, payload) {
    var instance, reject;
    instance = this.getProtocol(protocol);
    reject = function(reason) {
      var deferred;
      deferred = Q.defer();
      process.nextTick(function() {
        return deferred.reject(reason);
      });
      return deferred.promise;
    };
    if (!instance) {
      return reject('Unknown protocol');
    }
    if (!this.authorized && !(protocol === 'runtime' && command === 'getruntime' && typeof payload.secret === 'string')) {
      return reject('Unauthorized');
    }
    return instance.receive(command, payload, this);
  };

  RuntimeContext.prototype.send = function() {
    throw new Error("Not Implemented");
  };

  RuntimeContext.prototype.sendAll = function() {
    throw new Error("Not Implemented");
  };

  return RuntimeContext;

})();

module.exports = RuntimeContext;

/*
//# sourceMappingURL=index.js.map
*/
