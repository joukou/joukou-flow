
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
var BaseProtocol, CommandResponse, ComponentProtocol, NoFlo, NonReturnResponse, Q, models, schema, _,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseProtocol = require('../base');

models = require('joukou-data').models;

_ = require('lodash');

NoFlo = require('noflo');

Q = require('q');

schema = require('./schema');

NonReturnResponse = require('../../runtime/non-return-response');

CommandResponse = require('../../runtime/command-response');


/**
@module joukou-fbpp/protocols/component
@author Fabian Cook <fabian.cook@joukou.com>
 */

ComponentProtocol = (function(_super) {
  __extends(ComponentProtocol, _super);


  /**
  @constructor ComponentProtocol
   */

  function ComponentProtocol(context) {
    ComponentProtocol.__super__.constructor.call(this, 'component', context);
    this.loader = context.getComponentLoader();
    this.command('list', this.list, 'list', 'GET');

    /*
    !!! PLEASE NOTE THIS VALIDATES ALL PAYLOADS !!!
     */
    this.addCommandSchemas(schema);
  }


  /**
  @typedef { object } inPort
  @property { string } id
  @property { string } type
  @property { string } description
  @property { boolean } addressable
  @property { boolean } [required=false]
  @property { Array } values
  @property { * } default
   */


  /**
  @typedef { object } outPort
  @property { string } id
  @property { string } type
  @property { string } description
  @property { boolean } addressable
  @property { boolean } required
   */


  /**
  @typedef { object } component
  @property { string } name
  @property { string } [description=undefined]
  @property { string } [icon=undefined]
  @property { boolean } subgraph
  @property { Array.<inPort> } inPorts
  @property { Array.<outPort> } outPorts
   */


  /**
  @returns { Array.<component> | Promise }
   */

  ComponentProtocol.prototype.list = function() {
    var deferred;
    deferred = Q.defer();
    this.loader.listComponents().progress((function(_this) {
      return function(component) {
        var response;
        response = new CommandResponse('component', component);
        return _this.send(response);
      };
    })(this)).then(function() {
      return deferred.resolve(new NonReturnResponse);
    });
    return deferred.promise;
  };


  /**
  @typedef { object } source
  @property { string } name
  @property { string } language
  @property { string } [library=undefined]
  @property { string } code
  @property { * } tests
   */


  /**
  @typedef { object } getSourcePayload
  @property { string } name
   */


  /**
  @param { getSourcePayload } payload
  @returns { source | Promise }
   */

  return ComponentProtocol;

})(BaseProtocol);

module.exports = ComponentProtocol;
