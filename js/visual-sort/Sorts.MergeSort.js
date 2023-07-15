
var Sorts = Sorts || {};

(function($) {
	
	$.MergeSort = function(block) {
		this.block = block;
		this._c = block.getCount();
		this.aux = new Array(this._c);
		this._maxIndex = this._c - 1;
		this.sorted = false;
		this.stack = new Array();
		this.state = 1;
		
		this._i = 0;
		this._j = 0;
		this._k = 0;
		this._hi = 0;
		this._lo = 0;
		this._mid = 0;
		
		primeStack.call(this, 0, this._maxIndex);
	}
	
	$.MergeSort.prototype.step = function() {
		
		switch (this.state) {
			
			// sort is complete
		case 0:
			this.sorted = true;
			this._i = -1;
			this._j = -1;
			break;
			
			// pop value off stack and move values to aux
		case 1:
			var p = this.stack.pop();
			if (p) {
				for (var k = p.lo; k <= p.hi; ++k) {
					this.aux[k] = this.block.items[k].height;
				}
				this._mid = p.mid;
				this._i = p.lo;
				this._j = p.mid + 1;
				this._k = p.lo;
				this._hi = p.hi;
				this._lo = p.lo;
				this.state = 2;
			} else {
				this.state = 0;
			}
			break;
			
			// process merge
		case 2:
			if (this._k > this._hi) {
				this.state = 1;
			} else {
				if (this._i > this._mid) { this.block.items[this._k].setHeight(this.aux[this._j++]); }
				else if (this._j > this._hi) { this.block.items[this._k].setHeight(this.aux[this._i++]); }
				else if (less(this.aux, this._i, this._j)) { this.block.items[this._k].setHeight(this.aux[this._j++]); }
				else { this.block.items[this._k].setHeight(this.aux[this._i++]); }
				//console.log("k: " + this._k + " i: " + this._i + " j: " + this._j + " lo: " + this._lo + " mid: " + this._mid + " hi: " + this._hi);
				this._k++;
			}
			break;
		}
		
		setVisibleIndexes.call(this);
	};
	
	function less(array, i, j) {
		var x = array[i];
		var y = array[j];
		
		if (x > y) {
			return true;
		} else {
			return false;
		}
	}
	
	function primeStack(lo, hi) {
		if (hi <= lo) {
			return;
		}
		
		var mid = Math.floor(lo + (hi - lo) / 2);
		
		this.stack.push({lo: lo, mid: mid, hi: hi});
		
		primeStack.call(this, lo, mid);
		
		primeStack.call(this, mid + 1, hi);
	}
	
	function setVisibleIndexes() {
		this.block.i = this._i;
		this.block.j = this._j;
	}
	
})(Sorts);