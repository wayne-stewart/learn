
var ParticleEvent = function(t,a,b) {
    this.t = t;
    this.a = a;
    this.b = b;
    this.ac = a == null ? 0 : a.count;
    this.bc = b == null ? 0 : b.count;
};

ParticleEvent.prototype.compare = function(e) {
    this.t > e.t;
};

ParticleEvent.prototype.isValid = function() { 
    if (this.t == Infinity || this.t == -Infinity) return false;
    if (this.a == null && this.b == null) return true;
    if (this.a != null && this.b == null) return this.ac == this.a.count;
    if (this.a == null && this.b != null) return this.bc == this.b.count;
    return this.ac == this.a.count && this.bc == this.b.count;
};

var Particle = function() { 
    this.r = 0.006;
    this.fillStyle = "#000000";
    this.mass = 1;
    this.count = 0;
};

Particle.yfactor = 1;
Particle.collisions = 0;

Particle.prototype.move = function(dt) {
    this.x = this.x + this.vx * dt;
    this.y = this.y + this.vy * dt;
    if (this.x < this.r) this.x = this.r;
    if (this.x > 1 - this.r) this.x = 1 - this.r;
    if (this.y < this.r * Particle.yfactor) this.y = this.r * Particle.yfactor;
    if (this.y > 1 - this.r * Particle.yfactor) this.y = 1 - this.r * Particle.yfactor;
};

Particle.prototype.draw = function(ctx) {
    ctx.fillStyle = this.fillStyle;
    ctx.beginPath();
    ctx.arc(this.x * ctx.canvas.width, this.y * ctx.canvas.height, this.r * ctx.canvas.width, 0, Math.PI * 2);
    ctx.fill();
};

Particle.prototype.setRandomPosition = function(min, max) { 
    this.x = min + (max - min) * Math.random();
    this.y = min + (max - min) * Math.random();
};

Particle.prototype.setRandomVelocity = function(min, max) {
    var v = min + (max - min) * Math.random();
    var a = 2 * Math.PI * Math.random();
    this.vx = v * Math.cos(a);
    this.vy = v * Math.sin(a);
};

Particle.prototype.timeToHit = function(that) {
    if (this == that) return Infinity;

    var dx = that.x - this.x;
    var dvx = that.vx - this.vx;
    
    var dy = (that.y - this.y) / Particle.yfactor;
    var dvy = (that.vy - this.vy) / Particle.yfactor;

    var dvdr = dx*dvx + dy*dvy;
    if (dvdr > 0) return Infinity;
    var dvdv = dvx*dvx + dvy*dvy;
    var drdr = dx*dx + dy*dy;
    var sigma = this.r + that.r;
    var d = (dvdr*dvdr) - dvdv * (drdr - sigma*sigma);
    if (d<0) return Infinity;
    var t =  -(dvdr + Math.sqrt(d)) / dvdv;;
    //console.log("time to hit " + t);
    return t;
};

Particle.prototype.timeToHitVerticalWall = function() {
    var t = 0;
    if (this.vx > 0) {
        t = (1 - this.x - this.r) / this.vx;
    } else { 
        t = (this.x - this.r) / -this.vx;
    }
    return t;
};

Particle.prototype.timeToHitHorizontalWall = function() {
    var t = 0;
    if (this.vy > 0) {
        t = (1 - this.y - this.r * Particle.yfactor) / this.vy;
    } else {
        t = (this.y - this.r * Particle.yfactor) / -this.vy;
    }
    return t;
};

Particle.prototype.bounceOff = function(that) { 
    var dx = that.x - this.x;
    var dy = (that.y - this.y) / Particle.yfactor / Particle.yfactor;
    var dvx = that.vx - this.vx;
    var dvy = (that.vy - this.vy);
    var dvdr = dx*dvx + dy*dvy;
    //var dist = (this.r + that.r);
    var dist = Math.sqrt(dx * dx + dy * dy);
    var J = 2 * this.mass * that.mass * dvdr / ((this.mass + that.mass)*dist);
    var Jx = J * dx / dist;
    var Jy = J * dy / dist;
    this.vx += Jx / this.mass;
    this.vy += Jy / this.mass;
    that.vx -= Jx / that.mass;
    that.vy -= Jy / that.mass;
    this.count++;
    that.count++;
    Particle.collisions++;
};

Particle.prototype.bounceOffVerticalWall = function() {
    this.vx = -this.vx;
    this.count++;
    Particle.collisions++;
};

Particle.prototype.bounceOffHorizontalWall = function() { 
    this.vy = -this.vy;
    this.count++;
    Particle.collisions++;
};