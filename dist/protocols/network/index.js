
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
var BaseProtocol, FleetClient, NetworkProtocol, Q, RabbitMQClient, Request, models, schema,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseProtocol = require('../base');

Q = require('q');

schema = require('./schema');

RabbitMQClient = require('./rabbit-client');

Request = require('./request');

FleetClient = require('./fleet-client');

models = require('joukou-data').models;


/**
@module joukou-fbpp/protocols/network
@author Fabian Cook <fabian.cook@joukou.com>
 */

NetworkProtocol = (function(_super) {
  __extends(NetworkProtocol, _super);

  NetworkProtocol.prototype.fleetClient = FleetClient;

  NetworkProtocol.prototype.rabbitMQClient = RabbitMQClient;


  /**
  @constructor NetworkProtocol
   */

  function NetworkProtocol(context) {
    NetworkProtocol.__super__.constructor.call(this, 'network', context);
    this.loader = context.getGraphLoader();
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
    this.addCommandSchemas(schema);
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

  NetworkProtocol.prototype.start = function(payload) {
    return this.loader.fetchGraph(payload.graph).then((function(_this) {
      return function(graph) {
        var req, _ref;
        req = new Request(payload.graph, _this.context.secret, 'launched', (_ref = graph.properties.metadata) != null ? _ref.private_key : void 0);
        return client.send(req).then(function() {
          var _base;
          ((_base = graph.properties).network != null ? _base.network : _base.network = {}).state = 'launched';
          graph.properties.network.startTime = new Date().getTime();
          graph.properties.metadata.dirty = true;
          return _this.loader.save(payload);
        });
      };
    })(this));
  };


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

  NetworkProtocol.prototype.getStatus = function(payload) {
    return this.loader.fetchGraph(payload.graph).then(function(graph) {
      var deferred, functions, keys, model, promise, result, started, uptime, value, _ref, _ref1;
      model = (_ref = graph.properties.metadata) != null ? _ref.model : void 0;
      if (!model) {
        return Q.reject('Graph does not have model');
      }
      value = model.getValue();
      keys = _.keys(value.processes);
      started = ((_ref1 = graph.properties.network) != null ? _ref1.state : void 0) === 'launched';
      if (started) {
        uptime = (new Date().getTime() - graph.properties.network.startTime) / 1000;
      }
      result = {
        graph: payload.graph,
        running: false,
        started: started,
        uptime: uptime
      };
      if (!keys.length) {
        return result;
      }
      functions = _.map(keys, function(key) {
        var deferred;
        deferred = Q.defer();
        FleetClient.getUnitStates(key).then(function(states) {
          if (_.some(states, function(state) {
            return state.systemdActiveState === 'active';
          })) {
            return deferred.resolve(true);
          } else {
            return deferred.reject(false);
          }
        }).fail(deferred.reject);
        return deferred.promise;
      });
      promise = functions.reduce(Q.when, []);
      deferred = Q.defer();
      promise.then(function() {
        result.running = true;
        return deferred.resolve(result);
      }).fail(function() {
        return deferred.resolve(result);
      });
      return deferred.promise;
    });
  };


  /**
  @typedef { object } stopPayload
  @property { string } graph
   */


  /**
  @param { stopPayload } payload
  @param { RuntimeContext } context
  @returns { stopPayload | Promise }
   */

  NetworkProtocol.prototype.stop = function(payload) {
    return this.loader.fetchGraph(payload.graph).then((function(_this) {
      return function(graph) {
        var req, _ref;
        req = new Request(payload.graph, _this.context.secret, 'inactive', (_ref = graph.properties.metadata) != null ? _ref.private_key : void 0);
        return client.send(req).then(function() {
          var _base;
          ((_base = graph.properties).network != null ? _base.network : _base.network = {}).state = 'inactive';
          graph.properties.metadata.dirty = true;
          return _this.loader.save(payload);
        });
      };
    })(this));
  };


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

  NetworkProtocol.prototype.started = function(payload) {
    var deferred;
    deferred = Q.defer();
    this.getStatus(payload).then(function(result) {
      if (!result.started) {
        return deferred.reject('Graph not started');
      }
      return deferred.resolve(result);
    });
    return deferred.promise;
  };


  /**
  @typedef { object } statusPayload
  @property { string } graph
   */


  /**
  @param { statusPayload } payload
  @param { RuntimeContext } context
  @returns { status | Promise }
   */

  NetworkProtocol.prototype.status = function(payload) {
    return this.getStatus(payload);
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

  NetworkProtocol.prototype.stopped = function(payload) {
    var deferred;
    deferred = Q.defer();
    this.getStatus(payload).then(function(result) {
      if (result.started) {
        return deferred.reject('Graph not stopped');
      }
      return deferred.resolve(result);
    });
    return deferred.promise;
  };


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

  NetworkProtocol.prototype.debug = function(payload) {
    return Q.reject();
  };


  /**
  @typedef { object } iconPayload
  @property { string } id
  @property { string } [icon=undefined]
  @property { string } graph
   */


  /**
  @param { iconPayload } payload
  @param { RuntimeContext } context
  @returns { iconPayload | Promise }
   */

  NetworkProtocol.prototype.icon = function(payload) {
    if (payload.icon) {
      return Q.reject('Not implemented');
    }
    return this.loader.fetchGraph(payload.graph).then(function(graph) {
      var node;
      node = graph.getNode(payload.id);
      return models.circle.retrieve(node.component).then(function(circle) {
        var value;
        value = circle.getValue();
        return value.icon;
      });
    });
  };


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

  NetworkProtocol.prototype.connect = function(payload) {};


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
