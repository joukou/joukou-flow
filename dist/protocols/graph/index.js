
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
var BaseProtocol, GraphProtocol, models, schema,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseProtocol = require('../base');

models = require('joukou-data').models;

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

  function GraphProtocol(context) {
    GraphProtocol.__super__.constructor.call(this, 'graph', context);
    this.loader = context.getGraphLoader();
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
  @returns { graphPayload | Promise }
   */

  GraphProtocol.prototype.graph = function(payload) {
    return this.loader.fetchSafeGraph(payload.graph);
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
  @returns { clearPayload | Promise }
   */

  GraphProtocol.prototype.clear = function(payload) {
    var fullName, graph, _ref;
    if (!payload.name) {
      payload.name = 'Joukou NoFlo runtime';
    }
    graph = this.loader.createGraph(payload.id, payload.name);
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
    graph.baseDir = (_ref = this.context.options) != null ? _ref.baseDir : void 0;
    if (payload.main) {
      this.context.getProtocol('runtime').setMainGraph(payload.main);
    }
    return this.loader.save(graph);
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
  @returns { addNodePayload | Promise }
   */

  GraphProtocol.prototype.addNode = function(payload) {
    return this.loader.fetchGraph(payload.graph).then((function(_this) {
      return function(graph) {
        graph.addNode(payload.id, payload.component, payload.metadata || {});
        graph.properties.metadata.dirty = true;
        return _this.loader.save(payload);
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
  @returns { removeNodePayload | Promise }
   */

  GraphProtocol.prototype.removeNode = function(payload) {
    return this.loader.fetchGraph(payload.graph).then((function(_this) {
      return function(graph) {
        graph.removeNode(payload.id);
        graph.properties.metadata.dirty = true;
        return _this.loader.save(payload);
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
  @returns { renameNodePayload | Promise }
   */

  GraphProtocol.prototype.renameNode = function(payload) {
    return this.loader.fetchGraph(payload.graph).then((function(_this) {
      return function(graph) {
        graph.renameNode(payload.from, payload.to);
        graph.properties.metadata.dirty = true;
        return _this.loader.save(payload);
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
  @returns { changeNodePayload | Promise }
   */

  GraphProtocol.prototype.changeNode = function(payload) {
    return this.loader.fetchGraph(payload.graph).then((function(_this) {
      return function(graph) {
        graph.setNodeMetadata(payload.id, payload.metadata || {});
        graph.properties.metadata.dirty = true;
        return _this.loader.save(payload);
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
  @returns { addEdgePayload | Promise }
   */

  GraphProtocol.prototype.addEdge = function(payload) {
    return this.loader.fetchGraph(payload.graph).then((function(_this) {
      return function(graph) {
        if (payload.index != null) {
          graph.addEdge(payload.src.node, payload.src.port, payload.tgt.node, payload.tgt.port, payload.index, payload.metadata);
        } else {
          graph.addEdge(payload.src.node, payload.src.port, payload.tgt.node, payload.tgt.port, payload.metadata);
        }
        graph.properties.metadata.dirty = true;
        return _this.loader.save(payload);
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
  @returns { removeEdgePayload | Promise }
   */

  GraphProtocol.prototype.removeEdge = function(payload) {
    return this.loader.fetchGraph(payload.graph).then((function(_this) {
      return function(graph) {
        graph.removeEdge(payload.src.node, payload.src.port, payload.tgt.node, payload.tgt.port);
        graph.properties.metadata.dirty = true;
        return _this.loader.save(payload);
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
  @returns { changeEdgePayload | Promise }
   */

  GraphProtocol.prototype.changeEdge = function(payload) {
    return this.loader.fetchGraph(payload.graph).then((function(_this) {
      return function(graph) {
        graph.setEdgeMetadata(payload.src.node, payload.src.port, payload.tgt.node, payload.tgt.port, payload.metadata || {});
        graph.properties.metadata.dirty = true;
        return _this.loader.save(payload);
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
  @returns { addInitialPayload | Promise }
   */

  GraphProtocol.prototype.addInitial = function(payload) {
    return this.loader.fetchGraph(payload.graph).then((function(_this) {
      return function(graph) {
        if (payload.tgt.index != null) {
          graph.addInitialIndex(payload.src.data, payload.tgt.node, payload.tgt.port, payload.tgt.index, payload.metadata || {});
        } else {
          graph.addInitial(payload.src.data, payload.tgt.node, payload.tgt.port, payload.metadata || {});
        }
        graph.properties.metadata.dirty = true;
        return _this.loader.save(payload);
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
  @returns { removeInitialPayload | Promise }
   */

  GraphProtocol.prototype.removeInitial = function(payload) {
    return this.loader.fetchGraph(payload.graph).then((function(_this) {
      return function(graph) {
        graph.removeInitial(payload.tgt.node, payload.tgt.port);
        graph.properties.metadata.dirty = true;
        return _this.loader.save(payload);
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
  @returns { addInportPayload | Promise }
   */

  GraphProtocol.prototype.addInport = function(payload) {
    return this.loader.fetchGraph(payload.graph).then((function(_this) {
      return function(graph) {
        graph.addInport(payload["public"], payload.node, payload.port, payload.metadata || {});
        graph.properties.metadata.dirty = true;
        return _this.loader.save(payload);
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
  @returns { removeInportPayload | Promise }
   */

  GraphProtocol.prototype.removeInport = function(payload) {
    return this.loader.fetchGraph(payload.graph).then((function(_this) {
      return function(graph) {
        graph.removeInport(payload["public"]);
        graph.properties.metadata.dirty = true;
        return _this.loader.save(payload);
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
  @returns { renameInportPayload | Promise }
   */

  GraphProtocol.prototype.renameInport = function(payload) {
    return this.loader.fetchGraph(payload.graph).then((function(_this) {
      return function(graph) {
        graph.renameInport(payload.from, payload.to);
        graph.properties.metadata.dirty = true;
        return _this.loader.save(payload);
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
  @returns { addOutportPayload | Promise }
   */

  GraphProtocol.prototype.addOutport = function(payload) {
    return this.loader.fetchGraph(payload.graph).then((function(_this) {
      return function(graph) {
        graph.addOutport(payload["public"], payload.node, payload.port, payload.metadata || {});
        graph.properties.metadata.dirty = true;
        return _this.loader.save(payload);
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
  @returns { removeOutportPayload | Promise }
   */

  GraphProtocol.prototype.removeOutport = function(payload) {
    return this.loader.fetchGraph(payload.graph).then((function(_this) {
      return function(graph) {
        graph.removeOutport(payload["public"]);
        graph.properties.metadata.dirty = true;
        return _this.loader.save(payload);
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
  @returns { renameOutportPayload | Promise }
   */

  GraphProtocol.prototype.renameOutport = function(payload) {
    return this.loader.fetchGraph(payload.graph).then((function(_this) {
      return function(graph) {
        graph.renameOutport(payload.from, payload.to);
        graph.properties.metadata.dirty = true;
        return _this.loader.save(payload);
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
  @returns { addGroupPayload | Promise }
   */

  GraphProtocol.prototype.addGroup = function(payload) {
    return this.loader.fetchGraph(payload.graph).then((function(_this) {
      return function(graph) {
        graph.addGroup(payload.name, payload.nodes, payload.metadata || {});
        graph.properties.metadata.dirty = true;
        return _this.loader.save(payload);
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
  @returns { removeGroupPayload | Promise }
   */

  GraphProtocol.prototype.removeGroup = function(payload) {
    return this.loader.fetchGraph(payload.graph).then((function(_this) {
      return function(graph) {
        graph.removeGroup(payload.name);
        graph.properties.metadata.dirty = true;
        return _this.loader.save(payload);
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
  @returns { renameGroupPayload | Promise }
   */

  GraphProtocol.prototype.renameGroup = function(payload) {
    return this.loader.fetchGraph(payload.graph).then((function(_this) {
      return function(graph) {
        graph.renameGroup(payload.from, payload.to);
        graph.properties.metadata.dirty = true;
        return _this.loader.save(payload);
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
  @returns { changeGroupPayload | Promise }
   */

  GraphProtocol.prototype.changeGroup = function(payload) {
    return this.loader.fetchGraph(payload.graph).then((function(_this) {
      return function(graph) {
        graph.setGroupMetadata(payload.name, payload.metadata);
        graph.properties.metadata.dirty = true;
        return _this.loader.save(payload);
      };
    })(this));
  };

  return GraphProtocol;

})(BaseProtocol);

module.exports = GraphProtocol;
