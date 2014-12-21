
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
"use strict";
var NotFoundError, RestError, RiakError, ValidationError, data;

RestError = require('restify').RestError;

data = require('joukou-data');

NotFoundError = (data.errors || {}).NotFoundError;

RiakError = (data.errors || {}).RiakError;

ValidationError = (data.errors || {}).ValidationError;


/**
@class joukou-api/log/LoggerFactory
@requires bunyan
@requires path
@author Isaac Johnston <isaac.johnston@joukou.com>
@copyright (c) 2009-2014 Joukou Ltd. All rights reserved.
 */

module.exports = new ((function() {

  /**
  @private
  @static
  @property {bunyan} bunyan
   */
  var bunyan, loggers, path;

  bunyan = require('bunyan');


  /**
  @private
  @static
  @property {path} path
   */

  path = require('path');


  /**
  @private
  @static
  @property {Object} loggers
   */

  loggers = {};


  /**
  @method constructor
   */

  function _Class() {
    if (process.env.NODE_ENV === 'production') {
      this.logLevel = bunyan.INFO;
    } else {
      this.logLevel = bunyan.INFO;
    }
  }


  /**
  @method getLogger
  @param {Object} config
   */

  _Class.prototype.getLogger = function(config) {
    if (!loggers[config.name]) {
      return loggers[config.name] = this.createLogger(config);
    } else {
      return loggers[config.name];
    }
  };


  /**
  @method createLogger
  @param {Object} config
   */

  _Class.prototype.createLogger = function(config) {

    /*
    oldInfo = bunyan.prototype.info
    bunyan.prototype.info = (obj, message, statusCode) ->
      if not obj or not obj.err
        return oldInfo.apply(this, [obj, message, statusCode])
      if obj.err instanceof NotFoundError
        obj.NotFoundError = obj.err
      if obj.err instanceof RiakError
        obj.RiakError = obj.err
      if obj.err instanceof ValidationError
        obj.ValidationError = obj.err
      obj.err = obj.err.InnerError or obj.err
      return oldInfo.apply(this, [obj, message, statusCode])
     */
    var logger;
    logger = bunyan.createLogger({
      name: config.name,
      streams: [
        {
          stream: process.stdout,
          level: this.logLevel
        }
      ]
    });
    return logger;
  };

  return _Class;

})());
