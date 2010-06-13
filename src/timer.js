(function (global) {

  var timeout = "Timeout",
      interval = "Interval",
      method = interval,
      //method = timeout,
      timers = {
        // Int id: Array fns
      };

  /**
   * Executes timer groups functions at each interval or timeout.
   * @param {Number} speed
   * @return {Void}
   * @private
   * @method exec
   */
	function exec (speed) {
    var group = timers[speed],
        fns = group.fns,
        count = fns.length,
        fn;

    // Allow exceptions to terminate execution
    while (count--) {
      fn = fns[count];
      fn(fn, speed);
    }

    if (method == timeout) {
      group.id = set(speed);
    }
	}

  /**
   * Locates a function argument within the specified timer group. Uses native
   * indexOf method when the feature is available. Lazy definition.
   * @param {Function} fn
   * @param {Number} speed
   * @return {Number} >= 0 if the fn argument was found; -1 otherwise
   * @private
   * @method indexOf
   */
  function indexOf (fn, speed) {
    indexOf = [].indexOf ?
      function (fn, speed) {
        var group = timers[speed];
        return group ? group.fns.indexOf(fn) : -1;
      }:
      function (fn, speed) {
        var group = timers[speed],
            count,
            fns,
            idx = -1;

        if (group) {
          fns = group.fns;
          count = fns.length;
          while (count-- && fn !== fns[count]);
          idx = count;
        }

        return idx;
      };

    return indexOf(fn, speed);
	}

  /**
   * Responsible for setting the unified timeout or interval. Lazy initialized
   * to reduce number of function calls in modern browsers while accomodating
   * IE's non-standard implementation.
   * @param {Number} speed
   * @return {Number}
   * @private
   * @method set
   */
  function set (speed) {
    var setMethod = global["set" + method];

    set = global.execScript ?
      function (speed) {
          return setMethod(function(){ exec(speed); }, speed);
      }:
      function (speed) {
          return setMethod(exec, speed, speed);
      };

    return set(speed);
  }

  /**
   * Responsible for clearing a timeout or interval when there are no functions
   * to execute.
   * @param {Number} speed
   * @return {Void}
   * @private
   * @method clear
   */
  function clear (speed) {
    var group = timers[speed];
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
     * @param {Function} fn
     * @param {Number} speed
     * @return {Boolean} true if the function was added, false otherwise
     * @static
     * @method set
     */
    set: function (fn, speed) {
      var result = false,
          group;

      if (speed >= 0 && indexOf(fn, speed) < 0) {
        if (!timers[speed]) {
          timers[speed] = { id:null, fns:[] };
        }

        group = timers[speed];
        if (group.id === null) {
          //console.profile(method);
          group.id = set(speed);
        }

        group.fns.push(fn);
        result = !result;
      }

      return result;
    },

   /**
    * Remove a function from a timer group. Timer or interval will be
    * stopped when the group is empty.
    * @param {Function} fn
    * @param {Number} speed
    * @return {Boolean} true if the function was cleared, false otherwise
    * @static
    * @method clear
    */
    clear: function (fn, speed) {
      var idx = indexOf(fn, speed),
          result = false,
          group;

      if (idx > -1) {
        group = timers[speed];
        group.fns.splice(idx, 1);

        if (!group.fns.length) {
          clear(speed);
          //console.profileEnd();
        }

        result = !result;
      }

      return result;
    },

    /**
     * Remove all functions from one or all groups. Useful for performing mass
     * cleanup.
     * @param {Number} speed Optional
     * @return {Void}
     * @static
     * @method clearAll
     */
    clearAll: function (speed) {
      if (isNaN(speed)) {
        var each;
        for (each in timers) {
          clear(each);
        }
      } else {
        clear(speed);
      }
    }
  };

})(this);
