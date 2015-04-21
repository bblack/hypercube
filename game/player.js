var util = require('util')
var Entity = require('./entity')
var Bullet = require('./bullet')

var Player = function(game) {
  var self = this;

  Player.super_.call(this, game, 'player');

  this.position = [300, 300];
  this.velocity = [0, 0];
  this.orientAngle = 0;
  this.forward = false;
  this.back = false;
  this.left = false;
  this.right = false;
  this.color = function() {
    var color = Math.floor(Math.random()*parseInt("FFFFFF", 16));
    return "#" + ("00000" + color.toString(16)).slice(-6);
  }();

  this.rotate = function(angle) {
    self.orientAngle = (self.orientAngle + angle) % (2*Math.PI);
  };
}

util.inherits(Player, Entity)

Player.prototype.tick = function(){
  var p = this;
  var dTheta = Math.PI / this.game.fps;

  if (p.left) { p.orientAngle += dTheta; }
  if (p.right) { p.orientAngle -= dTheta; }
  p.orientAngle = p.orientAngle % (2*Math.PI);

  // calc accel (units per sec per sec)
  var a = 0;
  if (p.forward) { a += 50; }
  if (p.back) { a -= 50; }
  p.accel = [
    Math.cos(p.orientAngle)*a,
    Math.sin(p.orientAngle)*a
  ];

  Player.super_.prototype.tick.call(this);
}

Player.prototype.descriptor = function(){
  return {
    type: this.type,
    id: this.id,
    position: this.position.map(Math.round),
    orientAngle: this.orientAngle,
    a: this.forward || this.back,
    color: this.color
  };
}

Player.prototype.attack = function(on) {
  if (on !== !!on) throw "arg should be bool";
  if (on) {
    var v = 200
    v = [v*Math.cos(this.orientAngle), v*Math.sin(this.orientAngle)]
    var bullet = new Bullet(this.game, {
      position: this.position,
      velocity: vec2.add(v, this.velocity)
    })
  }
}

function vec2(){
}
vec2.add = function(v, w) {
  return [v[0] + w[0], v[1] + w[1]]
}

module.exports = Player;
