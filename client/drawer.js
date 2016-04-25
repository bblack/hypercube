var Drawer = function(game) {
  var self = this;

  this.game = game
  .on('tick', function(frame){
    _.each(frame.entities, function(ent){
      self.updateEntity(ent)
    })
  })
  .on('player_added', function(p){
    self.log('adding player ' + p.id)
    self.addPlayer(p);
  })
  .on('player_left', function(p){
    self.log('removing player ' + p.id)
    self.removePlayer(p.id);
  })
  .on('rock_added', function(r){
    self.log('adding rock ' + r.id)
    self.addRock(r);
  })
  .on('rock_removed', function(rid){
    self.log('removing rock', rid)
    self.removeRock(rid)
  })
  .on('bullet_added', function(b){
    self.log('adding bullet', b.id)
    self.addBullet(b)
  })
  .on('bullet_removed', function(bid){
    self.log('removing bullet', bid)
    self.removeBullet(bid)
  })

  this.fitCanvasToWindow = function() {
    var winW = window.innerWidth;
    var winH = window.innerHeight;
    self.paper.setSize(winW, winH);
    if (winW > winH) {
      self.x = 0 - (winW / winH - 1.0)*600/2;
      self.y = 0;
      self.w = (winW / winH)*600;
      self.h = 600;
    } else {
      self.x = 0;
      self.y = 0 - (winH / winW - 1.0)*600/2;
      self.w = 600;
      self.h = (winH / winW)*600;
    }
    self.paper.setViewBox(self.x, self.y, self.w, self.h);
  };

  this.paper = Raphael(0, 0, 600, 600);
  $(window).resize(self.fitCanvasToWindow);
  $(window).resize();
  this.statusEl = this.paper.text(300, 580, 'status unknown')
    .attr('fill', 'gray')
    .attr('font-size', '20');
  this.players = {} // player id => {name: element}
  this.rocks = {} // rock id => element
  this.bullets = {} // id => element

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
    var label = this.paper.text(0, 0, '');
    label.attr({x: 300, y: 0})
    label.attr('fill', 'white');
    label.attr('font-family', 'monospace');
    var oor = this.paper.set();
    oor.push(
      // this.paper.circle(0, 0, 20).attr('stroke', p.color),
      // this.paper.path('M-5,-5L-2.5,0L-5,5L7.5,0Z').attr('stroke', p.color)
      this.paper.path('M-5,5L-5,-5L15,0Z').attr({fill: p.color, stroke: null})
    );


    this.players[p.id] = {
      pel: pel,
      gel: gel,
      label: label,
      oor: oor
    };

    this.updatePlayer(p);
  }

  this.addRock = function(r){
    console.log('drawing a rock')
    var path = 'M';
    r.verts.forEach(function(vert, i){
      path += (vert[0] + r.position[0]) + ',' +
        (vert[1] + r.position[1]) +
        (i == r.verts.length - 1 ? 'Z' : 'L');
    })
    var el = this.paper.path(path)
    el.attr('stroke', 'white')
    // el.transform('')
    el.transform(Mustache.render("m1,0,0,-1,0,600"))
    this.rocks[r.id] = el;
  }

  this.addBullet = function(b){
    var el = this.paper.circle(b.position[0], b.position[1], 2);
    el.attr('stroke', 'white');
    this.bullets[b.id] = el;
    this.updateBullet(b);
  }

  this.removeBullet = function(bid){
    var el = this.bullets[bid];
    el.remove();
    delete this.bullets[bid];
  }

  this.removePlayer = function(pid) {
    var pels = this.players[pid];
    $.each(pels, function(name, el){ el.remove(); });
    delete this.players[pid];
  }

  this.removeRock = function(rid){
    var el = this.rocks[rid];
    el.remove();
    delete this.rocks[rid];
  }

  this.updatePlayer = function(p) {
    var pel = this.players[p.id].pel;
    var gel = this.players[p.id].gel;
    var label = this.players[p.id].label;
    var oor = this.players[p.id].oor;

    var labelPos = p.position[0].toFixed(2) + ', ' + p.position[1].toFixed(2);
    label.attr('text', labelPos);
    label.attr('x', p.position[0])
    label.attr('y', 600-p.position[1])

    $.each([pel, gel], function(i,el){
      el.transform(Mustache.render("m1,0,0,-1,0,600t{{x}},{{y}}r{{r}},0,0", {
        x: p.position[0],
        y: p.position[1],
        r: Raphael.deg(p.orientAngle)
      }));

      pel.attr('fill', p.a ? p.color : '');
    });

    // for each of 4 directions, parameterize line from camera focus to player.
    // parameter t should fall between 0 and 1 for exactly one of these if the
    // player is off-screen (none if player is on-screen)
    var center = [this.x + this.w / 2, this.y + this.h / 2];
    var minCorner = [this.x, this.y];
    var edges = {
      left: {},
      bottom: {},
    };
    edges.left.t = (minCorner[0] - center[0]) / (p.position[0] - center[0]);
    edges.bottom.t = (minCorner[1] - center[1]) / (p.position[1] - center[1]);
    if (_.any(edges, function(edge){ return Math.abs(edge.t) <= 1})) {
      oor.show();
    } else {
      oor.hide();
    }
    label.attr('text', _.map(edges, function(v,k){
      return k + ': ' + v.t.toFixed(2);
    }).join('\n'));
    _.each(edges, function(edge){edge.t = Math.abs(edge.t)*.95})
    // cross.x: point at which the line crosses an x boundary
    var cross = {
      x: [
        center[0] + edges.left.t * (p.position[0] - center[0]),
        center[1] + edges.left.t * (p.position[1] - center[1]),
      ],
      y: [
        center[0] + edges.bottom.t * (p.position[0] - center[0]),
        center[1] + edges.bottom.t * (p.position[1] - center[1]),
      ]
    };

    // find the point where the line goes off-screen
    var nearest = _.min(cross, function(p){
      return Math.pow(p[0] - center[0], 2) + Math.pow(p[1] - center[1], 2);
    });
    var r = Raphael.deg(Math.atan((p.position[1] - center[1]) / (p.position[0] - center[0])));
    if (p.position[0] < center[0]) r += 180;
    oor.transform(Mustache.render("m1,0,0,-1,0,600t{{x}},{{y}}r{{r}},0,0", {
      x: nearest[0],
      y: nearest[1],
      r: r
    }));
  }

  this.updateRock = function(r){

  }

  this.updateBullet = function(b){
    var el = this.bullets[b.id]
    el.attr('cx', b.position[0])
    el.attr('cy', 600-b.position[1])
  }

  this.updateEntity = function(e){
    if (e.type === 'player') {
      this.updatePlayer(e);
    } else if (e.type === 'bullet') {
      this.updateBullet(e);
    } else if (e.type === 'rock') {
      this.updateRock(e);
    } else {
      throw 'entity not recognized. type: ' + e.type;
    }
  }
}

Drawer.prototype.log = function(msg){
  console.log('[drawer] ' + Array.prototype.join.call(arguments, ' '));
}
