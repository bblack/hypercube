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

    _.each(self.entities, function(p){
      p.tick();
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
