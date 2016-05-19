function CanvasDrawer(client, game){
  this.client = client;
  this.game = game;
  var $canvas = $('canvas');
  this.canvas = $canvas[0];
  $(window).on('resize', function(){
    $canvas.attr('width', $(window).width());
    $canvas.attr('height', $(window).height());
  });
  $(window).resize();

  game.on('tick', (frame) => {
    this.draw(frame);
  })
  // this.drawAndRepeat();
}

CanvasDrawer.prototype.worldCoordsToCanvasCoords = function(worldCoords){
  return [worldCoords[0], this.canvas.height - worldCoords[1]];
}

function dot(v1, v2){
  return v1[0]*v2[0] + v1[1]*v2[1];
}

function vectorTimesMatrix(v, m){
  return [dot(v, m[0]), dot(v, m[1])];
}

function vectorPlusVector(v1, v2){
  return [v1[0] + v2[0], v1[1] + v2[1]]
}

CanvasDrawer.draw = {
  bullet: function(cd, e){
    var ctx = cd.canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.beginPath();
    var coords = cd.worldCoordsToCanvasCoords(e.position);
    ctx.arc(coords[0], coords[1], 2, 0, 2*Math.PI);
    ctx.fill();
    ctx.closePath();
  },
  player: function(cd, e){
    var ctx = cd.canvas.getContext('2d');
    var model = [[0, 0], [-5, 10], [15, 0], [-5, -10], [0, 0]];
    var rotMatrix = [
      [Math.cos(e.orientAngle), -Math.sin(e.orientAngle)],
      [Math.sin(e.orientAngle), Math.cos(e.orientAngle)]
    ];
    ctx.beginPath();
    ctx.strokeStyle = e.color;
    _.each(model, (vert) => {
      var vertRot = vectorTimesMatrix(vert, rotMatrix);
      var vertWorld = vectorPlusVector(vertRot, e.position);
      var vertCanvas = cd.worldCoordsToCanvasCoords(vertWorld);
      ctx.lineTo(vertCanvas[0], vertCanvas[1]);
    });
    ctx.stroke();
    ctx.closePath();
  }
};

CanvasDrawer.drawMinimumEntity = function(cd, e){
  var ctx = cd.canvas.getContext('2d');
  var canvasCoords = cd.worldCoordsToCanvasCoords(e.position);
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
    var dirIndCanvasCoords = cd.worldCoordsToCanvasCoords(dirIndWorldCoords);
    ctx.arc(dirIndCanvasCoords[0], dirIndCanvasCoords[1], 2, 0, 2*Math.PI);
    ctx.fillStyle = e.color || 'white';
    ctx.fill();
    ctx.closePath();
  }
  ctx.font = '10pt inconsolata';
  ctx.fillStyle = 'red';
  ctx.fillText('UNKNOWN ENTITY', x, y);
}

CanvasDrawer.prototype.draw = function(frame){
  var ctx = this.canvas.getContext('2d');
  ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  _.each(frame.entities, (e) => {
    var drawEnt = CanvasDrawer.draw[e.type] || CanvasDrawer.drawMinimumEntity;
    drawEnt(this, e);
  })
}

CanvasDrawer.prototype.drawAndRepeat = function(){
  this.draw();
  window.requestAnimationFrame(() => {
    this.drawAndRepeat();
  })
}
