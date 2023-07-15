
(function($){
    
    var logall = function(d) { 
        var s = "";
        for(var i = 0; i < d.length; i++) {
            s += d[i];
            s += " ";
        }
        console.log(s);
    };

    /*
        Constructor for PriorityQueue
        arguments
            cmp: cmp is a function used to compare the
                values added by the insert function.
                cmp should have a signature of int cmp(x,y).
                cmp should return 0,1,-1 depending on the
                type of queue ( Min / Max )
     */
    var PriorityQueue = function(cmp) {
        if (typeof cmp !== "function") {
            throw "argument should be a function. int compare(x,y)";
        }

        /*
            no data is stored in 0th element of Array
            indexOfLast will always equal the number
            of elements in the array

            values stored in data will be stored in heap order using
            array arithmetic to keep track of binary tree nodes
            rootIndex = 1;
            leftChild = index * 2;
            rightChild = leftChild + 1
            parent = Math.floor(index / 2);
         */
        var data = new Array();
        var indexOfLast = 0;

        var exchange = function(i, j) {
            var v = data[i];
            data[i] = data[j];
            data[j] = v;
        };

        var compare = function(i, j) { 
            return cmp(data[i], data[j]) < 0;
        };

        var swim = function(index) {
            var parentIndex = Math.floor(index / 2);
            while (index > 1 && compare(parentIndex, index)) {
                exchange(index, parentIndex);
                index = parentIndex;
                parentIndex = Math.floor(index / 2);
            }
        };

        var sink = function(index) {
            var childIndex = index * 2;
            while(childIndex <= indexOfLast) {
                if (childIndex < indexOfLast && compare(childIndex, childIndex+1))
                    childIndex++;
                if (!compare(index, childIndex))
                    break;
                exchange(index, childIndex);
                index = childIndex;
                childIndex = index * 2;
            }
        };

        this.push = function(value) {
            indexOfLast++;
            data[indexOfLast] = value;
            //logall(data);
            swim(indexOfLast);
            //logall(data);
        };

        /*
            pop the root off the tree and exchange it
            with the last element in the tree.
            then sink the new root down
            nullify the last element in the tree since
            it was popped off and we don't want it hanging around
         */
        this.pop = function() { 
            if (indexOfLast == 0)
                return null;
            //logall(data);
            var max = data[1];
            exchange(1, indexOfLast);
            indexOfLast--;
            //logall(data);
            sink(1);
            data[indexOfLast+1] = null;
            //logall(data);
            return max;
        };

        this.isEmpty = function() {
            return indexOfLast == 0;
        };

        this.getData = function() {
            return data;
        };

        this.size = function() {
            return indexOfLast;
        };
    };

    $.PriorityQueue = PriorityQueue;

})(window);