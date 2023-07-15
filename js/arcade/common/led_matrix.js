
define([], function() {

    var rgba2gray = function(inputData) {
        var outputData = new Uint8ClampedArray(inputData.length / 4);
        for(var i = 0; i < outputData.length; i++) {
            outputData[i] = 
                (0.2989 * inputData[i*4]) + 
                (0.5870 * inputData[i*4+1]) + 
                (0.1140 * inputData[i*4+2]);
        }
        return outputData;
    };

    var getPixel = function(data, dataSize, xOffset, ledX, ledY) {
        // xOffset comes from a calculation and could be a fractional value
        // Math.floor is requried to crate a valid index into an array
        var dataX = Math.floor(ledX - xOffset); 
        if (dataX < 0) return 0;
        var dataY = ledY;
        if (dataX >= dataSize.width) return 0;
        if (dataY >= dataSize.height) return 0;
        return data[dataY * dataSize.width + dataX];
    };

    /*
        rect = { x, y, w, h } rectangle on canvas in which to draw
        res = { w, h } pixel resolution horizontal and vertical count
        pixelSize = 0 - 1, 0 = tiny, 1 = max without overlapping
    */
    var LedMatrix = function(canvas, rect, res) {
        this.canvas = canvas;
        this.rect = rect;
        this.res = res;
        this.pixelSize = 0.5;
        this.backgroundStyle = "#040414";
        this.justification = "right";
        this.xOffset = 0;
    };
    
    LedMatrix.prototype.render = function() {
        var ctx = this.canvas.getContext2d();
        var rect = this.rect;
        ctx.fillStyle = this.backgroundStyle;
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        var sp;
        if (this.rect.h > this.rect.w) {
            sp = rect.w / this.res.w;
        }
        else {
            sp = rect.h / this.res.h;
        }
        var ledPixelData = this.ledPixelData;
        var r = sp / 2 * this.pixelSize;
        //var rowStart = 0;
        var offColor = parseInt("25", 16);
        var colorRange = 255 - offColor;
        var color = 0;
        for (var y = 0; y < this.res.h; y++) {
            //rowStart = y * this.res.w;
            for (var x = 0; x < this.res.w; x++) {
                color = getPixel(ledPixelData.data, ledPixelData, this.xOffset, x, y);
                color = ((color / 255) * colorRange) + offColor;
                color = Math.floor(color);
                ctx.fillStyle = "#" + color.toString(16) + "0000";
                ctx.beginPath();
                ctx.ellipse(
                    rect.x + (x + 1) * sp - sp / 2, 
                    rect.y + (y + 1) * sp - sp / 2, 
                    r, r, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    };

    LedMatrix.prototype.setText = function(fontfamily, text) {
        var font = this.canvas.createExactSizeFont(fontfamily, this.res.h, "Mg");
        var size = this.canvas.measureText(font, text);
        var msize = this.canvas.measureText(font, "M");
        var writeH = msize.h;
        var cvs = document.createElement("canvas");
        cvs.width = size.w;
        cvs.height = size.h;
        var ctx = cvs.getContext("2d");
        ctx.font = font;
        ctx.fillStyle = "black";
        ctx.fillRect(0,0,cvs.width, cvs.height);
        ctx.fillStyle = "white";
        ctx.fillText(text, 0, writeH);
        var imageData = ctx.getImageData(0, 0, cvs.width, cvs.height);
        this.ledPixelData = { 
            data:  rgba2gray(imageData.data),
            width: imageData.width, 
            height: imageData.height 
        };
        // setJustification does the calculations for the default justification
        this.setJustification(this.justification);
    };

    LedMatrix.prototype.setJustification = function(justification) {
        this.justification = justification;
        if (this.justification == "center") {
            this.xOffset = (this.res.w / 2) - (this.ledPixelData.width / 2);
        }
        else if (this.justification == "right") {
            this.xOffset = this.res.w - this.ledPixelData.width;
        }
        else if (this.justification == "left") {
            this.xOffset = 0;
        }
    };

    LedMatrix.prototype.setTextAnimation = function(type, speed) {
        this.textAnimation = type;
        this.textAnimationSpeed = speed;
        this.direction = 1;
    };

    LedMatrix.prototype.update = function(elapsed) {
        // var dataWidth = this.ledPixelData.width;
        // var displayWidth = this.res.w;
        // if (dataWidth > displayWidth) {
        //     var maxOffset = dataWidth - displayWidth;
        //     // this.dataPosition += (this.textAnimationSpeed * elapsed * this.direction);
        //     // if (this.dataPosition >= maxOffset) {
        //     //     this.dataPosition = maxOffset;
        //     //     this.direction *= -1;
        //     // }
        //     // else if (this.dataPosition <= 0) {
        //     //     this.dataPosition = 0;
        //     //     this.direction *= -1
        //     // }
        // }
    };

    return LedMatrix;
});