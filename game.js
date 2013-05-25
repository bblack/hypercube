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
      var msg = (this.thisTickTime / 1000).toString() + ": ";
      msg += this.ticks.toString() + " ticks. (";
      msg += (this.thisTickTime - this.lastPrintTime).toString() + " ms "
      msg += "since last print)."
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