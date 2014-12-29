
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
var CommandResponse;

CommandResponse = (function() {
  function CommandResponse(command, payload, protocol) {
    this.command = command;
    this.payload = payload;
    this.protocol = protocol != null ? protocol : void 0;
  }

  CommandResponse.prototype.hasProtocol = function() {
    return this.protocol != null;
  };

  CommandResponse.prototype.getProtocol = function() {
    if (!this.hasProtocol()) {
      throw new Error("Protocol not defined for command " + this.command);
    }
    return this.protocol;
  };

  CommandResponse.prototype.setProtocol = function(protocol) {
    this.protocol = protocol;
  };

  CommandResponse.prototype.getCommand = function() {
    return this.command;
  };

  CommandResponse.prototype.getPayload = function() {
    return this.payload;
  };

  CommandResponse.prototype.toJSON = function() {
    return {
      protocol: this.getProtocol(),
      command: this.getCommand(),
      payload: this.getPayload()
    };
  };

  return CommandResponse;

})();

module.exports = CommandResponse;
