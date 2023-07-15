
var App = App || new Object();

(function($) {
	
	function Item(height) {
		this.height = height;
		this.div = document.createElement('DIV');
		this.div.style.height = height + 'em';
		this.i = -1;
		this.j = -1;
		this.setHeight = function(height) { this.height = height; this.div.style.height = height + 'em'; };
	}
	
	$.Block = function(count) {
		this.div = document.createElement('DIV');
		this.div.className = 'sortBlock';
		this.items = new Array();
		
		for (var i = 1; i <= count; i++) {
			this.addItem(new Item(5 * i / count));				
		}
		
		this.render();
	}
	
	$.Block.prototype.addItem = function(item) {
		this.items.push(item);
	};

	$.Block.prototype.render = function() {
		this.div.innerHTML = '';
		
		var maintainHeight = document.createElement("div");
		maintainHeight.className = "maintainHeight";
		this.div.appendChild(maintainHeight);
		
		for (var i = 0; i < this.items.length; i++) {
			if (this.i == i || this.j == i) {
				this.items[i].div.className = 'active';				
			} else {
				this.items[i].div.className = '';
			}

			this.div.appendChild(this.items[i].div);
		}
	};
	
	$.Block.prototype.getCount = function() {
		return this.items.length;
	};
	
	// test whether element at j is less than element at i
	$.Block.prototype.less = function(i, j) {
		var x = this.items[i].height;
		var y = this.items[j].height;

		if (x > y) {
			return true;
		} else {
			return false;
		}
	};
	
	$.Block.prototype.exch = function(i, j) {
		var item = this.items[i];
		this.items[i] = this.items[j];
		this.items[j] = item;
	};
	
	$.Block.prototype.reverse = function() {
		this.items.reverse();
	};
	
	$.Block.prototype.randomize = function() {
		var items = this.items;
		for (var i = 0; i < items.length; i++) {
			var j = i + Math.floor(Math.random() * (items.length - i));
			this.exch(i, j);
		}
	};
	
})(App);
