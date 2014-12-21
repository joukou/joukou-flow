
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
var BaseTransport, MessageSchema, RuntimeContext, SocketClient, SocketTransport, uuid,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseTransport = require('../base');

SocketClient = require('./client');

RuntimeContext = require('../../runtime');

uuid = require('node-uuid');

MessageSchema = require('../../message/schema');

SocketTransport = (function(_super) {
  __extends(SocketTransport, _super);

  function SocketTransport(server) {
    this.server = server;
    server.on('request', function(request) {
      var client, connection, context;
      connection = request.accept();
      context = new RuntimeContext();
      context.socket = true;
      client = new SocketClient(connection, context, this);
      connection.on('message', function(message) {
        var data, utf8;
        utf8 = "";
        if (message.type === 'utf8') {
          utf8 = message.utf8Data;
        } else if (message.type === 'binary') {
          utf8 = message.binaryData.toString('utf8');
        }
        data = null;
        try {
          data = JSON.parse(utf8);
        } catch (_error) {
          return;
        }
        return client.receive(data);
      });
      return connection.on('close', function() {
        return client.disconnect();
      });
    });
  }

  SocketTransport.prototype.sendAll = function(data) {
    var message;
    if (!MessageSchema.validate(data)) {
      throw new Error('Data is not in the required format');
    }
    message = JSON.stringify(data);
    return this.server.broadcastUTF(message);
  };

  return SocketTransport;

})(BaseTransport);

module.exports = SocketTransport;
