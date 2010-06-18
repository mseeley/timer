Timer - unified timer loops
============================

JavaScript performance significantly degrades when multiple high-frequency timers (<= 200ms) are executing simultaneously. Timer uses a single interval or timeout to execute one or more functions. This approach is particularly useful when building animation utilities or in-page monitoring services.  Timer has no library dependencies, values a shallow callstack, and delivers a low file -- less than 500 bytes minified and gzipped.

Timer's performance can be tuned by flipping a private variable to use setTimeout instead of setInterval. Using setTimeout helps reduce interpreter congestion on pages with heavy runtime loads. Using setTimeout and setInterval simultaneously is unsupported.

Source: git://github.com/mseeley/Timer.git

[Unit tests](http://github.com/mseeley/Timer/blob/master/src-test/tests.js)

[BSD Licensed](http://github.com/mseeley/Timer/tree/master/LICENSE)

Named callbacks
---------------

The following example illustrates two timers running at an interval of 100 msec.
Only one setInterval timer is created by the browser.

    // monitorFontSize() is an example of a long running timer
    var originalFontSize = 11;
    function monitorFontSize () {
      var fontSize = parseInt(myEl.style.fontSize, 10);
      if (fontSize != originalFontSize) {
        originalFontSize = fontSize;
        // further code omitted
      }
    }
    timer.set(monitorFontSize, 100);

    // Sometime later another function needs to execute at the same interval
    var number = 0;
    function progressBar () {
      number += 2.5;
      if (number == 100) {
        // Clear using the original function reference and speed value
        timer.clear(progressBar, 100);
      }
    }
    timer.set(progressBar, 100);

Anonymous callbacks
-------------------

Functions are supplied two arguments; a reference to the executing function and
the interval the function is executing. These arguments make it possible for
an anonymous function to clear itself.

    var startTime = +new Date;
    timer.set(function (fn, interval) {
      if (+new Date - startTime > 4000) {
        timer.clear(fn, interval);
      }
    }, 100);

Cleaning up
-----------

Timers should be cleared whenever they are no longer necessary. All timers can
be cleared in a single function call; useful to tidy up before unloading the
page.

    window.addEventListener("unload", timer.clearAll);

---

[BSD Licensed](http://github.com/mseeley/Timer/tree/master/LICENSE)

&copy; Matthew Seeley 2010
