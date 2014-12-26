
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
var Network;

Network = (function() {
  Network.prototype.processes = {};

  function Network(context, graph) {
    var _base;
    this.context = context;
    this.graph = graph;
    this.network = (_base = this.graph.properties).network != null ? _base.network : _base.network = {};
    this._save = this.context.getGraphLoader().save;
    this.componentLoader = this.context.getComponentLoader();
  }

  Network.prototype.initialize = function() {};

  Network.prototype.save = function() {
    return typeof this._save === "function" ? this._save() : void 0;
  };

  return Network;

})();

module.exports = Network;
