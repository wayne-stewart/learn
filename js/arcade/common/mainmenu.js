
define([],function(){

    var MainMenu = function(canvas, rect) {
        this.canvas = canvas;
        this.rect = rect;
        this.backgroundStyle = "#040414";
        this.gridColumns = 4;
        this.gridAspectRatio = 4/3;
        this.menuItems = [
            { name: "Asteroids", path: "asteroids" }
        ];
    };

    MainMenu.prototype.render = function() {
        var ctx = this.canvas.getContext2d();
        ctx.fillStyle = this.backgroundStyle;
        var rect = this.rect;
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
        var menuItemWidth = rect.width / this.gridColumns;
        var menuItemHeight = menuItemWidth / this.gridAspectRatio;
        for(var i = 0; i < this.menuItems.length; i++) {
            var menuItem = this.menuItems[i];
            ctx.beginPath();
            ctx.lineWidth = "2";
            ctx.strokeStyle = "white";
            ctx.rect(i * menuItemWidth + 1, rect.top + 1, menuItemWidth - 2, menuItemHeight - 2);
            
            ctx.stroke();
        }
    };

    MainMenu.prototype.update = function(elapsed) {

    };

    return MainMenu;

});