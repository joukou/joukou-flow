###
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
###
port = {
  node:
    type: 'string'
    required: true
  port:
    type: 'string'
    required: true
  index:
    type: 'number'
}

self = {
  graph: {
    type: 'string'
    required: true
  },
  clear: {
    id:
      type: 'string'
      required: true
    name:
      type: 'string'
      required: true
    library:
      type: 'string'
    main:
      type: 'string'
    icon:
      type: 'string'
    description:
      type: 'string'
  },
  addNode: {
    id:
      type: 'string'
      required: true
    component:
      type: 'string'
      required: true
    metadata:
      type: 'object'
    graph:
      type: 'string'
      required: true
  },
  removeNode: {
    id:
      type: 'string'
      required: true
    graph:
      type: 'string'
      required: true
  },
  renameNode: {
    from:
      type: 'string'
      required: true
    to:
      type: 'string'
      required: true
    graph:
      type: 'string'
      required: true
  },
  changeNode: {
    id:
      type: 'string'
      required: true
    metadata:
      type: 'object'
      required: true
    graph:
      type: 'string'
      required: true
  },
  addEdge: {
    src:
      type: 'object'
      schema: port
      required: true
    tgt:
      type: 'object'
      schema: port
      required: true
    metadata:
      type: 'object'
    graph:
      type: 'string'
      required: true
  },
  removeEdge: {
    src:
      type: 'object'
      schema: port
      required: true
    tgt:
      type: 'object'
      schema: port
      required: true
    graph:
      type: 'string'
      required: true
  },
  changeEdge: {
    src:
      type: 'object'
      schema: port
      required: true
    tgt:
      type: 'object'
      schema: port
      required: true
    graph:
      type: 'string'
      required: true
  },
  addInitial: {
    src:
      type: 'object'
      schema:
        data:
          type: 'any'
          required: true
      required: true
    tgt:
      type: 'object'
      schema: port
      required: true
    metadata:
      type: 'object'
    graph:
      type: 'string'
      required: true
  },
  removeInitial: {
    tgt:
      type: 'object'
      schema: port
      required: true
    graph:
      type: 'string'
      required: true
  },
  addInport: {
    public:
      type: 'string'
      required: true
    node:
      type: 'string'
      required: true
    port:
      type: 'string'
      required: true
    metadata:
      type: 'object'
    graph:
      type: 'string'
      required: true
  },
  removeInport: {
    public:
      type: 'string'
      required: true
    graph:
      type: 'string'
      required: true
  },
  renameInport: {
    from:
      type: 'string'
      required: true
    to:
      type: 'string'
      required: true
    graph:
      type: 'string'
      required: true
  },
  addOutport: {
    public:
      type: 'string'
      required: true
    node:
      type: 'string'
      required: true
    port:
      type: 'string'
      required: true
    metadata:
      type: 'object'
    graph:
      type: 'string'
      required: true
  },
  removeOutport: {
    public:
      type: 'string'
      required: true
    graph:
      type: 'string'
      required: true
  },
  renameOutport: {
    from:
      type: 'string'
      required: true
    to:
      type: 'string'
      required: true
    graph:
      type: 'string'
      required: true
  },
  addGroup: {
    name:
      type: 'string'
      required: true
    nodes:
      type: 'array'
      items:
        type: 'string'
        required: true
      required: true
    metadata:
      type: 'object'
    graph:
      type: 'string'
      required: true
  },
  removeGroup: {
    name:
      type: 'string'
      required: true
    graph:
      type: 'string'
      required: true
  },
  renameGroup: {
    from:
      type: 'string'
      required: true
    to:
      type: 'string'
      required: true
    graph:
      type: 'string'
      required: true
  },
  changeGroup: {
    name:
      type: 'string'
      required: true
    metadata:
      type: 'object'
      required: true
    graph:
      type: 'string'
  }
}

module.exports = self