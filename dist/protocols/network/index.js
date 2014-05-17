
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
var BaseProtocol, NetworkProtocol, Q,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseProtocol = require('../base');

Q = require('q');


/**
@module joukou-fbpp/protocols/network
@author Fabian Cook <fabian.cook@joukou.com>
 */

NetworkProtocol = (function(_super) {
  __extends(NetworkProtocol, _super);


  /**
  @constructor NetworkProtocol
   */

  function NetworkProtocol() {
    NetworkProtocol.__super__.constructor.call(this, 'network');
    this.command('start', this.start, ':graph/start', 'PUT');
    this.command('getStatus', this.getStatus);
    this.command('stop', this.stop, ':graph/stop', 'PUT');
    this.command('started', this.started, ':graph/started', 'GET');
    this.command('status', this.status, ':graph', 'GET');
    this.command('stopped', this.stopped, ':graph/stopped', 'GET');
    this.command('debug', this.debug, ':graph/debug', 'PUT');
    this.command('icon', this.icon, ':graph/icon', 'GET');
    this.command('connect', this.connect);
    this.command('beginGroup', this.beginGroup);
    this.command('endGroup', this.endGroup);
    this.command('disconnect', this.disconnect);
    this.command('edges', this.edges, ':graph/edges', 'PUT');
  }


  /**
  @typedef { object } startPayload
  @property { string } graph
   */


  /**
  @param { startPayload } payload
  @param { RuntimeContext } runtime
  @returns { startPayload | Promise }
   */

  NetworkProtocol.prototype.start = function(payload, context) {};


  /**
  @typedef { object } getStatusPayload
  @property { string } graph
   */


  /**
  @typedef { object } status
  @property { string } graph
  @property { boolean } running
  @property { boolean } started
  @property { number } [uptime=undefined]
  @property { boolean } [debug=undefined]
   */


  /**
  @param { getStatusPayload } payload
  @param { RuntimeContext } context
  @returns { status | Promise }
   */

  NetworkProtocol.prototype.getStatus = function(payload, context) {};


  /**
  @typedef { object } stopPayload
  @property { string } graph
   */


  /**
  @param { stopPayload } payload
  @param { RuntimeContext } context
  @returns { stopPayload | Promise }
   */

  NetworkProtocol.prototype.stop = function(payload, context) {};


  /**
  @typedef { object } startedPayload
  @property { string } graph
   */


  /**
  @typedef { object } started
  @property { string } graph
  @property { number } time
  @property { boolean } running
  @property { boolean } started
  @property { number } [uptime=undefined]
   */


  /**
  @param { startedPayload } started
  @param { RuntimeContext } context
  @returns { started | Promise }
   */

  NetworkProtocol.prototype.started = function(payload, context) {};


  /**
  @typedef { object } statusPayload
  @property { string } graph
   */


  /**
  @param { statusPayload } payload
  @param { RuntimeContext } context
  @returns { status | Promise }
   */

  NetworkProtocol.prototype.status = function(payload, context) {
    return this.getStatus(payload, context);
  };


  /**
  @typedef { object } stoppedPayload
  @property { string } graph
   */


  /**
  @typedef { object } stopped
  @property { string } graph
  @property { number } time
  @property { boolean } running
  @property { boolean } started
  @property { number } [uptime=undefined]
   */


  /**
  @param { stoppedPayload } payload
  @param { RuntimeContext } context
  @returns { stopped | Promise }
   */

  NetworkProtocol.prototype.stopped = function(payload, context) {};


  /**
  @typedef { object } debugPayload
  @property { boolean } [enabled=false]
  @property { string } graph
   */


  /**
  @param { debugPayload } payload
  @param { RuntimeContext } context
  @returns { debugPayload | Promise }
   */

  NetworkProtocol.prototype.debug = function(payload, context) {
    return Q.reject();
  };


  /**
  @typedef { object } iconPayload
  @property { string } id
  @property { string } icon
  @property { string } graph
   */


  /**
  @param { iconPayload } payload
  @param { RuntimeContext } context
  @returns { iconPayload | Promise }
   */

  NetworkProtocol.prototype.icon = function(payload, context) {};


  /**
  @typedef { object } output
  @property { string } message
  @property { string } [type=undefined]
  @property { string } [url=undefined]
   */


  /**
  @typedef { object } error
  @property { string } message
   */


  /**
  @typedef { object } processError
  @property { string } id
  @property { error | string } error
  @property { string } graph
   */


  /**
  @typedef { object } port
  @property { string } node
  @property { string } port
   */


  /**
  @typedef { object } connectPayload
  @property { string } id
  @property { port } src
  @property { port } tgt
  @property { string } graph
  @property { Array.<string> } [subgraph=undefined]
   */


  /**
  @param { connectPayload } payload
  @param { RuntimeContext } context
  @returns { connectPayload | Promise }
   */

  NetworkProtocol.prototype.connect = function(payload, context) {};


  /**
  @typedef { object } beginGroupPayload
  @property { string } id
  @property { port } src
  @property { port } tgt
  @property { string } group
  @property { string } graph
  @property { Array.<string> } [subgraph=undefined]
   */


  /**
  @param { beginGroupPayload } payload
  @param { RuntimeContext } context
  @returns { beginGroupPayload | Promise }
   */

  NetworkProtocol.prototype.beginGroup = function(payload, context) {};


  /**
  @typedef { object } data
  @property { string } id
  @property { port } src
  @property { port } tgt
  @property { * } data
  @property { string } graph
  @property { Array.<string> } [subgraph=undefined]
   */


  /**
  @typedef { object } endGroupPayload
  @property { string } id
  @property { port } src
  @property { port } tgt
  @property { string } group
  @property { string } graph
  @property { Array.<string> } [subgraph=undefined]
   */


  /**
  @param { endGroupPayload } payload
  @param { RuntimeContext } context
  @returns { endGroupPayload | Promise }
   */

  NetworkProtocol.prototype.endGroup = function(payload, context) {};


  /**
  @typedef { object } disconnectPayload
  @property { string } id
  @property { port } src
  @property { port } tgt
  @property { string } graph
  @property { Array.<string> } [subgraph=undefined]
   */


  /**
  @param { disconnectPayload } payload
  @param { RuntimeContext } context
  @returns { disconnectPayload | Promise }
   */

  NetworkProtocol.prototype.disconnect = function(payload, context) {};


  /**
  @typedef { object } edge
  @property { port } src
  @property { port } tgt
  @property { object } [metadata=undefined]
   */


  /**
  @typedef { object } edgesPayload
  @property { Array.<edge> } edges
  @property { string } graph
   */


  /**
  @param { edgesPayload } payload
  @param { RuntimeContext } context
  @param { edgesPayload | Promise }
   */

  NetworkProtocol.prototype.edges = function(payload, context) {};

  return NetworkProtocol;

})(BaseProtocol);

module.exports = NetworkProtocol;

/*
//# sourceMappingURL=index.js.map
*/
