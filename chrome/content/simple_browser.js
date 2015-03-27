(function(){

    // nsIWebProgressListener implementation to monitor activity in the browser.
    var browserProgressListener = {

      _requestsStarted: 0,
      _requestsFinished: 0,

      // We need to advertize that we support weak references.  This is done simply
      // by saying that we QI to nsISupportsWeakReference.  XPConnect will take
      // care of actually implementing that interface on our behalf.
      QueryInterface: function(iid) {
        if (iid.equals(Components.interfaces.nsIWebProgressListener) ||
            iid.equals(Components.interfaces.nsISupportsWeakReference) ||
            iid.equals(Components.interfaces.nsISupports))
          return this;

        throw Components.results.NS_ERROR_NO_INTERFACE;
      },

      // This method is called to indicate state changes.
      onStateChange: function(webProgress, request, stateFlags, status) {
        const WPL = Components.interfaces.nsIWebProgressListener;

        var progress = document.getElementById("progress");

        if (stateFlags & WPL.STATE_IS_REQUEST) {
          if (stateFlags & WPL.STATE_START) {
            this._requestsStarted++;
          }
          else if (stateFlags & WPL.STATE_STOP) {
            this._requestsFinished++;
          }

          if (this._requestsStarted > 1) {
            var value = (100 * this._requestsFinished) / this._requestsStarted;
            progress.setAttribute("mode", "determined");
            progress.setAttribute("value", value );
          }
        }

        if (stateFlags & WPL.STATE_IS_NETWORK) {
          if (stateFlags & WPL.STATE_START) {
            progress.setAttribute("style", "");
          }
          else if (stateFlags & WPL.STATE_STOP) {

            // wait for status change update
            // GeckoJS.BaseObject.sleep(100);

            progress.setAttribute("style", "display: none");
            this.onStatusChange(webProgress, request, 0, "Done");
            this._requestsStarted = this._requestsFinished = 0;
          }
        }
      },

      // This method is called to indicate progress changes for the currently
      // loading page.
      onProgressChange: function(webProgress, request, curSelf, maxSelf, curTotal, maxTotal) {
        if (this._requestsStarted == 1) {
          var progress = document.getElementById("progress");
          if (maxSelf == -1) {
            progress.setAttribute("mode", "undetermined");
          }
          else {
            progress.setAttribute("mode", "determined");
            progress.setAttribute("value", ((100 * curSelf) / maxSelf));
          }
        }
      },

      // This method is called to indicate a change to the current location.
      onLocationChange: function( webProgress, request, locationURI ) {
      },

      // This method is called to indicate a status changes for the currently
      // loading page.  The message is already formatted for display.
      onStatusChange: function(webProgress, request, status, message) {
        var statusbar = document.getElementById("status");
        statusbar.setAttribute("label", message);
      },

      // This method is called when the security state of the browser changes.
      onSecurityChange: function(webProgress, request, state) {
        const WPL = Components.interfaces.nsIWebProgressListener;

        var sec = document.getElementById("security");

        if (state & WPL.STATE_IS_INSECURE) {
          sec.setAttribute("style", "display: none");
        } else {
          var level = "unknown";
          if (state & WPL.STATE_IS_SECURE) {
            if (state & WPL.STATE_SECURE_HIGH)
              level = "high";
            else if (state & WPL.STATE_SECURE_MED)
              level = "medium";
            else if (state & WPL.STATE_SECURE_LOW)
              level = "low";
          } else if (state & WPL_STATE_IS_BROKEN) {
            level = "mixed";
          }
          sec.setAttribute("label", "Security: " + level);
          sec.setAttribute("style", "");
        }
      }
    };

    window.goBackBrowser = function() {
        var browser = document.getElementById("browser-content");
        if (browser) browser.goBack();
    };

    window.goForwardBrowser = function() {
        var browser = document.getElementById("browser-content");
        if (browser) browser.goForward();
    };

    window.reloadBrowser = function() {
        var browser = document.getElementById("browser-content");
        if (browser) browser.reload();
    };

    window.closeBrowser = function() {
        window.close();
    };


    window.addEventListener("load", function (){
        var browser = document.getElementById("browser-content");
        if (browser) browser.addProgressListener(browserProgressListener, Components.interfaces.nsIWebProgress.NOTIFY_ALL);
    }, false);

    window.addEventListener("unload", function (){
      var browser = document.getElementById("browser-content");
      if (browser) browser.removeProgressListener(browserProgressListener);
    }, false);

})();