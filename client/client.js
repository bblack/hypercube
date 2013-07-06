var Client = function() {
  var self = this;

  this.connect = function() {
    this.drawer = new Drawer(self);
    this.game = new Game();
    if (this.socket) { throw 'already connected'; }
    try { io; } catch (Exception) {
      self.drawer.status('could not connect', 'red');
      return;
    }
    this.socket = io.connect('http://' + window.location.host);
    this.connectTime = Date.now();
    this.lastFewUpdates = [];

    this.socket.on('connect', function(){
      self.drawer.clear();
      self.drawer.status('connected', 'lime');
    });

    this.socket.on('disconnect', function(){
      self.drawer.status('disconnected', 'orange');
    });

    this.socket.on('welcome', function(data){
      self.playerId = data.playerId;
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
    var interpFrame = self.interpFrame();

    $.each(interpFrame.players, function(i,p){
      if (!self.game.players[p.id]) {
        self.game.addPlayer(p);
        self.drawer.addPlayer(p);
      }
      self.drawer.updatePlayer(p);
    });
  };

  this.interpFrame = function() {
    var oldFrame = self.lastFewUpdates[1];
    if (!oldFrame) { return {players: []}; }

    var newFrame = self.lastFewUpdates[0];
    if (!newFrame) { return oldFrame; }

    var timeDiff = newFrame.time - oldFrame.time;
    var now = Date.now();
    var interpFrame = {players: []};
    var oldPlayers = {}; // just for quick lookup

    $.each(oldFrame.data.players, function(i,p){ oldPlayers[p.id] = p; });
    $.each(newFrame.data.players, function(i,newPlayer){
      var oldPlayer = oldPlayers[newPlayer.id];
      if (oldPlayer) {

        // attempt to detect that the angle has crossed the 0/2pi line
        // rather than making an almost full circle in one tick
        var newAngle = newPlayer.orientAngle;
        var oldAngle = oldPlayer.orientAngle;
        if (Math.abs(newAngle - oldAngle) > Math.PI) {
          if (newAngle < oldAngle) {
            newAngle += 2*Math.PI;
          } else {
            oldAngle += 2*Math.PI;
          }
        } 

        if (timeDiff == 0) {
          console.warn('Tried to interp two frames with no time diff');
          // This happens if incoming packets get choked up and then rcvd
          // virtually simultaneously. To fix, have server include its own timestamp.
          // Server time should then only be used for calculating time diffs.
        }

        interpFrame.players.push(
          // To do extrap instead of interp, just replace "old + delta" with "new + delta"
          $.extend({}, newPlayer, {
            orientAngle: oldAngle + ((newAngle - oldAngle) / timeDiff) * (now - newFrame.time),
            position: [
              oldPlayer.position[0] + ((newPlayer.position[0] - oldPlayer.position[0]) / timeDiff) * (now - newFrame.time),
              oldPlayer.position[1] + ((newPlayer.position[1] - oldPlayer.position[1]) / timeDiff) * (now - newFrame.time)
            ]
          })
        );
      }
    });

    return interpFrame;
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

  $("#con_in").change(function(evt){
    var in_el = $("#con_in").get(0);
    var out_el = $("#con_out").get(0);
    $("<span>").css('display', 'block').text($(in_el).val()).appendTo(out_el);
    $(in_el).val('');
    out_el.scrollTop = out_el.scrollHeight;
  });

  $("#con_in").focusout(function(){
    $("#con").hide();
  });

  keypress.register_combo({
    keys: '`',
    on_keydown: function(){
      $('#con').toggle(500);
      if ($('#con').is(':visible')) {
        $('#con_in').focus();
      }
    },
    prevent_default: true,
    prevent_repeat: true
  });

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