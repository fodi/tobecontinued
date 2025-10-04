/* global urlParams, YT */

var player, stopPlayTimer, playMusicTimer;
var videoEventTime = urlParams.has('v') && urlParams.has('e') ? urlParams.get('e') : 255;
var videoStartTime = urlParams.has('v') && urlParams.has('e') ? urlParams.get('s') : 247;
var forceMute = urlParams.has('m') && parseInt(urlParams.get('m')) === 1;
var showYoutubeControls = urlParams.has('e'), pauseByAction = false, pauseByCode = false, musicLock = false, dontRestartMusic = false;
var rootUrl = location.protocol + '//' + location.host + window.location.pathname;

if (parseInt(urlParams.get('edit')) === 1) {
    document.getElementById('editor').classList.remove('d-none');
    document.getElementById('col-player').classList.add('col-lg-6');
    document.getElementById('col-editor').classList.remove('d-none');
    document.getElementById('editor-video-id').value = videoId;
    document.getElementById('editor-video-start-time').value = videoStartTime;
    document.getElementById('editor-video-event-time').value = videoEventTime;
    document.getElementById('player-controls').classList.add('d-none');
}

window.onYouTubeIframeAPIReady = loadYoutubePlayer;

function loadYoutubePlayer() {
    player = new YT.Player('player', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
            start: videoStartTime,
            controls: showYoutubeControls,
            rel: 0,
            fs: 0,
            iv_load_policy: 3,
            mute: forceMute
        },
        events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange
        }
    });
}

// The API will call this function when the video player is ready.
// This automatically starts the video playback when the player is loaded.
function onPlayerReady(event) {
    positionOverlay();
    //event.target.playVideo();
}

window.addEventListener('resize', positionOverlay);

// The API calls this function when the player's state changes.
function onPlayerStateChange(event) {
    var time, rate, remainingTime;
    clearTimeout(stopPlayTimer);
    clearTimeout(playMusicTimer);
    if (event.data === YT.PlayerState.PAUSED) {
        if (!pauseByAction) {
            document.getElementById('music').pause();
        }
    }
    if (event.data === YT.PlayerState.PLAYING) {
        if (musicLock && !dontRestartMusic) {
            dontRestartMusic = false;
            document.getElementById('music').play();
        }
        time = player.getCurrentTime();
        // Add .4 of a second to the time in case it's close to the current time
        // (The API kept returning ~9.7 when hitting play after stopping at 10s)
        if (time + .4 < videoEventTime) {
            rate = player.getPlaybackRate();
            remainingTime = (videoEventTime - time) / rate;
            stopPlayTimer = setTimeout(function () {
                pauseByAction = true;
                player.pauseVideo();
                document.getElementById('overlay').style.display = 'block';
                if (document.getElementById('player-controls')) {
                    document.getElementById('player-controls').style.visibility = 'visible';
                }
            }, remainingTime * 1000);
            playMusicTimer = setTimeout(function () {
                musicLock = true;
                document.getElementById('music').play();
            }, remainingTime * 1000 - 3560);
        }
    }
}

function onOverlayClick() {
    document.getElementById('music').pause();
    document.getElementById('music').currentTime = 0;
    document.getElementById('overlay').style.display = 'none';
    dontRestartMusic = true;
    player.playVideo();
}

function positionOverlay() {
    document.getElementById('overlay').style.marginTop = '-' + document.getElementById('player').offsetHeight + 'px';
    document.getElementById('overlay').style.height = document.getElementById('player').offsetHeight + 'px';
}

function onClickPlayAgain() {
    musicLock = false;
    dontRestartMusic = false;
    pauseByAction = false;
    clearTimeout(stopPlayTimer);
    clearTimeout(playMusicTimer);
    document.getElementById('music').pause();
    document.getElementById('music').currentTime = 0;
    document.getElementById('overlay').style.display = 'none';
    player.pauseVideo();
    player.seekTo(videoStartTime);
    player.playVideo();
}

function onClickEditorSetVideoEventTime() {
    videoEventTime = document.getElementById('editor-video-event-time').value = Number.parseFloat(player.getCurrentTime()).toFixed(2);
    updateSharableURL();
}

function onClickEditorSetVideoStartTime() {
    videoStartTime = parseInt(Math.round(document.getElementById('editor-video-start-time').value = player.getCurrentTime()));
    updateSharableURL();
}

function onBlurEditorSetVideoEventTime() {
    videoEventTime = Number.parseFloat(document.getElementById('editor-video-event-time').value).toFixed(2);
    updateSharableURL();
}

function onBlurEditorSetVideoStartTime() {
    document.getElementById('editor-video-start-time').value = videoStartTime = parseInt(Math.round(document.getElementById('editor-video-start-time').value));
    updateSharableURL();
}

function onClickEditorLoadVideo() {
    let loadVideoId = document.getElementById('editor-video-id').value;
    if (loadVideoId.length <= 11) {
        videoId = loadVideoId;
    } else {
        let url = new URL(loadVideoId);
        if (url.hostname === 'youtu.be') {
            videoId = url.pathname.substring(1); // Extract video ID from youtu.be/<videoID>
        } else if (url.hostname === 'www.youtube.com' || url.hostname === 'youtube.com') {
            videoId = url.searchParams.get('v'); // Extract video ID from youtube.com/watch?v=<videoID>
        }
    }

    document.getElementById('editor-video-id').value = videoId;
    player.destroy();
    loadYoutubePlayer();
    updateSharableURL();
}

function updateSharableURL() {
    if (document.getElementById('btn-open-sharable-url')) {
        document.getElementById('btn-open-sharable-url').href = document.getElementById('editor-video-sharable-url').value = rootUrl + '?v=' + videoId + (videoStartTime && videoStartTime > 0 ? '&s=' + videoStartTime : '') + '&e=' + videoEventTime;
    }
}
updateSharableURL();

function goToEditor() {
    location.href = './?edit=1&v=' + videoId + '&e=' + videoEventTime + '&s=' + videoStartTime;
}