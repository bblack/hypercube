var util = require('util')
var Entity = require('./entity')

var Rock = function(game){
  Rock.super_.call(this, game, 'rock')
  this.verts = [];
  var points = 8;
  for (var i=0; i<points; i++) {
    var r = 50;
    var x = Math.floor( Math.sin(2*Math.PI * i / points) * r )
    var y = Math.floor( Math.cos(2*Math.PI * i / points) * r )
    this.verts.push([x, y]);
  }
  this.position = [100,100]
}

util.inherits(Rock, Entity)

Rock.prototype.descriptor = function(){
  return {
    type: this.type,
    id: this.id,
    position: this.position.map(Math.round),
    verts: this.verts
  }
}

module.exports = Rock
