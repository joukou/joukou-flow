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
assert            = require( 'assert' )
chai              = require( 'chai' )
chaiAsPromised    = require( 'chai-as-promised' )
chai.use( chaiAsPromised )
should            = chai.should()
expect            = chai.expect
Q                 = require( 'q' )
RuntimeContext    = require( '../../../dist/runtime' )
_                 = require( 'lodash' )

index             = require( '../../../dist/protocols/graph/index' )

context           = new RuntimeContext( )

context.getPersonas = ->
  return Q.resolve( [ { key: 'persona' } ] )

context.user = {
  save: ->
    return Q.resolve( @ )
  getValue: ->
    return {

    }
  setValue: ->
  getKey: ->
    return 'test'
}
context.authorized = true

old_save = index.prototype._save
index.prototype._save = ( payload ) ->
  deferred = Q.defer()
  process.nextTick( ->
    deferred.resolve( payload )
  )
  return deferred.promise

describe 'protocols/graph/index', ->
  specify 'has protocol', ->
    protocol = new index()
    expect( protocol.protocol ).to.equal( 'graph' )
  specify 'has clear command', ->
    protocol = new index()
    expect( protocol.getHandler( 'clear' ) ).to.be.instanceof( Function )
  specify 'has graph command', ->
    protocol = new index()
    expect( protocol.getHandler( 'graph' ) ).to.be.instanceof( Function )
  specify 'has addNode command', ->
    protocol = new index()
    expect( protocol.getHandler( 'addNode' ) ).to.be.instanceof( Function )
  specify 'has removeNode command', ->
    protocol = new index()
    expect( protocol.getHandler( 'removeNode' ) ).to.be.instanceof( Function )
  specify 'has renameNode command', ->
    protocol = new index()
    expect( protocol.getHandler( 'renameNode' ) ).to.be.instanceof( Function )
  specify 'has changeNode command', ->
    protocol = new index()
    expect( protocol.getHandler( 'changeNode' ) ).to.be.instanceof( Function )
  specify 'has addEdge command', ->
    protocol = new index()
    expect( protocol.getHandler( 'addEdge' ) ).to.be.instanceof( Function )
  specify 'has removeEdge command', ->
    protocol = new index()
    expect( protocol.getHandler( 'removeEdge' ) ).to.be.instanceof( Function )
  specify 'has changeEdge command', ->
    protocol = new index()
    expect( protocol.getHandler( 'changeEdge' ) ).to.be.instanceof( Function )
  specify 'has addInitial command', ->
    protocol = new index()
    expect( protocol.getHandler( 'addInitial' ) ).to.be.instanceof( Function )
  specify 'has removeInitial command', ->
    protocol = new index()
    expect( protocol.getHandler( 'removeInitial' ) ).to.be.instanceof( Function )
  specify 'has addInport command', ->
    protocol = new index()
    expect( protocol.getHandler( 'addInport' ) ).to.be.instanceof( Function )
  specify 'has removeInport command', ->
    protocol = new index()
    expect( protocol.getHandler( 'removeInport' ) ).to.be.instanceof( Function )
  specify 'has renameInport command', ->
    protocol = new index()
    expect( protocol.getHandler( 'renameInport' ) ).to.be.instanceof( Function )
  specify 'has addOutport command', ->
    protocol = new index()
    expect( protocol.getHandler( 'addOutport' ) ).to.be.instanceof( Function )
  specify 'has removeOutport command', ->
    protocol = new index()
    expect( protocol.getHandler( 'removeOutport' ) ).to.be.instanceof( Function )
  specify 'has renameOutport command', ->
    protocol = new index()
    expect( protocol.getHandler( 'renameOutport' ) ).to.be.instanceof( Function )
  specify 'has addGroup command', ->
    protocol = new index()
    expect( protocol.getHandler( 'addGroup' ) ).to.be.instanceof( Function )
  specify 'has addGroup command', ->
    protocol = new index()
    expect( protocol.getHandler( 'addGroup' ) ).to.be.instanceof( Function )
  specify 'has removeGroup command', ->
    protocol = new index()
    expect( protocol.getHandler( 'removeGroup' ) ).to.be.instanceof( Function )
  specify 'has renameGroup command', ->
    protocol = new index()
    expect( protocol.getHandler( 'renameGroup' ) ).to.be.instanceof( Function )
  specify 'has changeGroup command', ->
    protocol = new index()
    expect( protocol.getHandler( 'changeGroup' ) ).to.be.instanceof( Function )
  specify 'creates new graph on clear', ( done ) ->
    protocol = new index()
    protocol.graphs[ 'test' ] = {
      OLD: true
    }
    handler = protocol.getHandler( 'clear' )
    handler({
      id: 'test'
      name: 'name_test'
    }, context)
    .then( ->

      console.log( _.keys( protocol.graphs ) )

      try
        expect( protocol.graphs[ 'test' ].OLD ).to.be.not.ok
        expect( protocol.graphs[ 'test' ].name ).to.equal( 'name_test' )
        done( )
      catch e
        done( e )
    )

###
specify 'get graph from object', ( done ) ->
protocol = new index()
protocol.graphs[ 'test' ] = {
  TEST: true
}
handler = protocol.getHandler( 'graph' )
handler({
  graph: 'test'
}, context)
.then( ( res ) ->
  try
    expect( res.TEST ).to.be.ok
    done( )
  catch e
    done( e )
).fail( done )


specify 'resolves with noflo graph', ( done ) ->
protocol = new index()
protocol._getModelByPublicKey = ->
  return Q.resolve({
    getKey: ->
      return 'test'
    getValue: ->
      return {
        name: 'test',
        personas: [
          {
            key: 'persona'
          }
        ]
      }
  })
clearHandler = protocol.getHandler( 'clear' )
clearHandler({
  id: 'test',
  name: 'test'
}, context)
.then( ->
  handler = protocol.getHandler( 'graph' )
  handler({
    graph: 'test'
  }, context)
  .then( ( res ) ->
    try
      expect( res.addNode ).to.be.instanceof(Function)
      done( )
    catch e
      done( e )
  ).fail( done )
)

specify 'add node, adds node', ( done ) ->
protocol = new index()
clearHandler = protocol.getHandler( 'clear' )
clearHandler({
  id: 'test',
  name: 'test'
}, context)
.then( ->
  handler = protocol.getHandler( 'addnode' )
  handler({
    id: 'test',
    component: 'test',
    graph: 'test'
  }, context)
  .then( ->
    try
      expect( protocol.graphs[ 'test' ].nodes[0].id ).to.equal( 'test' )
      done( )
    catch e
      done( e )
  )
  .fail( done )
)

###




