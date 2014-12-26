
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
var JoukouConductorExchange, JoukouConductorRoutingKey, RabbitMQClient;

RabbitMQClient = require('joukou-conductor-rabbitmq').RabbitMQClient;

JoukouConductorExchange = process.env["JOUKOU_CONDUCTOR_EXCHANGE"];

JoukouConductorRoutingKey = process.env["JOUKOU_CONDUCTOR_ROUTING_KEY"];

if (!JoukouConductorExchange) {
  JoukouConductorExchange = "amqp://localhost";
  process.env["JOUKOU_CONDUCTOR_EXCHANGE"] = JoukouConductorExchange;
}

if (!JoukouConductorRoutingKey) {
  JoukouConductorRoutingKey = "CONDUCTOR";
  process.env["JOUKOU_CONDUCTOR_ROUTING_KEY"] = JoukouConductorRoutingKey;
}

module.exports = RabbitMQClient.getClient(JoukouConductorExchange, JoukouConductorRoutingKey);
