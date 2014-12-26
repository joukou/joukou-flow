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
JoukouFleetAPIHost        = process.env["JOUKOU_FLEET_API_HOST"]
JoukouFleetAPIPath        = process.env["JOUKOU_FLEET_API_PATH"]

if not JoukouFleetAPIHost
  JoukouFleetAPIHost = "http://localhost:4001"
  process.env["JOUKOU_FLEET_API_HOST"] = JoukouFleetAPIHost

if not JoukouFleetAPIPath
  JoukouFleetAPIPath = "fleet/v1/"
  process.env["JOUKOU_FLEET_API_PATH"] = JoukouFleetAPIPath

fleet = require( 'joukou-conductor-fleet' )

#endpoint, basePath, doDiscovery

module.exports = fleet.getClient(
  JoukouFleetAPIHost,
  JoukouFleetAPIPath,
  yes
)