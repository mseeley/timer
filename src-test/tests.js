(function () {

  var defs = {

    "registered function runs": function (del) {
      var delegate = del(function () {
        timer.clear(delegate, 30);
        return true;
      });

      timer.set(delegate, 30);
    },

    "multiple registered functions run with same speed": function (del) {
      var count = 0,
          id = setTimeout(del(function () {
            return count == 2;
          }), 250),
          fnA = function () {
            count++;
            timer.clear(fnA, 30);
          },
          fnB = function () {
            count++;
            timer.clear(fnB, 30);
          };

      timer.set(fnA, 30);
      timer.set(fnB, 30);
    },

    "multiple registered functions run with different speeds": function (del) {
      var count = 0,
          fnA = function () {
            count++;
            timer.clear(fnA, 30);
          },
          fnB = function () {
            count++;
            timer.clear(fnB, 100);
          };

      timer.set(fnA, 30);
      timer.set(fnB, 100);

      setTimeout(del(function () {
        return count == 2;
      }), 250);
    },

    "unregistered function does not run": function (del) {
      var ran = false,
          fnA = function () {
            ran = true;
          };

      timer.set(fnA, 30);
      timer.clear(fnA, 30);

      setTimeout(del(function () {
        return !ran;
      }), 100);
    },

    "function registered only once": function (del) {
      var fn = function () {},
          result;

      timer.set(fn, 30);
      result = timer.set(fn, 30);
      timer.clear(fn, 30);

      return !result;
    },

    "speed must be >= 0": function (del) {
      return !(timer.set(function(){}, -1));
    },

    "clear all timers": function (del) {
      var count = 0,
          fn = function () {
            count++;
          },
          delegate = del(function () {
            return count === 0;
          });

      timer.set(fn, 50);
      timer.set(fn, 150);
      timer.set(fn, 200);
      timer.clearAll();

      setTimeout(delegate, 300);
    },

    "anonymous timer clears itself": function (del) {
      var startTime = +new Date,
          result = false,
          delegate = del(function () {
            return result;
          });

      timer.set(function (fn, interval) {
        if (+new Date - startTime > 250) {
          result = timer.clear(fn, interval);
          delegate();
        }
      }, 50);
    },
    "set callback with scope": function (del) {
      var obj = {
            id: "foo",
            fn: function (fn, interval, scope) {
              timer.clear(fn, interval, scope)
              // Cannot pass arguments to delegate functions :(
              id = this.id;
              delegate();
            }
          },
          delegate = del(function () {
            return id == obj.id;
          }),
          id;

      timer.set(obj.fn, 50, obj);
    },
    "clear callback with scope": function () {
      var obj = {
            fn: function () {}
          };

      timer.set(obj.fn, 100, obj);
      return timer.clear(obj.fn, 100, obj);
    }
  };

  kaze.tests(defs);

})();
