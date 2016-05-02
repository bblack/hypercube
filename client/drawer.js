function CanvasDrawer(client, game){
  this.client = client;
  this.game = game;
  this.canvas = $('canvas')[0];

  game.on('tick', (frame) => {
    this.draw(frame);
  })
  // this.drawAndRepeat();
}

CanvasDrawer.prototype.worldCoordsToCanvasCoords = function(worldCoords){
  return [worldCoords[0], this.canvas.height - worldCoords[1]];
}

CanvasDrawer.prototype.draw = function(frame){
  var ctx = this.canvas.getContext('2d');
  ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  _.each(frame.entities, (e) => {
    var canvasCoords = this.worldCoordsToCanvasCoords(e.position);
    var x = canvasCoords[0];
    var y = canvasCoords[1];
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2*Math.PI);
    ctx.fillStyle = e.color || 'white';
    ctx.fill();
    ctx.closePath();
    // dir indicator
    if (e.hasOwnProperty('orientAngle')) {
      ctx.beginPath();
      var dirIndWorldCoords = [
        e.position[0] + 8*Math.cos(e.orientAngle),
        e.position[1] + 8*Math.sin(e.orientAngle)
      ];
      var dirIndCanvasCoords = this.worldCoordsToCanvasCoords(dirIndWorldCoords);
      ctx.arc(dirIndCanvasCoords[0], dirIndCanvasCoords[1], 2, 0, 2*Math.PI);
      ctx.fillStyle = e.color || 'white';
      ctx.fill();
      ctx.closePath();
    }
  })
}

CanvasDrawer.prototype.drawEntity = function(canvas, e){
  var canvasCoords = this.worldCoordsToCanvasCoords(e.position);
  var x = canvasCoords[0];
  var y = canvasCoords[1];
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, 2*Math.PI);
  ctx.fillStyle = e.color || 'white';
  ctx.fill();
  ctx.closePath();
}

CanvasDrawer.prototype.drawEntity.player = function(canvas, e){
  var ctx = this.canvas.getContext('2d');
  var canvasCoords = this.worldCoordsToCanvasCoords(e.position);
  var x = canvasCoords[0];
  var y = canvasCoords[1];
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, 2*Math.PI);
  ctx.fillStyle = e.color || 'white';
  ctx.fill();
  ctx.closePath();
  // dir indicator
  if (e.hasOwnProperty('orientAngle')) {
    ctx.beginPath();
    var dirIndWorldCoords = [
      e.position[0] + 8*Math.cos(e.orientAngle),
      e.position[1] + 8*Math.sin(e.orientAngle)
    ];
    var dirIndCanvasCoords = this.worldCoordsToCanvasCoords(dirIndWorldCoords);
    ctx.arc(dirIndCanvasCoords[0], dirIndCanvasCoords[1], 2, 0, 2*Math.PI);
    ctx.fillStyle = e.color || 'white';
    ctx.fill();
    ctx.closePath();
  }
}

CanvasDrawer.prototype.drawAndRepeat = function(){
  this.draw();
  window.requestAnimationFrame(() => {
    this.drawAndRepeat();
  })
}
