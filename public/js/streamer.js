var player = videojs("player", {autoplay: true});

document.getElementById("livestatus").innerHTML=`<p style="color: lime;">ONLINE</p>`;
player.on('error', function() {
    document.getElementById("livestatus").innerHTML=`<p style="color: red;">OFFLINE</p>`;
    player.src({
        type: 'video/mp4',
        src: 'throwdown.mp4'
    });
})