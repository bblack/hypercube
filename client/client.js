var Client = function() {
  var self = this;

  this.connect = function() {
    this.game = new Game(this);
    this.drawer = new Drawer(this.game);
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
      console.log('server said welcome');
    });

    this.socket.on('entity_present', function(e){
      self.game.addEntity(e)
    })

    this.socket.on('entity_removed', function(eid){
      // if we don't wait for next tick, drawer will throw when trying to lerp this entity
      self.socket.once('tick', function(){
        self.game.removeEntity(eid)
      })
    })

    this.socket.on('rock_added', function(r){
      self.game.addEntity(r)
    })

    this.socket.on('player_present', function(p){
      console.log('player present: ' + p.id);
      self.game.addEntity(p);
    });

    this.socket.on('player_joined', function(p){
      console.log('player joined: ' + p.id);
      self.game.addEntity(p);
    });

    this.socket.on('player_left', function(p){
      console.log('player left: ' + p.id);
    });

    this.socket.on('tick', function(data){
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
