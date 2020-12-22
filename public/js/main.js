var player = videojs("player", {autoplay: true});

const socket = io();

socket.on('load')

document.getElementById("livestatus").innerHTML=`<p style="color: yellow;">PLEASE WAIT</p>`;
player.on('error', function(){
    document.getElementById("livestatus").innerHTML=`<p style="color: lime;">ONLINE</p>`;
    player.src({
        type: 'application/x-mpegURL',
        src: 'https://eu01.throwdown.tv/live/<%= streamkey %>/index.m3u8'
    });
    player.on('error', function() {
        document.getElementById("livestatus").innerHTML=`<p style="color: lime;">ONLINE</p>`;
        player.src({
            type: 'application/x-mpegURL',
            src: 'https://us01.throwdown.tv/live/<%= streamkey %>/index.m3u8'
        });
        player.on('error', function() {
            document.getElementById("livestatus").innerHTML=`<p style="color: red;">OFFLINE</p>`;
            player.src({
                type: 'video/mp4',
                src: 'throwdown.mp4'
            });
        })
    })
})