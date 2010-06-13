/*
Copyright (c) 2010, Matthew Seeley
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of the Matthew Seeley nor the names of its contributors
      may be used to endorse or promote products derived from this software
      without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
(function (global) {

  var running = false,
      waiting = false,
      paused = false,
      uid = 0,
      lastDefer = 0,

      // All available tests
      all = [],
      // Pending run() tasks
      tasks = [],
      // Active run task: {loops:Number, onresult:Function, tests:Array}
      task,
      // Active test: {name:String, fn:Function, pass:Boolean,
      // loopId:Number, loop:Number, start:Number, elapsed:Number}
      test;

  /**
   * Simple mechanism for deferring execution of a function. Return object
   * contains a method for clearing pending function execution.
   */
  function later (fn, msec) {
    var id = global.setTimeout(fn, msec || 0);
    return {
      clear: function () { global.clearTimeout(id); }
    };
  }

  /**
   * Shorthand for new Date().getTime();
   */
  function now () {
    return +new Date();
  }

  /**
   * Called by test assertion methods, this method pauses processing of the
   * pending test queue.  Executing this method forfiets the test's original
   * return value in favor of the delegated return value from the function arg.
   */
  function delegate (fn, msec) {
    var id = test.loopId,
        timeout = wait(msec);

    // The delegated function is itself executed after a timeout. This ensures
    // that the function cannot execute until after the assertion has completed.
    // This sadly adds unavoidable overhead within current implementation.

    return function () {
      later(function () {
        timeout.clear();
        if (test && test.loopId == id) {
          resume(fn());
        }
      });
    };
  }

  /**
   * Delays processing of the pending test queue while waiting for an assertion
   * delegate to return.
   */
  function wait (msec) {
    waiting = true;
    return later(resume, msec || 5000);
  }

  /**
   * Re-commences processing of the pending test queue.
   */
  function resume (result) {
    waiting = false;
    record(result);
    // Reset lastDefer after an async delegate to avoid an immediate defer on next exec
    defer(now());
    resolve();
  }

  /**
   * Updates the time of the last deferral and optionally schedules a
   * function to invoke later.
   */
  function defer (time, fn) {
    var update = time - lastDefer > 50;
    if (update) {
      lastDefer = time;
      if (fn) {
        later(fn);
      }
    }
    return update;
  }

  /**
   * Executes an assertion one or more times.
   */
  function exec () {
    var result,
        msec;

    while (test.loop++ < task.loops) {
      msec = now();
      test.start = msec;
      // Each loop has a unique ID binding each delegated assert to a single loop.
      test.loopId = ++uid;
      result = test.fn(delegate);

      if (!waiting) {
        record(result);
        if (defer(msec, exec)) {
          return;
        }
      } else {
        return;
      }
    }

    resolve();
  }

  /**
   * A result once set to false will never be re-set to true.
   */
  function record (result) {
    test.elapsed += now() - test.start;
    if (test.pass !== false) {
      test.pass = !!result;
    }
  }

  /**
   * Executes remaining assertion loops, continues to next test, or stops.
   */
  function resolve () {
    if (test.loop < task.loops) {
      exec();
    } else {
      task.onresult(test.name, test.pass, test.elapsed, task.loops, task.tests.length);
      nextTest();
    }
  }

  /**
   * Traverse the stack of tests.
   */
  function nextTest () {
    if (paused) { return; }

    if ((test = task.tests.shift())) {
      test.elapsed =
        test.start =
        test.loop = 0;

      test.pass =
        test.loopId = null;

      exec();
    } else {
      // Existing task's tests have been depleted, shift and continue
      nextTask();
    }
  }

  /**
   * Traverse the stack of tasks.
   */
  function nextTask () {
    if ((task = tasks.shift())) {
      running = true;
      nextTest();
    } else {
      running = false;
    }
  }

  /**
   * Creates the queue of pending jobs by filtering the queue of available tests
   * by name using a regular expression.
   */
  function filter (re) {
    re = re || /./;

    var len = all.length,
        result = [],
        item,
        i = 0;

    for (i; i < len; i++) {
      item = all[i];
      if (re.test(item.name)) {
        result.push({name:item.name, fn:item.fn});
      }
    }

    return result;
  }

  /**
   * Inserts a test descriptor into the stack.
   */
  function add (name, fn) {
    if (name && fn) {
      all.push({name:name, fn:fn});
    }
  }

  /**
   *
   */
  function start () {
    // start() always behaves async
    defer(now(), nextTask);
  }

  // Public methods ------------------------------------------------------------

  global.kaze = {
    test: add,
    /**
     * Empties the queue of available test and tasks. Does not halt execution of
     * current task.
     */
    clear: function () {
      all = [];
      tasks = [];
    },
    /**
     * Creates a queue of pending jobs then executes each.  All tests, or only
     * those with names that match the rex argument are executed.  A test will
     * execute at least once, or more depending on the final argument value.
     */
    run: function (fn, rx, i) {
      tasks.push({
        onresult: fn || function(){},
        loops: i || 1,
        tests: filter(rx)
      });

      // Ensure lastDefer is set and run() always behaves asynchronously
      if (!running && !paused) {
        start();
      }
    },
    /**
     * Traverses and object and attempts to add each member as a test.
     */
    tests: function (/* args... */) {
      var args = arguments,
          len = args.length,
          i = 0,
          each,
          defs;

      for (i; i < len; i++) {
        defs = args[i];
        for (each in defs) {
          if (defs.hasOwnProperty(each)) {
            add(each, defs[each]);
          }
        }
      }
    },
    /**
     * Enables pausing before tests begin running.  After tests are running,
     * calling pause() will stop execution after a test has finished
     * processing.
     */
    pause: function () {
      if (!paused) {
        paused = true;
      }
    },
    /**
     *
     */
    resume: function () {
      if (paused) {
        paused = false;
        if (running) {
          // resume() is always async, same as run()
          later(nextTest);
        } else {
          start();
        }
      }
    }
  };

})(this);
