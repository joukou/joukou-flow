
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
var DocumentationClient;

DocumentationClient = (function() {
  function DocumentationClient(server, api) {
    this.server = server;
    this.api = api;
    this.registerRoutes();
  }

  DocumentationClient.prototype.registerRoutes = function() {
    return this.server.get("" + this.api.routePrefix + "/documentation/routes", this.retrieveRoutes.bind(this));
  };

  DocumentationClient.prototype.retrieveRoutes = function(req, res) {
    return res.send(200, this.api.getRoutes());
  };

  return DocumentationClient;

})();

module.exports = DocumentationClient;
