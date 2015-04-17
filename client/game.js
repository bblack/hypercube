var Game = function() {
  var self = this;

  this.entities = {};
  this.fps = 60;

  this.addEntity = function(e){
    this.entities[e.id] = e;
    if (e.type == 'player') self.emit('player_added', e);
    if (e.type == 'rock') self.emit('rock_added', e);
  }

  this.removeEntity = function(eid){
    if (this.entities[eid]) {
      var e = this.entities[eid];
      delete this.entities[eid];
      if (e.type == 'player') self.emit('player_left', e);
    } else {
      throw "Game couldn't remove entity because it doesn't exist: " + eid;
    }
  }
};

inherits(Game, EventEmitter2);
