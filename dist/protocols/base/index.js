
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
var BaseProtocol, CommandResponse, Q, schemajs, _;

_ = require('lodash');

Q = require('q');

schemajs = require('schemajs');

CommandResponse = require('../../runtime/command-response');


/**
@module joukou-fbpp/protocols/base
@author Fabian Cook <fabian.cook@joukou.com>
 */

BaseProtocol = (function() {
  BaseProtocol.prototype.protocol = null;

  BaseProtocol.prototype.filterCommands = null;

  BaseProtocol.prototype.commands = null;

  function BaseProtocol(protocol, context) {
    this.protocol = protocol;
    this.context = context;
    this.filterCommands = [];
    this.commands = {};
  }

  BaseProtocol.prototype.getCommandKeys = function() {
    return _.keys(this.commands);
  };

  BaseProtocol.prototype.getHandler = function(command) {
    if (typeof command !== 'string') {
      return;
    }
    return this.commands[command.toLowerCase()];
  };

  BaseProtocol.prototype.addCommandSchemas = function(commandSchemas) {
    var key, value, _ref, _results;
    this.commandSchemas = commandSchemas;
    if (this.commandSchemasLower == null) {
      this.commandSchemasLower = {};
    }
    _ref = this.commandSchemas;
    _results = [];
    for (key in _ref) {
      value = _ref[key];
      if (!this.commandSchemas.hasOwnProperty(key)) {
        continue;
      }
      _results.push(this.commandSchemasLower[key.toLowerCase()] = value);
    }
    return _results;
  };

  BaseProtocol.prototype._resolvePromise = function(data) {
    var deferred;
    deferred = Q.defer();
    if ((data == null) || (data.then == null) || (data.fail == null)) {
      return Q.resolve(data);
    }
    data.then(deferred.resolve).fail(deferred.reject);
    return deferred.promise;
  };

  BaseProtocol.prototype.send = function(command, payload) {
    if (!this.context || this.context.socket) {
      return Q.resolve();
    }
    return this.context.send({
      protocol: this.protocol,
      command: command.toLowerCase(),
      payload: payload
    });
  };

  BaseProtocol.prototype.sendAll = function(command, payload) {
    if (!this.context || this.context.socket) {
      return;
    }
    return this.context.sendAll({
      protocol: this.protocol,
      command: command.toLowerCase(),
      payload: payload
    });
  };

  BaseProtocol.prototype.receive = function(command, payload) {
    var deferred, e, handler, promise;
    deferred = Q.defer();
    handler = this.commands[command];
    if (!handler) {
      return Q.reject();
    }
    try {
      promise = handler(payload, this.context);
      promise = this._resolvePromise(promise);
      promise.then((function(_this) {
        return function(data) {
          if (!(data instanceof CommandResponse)) {
            data = new CommandResponse(command, data != null ? data : payload, _this.protocol);
          } else if (!data.hasProtocol()) {
            data.setProtocol(_this.protocol);
          }
          return data;
        };
      })(this)).then(deferred.resolve).fail(deferred.reject);
    } catch (_error) {
      e = _error;
      return Q.reject(e);
    }
    return deferred.promise;
  };

  BaseProtocol.prototype.command = function(name, command, route, methods) {
    var handler;
    if (!_.isArray(methods)) {
      methods = [methods];
    }
    handler = (function(_this) {
      return function(payload, context) {
        var form;
        if (!handler.hasSchema()) {
          return command.call(_this, payload, context);
        }
        form = handler.validate(payload);
        if (!form.valid) {
          return Q.reject(form.errors);
        }
        return command.call(_this, form.data, context);
      };
    })(this);
    handler.command = command;
    handler.route = route;
    handler.methods = methods;
    handler.getSchema = function() {
      var _ref;
      return (_ref = this.commandSchemasLower) != null ? _ref[name.toLowerCase()] : void 0;
    };
    handler.hasSchema = function() {
      return !!handler.getSchema();
    };
    handler.validate = function(payload) {
      var schema, _ref;
      if (handler.$schema) {
        return handler.$schema.validate(payload);
      }
      schema = (_ref = this.commandSchemasLower) != null ? _ref[name.toLowerCase()] : void 0;
      if (!schema) {
        return {
          valid: true,
          data: payload,
          errors: []
        };
      }
      handler.$schema = schemajs.create(schema);
      return handler.$schema.validate(payload);
    };
    this.commands[name.toLowerCase()] = handler;
    if (this[name]) {
      return this[name] = handler;
    }
  };

  BaseProtocol.prototype.reject = function(error) {
    return Q.reject(error || new Error("Unknown"));
  };

  return BaseProtocol;

})();

module.exports = BaseProtocol;
