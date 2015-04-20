var Entity = function(game, type, opts){
  this.game = game;
  this.id = game.getNewEntityId();
  this.type = type;
  for (var key in opts) { this[key] = opts[key]; }
  game.addEntity(this);
}

module.exports = Entity;
