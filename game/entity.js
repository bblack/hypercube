var _ = require('underscore')
var Model = require('./Model')

var Entity = function(game, type, opts){
  var self = this;
  this.game = game;
  this.id = game.getNewEntityId();
  this.type = type;
  // ballistics
  this.model = new Model.Point()
  this.position = [0, 0]
  this.velocity = [0, 0]
  this.accel = [0, 0]
  for (var key in opts) {
    // clone in case e.g. copying vector from another entity
    this[key] = _.clone(opts[key]);
  }
  game.addEntity(this);

  if (this.ttl) {
    setTimeout(function(){
      if (game.entities[self.id])
        game.removeEntity(self.id)
    }, this.ttl)
  }
}

Entity.prototype.tick = function(duration){
  var p = this;

  // calc velo
  p.velocity[0] += p.accel[0];
  p.velocity[1] += p.accel[1];
  // cap abs(v)
  var vAbs = Math.sqrt(Math.pow(p.velocity[0], 2) + Math.pow(p.velocity[1], 2));
  if (vAbs > this.maxSpeed) {
    p.velocity[0] = p.velocity[0] * (this.maxSpeed / vAbs);
    p.velocity[1] = p.velocity[1] * (this.maxSpeed / vAbs);
  }

  // calc pos
  var v = p.velocity;
  p.position[0] += (v[0] * this.game.frameDuration / 1000);
  p.position[1] += (v[1] * this.game.frameDuration / 1000);
}

Entity.prototype.collidesWith = function(e){
  return this.model.collidesWith(e.model, this.position, e.position);
}

module.exports = Entity;
