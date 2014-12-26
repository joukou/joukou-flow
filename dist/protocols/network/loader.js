
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
var NetworkLoader;

NetworkLoader = (function() {
  function NetworkLoader(context, loader) {
    this.context = context;
    this.loader = loader;
    this.networks = {};
  }

  NetworkLoader.prototype.fetchGraph = function(id) {
    return this.loader.fetchGraph(id);
  };

  NetworkLoader.prototype.fetchNetwork = function(id) {
    return this.fetchGraph(id).then(function(graph) {
      var _base;
      return (_base = graph.properties).network != null ? _base.network : _base.network = {};
    });
  };

  NetworkLoader.prototype.save = function() {
    return this.loader.save();
  };

  return NetworkLoader;

})();

module.exports = NetworkLoader;
