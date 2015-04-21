var util = require('util')
var _ = require('underscore')
var Entity = require('./entity')

var Bullet = function(game, opts){
  opts = _.clone(opts)
  _.defaults(opts, {ttl: 1000})
  Bullet.super_.call(this, game, 'bullet', opts)
}

util.inherits(Bullet, Entity)

Bullet.prototype.descriptor = function(){
  return {
    id: this.id,
    type: this.type,
    position: this.position,
    velocity: this.velocity
  };
}

module.exports = Bullet
