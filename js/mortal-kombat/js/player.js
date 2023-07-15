
var Player = function(canvas, ctx, assets) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.timestamp = 0;
    this.x = 0.5; // screen width is 0 to 1. constrain between 0.05 - 0.95
    this.y = 0.9; // screen height is 0 to 1. constrain between 0.9 and 0.3;
    this.scale = 1;
    this.timestamp = 0;
    this.walkSpeed = 0.0003;
    this.floor = 0.9;
    this.gravity = 0.001;
    this.jumpYSpeed = 0.03;
    this.jumpXSpeed = 0.00;
    this.flipYSpeed = 0.038;
    this.flipXSpeed = 0.007;
    this.airborne = false;
    this.forwardDirection = 1;
    this.xSpeed = 0;
    this.ySpeed = 0;
    this.assets = assets;
    this.standing = new Sprite();
    this.sprite = this.standing;
    this.walking = new Sprite();
    this.ducking = new Sprite();
    this.jumping = new Sprite();
    this.jumping.framerate = 200;
    this.flipping = new Sprite();
};

Player.prototype.draw = function(timestamp) {
    //var frame = this.standing.getFrame(timestamp);
    var frame = this.sprite.getFrame(timestamp);
    this.ctx.drawImage(
        frame.image,
        this.x * this.canvas.width - frame.image.width * this.scale / 2 + frame.translate_x * this.scale,
        this.y * this.canvas.height - frame.image.height * this.scale,
        frame.image.width * this.scale,
        frame.image.height * this.scale);
};

Player.prototype.update = function(keyState, timestamp) { 
    var timeDiff = timestamp - this.timestamp;
    this.timestamp = timestamp;
    var x = 0;

    if (this.airborne) {
        this.ySpeed -= this.gravity;
        this.sprite.ySpeed = this.ySpeed;
        this.y -= this.ySpeed
        this.x += this.xSpeed;
        this.keepOnScreen();
        if (this.y == this.floor) {
            this.stand();
        }
    }
    else {
        if (keyState.s) {
            this.duck(timeDiff);
        }
        else if (keyState.w && keyState.a) {
            this.flipLeft();
        }
        else if (keyState.w && keyState.d) {
            this.flipRight();
        }
        else if (keyState.w) {
            this.jump();
        }
        else if (keyState.a) {
            this.walkLeft(timeDiff);
        }
        else if (keyState.d) {
            this.walkRight(timeDiff);
        }
        else {
            this.stand();
        }
    }
};

Player.prototype.keepOnScreen = function() {
    if (this.x > 0.95)
        this.x = 0.95;
    if (this.x < 0.05)
        this.x = 0.05;
    if (this.y > 0.9)
        this.y = 0.9;
    if (this.y < 0.2)
        this.y = 0.2;
};

Player.prototype.stand = function() { 
    this.sprite = this.standing;
    this.xSpeed = 0;
    this.ySpeed = 0;
    this.airborne = false;
};

Player.prototype.walkLeft = function(timeDiff) {
    this.sprite = this.walking;
    this.sprite.backward();
    this.xSpeed = -1 * this.walkSpeed * timeDiff;
    this.x += this.xSpeed;
    this.keepOnScreen();
};

Player.prototype.walkRight = function(timeDiff) {
    this.sprite = this.walking;
    this.sprite.forward();
    this.xSpeed = this.walkSpeed * timeDiff;
    this.x += this.xSpeed;
    this.keepOnScreen();
};

Player.prototype.duck = function(timeDiff) { 
    this.sprite = this.ducking;
    this.xSpeed = 0;
};

Player.prototype.jump = function() {
    this.sprite = this.jumping;
    this.airborne = true;
    this.ySpeed = this.jumpYSpeed;
    this.xSpeed = 0;
};

Player.prototype.flipRight = function() { 
    this.sprite = this.flipping;
    this.airborne = true;
    this.ySpeed = this.flipYSpeed;
    this.xSpeed = this.flipXSpeed;
};

Player.prototype.flipLeft = function() { 
    this.sprite = this.flipping;
    this.airborne = true;
    this.ySpeed = this.flipYSpeed;
    this.xSpeed = -this.flipXSpeed;
};


