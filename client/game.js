var Game = function(client) {
  var self = this;

  this.client = client;
  this.entities = {};
  this.fps = 60;

  this.addEntity = function(e){
    this.entities[e.id] = e;
    if (e.type == 'player') self.emit('player_added', e);
    if (e.type == 'rock') self.emit('rock_added', e);
    if (e.type == 'bullet') self.emit('bullet_added', e);
  }

  this.removeEntity = function(eid){
    console.log('removing', eid)
    if (this.entities[eid]) {
      var e = this.entities[eid];
      delete this.entities[eid];
      if (e.type == 'bullet') self.emit('bullet_removed', eid)
      if (e.type == 'player') self.emit('player_left', e);
    } else {
      throw "Game couldn't remove entity because it doesn't exist: " + eid;
    }
  }

  this.tick = function() {
    var interpFrame = self.interpFrame();
    self.emit('tick', interpFrame);
    window.requestAnimationFrame(self.tick)
  }

  function interpAngle(oldAngle, newAngle, timeDiff, timeSinceLastFrame){
    // attempt to detect that the angle has crossed the 0/2pi line
    // rather than making an almost full circle in one tick
    if (Math.abs(newAngle - oldAngle) > Math.PI) {
      if (newAngle < oldAngle) {
        newAngle += 2*Math.PI;
      } else {
        oldAngle += 2*Math.PI;
      }
    }
    return oldAngle + ((newAngle - oldAngle) / timeDiff) * timeSinceLastFrame;
  }

  this.interpFrame = function() {
    var oldFrame = self.client.lastFewUpdates[1];
    if (!oldFrame) { return {entities: []}; }

    var newFrame = self.client.lastFewUpdates[0];
    if (!newFrame) { return oldFrame; }

    var timeDiff = newFrame.time - oldFrame.time;
    var timeSinceLastFrame = Date.now() - newFrame.time;
    var interpFrame = {entities: []};
    var oldEntities = _.indexBy(oldFrame.data.entities, 'id');

    _.each(newFrame.data.entities, function(newEnt,i){
      var oldEnt = oldEntities[newEnt.id];

      var orientAngle = !oldEnt ? newEnt.orientAngle :
        interpAngle(oldEnt.orientAngle, newEnt.orientAngle, timeDiff, timeSinceLastFrame);

      if (timeDiff == 0) {
        console.warn('Tried to interp two frames with no time diff');
        // This happens if incoming packets get choked up and then rcvd
        // virtually simultaneously. To fix, have server include its own timestamp.
        // Server time should then only be used for calculating time diffs.
      }

      if (newEnt.velocity) {
        // if the entity has v included, it's a "dumb" entity (i.e. not another player) that can
        // be easily predicted using v
        var v = _.map(newEnt.velocity, function(x){return x/1000});
        var pos = [
          newEnt.position[0] + v[0] * timeSinceLastFrame,
          newEnt.position[1] + v[1] * timeSinceLastFrame
        ];
      } else if (oldEnt) {
        // the entity doesn't have v included => it's difficult to predict (i.e. another player)
        // so we lerp position b/t the last 2 frames
        var v = [
          (newEnt.position[0] - oldEnt.position[0]) / timeDiff,
          (newEnt.position[1] - oldEnt.position[1]) / timeDiff
        ];
        var pos = [
          oldEnt.position[0] + v[0] * timeSinceLastFrame,
          oldEnt.position[1] + v[1] * timeSinceLastFrame
        ];
      }

      var interpEnt = !pos ? newEnt : _.extend({}, newEnt, {
        orientAngle: orientAngle,
        position: pos
      })

      interpFrame.entities.push(interpEnt)
    });

    return interpFrame;
  };
};

inherits(Game, EventEmitter2);
