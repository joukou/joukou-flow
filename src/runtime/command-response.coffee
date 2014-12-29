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
class CommandResponse
  constructor: ( @command, @payload, @protocol = undefined ) ->

  hasProtocol: ->
    return @protocol?

  getProtocol: ->
    unless @hasProtocol( )
      throw new Error( "Protocol not defined for command #{ @command }")
    return @protocol

  setProtocol: ( @protocol ) ->

  setSendQueue: ( @sendQueue ) ->

  getSendQueue: ->
    return @sendQueue

  getCommand: ->
    return @command

  getPayload: ->
    return @payload

  toJSON: ->
    res = {
      protocol: @getProtocol( )
      command: @getCommand( )
      payload: @getPayload( )
    }
    queue = @getSendQueue( )
    if queue?
      res.queue = queue
    return res

module.exports = CommandResponse