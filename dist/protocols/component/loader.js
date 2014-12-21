
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
var ComponentLoader, NoFlo, Q, models, _;

Q = require('q');

_ = require('lodash');

models = require('joukou-data').models;

NoFlo = require('noflo');

ComponentLoader = (function() {
  function ComponentLoader(context) {
    this.context = context;
  }

  ComponentLoader.prototype.getComponent = function(name) {
    if (typeof name !== 'string') {
      return void 0;
    }
  };

  ComponentLoader.prototype._toComponent = function(circle) {
    var component, key, options, port, value, _i, _j, _len, _len1, _ref, _ref1, _ref2, _ref3;
    value = circle.getValue();
    options = {
      inPorts: new NoFlo.InPorts(),
      outPorts: new NoFlo.OutPorts()
    };
    _ref = value.inports;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      port = _ref[_i];
      options.inPorts.add(port.name, {
        datatype: 'all',
        required: port.required,
        description: port.description,
        addressable: port.addressable
      });
    }
    _ref1 = value.outports;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      port = _ref1[_j];
      options.outPorts.add(port.name, {
        datatype: 'all',
        required: port.required,
        description: port.description,
        addressable: port.addressable
      });
    }
    component = new NoFlo.Component(options);
    _ref2 = component.inPorts.ports;
    for (key in _ref2) {
      port = _ref2[key];
      if (!component.inPorts.ports.hasOwnProperty(key)) {
        continue;
      }
      port.name = key;
      port.node = circle.getKey();
    }
    _ref3 = component.outPorts.ports;
    for (key in _ref3) {
      port = _ref3[key];
      if (!component.outPorts.ports.hasOwnProperty(key)) {
        continue;
      }
      port.name = key;
      port.node = circle.getKey();
    }
    component.description = value.description;
    component.setIcon(value.icon);
    return component;
  };

  ComponentLoader.prototype._loadComponents = function() {
    var deferred;
    deferred = Q.defer();
    this.context.getPersonas().then((function(_this) {
      return function(personas) {
        var keys;
        keys = _.map(personas, function(persona) {
          return persona.key;
        });
        return models.circle.retrieveByPersonas(keys).then(function(circles) {
          var result;
          result = _.map(circles, function(circle) {
            var component, toPorts;
            component = _this._toComponent(circle);
            toPorts = function(ports) {
              var key, port, res;
              res = [];
              for (key in ports) {
                port = ports[key];
                if (!ports.hasOwnProperty(key)) {
                  continue;
                }
                res.push({
                  id: port.getId(),
                  type: port.getDataType(),
                  description: port.getDescription(),
                  addressable: port.isAddressable(),
                  required: port.isRequired(),
                  values: void 0,
                  "default": void 0
                });
              }
              return res;
            };
            return (_this.components != null ? _this.components : _this.components = {})[circle.getKey()] = {
              name: circle.getKey(),
              description: component.getDescription(),
              icon: component.getIcon(),
              subgraph: component.isSubgraph(),
              inPorts: toPorts(component.inPorts.ports),
              outPorts: toPorts(component.outPorts.ports)
            };
          });
          return deferred.resolve(result);
        });
      };
    })(this)).fail(deferred.reject);
    return deferred.promise;
  };

  ComponentLoader.prototype.listComponents = function() {
    if (this.components) {
      return Q.resolve(_.values(this.components));
    }
    return this._loadComponents();
  };

  return ComponentLoader;

})();

module.exports = ComponentLoader;
