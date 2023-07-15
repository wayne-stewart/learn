
Arena.prototype.initJadeDesert = function() {
    var sky = this.assets.getImage("jade_desert_5");
    var farDune = this.assets.getImage("jade_desert_4");
    var dune = this.assets.getImage("jade_desert_3");
    var cyrex = this.assets.getImage("jade_desert_3b");
    var wall = this.assets.getImage("jade_desert_2");
    var floor = this.assets.getImage("jade_desert_1");

    var screenWidth = this.canvas.width;
    var screenHeight = this.canvas.height;
    var scale = screenWidth / sky.image.width;

    this.backgroundLayers = [];
    this.foregroundLayers = [];

    this.backgroundLayers.push({ 
        image: sky.image, 
        width: screenWidth,
        scrollWidth: screenWidth,
        height: sky.image.height * scale,
        translate_y: 0,
        translate_x: 0
    });
    this.backgroundLayers.push({ 
        image: farDune.image, 
        width: farDune.image.width * scale, 
        scrollWidth: farDune.image.width * scale,
        height: farDune.image.height * scale,
        translate_y: screenHeight - floor.image.height * scale - farDune.image.height * scale,
        translate_x: 0
    });
    this.backgroundLayers.push({
        image: dune.image,
        width: dune.image.width * scale,
        scrollWidth: dune.image.width * scale,
        height: dune.image.height * scale,
        translate_y: screenHeight - floor.image.height * scale - dune.image.height * scale,
        translate_x: 0,
        layerSprites: [{
            image: cyrex.image,
            width: cyrex.image.width * scale,
            height: cyrex.image.height / 5 * scale,
            translate_y: 26 * scale,
            translate_x: 220 * scale,
            frames: 5,
            currentFrame: 0,
            frameWidth: cyrex.image.width,
            frameHeight: cyrex.image.height / 5,
            timestamp: 0,
            framerate: 150
        }]
    });
    this.backgroundLayers.push({
        image: floor.image,
        width: floor.image.width * scale,
        scrollWidth: wall.image.width * scale,
        height: floor.image.height * scale,
        translate_y: screenHeight - floor.image.height * scale,
        translate_x: -(floor.image.width - wall.image.width) * scale / 2
    });
    this.foregroundLayers.push({
        image: wall.image,
        width: wall.image.width * scale,
        scrollWidth: wall.image.width * scale,
        height: wall.image.height * scale,
        translate_y: screenHeight - wall.image.height * scale,
        translate_x: 0
    });
};

