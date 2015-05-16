var http = require('http');
var express = require('express');
var s = require('./server.js');

var app = express();
var httpServer = http.createServer(app);
var gameServer = new s.Server();

app.configure(function(){
  // app.set('views', __dirname + '/views');
  app.use(express.static(__dirname + '/client'));
});

gameServer.startGame();
gameServer.startListening(httpServer);
var port = process.env.PORT || 8888;
httpServer.listen(port);
