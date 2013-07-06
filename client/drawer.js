var Drawer = function(client) {
  var self = this;
  self.client = client;

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
      self.paper.setViewBox(
        p.position[0] - self.paper.width / 2,
        // apply flip to pos.y
        p.position[1]*-1 - self.paper.height / 2,
        self.paper.width,
        self.paper.height,
        true
      );
    }
  }
};