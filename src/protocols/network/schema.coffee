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
}

self = {
  start: {
    graph:
      type: 'string'
      required: true
  }
  getStatus: {
    graph:
      type: 'string'
      required: true
  }
  stop: {
    graph:
      type: 'string'
      required: true
  }
  started: {
    graph:
      type: 'string'
      required: true
  }
  status: {
    graph:
      type: 'string'
      required: true
  }
  stopped: {
    graph:
      type: 'string'
      required: true
  }
  debug: {
    enable:
      type: 'boolean'
    graph:
      type: 'string'
      required: true
  }
  icon: {
    id:
      type: 'string'
      required: true
    icon:
      type: 'string'
    graph:
      type: 'string'
      required: true
  }
  connect: {
    id:
      type: 'string'
      required: true
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
    subgraph:
      type: 'array'
      items:
        type: 'string'
  }
  beginGroup: {
    id:
      type: 'string'
      required: true
    src:
      type: 'object'
      schema: port
      required: true
    tgt:
      type: 'object'
      schema: port
      required: true
    group:
      type: 'string'
      required: true
    graph:
      type: 'string'
      required: true
    subgraph:
      type: 'array'
      items:
        type: 'string'
  }
  endGroup: {
    id:
      type: 'string'
      required: true
    src:
      type: 'object'
      schema: port
      required: true
    tgt:
      type: 'object'
      schema: port
      required: true
    group:
      type: 'string'
      required: true
    graph:
      type: 'string'
      required: true
    subgraph:
      type: 'array'
      items:
        type: 'string'
  }
  disconnect: {
    id:
      type: 'string'
      required: true
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
    subgraph:
      type: 'array'
      items:
        type: 'string'
  }
  edges: {
    edges:
      type: 'array'
      items:
        type: 'object'
        schema:
          src: port
          tgt: port
      required: true
    graph:
      type: 'string'
      required: true
  }

}