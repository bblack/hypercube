var Game = function() {
  var self = this;

  this.players = {};
  this.rocks = {};
  this.fps = 60;

  this.addRock = function(r){
    this.rocks[r.id] = r;
  }

  this.addPlayer = function(p) {
    this.players[p.id] = p;
  }

  this.removePlayer = function(pid) {
    if (this.players[pid]) {
      delete this.players[pid];
    } else {
      throw "Game couldn't remove player because he doesn't exist";
    }
  }
};
