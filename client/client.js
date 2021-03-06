var Client = function() {
  this.registerKeybindings();
};
inherits(Client, EventEmitter2);

Client.prototype.connect = function() {
  var self = this;
  this.game = new Game(this);
  this.drawer = new CanvasDrawer(this, this.game);
  if (this.socket) { throw 'already connected'; }
  try { io; } catch (Exception) {
    self.status('could not connect');
    return;
  }
  this.socket = io.connect('http://' + window.location.host);
  this.connectTime = Date.now();
  this.lastFewUpdates = [];

  this.socket.on('connect', function(){
    self.status('connected');
  })
  .on('disconnect', function(){
    self.status('disconnected');
  })
  .on('welcome', function(data){
    console.log('server said welcome');
  })
  .on('entity_present', function(e){
  })
  .on('entity_removed', function(eid){
    // if we don't wait for next tick, drawer will throw when trying to lerp this entity
    self.socket.once('tick', function(){
      self.game.removeEntity(eid)
    })
  })
  .on('player_present', function(p){
    console.log('player present: ' + p.id);
  })
  .on('player_joined', function(p){
    console.log('player joined: ' + p.id);
  })
  .on('player_left', function(p){
    console.log('player left: ' + p.id);
  })
  .on('tick', function(data){
    // self.printIncomingTickRate();

    // push latest update to front
    self.lastFewUpdates.unshift({
      time: Date.now(),
      data: data
    });

    _.each(data.entities, function(e){
      if (!self.game.entities[e.id]) {
        self.game.addEntity(e)
      }
    })

    // discard all but last 2 updates
    while (self.lastFewUpdates.length > 2) {
      self.lastFewUpdates.pop();
    }
  });

  this.game.tick();
};

Client.prototype.printIncomingTickRate = function() {
  var self = this;
  var now = Date.now();
  var msSinceLastPrint = (now - self.lastPrintTime);

  self.ticksSinceLastPrint = (self.ticksSinceLastPrint || 0) + 1;

  if (!self.lastPrintTime || msSinceLastPrint > 1000 ) {
    console.log((self.ticksSinceLastPrint*1000 / msSinceLastPrint).toFixed(4) +
      " ticks / s");
    self.lastPrintTime = now;
    self.ticksSinceLastPrint = 0;
  }
};

Client.prototype.registerKeybindings = function(){
  var self = this;
  var key_bindings = {
    'up': '+forward',
    'down': '+back',
    'left': '+left',
    'right': '+right',
    'space': '+attack'
  };

  $.each(key_bindings, function(k,v){
    keypress.register_combo({
      keys: k,
      on_keydown: function(){ self.socket.emit(v); },
      prevent_default: true,
      prevent_repeat: true
    });

    if (v[0] == '+') {
      var inverseCmd = '-' + v.slice(1);
      keypress.register_combo({
        keys: k,
        on_keyup: function(){ self.socket.emit(inverseCmd); },
        prevent_default: true,
        prevent_repeat: true
      });
    }
  });
};

Client.prototype.status = function(msg){
  this.status = msg;
}
