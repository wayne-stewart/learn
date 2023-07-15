
define([], function() { 

    var Canvas = function(canvasSelector) {
        this.el = document.querySelector(canvasSelector);
    };

    Canvas.prototype.matchResolution = function() {
        this.el.width = this.el.clientWidth;
        this.el.height = this.el.clientHeight;
        return this;
    };

    Canvas.prototype.getContext2d = function() {
        return this.el.getContext("2d");
    };

    Canvas.prototype.getResolution = function() {
        return { width: this.el.width, height: this.el.height };
    };

    /* 
        measure text height and width as rendered on a canvas
        does not use the canvas to which the method is attached
        maximum height is between 90 and 100 pixels
            this can be changed by updating the canvas dimenions
    */
    Canvas.prototype.measureText = function(font, text) {
        var cvs = document.createElement("canvas");
        cvs.width = 100;
        cvs.height = 100;
        var ctx = cvs.getContext("2d");
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, cvs.width, cvs.height);
        ctx.fillStyle = "white";
        ctx.font = font;
        ctx.fillText(text, (cvs.width * 0.1), (cvs.height * 0.9));
        cvs.style.width = cvs.width;
        cvs.style.height = cvs.height;
        var imageData = ctx.getImageData(0,0,cvs.width,cvs.height);
        var data = imageData.data;
        var top,bottom,rowEmpty,rowStart;
        // find the top and bottom of the rendered text
        for(var y = 0; y < imageData.height; y++) {
            rowEmpty = true;
            rowStart = y * imageData.width * 4;
            for (var x = 0; x < imageData.width; x++) {
                if (data[rowStart + (x * 4)] > 0) {
                    rowEmpty = false;
                    if (!top) {
                        top = y;
                    }
                    break;
                }
            }
            if (rowEmpty && top) {
                bottom = y;
                break;
            }
        }
        // display the top and bottom lines for debugging purposes
        // document.body.appendChild(cvs); 
        // console.log(top);
        // console.log(bottom);
        // ctx.strokeStyle = "white";
        // ctx.beginPath();
        // ctx.moveTo(0, top);
        // ctx.lineTo(cvs.width, top);
        // //ctx.stroke();
        // ctx.moveTo(0, bottom);
        // ctx.lineTo(cvs.width, bottom);
        // ctx.stroke();

        // the hieght of the text is the difference between the top and bottom lines
        var text_height = bottom - top;
        var text_width = ctx.measureText(text).width;
        return { w: text_width, h: text_height }
    };

    Canvas.prototype.createExactSizeFont = function(fontfamily, pixelHeight, text) {
        var fontSize = 5;
        while(fontSize < 200) {
            fontSize++;
            var font = fontSize + "px " + fontfamily;
            var size = this.measureText(font, text);
            if (size.h >= pixelHeight) {
                return font;
            }
        }
        throw "Enable to find font to match pixelHeight: " + pixelHeight;
    };

    return Canvas;

});