
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

/**
@module joukou-fbpp/protocols/index
@author Fabian Cook <fabian.cook@joukou.com>
 */
var ComponentProtocol, GraphProtocol, NetworkProtocol, RuntimeProtocol;

ComponentProtocol = require('./component');

GraphProtocol = require('./graph');

NetworkProtocol = require('./network');

RuntimeProtocol = require('./runtime');

module.exports = {
  component: ComponentProtocol,
  graph: GraphProtocol,
  network: NetworkProtocol,
  runtime: RuntimeProtocol
};

/*
//# sourceMappingURL=index.js.map
*/