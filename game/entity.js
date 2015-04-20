var Entity = function(game, type){
  this.game = game;
  this.id = game.getNewEntityId();
  this.type = type;
  game.entities[this.id] = this;
}

module.exports = Entity;
