(function() {
  var defaults = {
      width:160, height:90, basePath : ""
    },
    extend = function() {
      var args, target, i, object, property;
      args = Array.prototype.slice.call(arguments);
      target = args.shift() || {};
      for (i in args) {
        object = args[i];
        for (property in object) {
          if (object.hasOwnProperty(property)) {
            if (typeof object[property] === 'object') {
              target[property] = extend(target[property], object[property]);
            } else {
              target[property] = object[property];
            }
          }
        }
      }
      return target;
    },
    
    parseImageLink = function(imglocation) {
      var lsrc, clip, hashindex, hashstring;
      hashindex = imglocation.indexOf('#');
      if (hashindex === -1) {
        return {src:imglocation,w:0,h:0,x:0,y:0};
      } 
      lsrc = imglocation.substring(0,hashindex);
      hashstring = imglocation.substring(hashindex+1);
      if (hashstring.substring(0,5) !== 'xywh=') {
        return {src:defaults.basePath + lsrc,w:0,h:0,x:0,y:0};
      } 
      var data = hashstring.substring(5).split(',');
      return {src:defaults.basePath + lsrc,w:parseInt(data[2]),h:parseInt(data[3]),x:parseInt(data[0]),y:parseInt(data[1])};
    };

  /**
   * register the thubmnails plugin
   */
  videojs.registerPlugin('thumbnails', function(options) {
    var div, settings, img, player, progressControl, duration, moveListener, moveCancel, thumbTrack;
    
	defaults.basePath = '';

    if(options) {
		if(options.basePath) defaults.basePath = options.basePath;
		if(options.width && options.height) {
			defaults.width=options.width;
			defaults.height = options.height;
		}
	}
	settings = extend({}, defaults, options);
    player = this;
	if(videojs.browser.TOUCH_ENABLED) return;
	
    player.on('medialoaded', function(event) {

		//detect which track we use. For now we just use the first metadata track
		var numtracks = player.textTracks().length;
		if (numtracks === 0) {
			if(div) videojs.dom.addClass('div','vjs-hidden');
		  return;
		}
		var istrack=false;

		
		i = 0;
		while (i<numtracks) {
		  if (player.textTracks()[i].kind==='metadata'  && player.textTracks()[i].src) { 
		


			thumbTrack = player.textTracks()[i];
			istrack=true;
			var cnum = thumbTrack&&thumbTrack.cues.length;
			thumbTrack.mode = 'hidden';
			break;
		  }
		  i++;
		}
		if(istrack!=true) {
			if(div) videojs.dom.addClass('div','vjs-hidden');
			return;
		}

		var cnum = thumbTrack&&thumbTrack.cues.length;
		if(cnum<1) {
			videojs.dom.addClass('div','vjs-hidden');
			return;
		}
		var i = 0;

		  while (i<cnum) {
			var ccue = thumbTrack.cues[i];
			  ctt = parseImageLink(ccue.text);
			
			i++;
		  }


		var progressControl = player.controlBar.progressControl;
		var timg;

		// remove/add the thumbnail to the player

		var el3 = player.el_.querySelector('.vjs-thumb-tooltip');
		if (el3 !== null) el3.parentNode.removeChild(el3);
		var el2 = player.el_.querySelector('.vjs-thumb-image');
		if (el2 !== null) el2.parentNode.removeChild(el2);
		var el1 = player.el_.querySelector('.vjs-thumbnail-holder');
		if(el1 !== null) el1.parentNode.removeChild(el1);
	

			div = document.createElement('div');
			div.className = 'vjs-thumbnail-holder';
			tooltip = document.createElement('div');
			tooltip.className = 'vjs-thumb-tooltip';
			img = document.createElement('img');
			div.appendChild(img);
			img.className = 'vjs-thumb-image';
			div.appendChild(tooltip);

			progressControl.el().appendChild(div);

			duration = player.duration();
		
		// when the container is MP4
			player.on('durationchange', function(event) {
				duration = player.duration();
			});

		// when the container is HLS
		player.on('loadedmetadata', function(event) {
	
		  duration = player.duration();
		});

		

		var ppr = this.el_.querySelector('.vjs-play-progress');
		var ttp = ppr.querySelector('.vjs-time-tooltip');
		videojs.dom.addClass(ttp,'vjs-abs-hidden');
		var mtp = progressControl.el().querySelector('.vjs-mouse-display');
		mtp.style.opacity=0;

		moveListener = function(event) {

		  var msds = this.el_.querySelector('.vjs-mouse-display');
		  var left = Number(msds.style.left.replace(/px$/, ''));
	
		  var percent = left/progressControl.el().offsetWidth;
		  var mouseTime= percent*duration;
		  var tlp = mtp.querySelector('.vjs-time-tooltip');
		  tooltip.innerHTML=tlp.innerHTML;


		  //Now check which of the cues applies
		  var cnum = thumbTrack&&thumbTrack.cues.length;
		  i = 0; var is_slide=false;
		  while (i<cnum) {
			var ccue = thumbTrack.cues[i];
			if (ccue.startTime <= mouseTime && ccue.endTime >= mouseTime) {
			  is_slide=true;
			  vtt = parseImageLink(ccue.text);
			  break;
			}
			i++;
		  }
		
		  //None found, so show nothing
		  if (is_slide!=true) {
			tooltip.style.opacity=0;
			div.className='vjs-thumbnail-holder vjs-thumb-hidden'; return; 
		  } 

		  div.className='vjs-thumbnail-holder';
		  tooltip.style.opacity=1;


		  //Changed image?
		  if ( vtt.src && img.src !=  vtt.src) {
			img.src =  vtt.src;
		  }

		  //Fall back to plugin defaults in case no height/width is specified
		  if ( vtt.w === 0) {
			 vtt.w = settings.width;
			  img.style.width=vtt.w+'px';
		  }
		  if ( vtt.h === 0) {
			 vtt.h = settings.height;
			 img.style.height=vtt.h+'px';
		  }

		  //Set the container width/height if it changed
		  if (div.style.width !=  vtt.w || div.style.height !=  vtt.h) {
			div.style.width =  vtt.w + 'px';
			div.style.height =  vtt.h + 'px';
		  }
		  //Set the image cropping
		  img.style.left = -(vtt.x) + 'px';
		  img.style.top = -(vtt.y) + 'px';
		  img.style.clip = 'rect('+ vtt.y+'px,'+( vtt.w+ vtt.x)+'px,'+( vtt.y+ vtt.h)+'px,'+ vtt.x+'px)';
	
		  var width =  vtt.w;
		  var halfWidth = width / 2;
		  var right = progressControl.el().offsetWidth;
		  var holef = player.el_.querySelector('.vjs-progress-holder').offsetLeft;
		  var halfWidth2=halfWidth-holef;

		  // make sure that the thumbnail doesn't fall off the right side of the left side of the player
		  if ( (left + halfWidth+holef) > right ) {
			left = right - width;
		  } else if (left < halfWidth2) {
			left = 0;
		  } else {
			left = left-halfWidth2; 
		  }




		  div.style.left = left + 'px';
		};

		// update the thumbnail while hovering
		progressControl.on('mousemove', moveListener);


		moveCancel = function(event) {
		  div.style.left = '-1000px';
	
		};

		// move the placeholder out of the way when not hovering
		progressControl.on('mouseleave', moveCancel);
		player.on('userinactive', moveCancel);

	});
  });
})();
