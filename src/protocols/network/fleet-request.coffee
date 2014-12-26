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
env = require( '../../env' )

class RabbitMQRequest

  constructor: ( @graph, @state, @secret, @exchange = undefined ) ->

  toJSON: ->
    if @graph.getKey instanceof Function
      key = @graph.getKey()
    if @graph.properties?.metadata?.private_key
      key = @graph.properties.metadata.private_key
    ret = {
      "_links": {
        "joukou:graph": {
          href: "#{env.getHost()}/fbp/protocols/graph/#{key}"
        }
      },
      desiredState: @state,
      secret: @secret,
      exchange: @exchange
    }
    return JSON.stringify( ret )

module.exports = RabbitMQRequest