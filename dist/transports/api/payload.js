
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
var ApiClient, PayloadClient, RuntimeContext, authentication;

authentication = require('../../authentication');

RuntimeContext = require('../../runtime');

ApiClient = require('./client');

PayloadClient = (function() {
  function PayloadClient(server, api) {
    this.server = server;
    this.api = api;
    this.registerRoutes();
  }

  PayloadClient.prototype.registerRoutes = function() {
    this.server.put("" + this.api.routePrefix + "/payload/authenticated", authentication.authenticate, this.runPayload);
    return this.server.put("" + this.api.routePrefix + "/payload/", this.runPayload);
  };

  PayloadClient.prototype.runPayload = function(req, res, next) {
    var context;
    context = new RuntimeContext();
    return new ApiClient(req, res, next, this.api, context);
  };

  return PayloadClient;

})();

module.exports = PayloadClient;
