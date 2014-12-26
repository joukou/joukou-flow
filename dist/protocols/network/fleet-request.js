
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
var RabbitMQRequest, env;

env = require('../../env');

RabbitMQRequest = (function() {
  function RabbitMQRequest(graph, state, secret, exchange) {
    this.graph = graph;
    this.state = state;
    this.secret = secret;
    this.exchange = exchange != null ? exchange : void 0;
  }

  RabbitMQRequest.prototype.toJSON = function() {
    var key, ret, _ref, _ref1;
    if (this.graph.getKey instanceof Function) {
      key = this.graph.getKey();
    }
    if ((_ref = this.graph.properties) != null ? (_ref1 = _ref.metadata) != null ? _ref1.private_key : void 0 : void 0) {
      key = this.graph.properties.metadata.private_key;
    }
    ret = {
      "_links": {
        "joukou:graph": {
          href: "" + (env.getHost()) + "/fbp/protocols/graph/" + key
        }
      },
      desiredState: this.state,
      secret: this.secret,
      exchange: this.exchange
    };
    return JSON.stringify(ret);
  };

  return RabbitMQRequest;

})();

module.exports = RabbitMQRequest;
