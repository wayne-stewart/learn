
(function(){

    var canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
    var ctx = canvas.getContext("2d");

    let time_slider = document.createElement("input");
    time_slider.type = 'range';
    time_slider.min = -10;
    time_slider.max = 5;
    time_slider.value = 0;
    time_slider.step = 0.1;
    time_slider.style.top = 50;
    time_slider.style.right = 20;
    document.body.appendChild(time_slider);
    time_slider.addEventListener("click", function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
    });

    let btn_pin = document.createElement("button");
    btn_pin.innerHTML = 'Pool';
    document.body.appendChild(btn_pin);
    btn_pin.style.top = 20;
    btn_pin.style.right = 200 + 60;
    btn_pin.addEventListener("click", function(e) { 
        e.preventDefault(); e.stopImmediatePropagation(); 
        program.stop();
        program = new Program("pool");
        program.start();
    });
    let btn_line = document.createElement("button");
    btn_line.innerHTML = 'Bowling';
    document.body.appendChild(btn_line);
    btn_line.style.top = 20;
    btn_line.style.right = 100 + 40;
    btn_line.addEventListener("click", function(e) { 
        e.preventDefault(); e.stopImmediatePropagation(); 
        program.stop();
        program = new Program("bowling");
        program.start();
    });
    let btn_brownian = document.createElement("button");
    btn_brownian.innerHTML = 'Brownian';
    document.body.appendChild(btn_brownian);
    btn_brownian.style.top = 20;
    btn_brownian.style.right = 20;
    btn_brownian.addEventListener("click", function(e) { 
        e.preventDefault(); e.stopImmediatePropagation(); 
        program.stop();
        program = new Program("brownian");
        program.start();
    });

    var resizeCanvas = function() {
        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientHeight;

        // normalization factor -- canvas is not perfect square
        // but we are assuming height and width of 1
        Particle.yfactor = canvas.width / canvas.height;
    };

    window.addEventListener("resize", function(event){
        resizeCanvas();
    });

    window.addEventListener("click", function(event){
        program.toggle();
    });

    resizeCanvas();

    var clearCanvas = function() {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0,0,canvas.width, canvas.height);
    };

    clearCanvas();

    var Setup = {
        brownianMotion: function() {
            var col = new Array();
            for(var i = 0; i < 1000; i++) {
                var p = new Particle();
                p.r = 0.002;
                p.setRandomPosition(0.1, 0.9);
                p.setRandomVelocity(0.1, 0.2);
                p.mass = 1;
                col.push(p);
            }
            col[0].x = 0.5;
            col[0].y = 0.5;
            col[0].vx = 0;
            col[0].vy = 0;
            col[0].fillStyle = "#FF0000";
            col[0].mass = 100;
            col[0].r = 0.05;
            for (var i = 1; i < col.length; i++){
                var dx = col[0].x - col[i].x;
                var dy = col[0].y - col[i].y;
                if (Math.sqrt(dx*dx + dy*dy) < col[0].r + col[i].r) {
                    col[i].x += (dx > 0 ? -1 : 1) * (col[0].r + col[i].r + 0.2);
                    col[i].y += (dy > 0 ? -1 : 1) * (col[0].r + col[i].r + 0.2);
                }
            }
            return col;
        }
        , line: function() { 
            var col = new Array();
            for(var i = 0; i < 5; i++) {
                var p = new Particle();
                p.r = 0.02;
                p.y = 0.4;
                p.vx = 0;
                p.vy = 0;
                col.push(p);
            }
            col[0].x = 0.2;
            col[0].vx = 0.3;
            col[1].x = 0.5;
            col[2].x = 0.5 + col[0].r * 2;
            col[3].x = 0.5 + col[0].r * 4;
            col[4].x = 0.5 + col[0].r * 6;

            for(var i = 0; i < 5; i++) {
                var p = new Particle();
                p.r = 0.02;
                p.x = 0.3;
                p.vx = 0;
                p.vy = 0;
                col.push(p);
            }
            col[5].y = 0.2;
            col[5].vy = 0.3;
            col[6].y = 0.6;
            col[7].y = 0.6 + col[0].r * 2 * Particle.yfactor;
            col[8].y = 0.6 + col[0].r * 4 * Particle.yfactor;
            col[9].y = 0.6 + col[0].r * 6 * Particle.yfactor;
            return col;
        }
        , pool: function() {
            var col = new Array();
            for(var i = 0; i < 11; i++) {
                var p = new Particle();
                p.r = 0.02;
                p.y = 0.5;
                p.vx = 0;
                p.vy = 0;
                col.push(p);
            }
            col[0].x = 0.2;
            col[0].vx = 0.5;
            col[0].vy = -0.1 + (0.2 * Math.random());
            col[0].y = 0.50;
            col[1].x = 0.6;
            col[2].x = 0.635;
            col[2].y += 0.02 * Particle.yfactor;
            col[3].x = 0.635;
            col[3].y -= 0.02 * Particle.yfactor;
            col[4].x = 0.67;
            col[5].x = 0.67;
            col[5].y += 0.02 * Particle.yfactor * 2;
            col[6].x = 0.67;
            col[6].y -= 0.02 * Particle.yfactor * 2;
            col[7].x = 0.705;
            col[7].y += 0.02 * Particle.yfactor;
            col[8].x = 0.705;
            col[8].y -= 0.02 * Particle.yfactor;
            col[9].x = 0.705;
            col[9].y += 0.02 * Particle.yfactor * 3;
            col[10].x = 0.705;
            col[10].y -= 0.02 * Particle.yfactor * 3;

            return col;
        }
        , bowling: function() {
            var col = new Array();
            for(var i = 0; i < 11; i++) {
                var p = new Particle();
                p.r = 0.015;
                p.y = 0.5;
                p.vx = 0;
                p.vy = 0;
                col.push(p);
            }
            col[0].x = 0.2;
            col[0].vx = 0.5;
            col[0].vy = -0.1 + (0.2 * Math.random());
            col[0].y = 0.50;
            col[0].mass =  15;
            col[0].r = 0.025;
            col[1].x = 0.6;
            col[2].x = 0.635;
            col[2].y += 0.02 * Particle.yfactor;
            col[3].x = 0.635;
            col[3].y -= 0.02 * Particle.yfactor;
            col[4].x = 0.67;
            col[5].x = 0.67;
            col[5].y += 0.02 * Particle.yfactor * 2;
            col[6].x = 0.67;
            col[6].y -= 0.02 * Particle.yfactor * 2;
            col[7].x = 0.705;
            col[7].y += 0.02 * Particle.yfactor;
            col[8].x = 0.705;
            col[8].y -= 0.02 * Particle.yfactor;
            col[9].x = 0.705;
            col[9].y += 0.02 * Particle.yfactor * 3;
            col[10].x = 0.705;
            col[10].y -= 0.02 * Particle.yfactor * 3;

            return col;
        }
    };

    var Program = function(mode) { 

        Particle.collisions = 0;
        this.queue = new PriorityQueue(function(a,b) { return b.t - a.t; });
        this.clock = 0;
        this.max_simulation_iterations = 250;
        this.simulation_iterations = 0;
    
        switch(mode) {
            case "pool":
                this.particles = Setup.pool();
                break;
            case "brownian":
                this.particles = Setup.brownianMotion();
                break;
            case "bowling":
                this.particles = Setup.bowling();
                break;
            default:
                this.particles = Setup.brownianMotion();
                break;
        }
    
        this.draw = function() {
            clearCanvas();
            for(var i = 0; i < this.particles.length; i++) {
                this.particles[i].draw(ctx);
            }

            ctx.font = "25px monospace";
            let strings = [
                "Particles........." + this.particles.length,
                "Queue Depth......." + this.queue.size(),
                "Collisions........" + Particle.collisions,
                "FPS..............." + this.fps,
                "Events per Frame.." + this.simulation_iterations,
                "Time Dilation....." + time_slider.value
            ];
            let diag_width = 0;
            for(let i = 0; i < strings.length; i++) {
                let m = ctx.measureText(strings[i]);
                if (m.width > diag_width) diag_width = m.width;
            }

            let line_height = 20;
            let margin = 20;

            ctx.fillStyle = "rgba(255,255,255,0.7)";
            ctx.fillRect(margin,margin,diag_width,strings.length * line_height);

            ctx.fillStyle = "#FF0000";
            for(let i = 0; i < strings.length; i++) {
                ctx.fillText(strings[i], margin, margin + line_height + i * line_height);
            }
        };
    

        this.predict = function(particle) {
            if (particle == null) return;
            for (var i = 0; i < this.particles.length; i++) {
                var dt = particle.timeToHit(this.particles[i]);
                if (dt != Infinity && dt != -Infinity && !isNaN(dt)) {
                    this.queue.push(new ParticleEvent(this.clock + dt, particle, this.particles[i]));
                }
            }
            var t = particle.timeToHitVerticalWall();
            if (t != Infinity && t != -Infinity) {
                this.queue.push(new ParticleEvent(this.clock + t,particle, null));
            }
            t = particle.timeToHitHorizontalWall();
            if (t != Infinity && t != -Infinity) {
                this.queue.push(new ParticleEvent(this.clock + t,null, particle));
            }
        };
    
        for (var i = 0; i < this.particles.length; i++) { this.predict(this.particles[i]); }
        this.queue.push(new ParticleEvent(0,null,null));

        this.simulate = function(frame_ts) {
            let ms_time_span;
            if (this.frame_ts) {
                ms_time_span = frame_ts - this.frame_ts;
            }
            this.frame_ts = frame_ts;
            this.fps = (1 / (ms_time_span / 1000)).toFixed(2);
            this.simulation_iterations = 0;

            if (ms_time_span) {

                let simulation_i = 0;
                let run_loop = true;
                let time_dilation = parseFloat(time_slider.value);
                let time_divider = time_dilation == 0 ? 60 : 
                    time_dilation > 0 ? (60 / (1 + time_dilation)) : (60 * (1 + -time_dilation));

                for (; this.simulation_iterations < this.max_simulation_iterations && run_loop; simulation_i++) {

                    this.simulation_iterations++;
                    var event = this.queue.pop();
                    while(!event.isValid()) {
                        event = this.queue.pop();
                    }
                    var a = event.a;
                    var b = event.b;
            
                    // updated particle position to event position
                    for (var i = 0; i < this.particles.length; i++) {
                        this.particles[i].move(event.t - this.clock);
                    }
                    this.clock = event.t;
            
                    if (a != null && b != null) { 
                        a.bounceOff(b);
                    }
                    else if (a != null && b == null) {
                        a.bounceOffVerticalWall();
                    }
                    else if (a == null && b != null) { 
                        b.bounceOffHorizontalWall();
                    }
                    else if (a == null && b == null) {
                        run_loop = false;
                        this.queue.push(new ParticleEvent(this.clock + (1 / time_divider), null, null));
                    }
            
                    this.predict(a);
                    this.predict(b);
                }
            }

            this.draw();

            if (!this.pause) {
                requestAnimationFrame(ts => this.simulate(ts));
            }
        };

        this.pause = false;

        this.start = function() {
            this.pause = false;
            requestAnimationFrame(ts => this.simulate(ts));
        };

        this.stop = function() { 
            this.pause = true;
        };

        this.toggle = function() {
            if (this.pause) {
                this.start();
            }
            else {
                this.stop();
            }
        };
    };

    let program = new Program();
    program.start();
})();