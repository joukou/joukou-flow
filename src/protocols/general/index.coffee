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
BaseProtocol = require( '../base' )
Q            = require( 'q' )
schema       = require( './schema' )

class GeneralProtocol extends BaseProtocol

  constructor: ( context ) ->
    super( 'general', context )

    @command( 'setPersona', @setPersona, 'persona/:persona', 'PUT' )

    @addCommandSchemas( schema )

  ###
  @typedef { object } setPersonaPayload
  @property { string } persona
  ###
  ###
  @param { setPersonaPayload } payload
  @returns { setPersonaPayload | Promise }
  ###
  setPersona: ( payload ) ->
    deferred = Q.defer()

    @context.getPersonas()
    .then( ( personas ) =>

      persona = null

      for model in personas
        if model.getKey() is payload.persona
          persona = model
          break

      if not persona
        return deferred.reject(
          "No persona for the key #{payload.persona}"
        )

      @context.persona_key = persona.getKey()
      @context.persona = persona

      deferred.resolve(
        payload
      )

    )
    .fail( deferred.reject )

    return deferred.promise


module.exports = GeneralProtocol