function mod(m, n) {
  // like %, but gives positive results for negative m
  return ((m % n) + n) % n;
}

var Drawer = function(client) {
  var self = this;
  self.client = client;
  self.tiles = [
    [null, null, null],
    [null, null, null],
    [null, null, null]
  ];

  this.fitCanvasToWindow = function() {
    var winW = window.innerWidth;
    var winH = window.innerHeight;
    self.paper.setSize(winW, winH);
  };

  this.paper = Raphael(0, 0, 600, 600);
  $(window).resize(self.fitCanvasToWindow);
  $(window).resize();
  this.statusEl = this.paper.text(300, 580, 'status unknown')
    .attr('fill', 'gray')
    .attr('font-size', '20');
  this.players = {} // player id => {name: element}

  // grid shit
  this.gridSpacing = 100;
  this.xLines = [];
  this.yLines = [];

  this.clear = function() {
    $.each(this.players, function(pid, p){
      self.removePlayer(pid);
    });
  }

  this.status = function(text, color) {
    self.statusEl.attr('text', text || '');
    self.statusEl.attr('fill', color || 'gray');
    $(self.statusEl.node).css('text-shadow', color + ' 0 0 20px');
    return self.statusEl;
  }

  this.addPlayer = function(p) {
    var pel = this.paper.path("M-5,-10L0,0L-5,10L20,0Z");
    pel.attr('stroke', p.color);
    // pel.attr('stroke-width', 0);
    var gel = pel.glow({color: p.color});
    var cel = this.paper.text(0, 0, '(?, ?)')
      .attr('fill', 'white');

    this.players[p.id] = {
      pel: pel,
      gel: gel,
      cel: cel
    };

    $.each([pel, gel], function(i, el){
      el.transform('m1,0,0,-1,0,600'); // server is Y+ to mean 'up'
    });

    this.updatePlayer(p);
  }

  this.removePlayer = function(pid) {
    var pels = this.players[pid];
    $.each(pels, function(name, el){ el.remove(); });
    delete this.players[pid];
  }

  this.updatePlayer = function(p) {
    var pel = this.players[p.id].pel;
    var gel = this.players[p.id].gel;
    var cel = this.players[p.id].cel;

    $.each([pel, gel], function(i,el){
      el.transform(Mustache.render("s1,-1t{{x}},{{y}}r{{r}},0,0", {
        x: p.position[0],
        y: p.position[1], 
        r: Raphael.deg(p.orientAngle)
      }));
    });

    pel.attr('fill', p.a ? p.color : '');
    cel.transform(Mustache.render('t{{x}},{{y}}', {
      x: p.position[0],
      // mult by -1 here instead of doing a 's' transform
      // so that the text doesn't flip
      y: p.position[1] * -1 + 20
    }));
    cel.attr('text', Mustache.render('({{x}}, {{y}})', {
      x: Math.round(p.position[0]),
      y: Math.round(p.position[1])
    }));

    if (p.id == self.client.playerId) {
      if (!self.viewbox) {
        self.viewbox = [];
      }
      self.viewbox[0] = p.position[0] - self.paper.width / 2;
        // apply flip to pos.y
      self.viewbox[1] = p.position[1]*-1 - self.paper.height / 2;
      self.viewbox[2] = self.paper.width;
      self.viewbox[3] = self.paper.height;
      self.paper.setViewBox(
        self.viewbox[0],
        self.viewbox[1],
        self.viewbox[2],
        self.viewbox[3],
        true
      );
    }
  }

  this.centerTilesOnPlayer = function() {
    var me = self.players[self.client.playerId];
    var tileContainingMe = [null, null]; // row,col in tile matrix
    
    for (var i=0; i<=2; i++) {
      for (var j=0; j<=2; j++) {
        if ((me.position[0] >= self.tiles[i][j].x) &&
            (me.position[0] < self.tiles[i][j+1].x) &&
            (me.position[1] >= self.tiles[i][j].y) &&
            (me.position[1] < self.tiles[i+1][j].y)) {
          tileContainingMe = [i, j];
          // TODO: break out of fors, for performance
        }
      }
    }

    if (tileContainingMe[0] == 0) {
      // player in bottom row; shift all tiles up
    } else if (tileContainingMe[0] == 1) {
      // player in mid row; do nothing
    } else if (tileContainingMe[0] == 2) {
      // player in top row; shift all tiles down
    }

    if (tileContainingMe[1] == 0) {
      // player in left col; shift all tiles right
    } else if (tileContainingMe[1] == 1) {
      // player in mid col; do nothing
    } else if (tileContainingMe[1] == 2) {
      // player in right col; shift all tiles left
    }

    var playerTilePos = [
      me.position[0] - (me.position[0] % self.viewbox[2])
    ]
    // draw any missing tiles
    for (var i=0; i<=2; i++) {
      for (var j=0; j<=2; j++) {
        if (!self.tiles[i][j]) {
          self.tiles[i][j] = {
            x: (i-1)*self.viewbox[2]
          };
        }
      }
    }
  };

  this.draw = function(frame) {
    $.each(frame.players, function(i,p){
      self.updatePlayer(p);
    });
    var me = self.players[self.client.playerId];

    self.centerTilesOnPlayer();

    while (self.xLines[0] && (self.xLines[0].x < self.viewbox[0])) {
      self.xLines.shift().el.remove();
    }
    while (self.xLines[0] && (self.xLines[self.xLines.length - 1].x > (self.viewbox[0] + self.viewbox[2]))) {
      self.xLines.pop().el.remove();
    }
    while ((!self.xLines[0]) || (self.xLines[0].x > (self.viewbox[0] + self.gridSpacing))) {
      if (self.xLines[0]) {
        var x = self.xLines[0].x - self.gridSpacing;
      } else {
        var x = self.viewbox[0] + self.viewbox[2];
      }
      self.xLines.unshift({
        x: x,
        el: self.paper.path(Mustache.render("M{{x1}},{{y1}}L{{x2}},{{y2}}", {
          x1: x,
          y1: self.viewbox[1],
          x2: x,
          y2: self.viewbox[1] + self.viewbox[3]
        })).attr({'stroke': 'rgba(255, 255, 255, .5)', 'stroke-width': 1})
      });
    }
  };
};