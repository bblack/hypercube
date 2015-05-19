var _ = require('underscore')

function Circle(r){
    this.r = r || 0;
}

Circle.prototype.collidesWith = function(m, thisPos, mPos){
    if (m instanceof Point) {
        var d = Math.sqrt(Math.pow(mPos[0] - thisPos[0], 2) + Math.pow(mPos[1] - thisPos[1], 2));
        return d <= this.r;
    } else {
        throw "can't do collision detection with that thing"
    }
}

function Point(){

}

module.exports = {
    Circle: Circle,
    Point: Point
}
