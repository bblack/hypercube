var Drawer = function() {
  var self = this;

  this.fitCanvasToWindow = function() {
    var winW = $(window).width();
    var winH = $(window).height();
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
    .attr('fill', 'gray').attr('font-size', '20');
  this.players = {} // player id => {name: element}

  this.clear = function() {
    $.each(this.players, function(pid, p){
      self.removePlayer(pid);
    });
  }

  this.status = function(text) {
    return self.statusEl.attr('text', text);
  }

  this.addPlayer = function(p) {
    var pel = this.paper.circle(0, 0, 10);
    var oel = this.paper.path("M0,0L50,0");

    pel.attr('fill', p.color);
    pel.attr('stroke', 'white');

    oel.attr('stroke-width', 1);
    oel.attr('stroke', 'white');

    this.players[p.id] = {
      pel: pel,
      oel: oel,
    }
    $.each(this.players[p.id], function(name, el){
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
    var oel = this.players[p.id].oel;

    pel.attr('cx', p.position[0]);
    pel.attr('cy', p.position[1]);

    oel.attr('path', Mustache.render("M{{x1}},{{y1}}L{{x2}},{{y2}}", {
      x1: p.position[0],
      y1: p.position[1],
      x2: p.position[0] + 20 * Math.cos(p.orientAngle),
      y2: p.position[1] + 20 * Math.sin(p.orientAngle)
    }));
  }
};