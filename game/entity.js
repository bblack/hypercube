var Entity = function(game, type){
  this.id = game.getNewEntityId();
  game.entities[this.id] = this;
  console.log(type, this)
  this.type = type;
}

module.exports = Entity;
