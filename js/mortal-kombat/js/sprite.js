
var Sprite = function() {
    this.frames = [];
    this.mode = 0;
    this.timestamp = 0;
    this.current = 0;
    this.direction = 1;
    this.framerate = 75; // milliseconds until next frame
};

Sprite.prototype.reset = function() {
    this.frames = [];
    return this;
};

Sprite.prototype.forward = function() { 
    this.direction = 1;
    return this;
};

Sprite.prototype.backward = function() { 
    this.direction = -1;
    return this;
};

Sprite.prototype.oneWayLoop = function() {
    this.mode = 0;
    return this;
};

Sprite.prototype.twoWayLoop = function() { 
    this.mode = 1;
    return this;
};

Sprite.prototype.oneWayNoLoop = function() {
    this.mode = 2;
    return this;
};

Sprite.prototype.addFrame = function(frame, translate_x, translate_y) { 
    this.frames.push(frame);
    frame.translate_x = translate_x;
    return this;
};

Sprite.prototype.getFrame = function(timestamp) { 
    if (timestamp > this.timestamp) {
        this.timestamp = timestamp + this.framerate;
        this.current += this.direction;
        if (this.current >= this.frames.length) {
            if (this.mode === 0) {
                this.current = 0;
            }
            else if (this.mode === 1) {
                this.current = this.frames.length - 2;
                this.direction *= -1;
            }
            else if (this.mode === 2) {
                this.current = this.frames.length - 1;
            }
        }
        else if (this.current < 0) {
            if (this.mode === 0) {
                this.current = this.frames.length -1;
            }
            else if (this.mode === 1) {
                this.current = 1;
                this.direction *= -1;
            }
        }
    }
    //console.log(this.current);
    return this.frames[this.current];
};

