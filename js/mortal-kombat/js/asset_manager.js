
var AssetManager = function() {

    var images = [];
    var sounds = [];
    var progressTotal = 0;
    var progressCounter = 0;

    var loadImageAsync = function(item) {
        var promise = new Promise(function(resolve, reject) {
            var image = new Image();
            image.onload = function() { 
                images[item.name] = {
                    image: image
                };
                onProgress();
                resolve();
            };
            image.src = item.url;
        });
        return promise;
    };

    var onProgress = function() {
        progressCounter += 1;
        var result = progressCounter / progressTotal;
        if (result > 1) {
            result = 1;
        }
        if (result < 0) {
            result = 0;
        }
        progressCallback(result);
    };

    var progressCallback = function() { };

    this.loadAllAsync = function(manifest) {
        var promises = new Array();
        progressTotal = manifest.length;
        progressCounter = 0;
        for(var i = 0; i < manifest.length; i++) {
            var item = manifest[i];
            promises.push(loadImageAsync(item));
        }
        return Promise.all(promises);
    };

    this.getImage = function(name) {
        return images[name];
    };

    this.getSound = function(name) {
        return sounds[name];
    };

    /*
        takes in a callback function that accepts a float as input representing progress from 0 to 1
    */
    this.progress = function(callback) {
        progressCallback = callback;
    };
};

