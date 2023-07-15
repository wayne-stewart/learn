
var Game = function() {

    var assets = new AssetManager();
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    var arena = new Arena(canvas, ctx, assets, 0.01);
    var player1 = new Player(canvas, ctx, assets);
    var player2 = null;

    var drawProgress = function(p) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0,0,canvas.width, canvas.height); 
        ctx.fillStyle = "#000000";
        //ctx.fillText(p.toString(), canvas.width/2, canvas.height/2);
        ctx.strokeStyle = "#000000";
        ctx.strokeRect(canvas.width * 0.1, canvas.height / 2 - 10, canvas.width * 0.8, 20);
        ctx.fillRect(canvas.width * 0.1, canvas.height / 2 - 10, canvas.width * 0.8 * p, 20);
    };

    this.start = function() {
        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientHeight;
        document.body.appendChild(canvas);

        document.addEventListener("keydown", onKeyDown, false);
        document.addEventListener("keyup", onKeyUp, false);

        drawProgress(0);
        assets.progress(function(p){ 
            drawProgress(p);
        });
        var loaderPromise = assets.loadAllAsync(AssetManifest);
        loaderPromise.then(function(result) {

            arena.initJadeDesert();

            player1.initLiuKang();

            requestAnimationFrame(gameLoop);
        });
    };

    var keyState = { };

    var onKeyDown = function(event) {
        keyHandler(event, true);
    };

    var onKeyUp = function(event) {
        keyHandler(event, false);
    };

    var keyHandler = function(event, value) {
        //console.log(event.keyCode);
        switch(event.keyCode)
        {
            case 32: keyState.space = value; break;
            case 37: keyState.leftArrow = value; break;
            case 39: keyState.rightArrow = value; break;
            case 87: keyState.w = value; break;
            case 65: keyState.a = value; break;
            case 83: keyState.s = value; break;
            case 68: keyState.d = value; break;
            case 80: keyState.p = value; break;
            case 76: keyState.l = value; break;
            case 79: keyState.o = value; break;
            case 75: keyState.k = value; break;
            case 81: keyState.q = value; break;
        }
    };

    var gameLoop = function(timestamp) { 

        player1.update(keyState, timestamp);

        arena.update(player1, null);

        arena.drawBackground(timestamp);

        player1.draw(timestamp);

        arena.drawForeground(timestamp);

        if (!keyState.space) {
            requestAnimationFrame(gameLoop);
        }
        
    };
};


