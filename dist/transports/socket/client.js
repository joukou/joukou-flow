
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
var BaseClient, MessageSchema, SocketClient,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

MessageSchema = require('../../message/schema');

BaseClient = require('../base/client');

SocketClient = (function(_super) {
  __extends(SocketClient, _super);

  SocketClient.prototype.connected = true;

  SocketClient.prototype.context = null;

  SocketClient.prototype.connection = null;

  function SocketClient(connection, context) {
    this.connection = connection;
    this.context = context;
    SocketClient.__super__.constructor.call(this, this.context);
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
        payload = _this.resolveCommandResponse(payload);
        return _this.send({
          protocol: payload.getProtocol(),
          command: payload.getCommand(),
          payload: payload.getPayload()
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
    var _ref;
    return (_ref = this.context) != null ? _ref.sendAll(data) : void 0;
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

})(BaseClient);

module.exports = SocketClient;
