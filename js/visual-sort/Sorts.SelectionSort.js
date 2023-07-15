
var Sorts = Sorts || {};

(function ($) {

	$.SelectionSort = function(block) {
		this.block = block;
		this._c = block.getCount();
		this._maxIndex = this._c - 1;
		this._maxK = this._c;
		this.sorted = false;
		this._i = -1;
		this._j = 0;
		this._k = 0;
		this._state = 0;
	}
	
	$.SelectionSort.prototype.step = function() {
		
		this.block.i = this._j;
		this.block.j = this._k;
		
		if (this._state == 0) {
			this._state = 1;
	 		this._k++;
		
			// when k passes last index, we know we have found the minimum
			if (this._k == this._maxK) {
				this._i++;
				this.block.exch(this._i, this._j);
			
				this._j = this._i + 1;
				this._k = this._j;
			}
		
			// if i reaches last index, then we know array is sorted
			// i only makes one trip through the array
			if (this._i == this._maxIndex) {
				this.sorted = true;
				this.block.i = -1;
				this.block.j = -1;
			}
		} 
		else if (this._state = 1) {
			this._state = 0;
			
			// found new minimum
			if (this.block.less(this._j, this._k)) {
				this._j = this._k;
			}
		}
	};
	
})(Sorts);