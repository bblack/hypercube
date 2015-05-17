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
      self.paper.setViewBox(
        0 - (winW / winH - 1.0)*600/2,
        0,
        (winW / winH)*600,
        600)
    } else {
      self.paper.setViewBox(
        0,
        0 - (winH / winW - 1.0)*600/2,
        600,
        (winH / winW)*600)
    }
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
    label.attr('fill', 'white');
    label.attr('font-family', 'monospace');

    this.players[p.id] = {
      pel: pel,
      gel: gel,
      label: label
    };

    this.updatePlayer(p);
  }

  this.addRock = function(r){
    var path = 'M';
    r.verts.forEach(function(vert, i){
      path += (vert[0] + r.position[0]) + ',' +
        (vert[1] + r.position[1]) +
        (i == r.verts.length - 1 ? 'Z' : 'L');
    })
    var el = this.paper.path(path)
    el.attr('stroke', 'white')
    // el.transform('')
    this.rocks[r.id] = r;
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

  this.addEntity = function(e){
    if (e.type == 'player') {
      this.addPlayer(e);
    } else if (e.type == 'rock') {
      this.addRock(e);
    } else if (e.type == 'bullet') {
      this.addBullet(e);
    } else {
      throw 'unrecognized entity';
    }
  }

  this.removeEntity = function(e){
    if (e.type == 'player') {
      this.removePlayer(e);
    } else if (e.type == 'rock') {
      this.removeRock(e);
    } else {
      throw 'unrecognized entity';
    }
  }

  this.removePlayer = function(pid) {
    var pels = this.players[pid];
    $.each(pels, function(name, el){ el.remove(); });
    delete this.players[pid];
  }

  this.updatePlayer = function(p) {
    var pel = this.players[p.id].pel;
    var gel = this.players[p.id].gel;
    var label = this.players[p.id].label;

    label.attr('text', p.position[0].toFixed(2) + ', ' + p.position[1].toFixed(2));
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
