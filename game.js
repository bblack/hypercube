var Mustache = require('mustache');

Game = function() {
  var self = this;

  this.tickHandle;
  this.clients = [];
  this.fps = 50;
  this.lastTickTime;

  this.lastPrintTime;
  this.ticks = 0;

  this.run = function() {
    if (this.tickHandle) { throw 'Already running'; }
    this.tickHandle = setInterval(function(){ self.tick(); }, 1000 / this.fps);
  }

  this.tick = function() {
    this.thisTickTime = new Date().getTime();
    this.ticks += 1;

    if (!this.lastPrintTime || new Date() - this.lastPrintTime > 1000) {
      var msg = Mustache.render("{{ts}}: {{ticks}} ticks. ({{ms}} ms since last print).", {
        ts: this.thisTickTime / 1000,
        ticks: this.ticks,
        ms: this.thisTickTime - this.lastPrintTime
      });
      console.log(msg);

      this.lastPrintTime = this.thisTickTime;
    }

    // Let nothing come after this in this function
    this.lastTickTime = this.thisTickTime;
  }
}

g = new Game();
// console.log(typeof g.tick.call)
g.run();