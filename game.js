var Mustache = require('mustache');
var _ = require('underscore');
var events = require('events');
var util = require('util');

var Player = function() {
  var self = this;

  this.id = Math.floor(Math.random() * 1000000).toString();
  this.position = [300, 300];
  this.velocity = [0, 0];
  this.orientAngle = 0;
  this.forward = false;
  this.back = false;
  this.left = false;
  this.right = false;
  this.color = function() {
    var color = Math.floor(Math.random()*parseInt("FFFFFF", 16));
    return "#" + ("00000" + color.toString(16)).slice(-6);
  }();

  this.rotate = function(angle) {
    self.orientAngle = (self.orientAngle + angle) % (2*Math.PI);
  };
}

function Game() {
  var self = this;

  this.tickHandle;
  this.players = {};
  this.fps = 10;
  this.frameDuration = 1000 / this.fps;

  this.bboxMin = [-Math.pow(10, 6), -Math.pow(10, 6)];
  this.bboxMax = [Math.pow(10, 6), Math.pow(10, 6)];

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
      if ((p.position[0] <= self.bboxMin[0] && p.accel[0] < 0) ||
          (p.position[0] >= self.bboxMax[0] && p.accel[0] > 0)) {
        p.accel[0] = 0;
      }
      if ((p.position[1] <= self.bboxMin[1] && p.accel[1] < 0) ||
          (p.position[1] >= self.bboxMax[1] && p.accel[1] > 0)) {
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
      if ((p.position[0] <= self.bboxMin[0] && p.velocity[0] < 0) ||
          (p.position[0] >= self.bboxMax[0] && p.velocity[0] > 0)) {
        p.velocity[0] = 0;
      }
      if ((p.position[1] <= self.bboxMin[1] && p.velocity[1] < 0) ||
          (p.position[1] >= self.bboxMax[1] && p.velocity[1] > 0)) {
        p.velocity[1] = 0;
      }

      // calc pos
      var v = p.velocity;
      p.position[0] += (v[0] / self.fps);
      p.position[1] += (v[1] / self.fps);
      // player @ map edge?
      p.position[0] = Math.max(p.position[0], self.bboxMin[0]);
      p.position[0] = Math.min(p.position[0], self.bboxMax[0]);
      p.position[1] = Math.max(p.position[1], self.bboxMin[1]);
      p.position[1] = Math.min(p.position[1], self.bboxMax[1]);
    });

    self.emit('tick');

    // Let nothing come after this in this function
    this.lastTickTime = this.thisTickTime;
  }

  this.newPlayer = function() {
    var p = new Player();
    p.position = [
       self.bboxMin[0] + (self.bboxMax[0] - self.bboxMin[0]) / 2,
       self.bboxMin[1] + (self.bboxMax[1] - self.bboxMin[1]) / 2
    ];
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