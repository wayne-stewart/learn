
var Arena = function(canvas, ctx, assets, scrollSpeed) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.assets = assets;
    this.scrollSpeed = scrollSpeed;
    this.position = 0; // 0 is center range is from -1 to 1
    this.layers = [];
};

Arena.prototype.update = function(player1, player2) {
    if (player1.xSpeed > 0 && player1.x == 0.95) {
        this.position -= player1.xSpeed;
    }
    else if (player1.xSpeed < 0 && player1.x == 0.05) {
        this.position -= player1.xSpeed;
    }

    if (this.position < -1)
        this.position = -1;
    if (this.position > 1)
        this.position = 1;
};

Arena.prototype.scrollLeft = function() {
    this.position -= this.scrollSpeed;
    if (this.position < -1)
        this.position = -1;
};

Arena.prototype.scrollRight = function() {
    this.position += this.scrollSpeed;
    if (this.position > 1)
        this.position = 1;
};

Arena.prototype.drawLayers = function(layers, timestamp) {
    var ctx = this.ctx;
    for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        var scrollDiff = (layer.scrollWidth - this.canvas.width) / 2;
        ctx.drawImage(
            layer.image, 
            layer.translate_x - scrollDiff + this.position * scrollDiff, 
            layer.translate_y, 
            layer.width, 
            layer.height);
        if (layer.layerSprites) {
            for(var j = 0; j < layer.layerSprites.length; j++) {
                var sprite = layer.layerSprites[j];
                if (timestamp > sprite.timestamp) {
                    sprite.timestamp = timestamp + sprite.framerate;
                    sprite.currentFrame++;
                    if (sprite.currentFrame >= sprite.frames)
                        sprite.currentFrame = 0;
                }
                ctx.drawImage(
                    sprite.image,
                    0,
                    sprite.frameHeight * sprite.currentFrame,
                    sprite.frameWidth,
                    sprite.frameHeight,
                    layer.translate_x - scrollDiff + this.position * scrollDiff + sprite.translate_x,
                    layer.translate_y + sprite.translate_y,
                    sprite.width,
                    sprite.height);
            }
        }
    }
};

Arena.prototype.drawBackground = function(timestamp) { 
    this.drawLayers(this.backgroundLayers, timestamp);
};

Arena.prototype.drawForeground = function(timestamp) { 
    this.drawLayers(this.foregroundLayers, timestamp);
};

