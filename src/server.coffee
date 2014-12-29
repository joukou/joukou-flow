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
@module joukou-fbpp/server
@author Fabian Cook <fabian.cook@joukou.com>
###
# Standalone module

unless process.env["JOUKOU_FLEET_API_HOST"]
  process.env["JOUKOU_FLEET_API_HOST"] = 'http://localhost:4001'
unless process.env["JOUKOU_FLEET_API_PATH"]
  process.env["JOUKOU_FLEET_API_PATH"] = "/v1/"


restify         = require( 'restify' )
cors            = require( './cors' )
ApiTransport    = require( './transports/api' )
SocketTransport = require( './transports/socket' )
LoggerFactory   = require( './log/LoggerFactory' )
pjson           = require( '../package.json' )
registery       = require( './registry' )
initialize      = require( './initialize' )
https           = require( 'restify-https' )
_               = require( 'lodash' )
env             = require( './env' )

module.exports = env.getSSLKeyAndCertificate()
.then( ( keys ) ->
  httpOptions =
    name: 'flow'
    version: pjson.version
    log: LoggerFactory.getLogger( name: 'http-server' )
    acceptable: [
      'application/json'
    ]

  httpsOptions = _.clone( httpOptions )
  httpsOptions.log = LoggerFactory.getLogger( name: 'https-server' )
  httpsOptions.certificate = keys.certificate
  httpsOptions.key = keys.key
  httpsOptions.passphrase = keys.passphrase

  httpServer = restify.createServer(
    httpOptions
  )

  httpsServer = restify.createServer(
    httpsOptions
  )

  setup = ( server, loggerName ) ->
    server.pre( cors.preflight )
    server.use( cors.actual )
    server.use( restify.acceptParser( server.acceptable ) )
    server.use( restify.dateParser() )
    server.use( restify.queryParser() )
    server.use( restify.jsonp() )
    server.use( restify.gzipResponse() )
    server.use( restify.bodyParser( mapParams: false ) )

    server.on(
      'after',
      restify.auditLogger(
        log: LoggerFactory.getLogger( name: loggerName )
      )
    )

    server.on( 'uncaughtException', (err) ->
      console.log(err)
    )

  setup( httpServer, 'http-audit' )

  setup( httpsServer, 'https-audit' )

  transports = initialize( httpServer, httpsServer )

  routes = transports.ApiTransports[ 0 ].getRoutes()

  for key of routes
    if not routes.hasOwnProperty( key )
      continue
    for val in routes[ key ]
      console.log( key, val )


  calback = ( server, type, register = no ) ->
    return ->
      server.log.info(
        "#{type}: #{server.name}-#{pjson.version} listening at #{server.url}"
      )

      if register
        registery.register(
          '669b1aa1-381b-4a8b-8461-b057aa248913',
          'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJrZXkiOi' +
            'JmZDZkMzY0MS0xNjhiLTRlZWMtODM4ZS04YzYwN2EzYzk1ZG' +
            'MiLCJpYXQiOjE0MTgyMDcwMTR9.NHRn_a9FRb1UShTCSpLTX' +
            '13zBqvdgHBSAXH5e9YFTHU'
        )
        .then( ->
          console.log( 'Runtime registered' )
        )
        .fail( ( err ) ->
          console.log( 'Runtime failed to register', err )
        )

  httpServer.listen(
    process.env.JOUKOU_API_PORT || 2101,
    process.env.JOUKOU_API_HOST || 'localhost',
    calback( httpServer, 'HTTP', no )
  )

  httpsServer.listen(
    process.env.JOUKOU_API_HTTPS_PORT || 2102,
    process.env.JOUKOU_API_HOST || 'localhost',
    calback( httpsServer, 'HTTPS', yes )
  )

  return {
    httpServer: httpServer
    httpsServer: httpsServer
    transports: transports
  }
)

