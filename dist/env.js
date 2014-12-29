
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

/**
@module joukou-fbpp/env
@author Fabian Cook <fabian.cook@joukou.com>
 */
var Q, fs, pem, self;

fs = require('fs');

Q = require('q');

pem = require('pem');

self = {
  getFlowHubEnvironmentName: function() {},
  isDevelopment: function() {
    return true;
  },
  getSSLKeyAndCertificate: function() {
    var deferred;
    deferred = Q.defer();
    self._getSSLKey().then(function(key) {
      return self._getSSLCertificate().then(function(certificate) {
        return deferred.resolve({
          certificate: certificate,
          key: key,
          passphrase: self._getSSLPassPhrase()
        });
      });
    }).fail(deferred.reject);
    return deferred.promise;
  },
  _getSSLPassPhrase: function() {
    return process.env.JOUKOU_SSL_PASSPHRASE || 'joukou';
  },
  _getSSLKey: function() {
    var deferred;
    deferred = Q.defer();
    fs.readFile('./ssl/localhost.key', function(err, data) {
      if (err) {
        return deferred.reject(err);
      }
      return deferred.resolve(data);
    });
    return deferred.promise;
  },
  _getSSLCertificate: function() {
    var deferred;
    deferred = Q.defer();
    fs.readFile('./ssl/localhost.crt', function(err, data) {
      if (err) {
        return deferred.reject(err);
      }
      return deferred.resolve(data);
    });
    return deferred.promise;
  },
  getJWTToken: function() {
    return 'abc';
  },
  getWebSocketConnectionString: function() {
    return "wss://localhost:2102";
  },
  getHost: function() {
    return "http://localhost:2101";
  }
};

module.exports = self;
