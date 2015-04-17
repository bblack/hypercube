var Game = function() {
  var self = this;

  this.entities = {};
  this.players = {};
  this.rocks = {};
  this.fps = 60;

  this.addRock = function(r){
    this.rocks[r.id] = r;
  }

  this.addPlayer = function(p) {
    this.players[p.id] = p;
  }

  this.addEntity = function(e){
    this.entities[e.id] = e;
  }

  this.removePlayer = function(pid) {
    if (this.players[pid]) {
      delete this.players[pid];
    } else {
      throw "Game couldn't remove player because he doesn't exist";
    }
  }
};
