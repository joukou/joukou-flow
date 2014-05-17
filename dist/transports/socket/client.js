
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
var MessageSchema, Runtime, SocketClient;

Runtime = require('../../runtime');

MessageSchema = require('../../message/schema');

SocketClient = (function() {
  SocketClient.prototype.connected = true;

  SocketClient.prototype.context = null;

  SocketClient.prototype.connection = null;

  function SocketClient(connection, context, transport) {
    this.connection = connection;
    this.context = context;
    this.transport = transport;
    this.context.send = this.send.bind(this);
    this.context.sendAll = this.sendAll.bind(this);
  }

  SocketClient.prototype.receive = function(data) {
    var promise;
    if (!MessageSchema.validate(data)) {
      return;
    }
    promise = this.context.receive(data.protocol, data.command, data.payload);
    return promise.then((function(_this) {
      return function(payload) {
        return _this.send({
          protocol: data.protocol,
          command: data.command,
          payload: payload != null ? payload || data.payload : void 0
        });
      };
    })(this)).fail(function(err) {
      return console.log(err, err && err.stack);
    });
  };

  SocketClient.prototype.disconnect = function() {
    return this.connected = false;
  };

  SocketClient.prototype.sendAll = function(data) {
    return this.transport.sendAll(data);
  };

  SocketClient.prototype.send = function(data) {
    var message;
    if (!this.connected) {
      return;
    }
    if (!MessageSchema.validate(data)) {
      throw new Error('Data is not in the required format');
    }
    message = JSON.stringify(data);
    return this.connection.sendUTF(message);
  };

  return SocketClient;

})();

module.exports = SocketClient;

/*
//# sourceMappingURL=client.js.map
*/
