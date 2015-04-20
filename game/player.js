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
    var bullet = new Bullet(this.game, {
      position: this.position,
      velocity: [v*Math.cos(this.orientAngle), v*Math.sin(this.orientAngle)]
    })
  }
}

module.exports = Player;
