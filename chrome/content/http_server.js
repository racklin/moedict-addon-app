(function(){

    var initilized = false;
    var enable = false;
    var bindAddress = "127.0.0.1";
    var port = 54321;

    const GREUtils = XULApp.GREUtils;
    const NODE_STATIC_STARTUP_TIMEOUT = 3000;

    Components.utils.import("resource://gre/modules/Services.jsm");
    Components.utils.import("resource://gre/modules/Preferences.jsm");
    Components.utils.import("resource://gre/modules/NetUtil.jsm");

    function initHttpServer() {

        var server = new XULApp.HttpServer();

        var indexPath = GREUtils.File.chromeToPath('chrome://moedict-app-webkit/content/index.html');

        // convert path string to nsFile
        var file = GREUtils.File.getFile(indexPath);
        var webappDir = file.parent;

        // serve webapp directory
        server.registerDirectory("/", webappDir);

        // proces voices mapping
        mappingVoicesPath(server);

        // httpd.js gets worried when there is no stop callback
        server._stopCallback = function() {
            dump("HTTP server stopped\n");
        }

        enable = GREUtils.Pref.getPref('extensions.moedictApp.httpServer.enabled') || false;
        bindAddress = GREUtils.Pref.getPref('extensions.moedictApp.httpServer.bindAddress') || "127.0.0.1";
        port = GREUtils.Pref.getPref('extensions.moedictApp.httpServer.port') || 54321;

        // exposed getHttpServer to xul window object
        window.getHttpServer = function() {
            return server;
        };

        try {
            if (enable) {
                server.start(port, bindAddress);
                port = server.identity.primaryPort;
                // setting server to global scope
                dump("HTTP server listening on ("+ bindAddress +"):"+server._port);
            }
        } catch(e) {
            dump("Not initializing HTTP server" + e);
        }

    }

    function getVoicesPathHandler(regex, remoteUrl) {

      var preCompiledRegex = regex.map(function(obj) {
          var rObj = {};
          rObj.regex = new RegExp(obj.regex);
          rObj.baseurl = obj.baseurl;
          return rObj;
      });

      var handler = function(metadata, response) {

          var arPath = metadata.path.split("/")||[metadata.path];
          var requestFile = arPath[arPath.length-1];

          var voiceUrl = remoteUrl + requestFile; // default remoteurl
          dump("requestFile = " + requestFile + '\n');
          preCompiledRegex.forEach(function(mapping) {
              if (requestFile.match(mapping.regex)) {
                voiceUrl = mapping.baseurl + requestFile;
              }
          });
          dump("voiceUrl = " + voiceUrl + '\n');

          response.processAsync();
          NetUtil.asyncFetch(voiceUrl, function(aInputStream, aResult) {
              if (Components.isSuccessCode(aResult)) {
                  response.setStatusLine(metadata.httpVersion, 200, "OK");
                  response.setHeader("Content-Type", 'audio/ogg', false);
                  response.setHeader("Content-Length", ''+aInputStream.available(), false);
                  response.setHeader("Last-Modified", 'Wed, 22 May 2013 05:13:02 GMT', false);
                  NetUtil.asyncCopy(aInputStream, response.bodyOutputStream, function(aResult) {
                      response.finish();
                  });
              } else {
                  // error 404
                  response.setStatusLine(metadata.httpVersion, 404, "File Not Found.");
                  response.finish();
              }
          });
      };

      return handler;
    }

    function mappingVoicesPath(server) {
        var mapped = {};

        // voices pack settings
        var moedictAppBranch = Services.prefs.getBranch('extensions.moedictApp.');

        moedictAppBranch.getChildList('voices').forEach(function(key) {
            var voice = key.split('.')[1];
            if (mapped[voice]) return;

            var pKeyMapping = 'extensions.moedictApp.voices.'+voice+'.path';
            var pRemoteUrl = 'extensions.moedictApp.voices.'+voice+'.remote';
            var voicePath = Preferences.get(pKeyMapping, null);
            var remoteUrl = Preferences.get(pRemoteUrl, '');

            if (voicePath) {
                mapped[voice] = voicePath;

                var voiceMapping = [];
                var voiceBranch = Services.prefs.getBranch('extensions.moedictApp.voices.'+voice+'.');
                voiceBranch.getChildList('mapping').forEach(function(key2) {
                    var mvk = 'extensions.moedictApp.voices.'+voice+'.'+key2;
                    var mappingRule = Preferences.get('extensions.moedictApp.voices.'+voice+'.'+key2, false);
                    if (mappingRule) voiceMapping.push(JSON.parse(mappingRule));
                });

                // serve webapp directory
                server.registerPrefixHandler(voicePath, getVoicesPathHandler(voiceMapping, remoteUrl));
            }

        });

    }

    initHttpServer();

    window.addEventListener('DOMContentLoaded', function(e) {
        if (!initilized) {
            var homePage = 'http://'+bindAddress+':'+port+'/';
            var webappBrowser = document.getElementById('browser-moedict-app-webkit');
            if (webappBrowser) {
                webappBrowser.homePage = homePage;

                setTimeout(function() {
                    webappBrowser.loadURI(homePage);
                    initilized = true;
                }, NODE_STATIC_STARTUP_TIMEOUT);

            }
        }

    });



})();
