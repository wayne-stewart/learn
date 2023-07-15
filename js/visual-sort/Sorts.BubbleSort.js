
var Sorts = Sorts || {};

(function ($) {
	
	$.BubbleSort = function(block) {
		this.block = block;
		this._c = block.getCount();
		this._maxIndex = this._c - 1;
		this.sorted = false;
		this._i = 0;
		this._changeFlag = false;
		this._cmp = 0;
		this._state = 0;
	}
	
	$.BubbleSort.prototype.step = function() {
		
		this.block.i = this._i;
		this.block.j = this._i + 1;
		
		if (this._state == 0) {
			this._state = 1;
			
			this._cmp = this.block.less(this._i, this._i + 1);
			
		} else {
			this._state = 0;
			
			if (this._cmp) {
				
				this.block.exch(this._i, this._i + 1);
				this._changeFlag = true;
			}
			
			this._i++;
			if (this._i == this._maxIndex) {
				if (this._changeFlag) {
					this._i = 0;
					this._changeFlag = false;
				} else {
					this.sorted = true;
					this.block.i = -1;
					this.block.j = -1;
				}
			}
		}
	};
	
})(Sorts);

