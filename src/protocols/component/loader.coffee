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
Q           = require( 'q' )
_           = require( 'lodash' )
{ models }  = require( 'joukou-data' )
NoFlo       = require( 'noflo' )

componentToJSON = ( component ) ->
  # Check http://noflojs.org/documentation/protocol/
  # Component protocol - component
  toPorts = ( ports ) ->
    res = []
    for key, port of ports
      if not ports.hasOwnProperty( key )
        continue
      res.push({
        id: key
        type: port.getDataType( )
        description: port.getDescription( )
        addressable: port.isAddressable( )
        required: port.isRequired( )
        values: undefined # TODO
        default: undefined # TODO
      })
    return res

  return {
    name: component.name
    description: component.getDescription( )
    icon: component.getIcon( )
    subgraph: component.isSubgraph( )
    inPorts: toPorts(
      component.inPorts.ports
    )
    outPorts: toPorts(
      component.outPorts.ports
    )
  }

class ComponentLoader
  constructor: ( @context ) ->

  getComponent: ( name ) ->
    unless typeof name is 'string'
      return Q.reject( 'Name is required' )
    @context.getPersonas()
    .then( ( personas ) ->
      models.circle.getByFullName(
        name,
        personas
      )
    )

  getComponentForCircle: ( circle ) ->
    return (@components ?= {})[ circle.getKey() ] ?= @_toComponent( circle )

  _toComponent: ( circle ) ->
    value = circle.getValue( )

    options = {
      inPorts: new NoFlo.InPorts( )
      outPorts: new NoFlo.OutPorts( )
    }

    for port in value.inports
      options.inPorts.add(
        port.name,
        {
          datatype: 'all' # TODO add data types
          required: port.required
          description: port.description,
          addressable: port.addressable
        }
      )

    for port in value.outports
      options.outPorts.add(
        port.name,
        {
          datatype: 'all' # TODO add data types
          required: port.required
          description: port.description,
          addressable: port.addressable
        }
      )

    if not NoFlo.Component.prototype.toJSON
      NoFlo.Component.prototype.toJSON = ->
        componentToJSON( @ )

    if not NoFlo.Component.prototype.getName
      NoFlo.Component.prototype.getName = ->
        return @name

    if not NoFlo.Component.prototype.setName
      NoFlo.Component.prototype.setName = ( name ) ->
        return @name = name

    # TODO add Joukou Component
    component = new NoFlo.Component(
      options
    )

    # Add node and names, not sure why they don't have something for this

    for key, port of component.inPorts.ports
      if not component.inPorts.ports.hasOwnProperty(
        key
      )
        continue
      port.name = key
      port.node = circle.getKey( )

    for key, port of component.outPorts.ports
      if not component.outPorts.ports.hasOwnProperty(
        key
      )
        continue
      port.name = key
      port.node = circle.getKey( )

    component.description = value.description

    component.setIcon( value.icon )

    component.setName( value.name )

    return component

  _loadComponents: ->
    deferred = Q.defer( )
    @context.getPersonas( )
    .then( ( personas ) =>
      keys = _.map( personas, ( persona ) ->
        return persona.key
      )
      models.circle.retrieveByPersonas(
        keys
      )
      .then( ( circles ) =>
        result = _.map( circles, ( circle ) =>
          component = @getComponentForCircle( circle )
          deferred.notify(
            component
          )
          return component
        )
        deferred.resolve(
          result
        )
      )
    )
    .fail( deferred.reject )

    return deferred.promise

  listComponents: ->
    # Load every time
    #if @components
    #  return Q.resolve(
    #    _.values(
    #      @components
    #    )
    #  )
    return @_loadComponents()

module.exports = ComponentLoader