
(function(){

    var matrix3 = {
        identity: function() {
            return [
                1,0,0,
                0,1,0,
                0,0,1
            ];
        }
        ,translation: function(tx,ty) { 
            return [
                1,  0, 0,
                0,  1, 0,
                tx,ty, 1
            ];
        }
        ,rotation: function(radians) {
            var c = Math.cos(radians);
            var s = Math.sin(radians);
            return [
                c,-s, 0,
                s, c, 0,
                0, 0, 1
            ];
        }
        ,scaling: function(sx, sy) {
            return [
                sx, 0, 0,
                0, sy, 0,
                0,  0, 1
            ];
        }
    };

    Game.Matrix = {
        
    };

})();