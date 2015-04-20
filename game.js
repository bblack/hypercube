var Mustache = require('mustache');
var _ = require('underscore');
var events = require('events');
var util = require('util');
var Entity = require('./game/entity')
var Player = require('./game/player')
var Rock = require('./game/rock')

function Game() {
  var self = this;

  this.tickHandle;
  this.entities = {}; // keyed on id
  this.fps = 10;
  this.frameDuration = 1000 / this.fps;
  this.ticks = 0;
  this.nextEntityId = 1;

  this.getNewEntityId = function(){
    return this.nextEntityId++;
  };

  this.run = function() {
    if (this.tickHandle) { throw 'Already running'; }
    this.tickHandle = setInterval(function(){ self.tick(); }, this.frameDuration);
    var rock = new Rock(this);
    return this;
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
    _.each(_.values(self.entities), function(p){
      if (p.type != 'player') { return; }
      if (p.left) { p.orientAngle += Math.PI / self.fps; }
      if (p.right) { p.orientAngle -= Math.PI / self.fps; }
      p.orientAngle = p.orientAngle % (2*Math.PI);

      // calc accel (units per sec per sec)
      p.accel = [0, 0];
      if (p.forward) { p.accel[0] += 50; }
      if (p.back) { p.accel[0] -= 50; }
      p.accel = [
        Math.cos(p.orientAngle)*p.accel[0] - Math.sin(p.orientAngle)*p.accel[1],
        Math.sin(p.orientAngle)*p.accel[0] + Math.cos(p.orientAngle)*p.accel[1]
      ];

      // player @ map edge?
      if ((p.position[0] <= 0 && p.accel[0] < 0) ||
          (p.position[0] >= 600 && p.accel[0] > 0)) {
        p.accel[0] = 0;
      }
      if ((p.position[1] <= 0 && p.accel[1] < 0) ||
          (p.position[1] >= 600 && p.accel[1] > 0)) {
        p.accel[1] = 0;
      }

      // calc velo
      p.velocity[0] += p.accel[0];
      p.velocity[1] += p.accel[1];
      // cap abs(v)
      var vAbs = Math.sqrt(Math.pow(p.velocity[0], 2) + Math.pow(p.velocity[1], 2));
      if (vAbs > 200) {
        p.velocity[0] = p.velocity[0] * (200 / vAbs);
        p.velocity[1] = p.velocity[1] * (200 / vAbs);
      }
      // player @ map edge?
      if ((p.position[0] <= 0 && p.velocity[0] < 0) ||
          (p.position[0] >= 600 && p.velocity[0] > 0)) {
        p.velocity[0] = 0;
      }
      if ((p.position[1] <= 0 && p.velocity[1] < 0) ||
          (p.position[1] >= 600 && p.velocity[1] > 0)) {
        p.velocity[1] = 0;
      }

      // calc pos
      var v = p.velocity;
      p.position[0] += (v[0] / self.fps);
      p.position[1] += (v[1] / self.fps);
      // player @ map edge?
      p.position[0] = Math.max(p.position[0], 0);
      p.position[0] = Math.min(p.position[0], 600);
      p.position[1] = Math.max(p.position[1], 0);
      p.position[1] = Math.min(p.position[1], 600);
    });

    self.emit('tick');

    // Let nothing come after this in this function
    this.lastTickTime = this.thisTickTime;
  }

  this.addEntity = function(e){
    this.entities[e.id] = e;
    this.emit('entity_added', e);
  }

  this.removeEntity = function(eid) {
    console.log('removing entity', eid)
    var entityPresent = !!this.entities[eid];
    if (!entityPresent) { throw "Entity not present: " + eid; }
    delete this.entities[eid];
    console.log('entities remaining', this.entities)
    return entityPresent;
  }
};

util.inherits(Game, events.EventEmitter);

Game.Entity = Entity;
Game.Player = Player;
Game.Rock = Rock;

module.exports = Game;
