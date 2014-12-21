
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
var Q, Strategy, UnauthorizedError, decode, env, generate, jwt, models, verify;

Strategy = require('passport-http-bearer').Strategy;

UnauthorizedError = require('restify').UnauthorizedError;

jwt = require('jsonwebtoken');

env = require('../env');

models = require('joukou-data').models;

Q = require('q');

verify = function(token, next) {
  return decode(token).then(function(decoded) {
    var key;
    key = decoded.key;
    if (typeof key !== 'string') {
      return next(new UnauthorizedError());
    }
    return models.agent.retrieve(key).then(function(agent) {
      var value;
      value = agent.getValue();
      if (decoded.token && value.jwt_token && value.jwt_token !== decoded.token) {
        return next(new UnauthorizedError());
      }
      return next(null, agent);
    }).fail(function() {
      return next(new UnauthorizedError());
    });
  }).fail(next);
};

generate = function(agent, token) {
  if (token == null) {
    token = null;
  }
  if (!agent || !(agent.getKey instanceof Function) || !(agent.getValue instanceof Function)) {
    return "";
  }
  return jwt.sign({
    key: agent.getKey(),
    token: token,
    value: !token && agent.getValue()
  }, env.getJWTToken());
};

decode = function(token) {
  var deferred;
  if (!token) {
    return Q.reject(new UnauthorizedError());
  }
  deferred = Q.defer();
  jwt.verify(token, env.getJWTToken(), function(err, decoded) {
    if (err) {
      return deferred.reject(new UnauthorizedError());
    }
    return deferred.resolve(decoded);
  });
  return deferred.promise;
};

module.exports = {
  decode: decode,
  verify: verify,
  generate: generate,
  authenticate: null,
  strategy: null,
  setup: function(passport) {
    passport.use(this.strategy = new Strategy(this.verify));
    return this.authenticate = passport.authenticate('bearer', {
      session: false
    });
  }
};
