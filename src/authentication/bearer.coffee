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
{ Strategy }          = require( 'passport-http-bearer' )
{ UnauthorizedError } = require( 'restify' )
jwt                   = require( 'jsonwebtoken' )
env                   = require( '../env' )
{ models }            = require( 'joukou-data' )
Q                     = require( 'q' )

verify = ( token, next ) ->
  decode( token )
  .then( ( decoded ) ->
    key = decoded.key
    if typeof key isnt 'string'
      return next( new UnauthorizedError() )
    models.agent.retrieve( key )
    .then( ( agent ) ->
      value = agent.getValue()
      if (
        decoded.token and
        value.jwt_token and
        value.jwt_token isnt decoded.token
      )
        return next( new UnauthorizedError() )
      next( null, agent )
    )
    .fail( ->
      next( new UnauthorizedError() )
    )
  )
  .fail( next )

generate = ( agent, token = null ) ->
  if (
    not agent or
    agent.getKey not instanceof Function or
    agent.getValue not instanceof Function
  )
    return ""
  return jwt.sign(
    {
      key: agent.getKey()
      token: token,
      value: not token and agent.getValue()
    },
    env.getJWTToken()
  )

decode = ( token ) ->
  if not token
    return Q.reject(
      new UnauthorizedError()
    )
  deferred = Q.defer()
  jwt.verify( token, env.getJWTToken(), ( err, decoded ) ->
    if err
      return deferred.reject(
        new UnauthorizedError()
      )
    deferred.resolve(
      decoded
    )
  )
  return deferred.promise


module.exports =
  decode: decode
  verify: verify
  generate: generate
  authenticate: null
  strategy: null
  setup: ( passport ) ->
    passport.use(@strategy = new Strategy(@verify))
    @authenticate = passport.authenticate(
      'bearer',
      session: false
    )