
var Sorts = Sorts || {};

(function ($) {

	$.InsertionSort = function(block) {
		this.block = block;
		this._c = block.getCount();
		this._maxIndex = this._c - 1;
		this._minJ = 1;
		this.iterations = 0;
		this.sorted = false;
		this._i = 0;
		this._j = 0;
		this._state = 0;
		this._cmp = 0;
	}
	
	$.InsertionSort.prototype.step = function() {

		if (this._state == 0) {
			this._state = 1;
			this._j--;
		
			if (this._j < this._minJ) {
				this._i++;
				this._j = this._i;
			}
		
			if (this._i > this._maxIndex) {
				this.sorted = true;
				this.block.i = -1;
				this.block.j = -1;
				return;
			}
		
			this.block.i = this._j;
			this.block.j = this._j - 1;
			
			this._cmp = this.block.less(this._j - 1, this._j);
		} 
		else if (this._state == 1) {
			this._state = 0;
			
			if (this._cmp) {
				this.block.exch(this._j - 1, this._j);
			} else {
				this._j = 0;
			}
		}
	};
	
})(Sorts);