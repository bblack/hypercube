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
  this.camera = {
    position: [0, 0, 500],
    // assume direction is such that rotation matrix is identity,
    // i.e. no rotation required. world xy plane is parallel to camera xy plane.
    d: 10, // focal distance
    fov: Math.PI/2
  }
  game.on('tick', (frame) => {
    this.draw(frame);
  })
  // this.drawAndRepeat();
}

CanvasDrawer.prototype.worldCoordsToCanvasCoords = function(worldCoords){
  if (worldCoords.length === 2)
    worldCoords = worldCoords.concat(0); // z=0
  var camSpaceCoords = _.times(3, (n) => {
    return worldCoords[n] - this.camera.position[n];
  });
  // assume no rotation; i.e. cam space xy plane is parallel to screen xy plane
  var focalPlaneCoords = [
    (camSpaceCoords[0] * this.camera.d) / -camSpaceCoords[2],
    (camSpaceCoords[1] * this.camera.d) / -camSpaceCoords[2]
  ];
  var focalPlaneHalfSize = [
    this.camera.d * Math.tan(this.camera.fov/2),
    this.camera.d * Math.tan(this.camera.fov/2)
  ];
  canvasSpaceCoords = [
    (focalPlaneCoords[0] / focalPlaneHalfSize[0]) * (this.canvas.width / 2) + this.canvas.width / 2,
    (focalPlaneCoords[1] / focalPlaneHalfSize[1]) * (this.canvas.height / 2) + this.canvas.height / 2
  ];
  canvasSpaceCoords[1]  = this.canvas.height - canvasSpaceCoords[1];
  return canvasSpaceCoords;
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

CanvasDrawer.drawModel = function(cd, ctx, modelVerts, orientAngle, pos){
  var rotMatrix = [
    [Math.cos(orientAngle), -Math.sin(orientAngle)],
    [Math.sin(orientAngle), Math.cos(orientAngle)]
  ];
  _.times(2, (n) => {
    ctx.beginPath();
    _.each(modelVerts, (vert) => {
      var vertRot = vectorTimesMatrix(vert, rotMatrix);
      var vertWorld = vectorPlusVector(vertRot, pos).concat(n * 10);
      var vertCanvas = cd.worldCoordsToCanvasCoords(vertWorld);
      ctx.lineTo(vertCanvas[0], vertCanvas[1]);
    });
    ctx.closePath();
    ctx.stroke();
  });

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
    ctx.strokeStyle = e.color;
    CanvasDrawer.drawModel(cd, ctx, model, e.orientAngle, e.position);
  },
  rock: function(cd, e){
    var ctx = cd.canvas.getContext('2d');
    var modelVerts = e.verts;
    ctx.strokeStyle = 'white';
    CanvasDrawer.drawModel(cd, ctx, modelVerts, 0, e.position);
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
