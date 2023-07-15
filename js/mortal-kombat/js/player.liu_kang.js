
Player.prototype.initLiuKang = function() {
    this.standing
        .reset()
        .twoWayLoop()
        .addFrame(this.assets.getImage("liu_kang_standing_1"), 0, 0)
        .addFrame(this.assets.getImage("liu_kang_standing_2"), 2, 0)
        .addFrame(this.assets.getImage("liu_kang_standing_3"), 3, 0)
        .addFrame(this.assets.getImage("liu_kang_standing_4"), 4, 0)
        .addFrame(this.assets.getImage("liu_kang_standing_5"), 5, 0)
        .addFrame(this.assets.getImage("liu_kang_standing_6"), 5, 0)
        .addFrame(this.assets.getImage("liu_kang_standing_7"), 5, 0)
        .addFrame(this.assets.getImage("liu_kang_standing_8"), 5, 0)
        .addFrame(this.assets.getImage("liu_kang_standing_9"), 5, 0);
    
    this.scale = this.canvas.height / 2 / this.standing.frames[0].image.height;

    this.walking
        .reset()
        .oneWayLoop()
        .addFrame(this.assets.getImage("liu_kang_walking_1"), -4.5, 0)
        .addFrame(this.assets.getImage("liu_kang_walking_2"), 0, 0)
        .addFrame(this.assets.getImage("liu_kang_walking_3"), 0, 0)
        .addFrame(this.assets.getImage("liu_kang_walking_4"), 0, 0)
        .addFrame(this.assets.getImage("liu_kang_walking_5"), 0, 0)
        .addFrame(this.assets.getImage("liu_kang_walking_6"), 0, 0)
        .addFrame(this.assets.getImage("liu_kang_walking_7"), 0, 0)
        .addFrame(this.assets.getImage("liu_kang_walking_8"), 0, 0);
    
    this.ducking
        .reset()
        .oneWayNoLoop()
        .addFrame(this.assets.getImage("liu_kang_ducking_1"), 0, 0)
        .addFrame(this.assets.getImage("liu_kang_ducking_2"), 0, 0)
        .addFrame(this.assets.getImage("liu_kang_ducking_3"), 0, 0);
    
    this.jumping
        .reset()
        .oneWayNoLoop()
        .addFrame(this.assets.getImage("liu_kang_jump_1"), 0, 0)
        .addFrame(this.assets.getImage("liu_kang_jump_2"), 0, 0)
        .addFrame(this.assets.getImage("liu_kang_jump_3"), 0, 0);
    this.jumping.getFrame = function(timestamp) { 
        if (this.ySpeed) {
            if (this.ySpeed < 0.02 && this.ySpeed > -0.02) {
                return this.frames[1];
            }
            else if (this.ySpeed >= 0.01) {
                return this.frames[0];
            }
            else {
                return this.frames[2];
            }
        }
        else {
            return this.frames[2];
        }
    };

    this.flipping
        .reset()
        .oneWayLoop()
        .addFrame(this.assets.getImage("liu_kang_flip_1"), 0, 0)
        .addFrame(this.assets.getImage("liu_kang_flip_2"), 0, 0)
        .addFrame(this.assets.getImage("liu_kang_flip_3"), 0, 0)
        .addFrame(this.assets.getImage("liu_kang_flip_4"), 0, 0)
        .addFrame(this.assets.getImage("liu_kang_flip_5"), 0, 0)
        .addFrame(this.assets.getImage("liu_kang_flip_6"), 0, 0)
        .addFrame(this.assets.getImage("liu_kang_flip_7"), 0, 0)
        .addFrame(this.assets.getImage("liu_kang_flip_8"), 0, 0);
    this.flipping.getFrame = function(timestamp) { 
        if (timestamp > this.timestamp) {
            this.timestamp = timestamp + this.framerate;
            if (this.ySpeed) {
                if (this.ySpeed < 0.025 && this.ySpeed > -0.025) {
                    this.current++;
                    if (this.current >= this.frames.length)
                        this.current = 1;
                    return this.frames[this.current];
                }
                else {
                    this.current = 0;
                }
            }
            else {
                this.current = 0;
            }
        }
        return this.frames[this.current];
    };
};
