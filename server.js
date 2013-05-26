var g = require('./game.js');
var socketio = require('socket.io');
var _ = require('underscore');

var Server = function() {
  var self = this;

  this.game = new g.Game();
  this.io;
  this.playersBySocketId = {}; // keyed on socket.id
  this.socketsBySocketId = {}; // keyed on socket.id

  this.startGame = function() {
    this.game.run();
    this.game.on('tick', function(){
      _.each(_.keys(self.playersBySocketId), function(sid){
        var socket = self.socketsBySocketId[sid];
        socket.emit('tick', {
          players: self.game.players
        });
      });
    });
  }

  this.startListening = function() {
    this.io = socketio.listen(9090);
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
        socket.emit('player_present', otherPlayer);
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
}

var server = new Server();
server.startGame();
server.startListening();