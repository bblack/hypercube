var g = require('./game.js');
var socketio = require('socket.io');
var _ = require('underscore');

var Server = function() {
  var self = this;

  this.game = new g.Game();
  this.io;
  this.playersBySocketId = {}; // keyed on socket.id
  this.socketsBySocketId = {}; // keyed on socket.id

  this.playerUpdateMsg = function(p) {
    return {
      id: p.id,
      position: p.position.map(Math.round),
      orientAngle: p.orientAngle,
      a: p.forward || p.back,
      color: p.color
    };
  };

  this.rockUpdateMsg = function(r){
    return {
      id: r.id,
      position: r.position.map(Math.round),
      verts: r.verts
    }
  }

  this.entityUpdateMsg = function(e){
    var m;
    if (e.type === 'player') {
      m = this.playerUpdateMsg(e);
    } else if (e.type === 'rock') {
      m = this.rockUpdateMsg(e);
    }
    m.type = e.type;
    return m;
  }

  this.startGame = function() {
    this.game.run();
    this.game.on('tick', function(){
      _.each(_.keys(self.playersBySocketId), function(sid){
        var socket = self.socketsBySocketId[sid];
        socket.emit('tick', {
          entities: _.map(self.game.entities, function(e){
            return self.entityUpdateMsg(e);
          })
        });
      });
    });
  }

  this.startListening = function(server) {
    this.io = socketio.listen(server);
    this.io.set('log level', 1);

    this.io.sockets.on('connection', function(socket){
      self.socketsBySocketId[socket.id] = socket;

      // Negotiation
      socket.emit('welcome', 'hypercube');
      var player = self.game.newPlayer();
      self.playersBySocketId[socket.id] = player;

      // Tell client about current game state
      _.each(_.keys(self.game.players), function(pid) {
        var otherPlayer = self.game.players[pid];
        socket.emit('player_present', self.playerUpdateMsg(otherPlayer));
      });

      // Listen forever for client commands
      socket.on('disconnect', function(){
        self.game.removePlayer(player.id);
        delete self.socketsBySocketId[socket.id];
        delete self.playersBySocketId[socket.id];
        self.io.sockets.emit('player_left', {id: player.id});
      });

      socket.on('+forward', function(){ player.forward = true; });
      socket.on('-forward', function(){ player.forward = false; });
      socket.on('+back', function(){ player.back = true; });
      socket.on('-back', function(){ player.back = false; });
      socket.on('+left', function(){ player.left = true; });
      socket.on('-left', function(){ player.left = false; });
      socket.on('+right', function(){ player.right = true; });
      socket.on('-right', function(){ player.right = false; });
    });
  }
};

module.exports = {"Server": Server};
