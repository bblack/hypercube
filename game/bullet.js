var util = require('util')
var Entity = require('./entity')

var Bullet = function(game, opts){
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
