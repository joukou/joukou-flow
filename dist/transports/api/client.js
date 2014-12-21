
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
var ApiClient, BaseClient, MessageSchema,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseClient = require('../base/client');

MessageSchema = require('../../message/schema');

ApiClient = (function(_super) {
  __extends(ApiClient, _super);

  function ApiClient(req, res, next, api, context) {
    var _ref;
    this.req = req;
    this.res = res;
    this.next = next;
    this.api = api;
    this.context = context;
    this.payloads = ((_ref = req.body) != null ? _ref.payloads : void 0) || [];
    this.results = [];
    if (req.user) {
      context.user = req.user;
      context.authorized = true;
    }
  }

  ApiClient.prototype.runPayloads = function() {
    var next;
    if (!this.payloads.length) {
      return this.res.send(400, {
        payloads: [],
        error: 'No payloads found'
      });
    }
    this.index = -1;
    next = (function(_this) {
      return function() {
        var payload, promise;
        _this.index += 1;
        payload = _this.payloads[_this.index];
        if (!payload) {
          return _this.complete();
        }
        if (!MessageSchema.validate(payload)) {
          _this.results[_this.index] = {
            success: false,
            error: 'Payload not valid',
            payload: null,
            requestPayload: payload,
            run: false
          };
          return _this.complete();
        }
        promise = context.receive(payload);
        return promise.then(function(resultPayload) {
          _this.results[_this.index] = {
            success: true,
            error: null,
            payload: resultPayload,
            requestPayload: payload,
            run: true
          };
          return next();
        }).fail(function(err) {
          _this.results[_this.index] = {
            success: false,
            error: err,
            payload: null,
            requestPayload: payload,
            run: true
          };
          return _this.complete();
        });
      };
    })(this);
    return next();
  };

  ApiClient.prototype.complete = function() {
    var i, index, response, result, _i, _len, _ref, _results;
    response = {
      result: [],
      payloads: [],
      success: false
    };
    this.completedUpTo = -1;
    _ref = this.results;
    for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
      result = _ref[index];
      response.result.push(result);
      if (result.success) {
        this.completedUpTo = index;
        response.payload.push(result.payload);
      }
    }
    response.success = this.completedUpTo === this.payloads.length;
    if (!response.success) {
      i = this.completedUpTo;
      _results = [];
      while (i < this.payloads.length) {
        if (this.results[i]) {
          i++;
          continue;
        }
        response.result.push({
          success: false,
          error: null,
          payload: null,
          requestPayload: this.payloads[i],
          run: false
        });
        _results.push(i++);
      }
      return _results;
    }
  };

  return ApiClient;

})(BaseClient);

module.exports = ApiClient;
