
(function(global) {

    /*
        Remove element(s) from an array

        Arguments
            predicate (typeof function)
                a function that should return true if an element
                should be removed and false if not.
                usage: arr.remove(x => x.id === 2) // remove element where id === 2
            predicate (typeof number)
                index of element that should be removed in the array
                usage: arr.remove(2) // remove element at index 2
        
        Returns all values removed from the array.
    */
    Array.prototype.remove = function(predicate) {
        let removed = new Array();
        if (typeof predicate === "function") {
            for (let i = (this.length - 1); i >= 0; i--) {
                if (predicate(this[i])) {
                    removed.push(this.splice(i, 1)[0]);
                }
            }
        }
        else if (typeof predicate === "number" && !isNaN(predicate)) {
            removed.push(this.splice(predicate, 1)[0]);
        }
        return removed;
    };

})(this);