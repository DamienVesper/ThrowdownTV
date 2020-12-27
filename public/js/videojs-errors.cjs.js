/*! @name videojs-errors @version 4.3.2 @license Apache-2.0 */
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var videojs = _interopDefault(require('video.js'));
var document = _interopDefault(require('global/document'));

var version = "4.3.2";

var FlashObj = videojs.getComponent('Flash');
var defaultDismiss = !videojs.browser.IS_IPHONE; // Video.js 5/6 cross-compatibility.

var registerPlugin = videojs.registerPlugin || videojs.plugin; // Default options for the plugin.

var defaults = {
  header: '',
  code: '',
  message: '',
  timeout: 45 * 1000,
  dismiss: defaultDismiss,
  errors: {
    '1': {
      type: 'MEDIA_ERR_ABORTED',
      headline: 'The video download was cancelled'
    },
    '2': {
      type: 'MEDIA_ERR_NETWORK',
      headline: 'The video connection was lost, please confirm you are ' + 'connected to the internet'
    },
    '3': {
      type: 'MEDIA_ERR_DECODE',
      headline: 'The video is bad or in a format that cannot be played on your browser'
    },
    '4': {
      type: 'MEDIA_ERR_SRC_NOT_SUPPORTED',
      headline: 'This video is either unavailable or not supported in this browser'
    },
    '5': {
      type: 'MEDIA_ERR_ENCRYPTED',
      headline: 'The video you are trying to watch is encrypted and we do not know how ' + 'to decrypt it'
    },
    'unknown': {
      type: 'MEDIA_ERR_UNKNOWN',
      headline: 'An unanticipated problem was encountered, check back soon and try again'
    },
    '-1': {
      type: 'PLAYER_ERR_NO_SRC',
      headline: 'No video has been loaded'
    },
    '-2': {
      type: 'PLAYER_ERR_TIMEOUT',
      headline: 'Could not download the video'
    },
    'PLAYER_ERR_DOMAIN_RESTRICTED': {
      headline: 'This video is restricted from playing on your current domain'
    },
    'PLAYER_ERR_IP_RESTRICTED': {
      headline: 'This video is restricted at your current IP address'
    },
    'PLAYER_ERR_GEO_RESTRICTED': {
      headline: 'This video is restricted from playing in your current geographic region'
    },
    'FLASHLS_ERR_CROSS_DOMAIN': {
      headline: 'The video could not be loaded: crossdomain access denied.'
    }
  }
};

var initPlugin = function initPlugin(player, options) {
  var monitor;
  var waiting;
  var isStalling;
  var listeners = [];

  var updateErrors = function updateErrors(updates) {
    options.errors = videojs.mergeOptions(options.errors, updates); // Create `code`s from errors which don't have them (based on their keys).

    Object.keys(options.errors).forEach(function (k) {
      var err = options.errors[k];

      if (!err.type) {
        err.type = k;
      }
    });
  }; // Make sure we flesh out initially-provided errors.


  updateErrors(); // clears the previous monitor timeout and sets up a new one

  var resetMonitor = function resetMonitor() {
    // at this point the player has recovered
    player.clearTimeout(waiting);

    if (isStalling) {
      isStalling = false;
      player.removeClass('vjs-waiting');
    } // start the loading spinner if player has stalled


    waiting = player.setTimeout(function () {
      // player already has an error
      // or is not playing under normal conditions
      if (player.error() || player.paused() || player.ended()) {
        return;
      }

      isStalling = true;
      player.addClass('vjs-waiting');
    }, 1000);
    player.clearTimeout(monitor);
    monitor = player.setTimeout(function () {
      // player already has an error
      // or is not playing under normal conditions
      if (player.error() || player.paused() || player.ended()) {
        return;
      }

      player.error({
        code: -2,
        type: 'PLAYER_ERR_TIMEOUT'
      });
    }, options.timeout); // clear out any existing player timeout
    // playback has recovered

    if (player.error() && player.error().code === -2) {
      player.error(null);
    }
  }; // clear any previously registered listeners


  var cleanup = function cleanup() {
    var listener;

    while (listeners.length) {
      listener = listeners.shift();
      player.off(listener[0], listener[1]);
    }

    player.clearTimeout(monitor);
    player.clearTimeout(waiting);
  }; // creates and tracks a player listener if the player looks alive


  var healthcheck = function healthcheck(type, fn) {
    var check = function check() {
      // if there's an error do not reset the monitor and
      // clear the error unless time is progressing
      if (!player.error()) {
        // error if using Flash and its API is unavailable
        var tech = player.$('.vjs-tech');

        if (tech && tech.type === 'application/x-shockwave-flash' && !tech.vjs_getProperty) {
          player.error({
            code: -2,
            type: 'PLAYER_ERR_TIMEOUT'
          });
          return;
        } // playback isn't expected if the player is paused


        if (player.paused()) {
          return resetMonitor();
        } // playback isn't expected once the video has ended


        if (player.ended()) {
          return resetMonitor();
        }
      }

      fn.call(this);
    };

    player.on(type, check);
    listeners.push([type, check]);
  };

  var onPlayStartMonitor = function onPlayStartMonitor() {
    var lastTime = 0;
    cleanup(); // if no playback is detected for long enough, trigger a timeout error

    resetMonitor();
    healthcheck(['timeupdate', 'adtimeupdate'], function () {
      var currentTime = player.currentTime(); // playback is operating normally or has recovered

      if (currentTime !== lastTime) {
        lastTime = currentTime;
        resetMonitor();
      }
    });
  };

  var onPlayNoSource = function onPlayNoSource() {
    if (!player.currentSrc()) {
      player.error({
        code: -1,
        type: 'PLAYER_ERR_NO_SRC'
      });
    }
  };

  var onErrorHandler = function onErrorHandler() {
    var details = '';
    var error = player.error();
    var content = document.createElement('div');
    var dialogContent = ''; // In the rare case when `error()` does not return an error object,
    // defensively escape the handler function.

    if (!error) {
      return;
    }

    error = videojs.mergeOptions(error, options.errors[error.code || error.type || 0]);

    if (error.message) {
      details = "<div class=\"vjs-errors-details\">" + player.localize('Technical details') + "\n        : <div class=\"vjs-errors-message\">" + player.localize(error.message) + "</div>\n        </div>";
    }

    if (error.code === 4 && FlashObj && !FlashObj.isSupported()) {
      var flashMessage = player.localize('If you are using an older browser please try upgrading or installing Flash.');
      details += "<span class=\"vjs-errors-flashmessage\">" + flashMessage + "</span>";
    }

    var display = player.getChild('errorDisplay');
    content.className = 'vjs-errors-dialog';
    content.id = 'vjs-errors-dialog';
    dialogContent = "<div class=\"vjs-errors-content-container\">\n      <h2 class=\"vjs-errors-headline\">" + this.localize(error.headline) + "</h2>\n        <div class=\"vjs-errors-code\"><b>" + this.localize('Error Code') + ":</b> " + (error.type || error.code) + "</div>\n        " + details + "\n      </div>";
    var closeable = display.closeable(!('dismiss' in error) || error.dismiss); // We should get a close button

    if (closeable) {
      dialogContent += "<div class=\"vjs-errors-ok-button-container\">\n          <button class=\"vjs-errors-ok-button\">" + this.localize('OK') + "</button>\n        </div>";
      content.innerHTML = dialogContent;
      display.fillWith(content); // Get the close button inside the error display

      display.contentEl().firstChild.appendChild(display.getChild('closeButton').el());
      var okButton = display.el().querySelector('.vjs-errors-ok-button');
      player.on(okButton, 'click', function () {
        display.close();
      });
    } else {
      content.innerHTML = dialogContent;
      display.fillWith(content);
    }

    if (player.currentWidth() <= 600 || player.currentHeight() <= 250) {
      display.addClass('vjs-xs');
    }

    display.one('modalclose', function () {
      return player.error(null);
    });
  };

  var onDisposeHandler = function onDisposeHandler() {
    cleanup();
    player.removeClass('vjs-errors');
    player.off('play', onPlayStartMonitor);
    player.off('play', onPlayNoSource);
    player.off('dispose', onDisposeHandler);
    player.off(['aderror', 'error'], onErrorHandler);
  };

  var reInitPlugin = function reInitPlugin(newOptions) {
    onDisposeHandler();
    initPlugin(player, videojs.mergeOptions(defaults, newOptions));
  };

  reInitPlugin.extend = function (errors) {
    return updateErrors(errors);
  };

  reInitPlugin.getAll = function () {
    return videojs.mergeOptions(options.errors);
  }; // Get / set timeout value. Restart monitor if changed.


  reInitPlugin.timeout = function (timeout) {
    if (typeof timeout === 'undefined') {
      return options.timeout;
    }

    if (timeout !== options.timeout) {
      options.timeout = timeout;

      if (!player.paused()) {
        onPlayStartMonitor();
      }
    }
  }; // no-op API
  // TODO: remove in a major version


  reInitPlugin.disableProgress = function () {};

  player.on('play', onPlayStartMonitor);
  player.on('play', onPlayNoSource);
  player.on('dispose', onDisposeHandler);
  player.on(['aderror', 'contenterror', 'error'], onErrorHandler);
  player.ready(function () {
    player.addClass('vjs-errors');
  }); // if the plugin is re-initialised during playback, start the timeout handler.

  if (!player.paused()) {
    onPlayStartMonitor();
  } // Include the version number.


  reInitPlugin.VERSION = version;
  player.errors = reInitPlugin;
};

var errors = function errors(options) {
  initPlugin(this, videojs.mergeOptions(defaults, options));
};

['extend', 'getAll'].forEach(function (k) {
  errors[k] = function () {
    videojs.log.warn("The errors." + k + "() method is not available until the plugin has been initialized!");
  };
}); // Include the version number.

errors.VERSION = version; // Register the plugin with video.js.

registerPlugin('errors', errors);

module.exports = errors;
