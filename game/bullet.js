var util = require('util')
var _ = require('underscore')
var Entity = require('./entity')
var Rock = require('./rock')

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

Bullet.prototype.tick = function(){
  Bullet.super_.prototype.tick.call(this);

  var self = this;
  var collidingRock = _.find(this.game.entities, function(e){
    return e.type == 'rock' && e.collidesWith(self, e.position, self.position)
  })

  if (collidingRock) {
    console.log('bullet', self.id, 'collides with rock', collidingRock.id)
    var newRock1 = new Rock(self.game, {
      radius: collidingRock.radius / 2,
      position: [collidingRock.position[0] - collidingRock.radius / 2, collidingRock.position[1]]
    })
    var newRock1 = new Rock(self.game, {
      radius: collidingRock.radius / 2,
      position: [collidingRock.position[0] + collidingRock.radius / 2, collidingRock.position[1]]
    })
    self.game.removeEntity(collidingRock.id)
    self.game.removeEntity(self.id)
  }
}

module.exports = Bullet
