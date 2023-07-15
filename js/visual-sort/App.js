
var App = App || new Object();

(function($) {
	
	var blockSize = 50;
	var stepDelay = 5;
	
	var states = { paused:0, running:1 };
	
	var state = states.paused;
	
	var sorts = new Array();
	
	$.init = function() {
		
		window.onload = function() {

			attachEventHandlers();

			setup();
			
		};
	};
	
	var setup = function () {
		
		var app = document.getElementById("app");
		
		app.innerHTML = "";
		delete sorts;
		sorts = new Array();

		var algorithms = document.querySelectorAll(".sortalgo");
		
		var initialOrders = document.querySelectorAll(".initialorder");
		
		setDelay();
		
		blockSize = document.getElementById("BlockSize").value;
		
		for (var i = 0; i < algorithms.length; ++i) {
			if (algorithms[i].checked) {
				var sortName = algorithms[i].id;
				
				var blockRow = document.createElement("div");
				blockRow.className = "blockRow";
				
				var label = document.createElement("label");
				label.innerHTML = sortName;
				blockRow.appendChild(label);
			
				for (var j = 0; j < initialOrders.length; ++j) {
					if (initialOrders[j].checked) {
						var order = initialOrders[j].id;
				
						var block = new App.Block(blockSize);
						
						if (order == "Randomized") block.randomize();
						
						else if (order == "Descending") block.reverse();
						
						block.render();
				
						var m = new Sorts[sortName](block);
				
						sorts.push(m);
				
						blockRow.appendChild(block.div);
					}
				}
				
				app.appendChild(blockRow);
			}
		}
	};
	
	var start = function() {
		state = states.running;
		step();
	};
	
	var pause = function() { state = states.paused; };
	
	var reset = function() { pause(); setup(); };
	
	var setDelay = function() { stepDelay = document.getElementById("StepDelay").value; };
	
	var attachEventHandlers = function() {
		
		var array = document.querySelectorAll("input[type=checkbox]");
		for(var i = 0; i < array.length; i++) {
			array[i].onchange = function() { pause(); setup(); };
		}
		
		document.getElementById("start").addEventListener("click", function() { start(); });
		
		document.getElementById("pause").addEventListener("click", function() { pause(); });
		
		document.getElementById("reset").addEventListener("click", function() { reset(); });
		
		document.getElementById("StepDelay").addEventListener("change", function() { setDelay(); });
		
		document.getElementById("BlockSize").addEventListener("change", function() { reset(); });
	};
	
	var step = function() {
		
		if (state == states.paused) {
			return;
		}
		
		var flag = false;
		
		for (var i = 0; i < sorts.length; i++) {
			var sort = sorts[i];
			if (!sort.sorted) {
				sort.step();
				sort.block.render();
				flag = true;
			}
		}
		
		if (flag) {
			setTimeout(step, stepDelay);
		}
	}
	
})(App);