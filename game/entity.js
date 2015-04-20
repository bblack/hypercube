var _ = require('underscore')

var Entity = function(game, type, opts){
  this.game = game;
  this.id = game.getNewEntityId();
  this.type = type;
  // ballistics
  this.position = [0, 0]
  this.velocity = [0, 0]
  this.accel = [0, 0]
  for (var key in opts) {
    // clone in case e.g. copying vector from another entity
    if (type == 'bullet') console.log(opts)
    this[key] = _.clone(opts[key]);
  }
  game.addEntity(this);
}

Entity.prototype.tick = function(duration){
  var p = this;

  // @ map edge?
  if ((p.position[0] <= 0 && p.accel[0] < 0) ||
      (p.position[0] >= 600 && p.accel[0] > 0)) {
    p.accel[0] = 0;
  }
  if ((p.position[1] <= 0 && p.accel[1] < 0) ||
      (p.position[1] >= 600 && p.accel[1] > 0)) {
    p.accel[1] = 0;
  }

  // calc velo
  p.velocity[0] += p.accel[0];
  p.velocity[1] += p.accel[1];
  // cap abs(v)
  var vAbs = Math.sqrt(Math.pow(p.velocity[0], 2) + Math.pow(p.velocity[1], 2));
  if (vAbs > 200) {
    p.velocity[0] = p.velocity[0] * (200 / vAbs);
    p.velocity[1] = p.velocity[1] * (200 / vAbs);
  }
  // @ map edge?
  if ((p.position[0] <= 0 && p.velocity[0] < 0) ||
      (p.position[0] >= 600 && p.velocity[0] > 0)) {
    p.velocity[0] = 0;
  }
  if ((p.position[1] <= 0 && p.velocity[1] < 0) ||
      (p.position[1] >= 600 && p.velocity[1] > 0)) {
    p.velocity[1] = 0;
  }

  // calc pos
  var v = p.velocity;
  p.position[0] += (v[0] * this.game.frameDuration / 1000);
  p.position[1] += (v[1] * this.game.frameDuration / 1000);
  // @ map edge?
  p.position[0] = Math.max(p.position[0], 0);
  p.position[0] = Math.min(p.position[0], 600);
  p.position[1] = Math.max(p.position[1], 0);
  p.position[1] = Math.min(p.position[1], 600);
}

module.exports = Entity;
