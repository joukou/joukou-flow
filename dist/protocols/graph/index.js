
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
var BaseProtocol, GraphProtocol, NoFlo, Q, models, schema, _,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseProtocol = require('../base');

Q = require('q');

models = require('joukou-data').models;

_ = require('lodash');

NoFlo = require('noflo');

schema = require('./schema');


/**
@module joukou-fbpp/protocols/graph
@author Fabian Cook <fabian.cook@joukou.com>
 */

GraphProtocol = (function(_super) {
  __extends(GraphProtocol, _super);

  GraphProtocol.prototype.graphs = null;


  /**
  @constructor GraphProtocol
   */

  function GraphProtocol() {
    GraphProtocol.__super__.constructor.call(this, 'graph');
    this.graphs = {};
    this.command('clear', this.clear, ':id', 'PUT');
    this.command('graph', this.graph, ':graph', 'GET');
    this.command('addNode', this.addNode, ':graph/node/:id', 'PUT');
    this.command('removeNode', this.removeNode, ':graph/node/:id', 'DELETE');
    this.command('renameNode', this.renameNode, ':graph/node/:from/rename', 'POST');
    this.command('changeNode', this.changeNode, ':graph/node/:id', 'POST');
    this.command('addEdge', this.addEdge, ':graph/edge', 'PUT');
    this.command('removeEdge', this.removeEdge, ':graph/edge', 'DELETE');
    this.command('changeEdge', this.changeEdge, ':graph/edge', 'POST');
    this.command('addInitial', this.addInitial, ':graph/initial', 'PUT');
    this.command('removeInitial', this.removeInitial, ':graph/initial', 'DELETE');
    this.command('addInport', this.addInport, ':graph/inport/:public', 'PUT');
    this.command('removeInport', this.removeInport, ':graph/inport/:public', 'DELETE');
    this.command('renameInport', this.renameInport, ':graph/inport/:public/rename', 'POST');
    this.command('addOutport', this.addOutport, ':graph/outport/:public', 'PUT');
    this.command('removeOutport', this.removeOutport, ':graph/outport/:public', 'DELETE');
    this.command('renameOutport', this.renameOutport, ':graph/outport/:public/rename', 'POST');
    this.command('addGroup', this.addGroup, ':graph/group/:name', 'PUT');
    this.command('removeGroup', this.removeGroup, ':graph/group/:name', 'DELETE');
    this.command('renameGroup', this.renameGroup, ':graph/group/:name/rename', 'POST');
    this.command('changeGroup', this.changeGroup, ':graph/group/:name', 'POST');

    /*
    !!! PLEASE NOTE THIS VALIDATES ALL PAYLOADS !!!
     */
    this.addCommandSchemas(schema);
  }


  /**
  @typedef { object } graphPayload
  @property { string } graph
   */


  /**
  @param { graphPayload } payload
  @param { RuntimeContext } context
  @returns { graphPayload | Promise }
   */

  GraphProtocol.prototype.graph = function(payload, context) {
    var deferred;
    context.graph = payload.graph;
    if (this.graphs[payload.graph]) {
      deferred = Q.defer();
      process.nextTick((function(_this) {
        return function() {
          console.log('from cache');
          return deferred.resolve(_this.graphs[payload.graph]);
        };
      })(this));
      return deferred.promise;
    }
    deferred = Q.defer();
    this._getModelByPublicKey(payload.graph).then((function(_this) {
      return function(model) {
        var value;
        value = model.getValue();
        return context.getPersonas().then(function(agentPersonas) {
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
          console.log('from model ', model.getKey());
          graph = _this._joukouToNoflo(model.getKey(), model, value);
          _this.graphs[payload.graph] = graph;
          return deferred.resolve(graph);
        }).fail(deferred.reject);
      };
    })(this)).fail(deferred.reject);
    return deferred.promise;
  };

  GraphProtocol.prototype._getModelByPublicKey = function(key) {
    return models.graph.search("public_key:" + key, true);
  };

  GraphProtocol.prototype._getModel = function(public_key, graph) {
    var deferred;
    deferred = Q.defer();
    if (graph.properties.metadata.model) {
      process.nextTick(function() {
        return deferred.resolve(graph.properties.metadata.model);
      });
      return deferred.promise;
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

  GraphProtocol.prototype._joukouExportedPortsToNoflo = function(obj) {
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

  GraphProtocol.prototype._nofloExportedPortsToJoukou = function(ports) {
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

  GraphProtocol.prototype._joukouNodeToNoflo = function(processes) {
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

  GraphProtocol.prototype._nofloNodeToJoukou = function(nodes) {
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

  GraphProtocol.prototype._joukouEdgeToNoflo = function(connections) {
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

  GraphProtocol.prototype._nofloEdgeToJoukou = function(edges) {
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

  GraphProtocol.prototype._joukouToNoflo = function(private_key, model, value) {
    var edge, edges, graph, inports, node, nodes, outports, port, _i, _j, _k, _l, _len, _len1, _len2, _len3;
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
    graph.setProperties({
      name: value.properties.name,
      library: value.properties.library,
      main: value.properties.main,
      icon: value.properties.icon,
      description: value.properties.description,
      metadata: {
        dirty: false,
        "new": false,
        private_key: private_key,
        model: model
      }
    });
    return graph;
  };

  GraphProtocol.prototype._nofloToJoukou = function(public_key, graph, value) {
    if (value == null) {
      value = {};
    }
    value.name = graph.name;
    value.public_key = public_key;
    if (value.properties == null) {
      value.properties = {};
    }
    value.properties.name = graph.properties.name;
    value.properties.library = graph.properties.library;
    value.properties.main = graph.properties.main;
    value.properties.icon = graph.properties.icon;
    value.properties.description = graph.properties.description;
    value.inports = this._nofloExportedPortsToJoukou(graph.inports);
    value.outports = this._nofloExportedPortsToJoukou(graph.outports);
    value.processes = this._nofloNodeToJoukou(graph.nodes);
    value.connections = this._nofloEdgeToJoukou(graph.edges);
    return value;
  };

  GraphProtocol.prototype._saveWithModel = function(model, public_key, graph) {
    var value;
    value = model.getValue();
    value = this._nofloToJoukou(public_key, graph, value);
    model.setValue(value);
    return model.save();
  };

  GraphProtocol.prototype._save = function(payload, context) {
    var deferred, keys;
    deferred = Q.defer();
    keys = _.where(_.keys(this.graphs), (function(_this) {
      return function(key) {
        return _this.graphs[key].properties.metadata.dirty;
      };
    })(this));
    if (!keys.length) {
      process.nextTick(function() {
        return deferred.resolve(payload);
      });
      return deferred.promise;
    }
    context.getPersonas((function(_this) {
      return function(personas) {
        var promises;
        promises = _.map(keys, function(key) {
          var graph;
          deferred = Q.defer();
          graph = _this.graphs[key];
          _this._getModel(key, graph).then(function(model) {
            return this._saveWithModel(model, key, graph);
          }).then(deferred.resolve).fail(deferred.reject);
          return deferred.promise;
        });
        return Q.all(promises);
      };
    })(this)).then(function() {
      return deferred.resolve(payload);
    }).fail(function() {
      return deferred.resolve(payload);
    });
    return deferred.promise;
  };


  /**
  @typedef { object } clearPayload
  @property { string } id
  @property { string } name
  @property { string } library
  @property { boolean } main
  @property { string } icon
  @property { string } description
   */


  /**
  @param { clearPayload } payload
  @param { RuntimeContext } context
  @returns { clearPayload | Promise }
   */

  GraphProtocol.prototype.clear = function(payload, context) {
    var fullName, graph, _base, _ref;
    console.log(payload);
    if (!payload.name) {
      payload.name = 'Joukou NoFlo runtime';
    }
    graph = new NoFlo.Graph(payload.name);
    fullName = payload.id;
    if (payload.library) {
      fullName = "" + payload.library + "/" + fullName;
    }
    if (payload.icon) {
      graph.properties.icon = payload.icon;
    }
    if (payload.description) {
      graph.properties.description = payload.description;
    }
    if ((_base = graph.properties).metadata == null) {
      _base.metadata = {};
    }
    graph.properties.metadata.dirty = true;
    graph.properties.metadata["new"] = this.graphs[payload.id] == null;
    graph.baseDir = (_ref = context.options) != null ? _ref.baseDir : void 0;
    this.graphs[payload.id] = graph;
    if (payload.main) {
      context.getProtocol('runtime').setMainGraph(payload.main);
    }
    return this._save(graph, context);
  };


  /**
  @typedef { object } addNodePayload
  @property { string } id
  @property { string } component
  @property { object } [metadata=undefined]
  @property { string } graph
   */


  /**
  @param { addNodePayload } payload
  @param { RuntimeContext } context
  @returns { addNodePayload | Promise }
   */

  GraphProtocol.prototype.addNode = function(payload, context) {
    return this.graph(payload, context).then((function(_this) {
      return function(graph) {
        graph.addNode(payload.id, payload.component, payload.metadata || {});
        graph.properties.metadata.dirty = true;
        return _this._save(payload, context);
      };
    })(this));
  };


  /**
  @typedef { object } removeNodePayload
  @property { string } id
  @property { string } graph
   */


  /**
  @param { removeNodePayload } payload
  @param { RuntimeContext } context
  @returns { removeNodePayload | Promise }
   */

  GraphProtocol.prototype.removeNode = function(payload, context) {
    return this.graph(payload, context).then((function(_this) {
      return function(graph) {
        graph.removeNode(payload.id);
        graph.properties.metadata.dirty = true;
        return _this._save(payload, context);
      };
    })(this));
  };


  /**
  @typedef { object } renameNodePayload
  @property { string } from
  @property { string } to
  @property { string } graph
   */


  /**
  @param { renameNodePayload } payload
  @param { RuntimeContext } context
  @returns { renameNodePayload | Promise }
   */

  GraphProtocol.prototype.renameNode = function(payload, context) {
    return this.graph(payload, context).then((function(_this) {
      return function(graph) {
        graph.renameNode(payload.from, payload.to);
        graph.properties.metadata.dirty = true;
        return _this._save(payload, context);
      };
    })(this));
  };


  /**
  @typedef { object } changeNodePayload
  @property { string } id
  @property { object } metadata
  @property { string } graph
   */


  /**
  @param { changeNodePayload } payload
  @param { RuntimeContext } context
  @returns { changeNodePayload | Promise }
   */

  GraphProtocol.prototype.changeNode = function(payload, context) {
    return this.graph(payload, context).then((function(_this) {
      return function(graph) {
        graph.setNodeMetadata(payload.id, payload.metadata || {});
        graph.properties.metadata.dirty = true;
        return _this._save(payload, context);
      };
    })(this));
  };


  /**
  @typedef { object } port
  @property { string } node
  @property { string } port
  @property { number } [index=undefined]
   */


  /**
  @typedef { object } addEdgePayload
  @property { port } src
  @property { port } tgt
  @property { object } [metadata=undefined]
  @property { string } graph
   */


  /**
  @param { addEdgePayload } payload
  @param { RuntimeContext } context
  @returns { addEdgePayload | Promise }
   */

  GraphProtocol.prototype.addEdge = function(payload, context) {
    return this.graph(payload, context).then((function(_this) {
      return function(graph) {
        if (payload.index != null) {
          graph.addEdge(payload.src.node, payload.src.port, payload.tgt.node, payload.tgt.port, payload.index, payload.metadata);
        } else {
          graph.addEdge(payload.src.node, payload.src.port, payload.tgt.node, payload.tgt.port, payload.metadata);
        }
        graph.properties.metadata.dirty = true;
        return _this._save(payload, context);
      };
    })(this));
  };


  /**
  @typedef { object } removeEdgePayload
  @property { port } src
  @property { port } tgt
  @property { string } graph
   */


  /**
  @param { removeEdgePayload } payload
  @param { RuntimeContext } context
  @returns { removeEdgePayload | Promise }
   */

  GraphProtocol.prototype.removeEdge = function(payload, context) {
    return this.graph(payload, context).then((function(_this) {
      return function(graph) {
        graph.removeEdge(payload.src.node, payload.src.port, payload.tgt.node, payload.tgt.port);
        graph.properties.metadata.dirty = true;
        return _this._save(payload, context);
      };
    })(this));
  };


  /**
  @typedef { object } changeEdgePayload
  @property { port } src
  @property { port } tgt
  @property { object } metadata
  @property { string } graph
   */


  /**
  @param { changeEdgePayload } payload
  @param { RuntimeContext } context
   */

  GraphProtocol.prototype.changeEdge = function(payload, context) {
    return this.graph(payload, context).then((function(_this) {
      return function(graph) {
        graph.setEdgeMetadata(payload.src.node, payload.src.port, payload.tgt.node, payload.tgt.port, payload.metadata || {});
        graph.properties.metadata.dirty = true;
        return _this._save(payload, context);
      };
    })(this));
  };


  /**
  @typedef { object } initialSrc
  @property { * } data
   */


  /**
  @typedef { object } addInitialPayload
  @property { initialSrc } src
  @property { port } tgt
  @property { object } [metadata=undefined]
  @property { string } graph
   */


  /**
  @param { addInitialPayload } payload
  @param { RuntimeContext } context
  @returns { addInitialPayload | Promise }
   */

  GraphProtocol.prototype.addInitial = function(payload, context) {
    return this.graph(payload, context).then((function(_this) {
      return function(graph) {
        if (payload.tgt.index != null) {
          graph.addInitialIndex(payload.src.data, payload.tgt.node, payload.tgt.port, payload.tgt.index, payload.metadata || {});
        } else {
          graph.addInitial(payload.src.data, payload.tgt.node, payload.tgt.port, payload.metadata || {});
        }
        graph.properties.metadata.dirty = true;
        return _this._save(payload, context);
      };
    })(this));
  };


  /**
  @typedef { object } removeInitialPayload
  @property { port } tgt
  @property { string } graph
   */


  /**
  @param { removeInitialPayload } payload
  @param { RuntimeContext } context
  @returns { removeInitialPayload | Promise }
   */

  GraphProtocol.prototype.removeInitial = function(payload, context) {
    return this.graph(payload, context).then((function(_this) {
      return function(graph) {
        graph.removeInitial(payload.tgt.node, payload.tgt.port);
        graph.properties.metadata.dirty = true;
        return _this._save(payload, context);
      };
    })(this));
  };


  /**
  @typedef { object } addInportPayload
  @property { string } public
  @property { string } node
  @property { string } port
  @property { object } [metadata=undefined]
  @property { string } graph
   */


  /**
  @param { addInportPayload } payload
  @param { RuntimeContext } context
  @returns { addInportPayload | Promise }
   */

  GraphProtocol.prototype.addInport = function(payload, context) {
    return this.graph(payload, context).then((function(_this) {
      return function(graph) {
        graph.addInport(payload["public"], payload.node, payload.port, payload.metadata || {});
        graph.properties.metadata.dirty = true;
        return _this._save(payload, context);
      };
    })(this));
  };


  /**
  @typedef { object } removeInportPayload
  @property { string } public
  @property { string } graph
   */


  /**
  @param { removeInportPayload } payload
  @param { RuntimeContext } context
  @returns { removeInportPayload | Promise }
   */

  GraphProtocol.prototype.removeInport = function(payload, context) {
    return this.graph(payload, context).then((function(_this) {
      return function(graph) {
        graph.removeInport(payload["public"]);
        graph.properties.metadata.dirty = true;
        return _this._save(payload, context);
      };
    })(this));
  };


  /**
  @typedef { object } renameInportPayload
  @property { string } from
  @property { string } to
  @property { string } graph
   */


  /**
  @param { renameInportPayload } payload
  @param { RuntimeContext } context
  @returns { renameInportPayload | Promise }
   */

  GraphProtocol.prototype.renameInport = function(payload, context) {
    return this.graph(payload, context).then((function(_this) {
      return function(graph) {
        graph.renameInport(payload.from, payload.to);
        graph.properties.metadata.dirty = true;
        return _this._save(payload, context);
      };
    })(this));
  };


  /**
  @typedef { object } addOutportPayload
  @property { string } public
  @property { string } node
  @property { string } port
  @property { object } [metadata=undefined]
  @property { string } graph
   */


  /**
  @param { addOutportPayload } payload
  @param { RuntimeContext } context
  @returns { addOutportPayload | Promise }
   */

  GraphProtocol.prototype.addOutport = function(payload, context) {
    return this.graph(payload, context).then((function(_this) {
      return function(graph) {
        graph.addOutport(payload["public"], payload.node, payload.port, payload.metadata || {});
        graph.properties.metadata.dirty = true;
        return _this._save(payload, context);
      };
    })(this));
  };


  /**
  @typedef { object } removeOutportPayload
  @property { string } public
  @property { string } graph
   */


  /**
  @param { removeOutportPayload } payload
  @param { RuntimeContext } context
  @returns { removeOutportPayload | Promise }
   */

  GraphProtocol.prototype.removeOutport = function(payload, context) {
    return this.graph(payload, context).then((function(_this) {
      return function(graph) {
        graph.removeOutport(payload["public"]);
        graph.properties.metadata.dirty = true;
        return _this._save(payload, context);
      };
    })(this));
  };


  /**
  @typedef { object } renameOutportPayload
  @property { string } from
  @property { string } to
  @property { string } graph
   */


  /**
  @param { renameOutportPayload } payload
  @param { RuntimeContext } context
  @returns { renameOutportPayload | Promise }
   */

  GraphProtocol.prototype.renameOutport = function(payload, context) {
    return this.graph(payload, context).then((function(_this) {
      return function(graph) {
        graph.renameOutport(payload.from, payload.to);
        graph.properties.metadata.dirty = true;
        return _this._save(payload, context);
      };
    })(this));
  };


  /**
  @typedef { object } addGroupPayload
  @property { string } name
  @property { Array.<string> } nodes
  @property { object } [metadata=undefined]
  @property { string } graph
   */


  /**
  @param { addGroupPayload } payload
  @param { RuntimeContext } context
  @returns { addGroupPayload | Promise }
   */

  GraphProtocol.prototype.addGroup = function(payload, context) {
    return this.graph(payload, context).then((function(_this) {
      return function(graph) {
        graph.addGroup(payload.name, payload.nodes, payload.metadata || {});
        graph.properties.metadata.dirty = true;
        return _this._save(payload, context);
      };
    })(this));
  };


  /**
  @typedef { object } removeGroupPayload
  @property { string } name
  @property { string } graph
   */


  /**
  @param { removeGroupPayload } payload
  @param { RuntimeContext } context
  @returns { removeGroupPayload | Promise }
   */

  GraphProtocol.prototype.removeGroup = function(payload, context) {
    return this.graph(payload, context).then((function(_this) {
      return function(graph) {
        graph.removeGroup(payload.name);
        graph.properties.metadata.dirty = true;
        return _this._save(payload, context);
      };
    })(this));
  };


  /**
  @typedef { object } renameGroupPayload
  @property { string } from
  @property { string } to
  @property { string } graph
   */


  /**
  @param { renameGroupPayload } payload
  @param { RuntimeContext } context
  @returns { renameGroupPayload | Promise }
   */

  GraphProtocol.prototype.renameGroup = function(payload, context) {
    return this.graph(payload, context).then((function(_this) {
      return function(graph) {
        graph.renameGroup(payload.from, payload.to);
        graph.properties.metadata.dirty = true;
        return _this._save(payload, context);
      };
    })(this));
  };


  /**
  @typedef { object } changeGroupPayload
  @property { string } name
  @property { object } metadata
  @property { string } graph
   */


  /**
  @param { changeGroupPayload } payload
  @param { RuntimeContext } context
  @returns { changeGroupPayload | Promise }
   */

  GraphProtocol.prototype.changeGroup = function(payload, context) {
    return this.graph(payload, context).then((function(_this) {
      return function(graph) {
        graph.setGroupMetadata(payload.name, payload.metadata);
        graph.properties.metadata.dirty = true;
        return _this._save(payload, context);
      };
    })(this));
  };

  return GraphProtocol;

})(BaseProtocol);

module.exports = GraphProtocol;

/*
//# sourceMappingURL=index.js.map
*/
