(function (root, factory) {
    if (typeof define === `function` && define.amd) {
        define([], factory.bind(this, root, root.videojs));
    } else if (typeof module !== `undefined` && module.exports) {
        module.exports = factory(root, root.videojs);
    } else {
        factory(root, root.videojs);
    }
})(window, (window, videojs) => {
    "use strict";
    window.videojs_hotkeys = { version: `0.2.16` };

    const hotkeys = function (options) {
        const player = this;
        const pEl = player.el();
        const doc = document;
        const def_options = {
            volumeStep: 0.1,
            seekStep: 5,
            enableMute: true,
            enableVolumeScroll: true,
            enableFullscreen: true,
            enableNumbers: true,
            enableJogStyle: false,
            alwaysCaptureHotkeys: true,
            enableModifiersForNumbers: true,
            playPauseKey: playPauseKey,
            rewindKey: rewindKey,
            forwardKey: forwardKey,
            volumeUpKey: volumeUpKey,
            volumeDownKey: volumeDownKey,
            muteKey: muteKey,
            fullscreenKey: fullscreenKey,
            customKeys: {}
        };
        videojs.options.blockKeys = false;
        const cPlay = 1;
        const cRewind = 2;
        const cForward = 3;
        const cVolumeUp = 4;
        const cVolumeDown = 5;
        const cMute = 6;
        const cFullscreen = 7;

        // Use built-in merge function from Video.js v5.0+ or v4.4.0+
        const mergeOptions = videojs.mergeOptions || videojs.util.mergeOptions;
        options = mergeOptions(def_options, options || {});

        const volumeStep = options.volumeStep;
        const seekStep = options.seekStep;
        const enableMute = options.enableMute;
        const enableVolumeScroll = options.enableVolumeScroll;
        const enableFull = options.enableFullscreen;
        const enableNumbers = options.enableNumbers;
        const enableJogStyle = options.enableJogStyle;
        const alwaysCaptureHotkeys = options.alwaysCaptureHotkeys;
        const enableModifiersForNumbers = options.enableModifiersForNumbers;

        // Set default player tabindex to handle keydown and doubleclick events
        if (!pEl.hasAttribute(`tabIndex`)) {
            pEl.setAttribute(`tabIndex`, `-1`);
        }

        // Remove player outline to fix video performance issue
        pEl.style.outline = `none`;

        if (alwaysCaptureHotkeys || !player.autoplay()) {
            player.one(`play`, () => {
                pEl.focus(); // Fixes the .vjs-big-play-button handing focus back to body instead of the player
            });
        }

        player.on(`userinactive`, () => {
            // When the control bar fades, re-apply focus to the player if last focus was a control button
            const cancelFocusingPlayer = function () {
                clearTimeout(focusingPlayerTimeout);
            };
            var focusingPlayerTimeout = setTimeout(() => {
                player.off(`useractive`, cancelFocusingPlayer);
                if (doc.activeElement.parentElement == pEl.querySelector(`.vjs-control-bar`)) {
                    pEl.focus();
                }
            }, 10);

            player.one(`useractive`, cancelFocusingPlayer);
        });

        player.on(`play`, () => {
            // Fix allowing the YouTube plugin to have hotkey support.
            const ifblocker = pEl.querySelector(`.iframeblocker`);
            if (ifblocker && ifblocker.style.display === ``) {
                ifblocker.style.display = `block`;
                ifblocker.style.bottom = `39px`;
            }
        });

        const keyDown = function keyDown (event) {
            const ewhich = event.which; let curTime;
            const ePreventDefault = event.preventDefault;
            // When controls are disabled, hotkeys will be disabled as well
            if (player.controls()) {
                // Don't catch keys if any control buttons are focused, unless alwaysCaptureHotkeys is true
                const activeEl = doc.activeElement;
                if (alwaysCaptureHotkeys ||
            activeEl == pEl ||
            activeEl == pEl.querySelector(`.vjs-tech`) ||
            activeEl == pEl.querySelector(`.vjs-control-bar`) ||
            activeEl == pEl.querySelector(`.iframeblocker`)) {
                    const dkey = checkKeys(event, player);

                    switch (checkKeys(event, player)) {
                        // Spacebar toggles play/pause
                        case cPlay:
                            event.preventDefault();
                            // if (alwaysCaptureHotkeys) {
                            // Prevent control activation with space
                            if (event.stopPropagation) {
				  event.stopPropagation();
                            } else if (window.event) {
				  window.event.cancelBubble = true;
                            }
                            // }

                            if (player.paused()) {
                                player.play();
                            } else {
                                player.pause();
                            }
                            break;

                            // Seeking with the left/right arrow keys
                        case cRewind: // Seek Backward
                            event.preventDefault();
			  if (videojs.options.blockKeys) break;
                            curTime = player.currentTime() - seekStep;
                            // The flash player tech will allow you to seek into negative
                            // numbers and break the seekbar, so try to prevent that.
                            if (player.currentTime() <= seekStep) {
                                curTime = 0;
                            }
                            player.currentTime(curTime);
                            break;
                        case cForward: // Seek Forward
                            event.preventDefault();
			  if (videojs.options.blockKeys) break;
                            player.currentTime(player.currentTime() + seekStep);
                            break;

                            // Volume control with the up/down arrow keys
                        case cVolumeDown:
                            event.preventDefault();
                            if (videojs.options.blockKeys) break;
                            if (!enableJogStyle) {
                                player.volume(player.volume() - volumeStep);
                            } else {
                                curTime = player.currentTime() - 1;
                                if (player.currentTime() <= 1) {
                                    curTime = 0;
                                }
                                player.currentTime(curTime);
                            }
                            break;
                        case cVolumeUp:

                            event.preventDefault();
			  if (videojs.options.blockKeys) break;
                            if (!enableJogStyle) {
                                player.volume(player.volume() + volumeStep);
                            } else {
                                player.currentTime(player.currentTime() + 1);
                            }
                            break;

                            // Toggle Mute with the M key
                        case cMute:
                            event.preventDefault();
                            if (event.stopPropagation) {
				  event.stopPropagation();
                            } else if (window.event) {
				  window.event.cancelBubble = true;
                            }
                            // if (enableMute) {

                            player.muted(!player.muted());
                            // }
                            break;

                            // Toggle Fullscreen with the F key
                        case cFullscreen:
                            if (enableFull) {
                                if (player.isFullscreen()) {
                                    player.exitFullscreen();
                                } else {
                                    player.requestFullscreen();
                                }
                            }
                            break;

                        default:
                            // Number keys from 0-9 skip to a percentage of the video. 0 is 0% and 9 is 90%
                            if ((ewhich > 47 && ewhich < 59) || (ewhich > 95 && ewhich < 106)) {
                                // Do not handle if enableModifiersForNumbers set to false and keys are Ctrl, Cmd or Alt
                                if (enableModifiersForNumbers || !(event.metaKey || event.ctrlKey || event.altKey)) {
                                    if (enableNumbers) {
                                        let sub = 48;
                                        if (ewhich > 95) {
                                            sub = 96;
                                        }
                                        const number = ewhich - sub;
                                        event.preventDefault();
                                        player.currentTime(player.duration() * number * 0.1);
                                    }
                                }
                            }

                            // Handle any custom hotkeys
                            for (const customKey in options.customKeys) {
                                const customHotkey = options.customKeys[customKey];
                                // Check for well formed custom keys
                                if (customHotkey && customHotkey.key && customHotkey.handler) {
                                    // Check if the custom key's condition matches
                                    if (customHotkey.key(event)) {
                                        event.preventDefault();
                                        customHotkey.handler(player, options);
                                    }
                                }
                            }
                    }
                }
            }
        };

        const doubleClick = function doubleClick (event) {
            // When controls are disabled, hotkeys will be disabled as well
            if (player.controls()) {
                // Don't catch clicks if any control buttons are focused
                const activeEl = event.relatedTarget || event.toElement || doc.activeElement;
                if (activeEl == pEl ||
            activeEl == pEl.querySelector(`.vjs-tech`) ||
            activeEl == pEl.querySelector(`.iframeblocker`)) {
                    if (enableFull) {
                        if (player.isFullscreen()) {
                            player.exitFullscreen();
                        } else {
                            player.requestFullscreen();
                        }
                    }
                }
            }
        };

        const mouseScroll = function mouseScroll (event) {
            // When controls are disabled, hotkeys will be disabled as well
            if (player.controls()) {
                const activeEl = event.relatedTarget || event.toElement || doc.activeElement;
                if (alwaysCaptureHotkeys ||
            activeEl == pEl ||
            activeEl == pEl.querySelector(`.vjs-tech`) ||
            activeEl == pEl.querySelector(`.iframeblocker`) ||
            activeEl == pEl.querySelector(`.vjs-control-bar`)) {
                    if (enableVolumeScroll) {
                        event = window.event || event;
                        const delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));
                        event.preventDefault();

                        if (delta == 1) {
                            player.volume(player.volume() + volumeStep);
                        } else if (delta == -1) {
                            player.volume(player.volume() - volumeStep);
                        }
                    }
                }
            }
        };

        var checkKeys = function checkKeys (e, player) {
            // Allow some modularity in defining custom hotkeys

            // Play/Pause check
            if (options.playPauseKey(e, player)) {
                return cPlay;
            }

            // Seek Backward check
            if (options.rewindKey(e, player)) {
                return cRewind;
            }

            // Seek Forward check
            if (options.forwardKey(e, player)) {
                return cForward;
            }

            // Volume Up check
            if (options.volumeUpKey(e, player)) {
                return cVolumeUp;
            }

            // Volume Down check
            if (options.volumeDownKey(e, player)) {
                return cVolumeDown;
            }

            // Mute check
            if (options.muteKey(e, player)) {
                return cMute;
            }

            // Fullscreen check
            if (options.fullscreenKey(e, player)) {
                return cFullscreen;
            }
        };

        function playPauseKey (e) {
            // Space bar or MediaPlayPause
            return (e.which === 32 || e.which === 179);
        }

        function rewindKey (e) {
            // Left Arrow or MediaRewind
            return (e.which === 37 || e.which === 177);
        }

        function forwardKey (e) {
            // Right Arrow or MediaForward
            return (e.which === 39 || e.which === 176);
        }

        function volumeUpKey (e) {
            // Up Arrow
            return (e.which === 38);
        }

        function volumeDownKey (e) {
            // Down Arrow
            return (e.which === 40);
        }

        function muteKey (e) {
            // M key
            return (e.which === 77);
        }

        function fullscreenKey (e) {
            // F key
            return (e.which === 70);
        }
        function disableEventPropagation (e) {
	  if (e) {
                if (e.stopPropagation) {
		  e.stopPropagation();
                } else if (window.event) {
		  window.event.cancelBubble = true;
                }
                e.preventDefault();
	  }
        }

        document.onkeydown = keyDown;

        player.on(`keydown`, keyDown);
        player.on(`dblclick`, doubleClick);
        player.on(`mousewheel`, mouseScroll);
        player.on(`DOMMouseScroll`, mouseScroll);

        return this;
    };

    videojs.registerPlugin(`hotkeys`, hotkeys);
});
