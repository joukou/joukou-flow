
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
var ComponentLoader, GraphLoader, NetworkLoader, Q, RuntimeContext, authentication, env, jwt, models, pjson, protocols, uuid, _;

protocols = require('../protocols');

Q = require('q');

models = require('joukou-data').models;

jwt = require('jsonwebtoken');

env = require('../env');

uuid = require('node-uuid');

pjson = require('../../package.json');

ComponentLoader = require('../protocols/component/loader');

GraphLoader = require('../protocols/graph/loader');

NetworkLoader = require('../protocols/network/loader');

authentication = require('../authentication');

_ = require('lodash');

RuntimeContext = (function() {
  RuntimeContext.prototype.socket = false;

  RuntimeContext.prototype.authorized = false;

  RuntimeContext.prototype.persona = null;

  RuntimeContext.prototype.user = null;

  RuntimeContext.prototype.context = null;

  RuntimeContext.prototype.type = 'joukou-flow';

  RuntimeContext.prototype.version = pjson.version;

  RuntimeContext.prototype.capabilities = ['protocol:runtime', 'protocol:graph', 'protocol:component', 'protocol:network'];

  RuntimeContext.prototype.id = uuid.v4();

  RuntimeContext.prototype.label = 'Joukou Flow';

  RuntimeContext.prototype.graph = null;

  RuntimeContext.prototype._sendQueue = [];

  RuntimeContext.prototype.options = null;


  /**
  @constructor RuntimeContext
   */

  function RuntimeContext(options) {
    this.options = options != null ? options : {};
    this.context = this;
    this._sendQueue = [];
  }

  RuntimeContext.prototype.getComponentLoader = function() {
    return this.componentLoader != null ? this.componentLoader : this.componentLoader = new ComponentLoader(this);
  };

  RuntimeContext.prototype.getGraphLoader = function() {
    return this.graphLoader != null ? this.graphLoader : this.graphLoader = new GraphLoader(this);
  };

  RuntimeContext.prototype.getNetworkLoader = function() {
    return this.networkLoader != null ? this.networkLoader : this.networkLoader = new NetworkLoader(this, this.getGraphLoader());
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
      this.instances[key] = new protocol(this);
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
    return this.instances[protocol] = new type(this);
  };

  RuntimeContext.prototype.getPersona = function() {
    if (this.persona) {
      return this.persona;
    }
    return this.getPersonaKey().then((function(_this) {
      return function(persona_key) {
        var persona, _i, _len, _ref;
        _ref = _this.personas != null;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          persona = _ref[_i];
          if (persona.getKey() === persona_key) {
            return persona;
          }
        }
        return models.persona.retrieve(persona_key);
      };
    })(this));
  };

  RuntimeContext.prototype.getPersonaKey = function(useSecret) {
    if (this.persona_key) {
      return Q.resolve(this.persona_key);
    }
    if (this.secret && useSecret !== false) {
      return authentication.bearer.decode(this.secret).then((function(_this) {
        return function(decoded) {
          if (!(decoded != null ? decoded.persona_key : void 0)) {
            return _this.getPersonaKey(false);
          }
          return _this.persona_key = decoded.persona_key;
        };
      })(this));
    }
    return this.getPersonaKeys().then((function(_this) {
      return function(personas) {
        var persona;
        persona = personas[0];
        if (!persona) {
          return deferred.reject('No personas');
        }
        return _this.persona_key = persona;
      };
    })(this));
  };

  RuntimeContext.prototype.getPersonaKeys = function() {
    if (this.persona_keys) {
      return Q.resolve(this.persona_keys);
    }
    return this.getPersonas().then((function(_this) {
      return function(personas) {
        return _this.persona_keys = _.map(personas, function(persona) {
          return persona.getKey();
        });
      };
    })(this));
  };

  RuntimeContext.prototype.getPersonas = function() {
    if (!this.user) {
      return Q.reject('Unauthorized');
    }
    if (this.personas) {
      return Q.resolve(this.personas);
    }
    return models.persona.getForAgent(this.user.getKey()).then((function(_this) {
      return function(personas) {
        return _this.personas = personas;
      };
    })(this));
  };

  RuntimeContext.prototype.receive = function(protocol, command, payload) {
    var instance;
    instance = this.getProtocol(protocol);
    if (!instance) {
      return Q.reject('Unknown protocol');
    }
    if (!this.authorized && !(protocol === 'runtime' && command === 'getruntime' && typeof payload.secret === 'string')) {
      return Q.reject('Unauthorized');
    }
    return instance.receive(command, payload, this);
  };

  RuntimeContext.prototype.send = function(data) {
    return this._sendQueue.push(data);
  };

  RuntimeContext.prototype.getSendQueue = function() {
    return this._sendQueue;
  };

  RuntimeContext.prototype.clearSendQueue = function() {
    return this._sendQueue = [];
  };

  RuntimeContext.prototype.sendAll = function() {
    throw new Error("Not Implemented");
  };

  return RuntimeContext;

})();

module.exports = RuntimeContext;
