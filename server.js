var Game = require('./game.js');
var socketio = require('socket.io');
var _ = require('underscore');

var Server = function() {
  var self = this;

  this.game = new Game();
  this.io;
  this.playersBySocketId = {}; // keyed on socket.id
  this.socketsBySocketId = {}; // keyed on socket.id

  this.startGame = function() {
    this.game.run();
    this.game.on('tick', function(){
      _.each(_.keys(self.playersBySocketId), function(sid){
        var socket = self.socketsBySocketId[sid];
        socket.emit('tick', {
          entities: _.map(self.game.entities, function(e){
            // TODO: don't be sending redundant unchanged stuff, like color or geometry
            return e.descriptor();
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

      // Tell client about current game state
      _.each(self.game.entities, function(ent, id) {
        if (ent.type == 'player') {
          socket.emit('player_present', ent.descriptor());
        } else if (ent.type == 'rock') {
          socket.emit('rock_added', ent.descriptor());
        }
      });

      var player = new Game.Player(self.game);
      self.playersBySocketId[socket.id] = player;

      _.each(self.socketsBySocketId, function(otherPlayerSocket){
        otherPlayerSocket.emit('player_joined', player.descriptor())
      });

      // Listen forever for client commands
      socket.on('disconnect', function(){
        self.game.removeEntity(player.id);
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
