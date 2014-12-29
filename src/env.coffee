###
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
###
###*
@module joukou-fbpp/env
@author Fabian Cook <fabian.cook@joukou.com>
###
fs  = require( 'fs' )
Q   = require( 'q' )
pem = require( 'pem' )

self =
  getFlowHubEnvironmentName: ->


  isDevelopment: ->
    return true # TODO
  getSSLKeyAndCertificate: ->
    deferred = Q.defer()
    self._getSSLKey()
    .then( ( key ) ->
      return self._getSSLCertificate()
      .then( ( certificate ) ->
        deferred.resolve(
          certificate: certificate
          key: key
          passphrase: self._getSSLPassPhrase( )
        )
      )
    )
    .fail( deferred.reject )
    return deferred.promise
  # TODO get signed production pair
  _getSSLPassPhrase: ->
    return process.env.JOUKOU_SSL_PASSPHRASE or 'joukou'
  _getSSLKey: ->
    deferred = Q.defer()
    fs.readFile( './ssl/localhost.key', ( err, data ) ->
      if err
        return deferred.reject( err )
      deferred.resolve( data )
    )
    return deferred.promise
  _getSSLCertificate: ->
    deferred = Q.defer()
    fs.readFile( './ssl/localhost.crt', ( err, data ) ->
      if err
        return deferred.reject( err )
      deferred.resolve( data )
    )
    return deferred.promise
  getJWTToken: ->
    return 'abc' # TODO load from file
  getWebSocketConnectionString: ->
    return "wss://localhost:2102" # TODO
  getHost: ->
    # TODO get from api
    return "http://localhost:2101"

module.exports = self