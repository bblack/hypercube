var Mustache = require('mustache');
var _ = require('underscore');
var events = require('events');
var util = require('util');

var Player = function() {
  var self = this;

  this.id = Math.floor(Math.random() * 1000000).toString();
  this.position = [0, 0];
  this.forward = false;
  this.back = false;
  this.left = false;
  this.right = false;
  this.color = function() {
    var color = Math.floor(Math.random()*parseInt("FFFFFF", 16));
    return "#" + ("00000" + color.toString(16)).slice(-6);
  }();

  this.velocity = function() {
    // units per sec
    var out = [0, 0];
    var maxSpeed = 200;
    if (self.forward) { out[1] += maxSpeed; }
    if (self.back) { out[1] -= maxSpeed; }
    if (self.left) { out[0] -= maxSpeed; }
    if (self.right) { out[0] += maxSpeed; }

    return out;
  }
}

function Game() {
  var self = this;

  this.tickHandle;
  this.players = {};
  this.fps = 20;
  this.frameDuration = 1000 / this.fps;

  this.ticks = 0;

  this.run = function() {
    if (this.tickHandle) { throw 'Already running'; }
    this.tickHandle = setInterval(function(){ self.tick(); }, this.frameDuration);
  }

  this.tick = function() {
    this.thisTickTime = new Date().getTime();
    this.ticks += 1;

    // if (!this.lastPrintTime || new Date() - this.lastPrintTime > 1000) {
    //   var msg = Mustache.render("{{ts}}: {{ticks}} ticks. ({{ms}} ms since last print).", {
    //     ts: this.thisTickTime / 1000,
    //     ticks: this.ticks,
    //     ms: this.thisTickTime - this.lastPrintTime
    //   });
    //   console.log(msg);

    //   this.lastPrintTime = this.thisTickTime;
    // }

    // update player positions
    _.each(_.values(self.players), function(p){
      var v = p.velocity();
      p.position[0] += (v[0] / self.fps);
      p.position[1] += (v[1] / self.fps);
      p.position[0] = Math.max(p.position[0], 0);
      p.position[0] = Math.min(p.position[0], 600);
      p.position[1] = Math.max(p.position[1], 0);
      p.position[1] = Math.min(p.position[1], 600);
    });

    self.emit('tick');

    // Let nothing come after this in this function
    this.lastTickTime = this.thisTickTime;
  }

  this.newPlayer = function() {
    var p = new Player();
    if (this.players[p.id]) { throw "player id collision"; }
    this.players[p.id] = p;
    return p;
  }

  this.removePlayer = function(pid) {
    var playerPresent = !!this.players[pid];
    if (!playerPresent) { throw "Player not present: " + pid.toString(); }
    delete this.players[pid];
    return playerPresent;
  }
};

util.inherits(Game, events.EventEmitter);

module.exports = {"Game": Game};