var util = require('util')
var Entity = require('./entity')
var Model = require('./Model')

var Rock = function(game, opts){
  Rock.super_.call(this, game, 'rock', opts)
  opts = opts || {};
  this.verts = [];
  var points = 8;
  var r = opts.radius || 50;
  this.radius = r;
  console.log('radius', r)
  for (var i=0; i<points; i++) {
    var x = Math.floor( Math.sin(2*Math.PI * i / points) * r )
    var y = Math.floor( Math.cos(2*Math.PI * i / points) * r )
    this.verts.push([x, y]);
  }
  this.position = opts.position || [100, 100] || this.position;
  this.model = new Model.Circle(r)
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
