var Client = function() {
  var self = this;

  this.connect = function() {
    this.drawer = new Drawer();
    this.game = new Game();
    if (this.socket) { throw 'already connected'; }
    try { io; } catch (Exception) {
      self.drawer.status('could not connect');
      return;
    }
    this.socket = io.connect('http://localhost:9090');
    this.connectTime = Date.now();
    this.lastFewUpdates = [];

    this.socket.on('connect', function(){
      self.drawer.clear();
      self.drawer.status('connected').attr('fill', 'green');
    });

    this.socket.on('disconnect', function(){
      self.drawer.status('disconnected').attr('fill', 'orange');
    });

    this.socket.on('welcome', function(data){
      console.log('server said welcome');
    });

    this.socket.on('player_present', function(p){
      console.log('was told about player ' + p.id);
      self.game.addPlayer(p);
      self.drawer.addPlayer(p);
    });

    this.socket.on('player_left', function(p){
      console.log('got player_left');
      self.game.removePlayer(p.id);
      self.drawer.removePlayer(p.id);
    });

    this.socket.on('tick', function(data){
      // self.printIncomingTickRate();

      // push latest update to front
      self.lastFewUpdates.unshift({
        time: Date.now(),
        data: data
      });

      // discard all but last 2 updates
      while (self.lastFewUpdates.length > 2) {
        self.lastFewUpdates.pop();
      }
    });

    this.tickHandle = setInterval(this.tick, 1000 / this.game.fps);
  };

  this.tick = function() {
    var predictedFrame = self.predictFrame();

    $.each(predictedFrame.players, function(i,p){
      if (!self.game.players[p.id]) {
        self.game.addPlayer(p);
        self.drawer.addPlayer(p);
      }
      self.drawer.updatePlayer(p);
    });
  };

  this.predictFrame = function() {
    var oldFrame = self.lastFewUpdates[1];
    if (!oldFrame) { return {players: []}; }

    var newFrame = self.lastFewUpdates[0];
    if (!newFrame) { return oldFrame; }

    var timeDiff = newFrame.time - oldFrame.time;
    var now = Date.now();
    var extrapolatedFrame = {players: []};
    var oldPlayers = {}; // just for quick lookup

    $.each(oldFrame.data.players, function(i,p){ oldPlayers[p.id] = p; });
    $.each(newFrame.data.players, function(i,newPlayer){
      var oldPlayer = oldPlayers[newPlayer.id];
      if (oldPlayer) {
        extrapolatedFrame.players.push(
          $.extend({}, newPlayer, {
            orientAngle: newPlayer.orientAngle + ((newPlayer.orientAngle - oldPlayer.orientAngle) / timeDiff) * (now - newFrame.time),
            position: [
              newPlayer.position[0] + ((newPlayer.position[0] - oldPlayer.position[0]) / timeDiff) * (now - newFrame.time),
              newPlayer.position[1] + ((newPlayer.position[1] - oldPlayer.position[1]) / timeDiff) * (now - newFrame.time)
            ]
          })
        );
      }
    });

    return extrapolatedFrame;
  };

  this.printIncomingTickRate = function() {
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

  var key_bindings = {
    'up': '+forward',
    'down': '+back',
    'left': '+left',
    'right': '+right'
  };

  $.each(key_bindings, function(k,v){
    keypress.register_combo({
      keys: k,
      on_keydown: function(){ self.socket.emit(v); },
      prevent_repeat: true
    });

    if (v[0] == '+') {
      var inverseCmd = '-' + v.slice(1);
      keypress.register_combo({
        keys: k,
        on_keyup: function(){ self.socket.emit(inverseCmd); },
        prevent_repeat: true
      });
    }
  });
};