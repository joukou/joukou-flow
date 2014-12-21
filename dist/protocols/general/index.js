
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
var BaseProtocol, GeneralProtocol, Q, schema,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseProtocol = require('../base');

Q = require('q');

schema = require('./schema');

GeneralProtocol = (function(_super) {
  __extends(GeneralProtocol, _super);

  function GeneralProtocol(context) {
    GeneralProtocol.__super__.constructor.call(this, 'general', context);
    this.command('setPersona', this.setPersona, 'persona/:persona', 'PUT');
    this.addCommandSchemas(schema);
  }


  /*
  @typedef { object } setPersonaPayload
  @property { string } persona
   */


  /*
  @param { setPersonaPayload } payload
  @returns { setPersonaPayload | Promise }
   */

  GeneralProtocol.prototype.setPersona = function(payload) {
    var deferred;
    deferred = Q.defer();
    this.context.getPersonas().then((function(_this) {
      return function(personas) {
        var model, persona, _i, _len;
        persona = null;
        for (_i = 0, _len = personas.length; _i < _len; _i++) {
          model = personas[_i];
          if (model.getKey() === payload.persona) {
            persona = model;
            break;
          }
        }
        if (!persona) {
          return deferred.reject("No persona for the key " + payload.persona);
        }
        _this.context.persona_key = persona.getKey();
        _this.context.persona = persona;
        return deferred.resolve(payload);
      };
    })(this)).fail(deferred.reject);
    return deferred.promise;
  };

  return GeneralProtocol;

})(BaseProtocol);

module.exports = GeneralProtocol;
