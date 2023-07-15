
var Sorts = Sorts || {};

(function($) {
	
	var states = {shuffle:1,shuffleComplete:2,loop_i:3,loop_j:4,loop_p:5};
	
	$.QuickSort = function(block) {
		this.block = block;
		this._c = block.getCount();
		this._maxIndex = this._c - 1;
		this._minJ = 1;
		this.sorted = false;
		this.state = states.shuffle;
		this._i = -1;
		this._j = 0;
		this._lo = 0;
		this._hi = 0;
		this.stack = new Array();
		this.stack.push({lo:0,hi:this._maxIndex});
	}
	
	function loop_i(sort) {
		sort._i++;
		
		setVisibleIndexes(sort);
		
		if (sort.block.less(sort._lo, sort._i)) {
			if (sort._i == sort._hi) {
				sort.state = states.loop_j;
			}
		} else {
			sort.state = states.loop_j;
		}
	}
	
	function loop_j(sort) {
		sort._j--;
		
		setVisibleIndexes(sort);
		
		if (sort.block.less(sort._j, sort._lo)) {
			if (sort._j == sort._lo) {
				sort.state = states.loop_p;
			}
		} else {
			sort.state = states.loop_p;
		}
	}
	
	function loop_p(sort) {
		if (sort._i < sort._j) {
			sort.block.exch(sort._i, sort._j);
			sort.state = states.loop_i;
		} 
		else {
			sort.block.exch(sort._j, sort._lo);
			
			if (sort._lo < sort._hi) {
				sort.stack.push({lo:sort._lo,hi:sort._j - 1});
				sort.stack.push({lo:sort._j+1,hi:sort._hi});
			}
			
			popPartitionOffStack(sort);
		}
	}
	
	function shuffle(sort) {
		sort._i++;
		if (sort._i < sort._maxIndex) {
			sort._j = sort._i + Math.floor(Math.random() * sort._c - sort._i);
			sort.block.exch(sort._i, sort._j);
		} else {
			sort.state = states.shuffleComplete;
		}
		
		sort.block.i = sort._i;
		sort.block.j = sort._j;
	}
	
	function setVisibleIndexes(sort) {
		sort.block.i = sort._i;
		sort.block.j = sort._j;
	}
	
	function setFinished(sort) {
		sort.sorted = true;
		sort.block.i = -1;
		sort.block.j = -1;
	}
	
	function popPartitionOffStack(sort) {
		
		var p = sort.stack.pop();
		if (p) {
			if (p.lo < p.hi) {
				sort._lo = p.lo;
				sort._i = p.lo;
				sort._j = p.hi + 1;
				sort._hi = p.hi;
				sort.state = states.loop_i;	
			} else {
				popPartitionOffStack(sort);
			}
		}
		else {
			setFinished(sort);
		}
	}
	
	$.QuickSort.prototype.step = function() {

		switch(this.state){
			
		case states.shuffle:
			shuffle(this);
			break;
			
		case states.shuffleComplete:
			popPartitionOffStack(this);
			break;
			
		case states.loop_i:
			loop_i(this);
			break;
			
		case states.loop_j:
			loop_j(this);
			break;
			
		case states.loop_p:
			loop_p(this);
			break;
			
		}
	};
	
})(Sorts);