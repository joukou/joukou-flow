
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
var BaseProtocol, Q, RuntimeProtocol, authentication, pjson, schema, uuid,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseProtocol = require('../base/index');

pjson = require('../../../package.json');

uuid = require('node-uuid');

Q = require('q');

authentication = require('../../authentication').bearer;

schema = require('./schema');


/**
@module joukou-fbpp/protocols/runtime
@author Fabian Cook <fabian.cook@joukou.com>
 */

RuntimeProtocol = (function(_super) {
  __extends(RuntimeProtocol, _super);

  RuntimeProtocol.prototype.mainGraph = null;


  /**
  @constructor RuntimeProtocol
   */

  function RuntimeProtocol(context) {
    RuntimeProtocol.__super__.constructor.call(this, 'runtime', context);
    this.command('getRuntime', this.getRuntime, '', 'GET');
    this.command('ports', this.ports, 'ports', 'GET');
    this.command('receivePacket', this.receivePacket, ':graph/packet/:port', 'PUT');
    this.addCommandSchemas(schema);
  }


  /**
  @typedef  { object } getRuntimePayload
  @property { string } secret
   */


  /**
  @typedef  { object } runtime
  @property { string } type
  @property { Array.<string> } capabilities
  @property { string } [id=undefined]
  @property { string } [label=undefined]
  @property { string } [graph=undefined]
   */


  /**
  Request the information about the runtime.
  When receiving this message the runtime should response with a runtime
  message.
  @param   { getRuntimePayload } payload
  @param   { RuntimeContext } context
  @returns { runtime | Promise }
   */

  RuntimeProtocol.prototype.getRuntime = function(payload, context) {
    var deferred, runtime;
    runtime = {
      type: context.type,
      version: context.version,
      capabilities: context.capabilities,
      id: context.id,
      label: context.label,
      graph: context.graph
    };
    if (context.authorized && ((payload.secret == null) || payload.secret === context.secret)) {
      return runtime;
    }
    deferred = Q.defer();
    authentication.verify(payload.secret, function(err, model) {
      if (err) {
        return deferred.reject(err);
      }
      context.user = model;
      context.authorized = true;
      context.secret = payload.secret;
      return deferred.resolve(runtime);
    });
    return deferred.promise;
  };


  /**
  @param { string } id
  @returns { string }
   */

  RuntimeProtocol.prototype.setMainGraph = function(id, graph) {
    return this.mainGraph = graph;
  };


  /**
  @typedef { object } portDef
  @property { string } id
  @property { string } type
  @property { string } description
  @property { boolean } addressable
  @property { boolean } required
   */


  /**
  @typedef  { object } port
  @property { string } graph
  @property { Array.<portDef> } inPorts
  @property { Array.<portDef> } outPorts
   */


  /**
  Signals the runtime's available ports.
  @param { * } payload
  @param { RuntimeContext } context
  @returns { Array.<port> | Promise }
   */

  RuntimeProtocol.prototype.ports = function(payload, context) {};


  /**
  @typedef { object } packet
  @property { string } port
  @property { string } event
  @property { object } payload
  @property { string } graph
   */


  /**
  @param { packet } payload
  @param { RuntimeContext } context
  @returns { packet | Promise }
   */

  RuntimeProtocol.prototype.receivePacket = function(payload, context) {};

  return RuntimeProtocol;

})(BaseProtocol);

module.exports = RuntimeProtocol;
