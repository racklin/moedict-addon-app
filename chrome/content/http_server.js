(function(){

    var initilized = false;
    var enable = false;
    var bindAddress = "127.0.0.1";
    var port = 54321;

    const GREUtils = XULApp.GREUtils;
    const NODE_STATIC_STARTUP_TIMEOUT = 3000;

    Components.utils.import("resource://gre/modules/Services.jsm");
    Components.utils.import("resource://gre/modules/Preferences.jsm");

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

    function mappingVoicesPath(server) {
        var mapped = {};

        // voices pack settings
        var moedictAppBranch = Services.prefs.getBranch('extensions.moedictApp.');

        moedictAppBranch.getChildList('voices').forEach(function(key) {
            var voice = key.split('.')[1];
            if (mapped[voice]) return;

            var pKey = 'extensions.moedictApp.voices.'+voice+'.index';
            var pKeyMapping = 'extensions.moedictApp.voices.'+voice+'.path';
            var voiceIndex = Preferences.get(pKey, null);
            var voicePath = Preferences.get(pKeyMapping, null);

            if (voiceIndex && voicePath) {
                dump(voiceIndex + ' to ' + voicePath + '\n');
                mapped[voice] = voicePath;

                var indexPath = GREUtils.File.chromeToPath(voiceIndex);

                // convert path string to nsFile
                var file = GREUtils.File.getFile(indexPath);
                var webappDir = file.parent;

                // serve webapp directory
                server.registerDirectory(voicePath, webappDir);
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
