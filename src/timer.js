/**
 * Timer - unified timer loops
 * git://github.com/mseeley/Timer.git
 * http://github.com/mseeley/Timer/tree/master/LICENSE
 */
(function (global) {

  var timeout = "Timeout",
      interval = "Interval",
      method = interval,
      //method = timeout,
      slice = [].slice,
      timers = {
        // Int id: Array fns
      };

  /**
   * Executes timer groups functions at each interval or timeout.
   * @param {Number} interval
   * @return {Void}
   * @private
   * @method exec
   */
  function exec (interval) {
    var group = timers[interval],
        fns = group.fns,
        count = fns.length,
        fn;

    while (count--) {
      fn = fns[count];
      fn[0].apply(fn[1], fn[2]);
    }

    if (method == timeout) {
      group.id = set(interval);
    }
  }

  /**
   * Locates a function argument within the specified timer group. Uses native
   * indexOf method when the feature is available.
   * @param {Function} callback
   * @param {Number} interval
   * @param {Object} scope
   * @return {Number} >= 0 if the callback argument was found; -1 otherwise
   * @private
   * @method indexOf
   */
  function indexOf (callback, interval, scope) {
    var group = timers[interval],
        count,
        fns,
        idx = -1;

    if (group) {
      fns = group.fns;
      count = fns.length;

      while (count--) {
        if (fns[count][0] == callback && fns[count][1] == scope) {
          idx = count;
          break;
        }
      }
    }

    return idx;
  }

  /**
   * Responsible for setting the unified timeout or interval. Lazy initialized
   * to reduce number of function calls in modern browsers while accomodating
   * IE's non-standard implementation.
   * @param {Number} interval
   * @return {Number}
   * @private
   * @method set
   */
  function set (interval) {
    var setMethod = global["set" + method];

    set = global.execScript ?
      function (interval) {
          return setMethod(function(){ exec(interval); }, interval);
      }:
      function (interval) {
          return setMethod(exec, interval, interval);
      };

    return set(interval);
  }

  /**
   * Responsible for clearing a timeout or interval when there are no functions
   * to execute.
   * @param {Number} interval
   * @return {Void}
   * @private
   * @method clear
   */
  function clear (interval) {
    var group = timers[interval];
    global["clear" + method](group.id);
    group.id = null;
    group.fns = [];
  }

  /**
   * Consolidate high-frequency function execution, executes one or more times
   * each ~200 ms, under a general interface. Order of function registration
   * does not imply order of execution.
   * @class timer
   * @static
   */
  global.timer = {
    /**
     * Append a function to a timer group.
     * @param {Function} callback
     * @param {Number} interval
     * @param {Object} scope Optional
     * @param {Mixed} arg1, ..., argN Optional
     * @return {Boolean} true if the function was added, false otherwise
     * @static
     * @method set
     */
    set: function (callback, interval, scope /*, rest */) {
      var args = slice.call(arguments, 3),
          result = false,
          group;

      if (callback && interval >= 0 && indexOf(callback, interval, scope) < 0) {
        if (!timers[interval]) {
          timers[interval] = { id:null, fns:[] };
        }

        group = timers[interval];
        if (group.id === null) {
          group.id = set(interval);
        }

        group.fns.push([callback, scope, args]);
        result = !result;
      }

      return result;
    },

   /**
    * Remove a function from a timer group. Timer or interval will be
    * stopped when the group is empty.
    * @param {Function} callback
    * @param {Number} interval
    * @param {Object} scope Required only if callback was set with a scope argument
    * @return {Boolean} true if the function was cleared, false otherwise
    * @static
    * @method clear
    */
    clear: function (callback, interval, scope) {
      var idx = indexOf(callback, interval, scope),
          result = false,
          group;

      if (idx > -1) {
        group = timers[interval];
        group.fns.splice(idx, 1);

        if (!group.fns.length) {
          clear(interval);
        }

        result = !result;
      }

      return result;
    },

    /**
     * Remove all functions from one or all groups. Useful for performing mass
     * cleanup.
     * @param {Number} interval Optional
     * @return {Void}
     * @static
     * @method clearAll
     */
    clearAll: function (interval) {
      if (interval >= 0) {
        clear(interval);
      } else {
        var each;
        for (each in timers) {
          clear(each);
        }
      }
    }
  };

})(this);
