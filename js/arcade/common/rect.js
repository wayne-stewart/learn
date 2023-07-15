
define([], function() {

    var Rect = function(x,y,width,height) {
        this.x = x;
        this.right = x;
        this.y = y;
        this.top = y;
        this.w = width;
        this.width = width;
        this.h = height;
        this.height = height;
        this.bottom = y + height;
        this.left = x + width;
    };

    return Rect;

});