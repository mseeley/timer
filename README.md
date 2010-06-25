Timer - unified interval based callback execution
=================================================

    timer
        void    set(Function fn, Number interval[, Object scope, Mixed arg1, ..., Mixed argN])
        void    clear(Function fn, Number interval[, Object scope])
        void    clearAll([Number interval])

JavaScript performance significantly degrades when multiple high-frequency timers (<= 200ms) are executing simultaneously. Timer uses a single interval or timeout to execute one or more functions. This approach is particularly useful when building animation utilities or in-page monitoring services.  Timer has no library dependencies, values a shallow callstack, and delivers a low file -- less than 500 bytes minified and gzipped.

Performance can be tuned by flipping a private variable to use setTimeout instead of setInterval. Using setTimeout helps reduce interpreter congestion. Mixing setTimeout and setInterval usage, or switching at runtime, is unsupported.

Git: git://github.com/mseeley/Timer.git

[Unit tests](http://github.com/mseeley/Timer/blob/master/src-test/tests.js)

[BSD Licensed](http://github.com/mseeley/Timer/tree/master/LICENSE)

Usage
-----

The following example illustrates two callbacks running at an interval of 100 msec. Behind the scenes only one call to setInterval or setTimeout is made.

    var originalFontSize = parseInt(myEl.style.fontSize, 10);

    function monitorFontSize () {
      var fontSize = parseInt(myEl.style.fontSize, 10);
      if (fontSize != originalFontSize) {
        originalFontSize = fontSize;
        // further code omitted
      }
    }

    // Execute the callback at 100 msec intervals, minimum required arguments
    timer.set(monitorFontSize, 100);

    var progressBar = {
      value: 0,
      update: function (toValue) {
        if (this.value++ === toValue) {
          // Clear using the values provided to set(); optional arguments may
          // be omitted.
          timer.clear(this.progressBar, 100, this);
        }
      }
    };

    // Execute scoped callback function, pass optional argument
    timer.set(progressBar.update, 100, progressBar, 100);

    // All timers can be cleared in a single function call
    window.addEventListener("unload", timer.clearAll, false);

---

[BSD Licensed](http://github.com/mseeley/Timer/tree/master/LICENSE)

&copy; Matthew Seeley 2010
