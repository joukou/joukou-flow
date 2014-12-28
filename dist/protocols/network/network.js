
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
var EventEmitter, FleetClient, Network, Q, RabbitMQClient, Request, models,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

FleetClient = require('./fleet-client');

RabbitMQClient = require('./rabbit-client');

Q = require('q');

Request = require('./fleet-request');

models = require('joukou-data').models;

EventEmitter = require('events').EventEmitter;

Network = (function(_super) {
  __extends(Network, _super);

  Network.prototype.processes = {};

  Network.prototype.connections = [];

  Network.prototype.initials = [];

  Network.prototype.defaults = [];

  Network.prototype.graph = null;

  Network.prototype.startupTime = 0;

  Network.prototype.portBuffer = {};

  function Network(context, graph) {
    var _base, _ref, _ref1, _ref2;
    this.context = context;
    this.graph = graph;
    if (!((_ref = this.graph) != null ? (_ref1 = _ref.properties) != null ? (_ref2 = _ref1.metadata) != null ? _ref2.private_key : void 0 : void 0 : void 0)) {
      throw new Error("Graph does not have a private key");
      return;
    }
    this.id = this.graph.properties.metadata.private_key;
    this.processes = {};
    this.connections = [];
    this.initials = [];
    this.nextInitials = [];
    this.defaults = [];
    this.started = false;
    this.debug = false;
    this.network = (_base = this.graph.properties).network != null ? _base.network : _base.network = {};
    this._save = this.context.getNetworkLoader().save;
    this.componentLoader = this.context.getComponentLoader();
  }

  Network.prototype.save = function() {
    return typeof this._save === "function" ? this._save() : void 0;
  };

  Network.prototype.start = function() {
    var req;
    req = new Request(this.id, this.context.secret, 'launched', this.id);
    return RabbitMQClient.send(req).then((function(_this) {
      return function() {
        _this.network.state = 'launched';
        _this.network.startTime = new Date().getTime();
        return _this.save();
      };
    })(this));
  };

  Network.prototype.stop = function() {
    var req;
    req = new Request(this.id, this.context.secret, 'inactive', this.id);
    return RabbitMQClient.send(req).then((function(_this) {
      return function() {
        _this.network.state = 'inactive';
        return _this.save();
      };
    })(this));
  };

  Network.prototype.isStarted = function() {
    return this.network.state === 'launched';
  };

  Network.prototype.isRunning = function() {
    if (!this.isStarted()) {
      return Q.resolve(false);
    }
    return this.getStatus().then(function(result) {
      return result.running;
    });
  };

  Network.prototype.getStatus = function() {
    var deferred, functions, keys, model, promise, result, started, uptime, value, _ref;
    model = (_ref = this.graph.properties.metadata) != null ? _ref.model : void 0;
    if (!model) {
      return Q.reject('Graph does not have model');
    }
    if (!this.graph.properties.private_key) {
      return Q.reject('Graph does not have a private key');
    }
    value = model.getValue();
    keys = _.keys(value.processes);
    started = this.network.state === 'launched';
    if (started) {
      uptime = (new Date().getTime() - this.network.startTime) / 1000;
    }
    result = {
      graph: this.id,
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
  };

  Network.prototype.getIcon = function(nodeId) {
    var node;
    node = graph.getNode(nodeId);
    return models.circle.retrieve(node.component).then(function(circle) {
      var value;
      value = circle.getValue();
      return value.icon;
    });
  };

  Network.prototype.connect = function(id, src, tgt, subgraph) {};

  return Network;

})(EventEmitter);

module.exports = Network;
