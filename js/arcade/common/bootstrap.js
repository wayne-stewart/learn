/*
    Application Bootstrapper

    requires amd_loader with require to be loaded first
*/

(function(global) {

    var _led = null;
    var _mainMenu = null;
    var _timestamp = 0;

    window.addEventListener("resize", function() {
        console.log("resized");
    });

    require(["common/canvas", "common/led_matrix", "common/mainmenu", "common/rect"], 
        function(Canvas, LedMatrix, MainMenu, Rect) {

        var cvs_banner = new Canvas("#cvs_banner");
        cvs_banner.matchResolution();

        var res = cvs_banner.getResolution();
        var led = new LedMatrix(cvs_banner, 
            new Rect(0, 0, res.width, res.height), 
            {w:16 * res.width / res.height, h:16});
        led.pixelSize = 0.8;
        led.setText("verdana", "Arcade");
        led.setTextAnimation("bounce", 0.0125);
        led.setJustification("center");
        _led = led;

        // var mainMenu = new MainMenu(canvas, 
        //     new Rect(0, led.rect.bottom, res.width, res.height - led.rect.height));
        // _mainMenu = mainMenu;

        requestAnimationFrame(frameRequestCallback);
    });

    let frameRequestCallback = function(timestamp) {
        var elapsed = timestamp - _timestamp;
        _led.update(elapsed);
        _led.render();
        // _mainMenu.update(elapsed);
        // _mainMenu.render();
        _timestamp = timestamp;
        requestAnimationFrame(frameRequestCallback);
    };

})(this);