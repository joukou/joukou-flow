
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
var GraphLoader, NoFlo, Q, models, _;

Q = require('q');

_ = require('lodash');

NoFlo = require('noflo');

models = require('joukou-data').models;

GraphLoader = (function() {
  function GraphLoader(context) {
    this.context = context;
    this.graphs = {};
    this.graphHash = {};
  }

  GraphLoader.prototype._getGraphHash = function(value) {
    var _ref;
    value = {
      properties: _.cloneDeep(value.properties),
      nodes: value.nodes,
      edges: value.edges,
      initializers: valie.initializers,
      exports: value.exports,
      inports: value.inports,
      outports: value.outports,
      groups: value.groups
    };
    if ((_ref = value.properties.metadata) != null) {
      _ref.model = void 0;
    }
    return this._getHash(value);
  };

  GraphLoader.prototype._getHash = function(value) {
    var hash, i;
    value = JSON.stringify(value);
    hash = 0;
    i = 0;
    while (i < value.length) {
      hash = value.charCodeAt(i) + (hash << 6) + (hash << 16) - hash;
      i++;
    }
    return hash;
  };

  GraphLoader.prototype.fetchGraph = function(id) {
    var deferred;
    this.context.graph = id;
    if (this.graphs[id]) {
      return Q.resolve(this.graphs[id]);
    }
    deferred = Q.defer();
    this._getModelByPublicKey(id).then((function(_this) {
      return function(model) {
        var value;
        value = model.getValue();
        return _this.context.getPersonas().then(function(agentPersonas) {
          var any, graph, persona, _i, _len;
          any = false;
          for (_i = 0, _len = agentPersonas.length; _i < _len; _i++) {
            persona = agentPersonas[_i];
            if (_.some(value.personas, function(graphPersona) {
              return graphPersona.key === persona.key;
            })) {
              any = true;
              break;
            }
          }
          if (!any) {
            return deferred.reject('Unauthorized');
          }
          graph = _this._joukouToNoflo(model.getKey(), model, value);
          _this.graphs[id] = graph;
          _this.graphHash[id] = _this._getGraphHash(graph);
          return deferred.resolve(graph);
        }).fail(deferred.reject);
      };
    })(this)).fail(deferred.reject);
    return deferred.promise;
  };

  GraphLoader.prototype.fetchSafeGraph = function(id) {
    return this.fetchGraph(id).then(function(graph) {
      var ret;
      graph = _.cloneDeep(graph);
      graph.properties.metadata = void 0;
      ret = new NoFlo.Graph(graph.name);
      ret.properties = graph.properties;
      ret.nodes = graph.nodes;
      ret.edges = graph.edges;
      ret.initializers = graph.initializers;
      ret.exports = graph.exports;
      ret.inports = graph.inports;
      ret.outports = graph.outports;
      ret.groups = graph.groups;
      return ret;
    });
  };

  GraphLoader.prototype.createGraph = function(id, name) {
    var graph, _ref, _ref1;
    graph = new NoFlo.Graph(name);
    graph.properties.metadata = {
      dirty: true,
      "new": this.graphs[id] == null,
      model: (_ref = this.graphs[id]) != null ? (_ref1 = _ref.properties.metadata) != null ? _ref1.model : void 0 : void 0
    };
    return this.graphs[id] = graph;
  };

  GraphLoader.prototype._getModelByPublicKey = function(key) {
    return models.graph.elasticSearch("public_key:" + key, true);
  };

  GraphLoader.prototype._getModel = function(public_key, graph) {
    var deferred, _ref, _ref1;
    deferred = Q.defer();
    if ((_ref = graph.properties) != null ? (_ref1 = _ref.metadata) != null ? _ref1.model : void 0 : void 0) {
      return Q.resolve(graph.properties.metadata.model);
    }
    this._getModelByPublicKey(public_key).then(function(model) {
      return deferred.resolve(model);
    }).fail(function() {
      return models.graph.create().then(function(model) {
        return deferred.resolve(model);
      }).fail(deferred.reject);
    });
    return deferred.promise;
  };

  GraphLoader.prototype._joukouExportedPortsToNoflo = function(obj) {
    var key, ports;
    if (obj == null) {
      obj = {};
    }
    ports = [];
    for (key in obj) {
      if (!obj.hasOwnProperty(key)) {
        continue;
      }
      ports.push({
        "public": key,
        node: obj[key].process,
        port: obj[key].port,
        metadata: obj[key].metadata || {}
      });
    }
    return ports;
  };

  GraphLoader.prototype._nofloExportedPortsToJoukou = function(ports) {
    var obj, val, _i, _len;
    if (ports == null) {
      ports = [];
    }
    obj = {};
    for (_i = 0, _len = ports.length; _i < _len; _i++) {
      val = ports[_i];
      obj[val["public"]] = {
        process: val.node,
        port: val.port,
        metadata: val.metadata || {}
      };
    }
    return obj;
  };

  GraphLoader.prototype._joukouNodeToNoflo = function(processes) {
    var key, nodes;
    if (processes == null) {
      processes = {};
    }
    nodes = [];
    for (key in processes) {
      if (!processes.hasOwnProperty(key)) {
        continue;
      }
      nodes.push({
        id: key,
        component: processes[key].circle.key,
        metadata: processes[key].metadata || {}
      });
    }
    return nodes;
  };

  GraphLoader.prototype._nofloNodeToJoukou = function(nodes) {
    var processes, val, _i, _len;
    if (nodes == null) {
      nodes = [];
    }
    processes = {};
    for (_i = 0, _len = nodes.length; _i < _len; _i++) {
      val = nodes[_i];
      processes[val.id] = {
        circle: {
          key: val.component
        },
        metadata: val.metadata || {}
      };
    }
    return processes;
  };

  GraphLoader.prototype._joukouEdgeToNoflo = function(connections) {
    if (connections == null) {
      connections = [];
    }
    return _.map(connections, function(connection) {
      var res;
      res = {
        data: connection.data,
        metadata: connection.metadata || {}
      };
      if (connection.src) {
        res.src = {
          node: connection.src.process,
          port: connection.src.port,
          index: connection.src.index,
          metadata: connection.src.metadata || {}
        };
      }
      if (connection.tgt) {
        res.tgt = {
          node: connection.tgt.process,
          port: connection.tgt.port,
          index: connection.tgt.index,
          metadata: connection.tgt.metadata || {}
        };
      }
      res.metadata.key = connection.key;
      return res;
    });
  };

  GraphLoader.prototype._nofloEdgeToJoukou = function(edges) {
    if (edges == null) {
      edges = [];
    }
    return _.map(edges, function(edge) {
      var res;
      res = {
        key: edge.metadata.key,
        metadata: edge.metadata
      };
      res.metadata.key = void 0;
      if (edge.src) {
        res.src = {
          process: edge.src.node,
          port: edge.src.port,
          index: edge.src.index,
          metadata: edge.src.metadata || {}
        };
      }
      if (edge.tgt) {
        res.tgt = {
          process: edge.tgt.node,
          port: edge.tgt.port,
          index: edge.tgt.index,
          metadata: edge.tgt.metadata || {}
        };
      }
      return res.data = edge.data;
    });
  };

  GraphLoader.prototype._joukouToNoflo = function(private_key, model, value) {
    var edge, edges, graph, inports, node, nodes, outports, port, properties, _i, _j, _k, _l, _len, _len1, _len2, _len3;
    graph = new NoFlo.Graph(value.name);
    inports = this._joukouExportedPortsToNoflo(value.inports);
    for (_i = 0, _len = inports.length; _i < _len; _i++) {
      port = inports[_i];
      graph.addInport(port["public"], port.node, port.port, port.metadata);
    }
    outports = this._joukouExportedPortsToNoflo(value.outports);
    for (_j = 0, _len1 = outports.length; _j < _len1; _j++) {
      port = outports[_j];
      graph.addOutport(port["public"], port.node, port.port, port.metadata);
    }
    nodes = this._joukouNodeToNoflo(value.processes);
    for (_k = 0, _len2 = nodes.length; _k < _len2; _k++) {
      node = nodes[_k];
      graph.addNode(node.id, node.component, node.metadata);
    }
    edges = this._joukouEdgeToNoflo(value.connections);
    for (_l = 0, _len3 = edges.length; _l < _len3; _l++) {
      edge = edges[_l];
      if (edge.index != null) {
        graph.addEdgeIndex(edge.src.node, edge.src.port, edge.tgt.node, edge.tgt.port, edge.index, edge.metadata);
      } else {
        graph.addEdge(edge.src.node, edge.src.port, edge.tgt.node, edge.tgt.port, edge.metadata);
      }
    }
    if (value.properties == null) {
      value.properties = {};
    }
    properties = _.assign({}, value.properties);
    properties.metadata = _.assign(properties.metadata || {}, {
      dirty: false,
      "new": false,
      private_key: private_key,
      model: model
    });
    graph.setProperties(properties);
    return graph;
  };

  GraphLoader.prototype._nofloToJoukou = function(public_key, graph, value, persona_key) {
    var metadata, _ref, _ref1;
    if (value == null) {
      value = {};
    }
    value.name = graph.name;
    value.public_key = public_key;
    if (value.properties == null) {
      value.properties = {};
    }
    metadata = _.assign(((_ref = value.properties) != null ? _ref.metadata : void 0) || {}, ((_ref1 = graph.properties) != null ? _ref1.metadata : void 0) || {});
    metadata["new"] = void 0;
    metadata.dirty = void 0;
    metadata.model = void 0;
    metadata.private_key = void 0;
    value.properties = _.assign(value.properties || {}, graph.properties || {});
    graph.properties.metadata = metadata;
    value.inports = this._nofloExportedPortsToJoukou(graph.inports);
    value.outports = this._nofloExportedPortsToJoukou(graph.outports);
    value.processes = this._nofloNodeToJoukou(graph.nodes);
    value.connections = this._nofloEdgeToJoukou(graph.edges);
    if (!_.some((value.personas != null ? value.personas : value.personas = []), function(persona) {
      return persona.key === persona_key;
    })) {
      value.personas.push({
        key: persona_key
      });
    }
    return value;
  };

  GraphLoader.prototype._saveWithModel = function(model, public_key, graph, persona_key) {
    var value;
    value = model.getValue();
    value = this._nofloToJoukou(public_key, graph, value, persona_key);
    model.setValue(value);
    return model.save();
  };

  GraphLoader.prototype.save = function(payload) {
    var deferred, keys;
    deferred = Q.defer();
    keys = _.where(_.keys(this.graphs), (function(_this) {
      return function(key) {
        var hash;
        hash = _this._getGraphHash(_this.graphs[key]);
        return hash !== _this.graphHash[key];
      };
    })(this));
    if (!keys.length) {
      return Q.resolve(payload);
    }
    this.context.getPersonaKey().then((function(_this) {
      return function(persona) {
        var promises;
        promises = _.map(keys, function(key) {
          var graph;
          graph = _this.graphs[key];
          return _this._getModel(key, graph, persona).then(function(model) {
            var _base;
            ((_base = graph.properties).metadata != null ? _base.metadata : _base.metadata = {}).model = model;
            graph.properties.metadata.private_key = model.getKey();
            return _this._saveWithModel(model, key, graph, persona);
          }).then(function() {
            var _ref;
            if ((_ref = graph.properties.metadata) != null) {
              _ref.dirty = false;
            }
            return _this.graphHash[key] = _this._getGraphHash(graph);
          });
        });
        return Q.all(promises);
      };
    })(this)).then(function() {
      return deferred.resolve(payload);
    }).fail(function(err) {
      return deferred.reject(err);
    });
    return deferred.promise;
  };

  return GraphLoader;

})();

module.exports = GraphLoader;
