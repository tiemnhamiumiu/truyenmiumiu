document.addEventListener("DOMContentLoaded", () => {

    const audioCard = document.getElementById("audioCard");

    if (!audioCard) {
        console.error("Không tìm thấy audioCard");
        return;
    }

    const youtubeUrl = audioCard.dataset.audio;

    const playBtn = document.getElementById("playPauseBtn");
    const backBtn = document.getElementById("back10Btn");
    const forwardBtn = document.getElementById("forward10Btn");
    const progress = document.getElementById("audioProgress");
    const currentTime = document.getElementById("currentTime");
    const duration = document.getElementById("duration");

    // ==============================
    // LẤY VIDEO ID
    // ==============================

    function getVideoId(url) {

        try {

            const u = new URL(url);

            if (u.hostname === "youtu.be") {
                return u.pathname.substring(1);
            }

            if (
                u.hostname === "youtube.com" ||
                u.hostname === "www.youtube.com" ||
                u.hostname === "m.youtube.com"
            ) {
                return u.searchParams.get("v");
            }

        } catch (e) {
            console.error("URL YouTube lỗi:", e);
        }

        return null;
    }

    const videoId = getVideoId(youtubeUrl);

    if (!videoId) {
        console.error("Không lấy được Video ID");
        return;
    }

    console.log("Video ID:", videoId);


    // ==============================
    // PLAYER
    // ==============================

    let player = null;
    let ready = false;
    let timer = null;


    // ==============================
    // FORMAT TIME
    // ==============================

    function formatTime(seconds) {

        if (!Number.isFinite(seconds)) {
            return "00:00";
        }

        seconds = Math.floor(seconds);

        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        if (h > 0) {
            return (
                String(h).padStart(2, "0") + ":" +
                String(m).padStart(2, "0") + ":" +
                String(s).padStart(2, "0")
            );
        }

        return (
            String(m).padStart(2, "0") + ":" +
            String(s).padStart(2, "0")
        );
    }


    // ==============================
    // CẬP NHẬT THANH TUA
    // ==============================

    function updateProgress() {

        if (!ready || !player) {
            return;
        }

        const current = player.getCurrentTime();
        const total = player.getDuration();

        if (total > 0) {

            progress.max = total;

            duration.textContent =
                formatTime(total);

            progress.value = current;

            currentTime.textContent =
                formatTime(current);
        }
    }


    // ==============================
    // PLAYER READY
    // ==============================

    function onReady() {

        console.log("YouTube READY");

        ready = true;

        const total = player.getDuration();

        if (total > 0) {

            progress.max = total;

            duration.textContent =
                formatTime(total);
        }

        // Khôi phục vị trí
        const saved =
            Number(
                localStorage.getItem(
                    "audio_" + videoId
                ) || 0
            );

        if (
            saved > 0 &&
            saved < total
        ) {

            player.seekTo(saved, true);

            currentTime.textContent =
                formatTime(saved);

            progress.value = saved;
        }
    }


    // ==============================
    // PLAYER STATE
    // ==============================

    function onStateChange(event) {

        if (
            event.data ===
            YT.PlayerState.PLAYING
        ) {

            playBtn.textContent = "❚❚";

            clearInterval(timer);

            timer = setInterval(
                updateProgress,
                250
            );

        } else {

            playBtn.textContent = "▶";

            clearInterval(timer);

            savePosition();
        }
    }


    // ==============================
    // LƯU VỊ TRÍ
    // ==============================

    function savePosition() {

        if (!ready || !player) {
            return;
        }

        const time =
            player.getCurrentTime();

        localStorage.setItem(
            "audio_" + videoId,
            Math.floor(time)
        );
    }


    // ==============================
    // PLAY / PAUSE
    // ==============================

    playBtn.addEventListener(
        "click",
        () => {

            if (!ready) {
                console.log("YouTube chưa READY");
                return;
            }

            const state =
                player.getPlayerState();

            if (
                state ===
                YT.PlayerState.PLAYING
            ) {

                player.pauseVideo();

            } else {

                player.playVideo();
            }
        }
    );


    // ==============================
    // -10 GIÂY
    // ==============================

    backBtn.addEventListener(
        "click",
        () => {

            if (!ready) return;

            const time =
                player.getCurrentTime();

            player.seekTo(
                Math.max(0, time - 10),
                true
            );

            savePosition();
        }
    );


    // ==============================
    // +10 GIÂY
    // ==============================

    forwardBtn.addEventListener(
        "click",
        () => {

            if (!ready) return;

            const time =
                player.getCurrentTime();

            const total =
                player.getDuration();

            player.seekTo(
                Math.min(total, time + 10),
                true
            );

            savePosition();
        }
    );


    // ==============================
    // THANH TUA
    // ==============================

    progress.addEventListener(
        "input",
        () => {

            if (!ready) return;

            const time =
                Number(progress.value);

            player.seekTo(
                time,
                true
            );

            currentTime.textContent =
                formatTime(time);

            savePosition();
        }
    );


    // ==============================
    // TỐC ĐỘ
    // ==============================

    document
        .querySelectorAll(".speed-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    if (!ready) return;

                    const speed =
                        Number(button.dataset.speed);

                    player.setPlaybackRate(speed);

                    document
                        .querySelectorAll(".speed-btn")
                        .forEach(btn => {
                            btn.classList.remove("active");
                        });

                    button.classList.add("active");

                    localStorage.setItem(
                        "speed_" + videoId,
                        speed
                    );
                }
            );

        });


    // ==============================
    // MỐC NGHE
    // ==============================

    const markerBtn =
        document.getElementById("markerBtn");

    if (markerBtn) {

        markerBtn.addEventListener(
            "click",
            () => {

                if (!ready) return;

                const marker =
                    Number(
                        audioCard.dataset.marker || 0
                    );

                player.seekTo(
                    marker,
                    true
                );

                player.playVideo();
            }
        );
    }


    // ==============================
    // TẠO PLAYER
    // ==============================

    function createPlayer() {

        player =
            new YT.Player(
                "youtubePlayer",
                {

                    videoId: videoId,

                    width: "1",
                    height: "1",

                    playerVars: {

                        autoplay: 0,

                        controls: 0,

                        playsinline: 1,

                        rel: 0
                    },

                    events: {

                        onReady: onReady,

                        onStateChange:
                            onStateChange,

                        onError: event => {

                            console.error(
                                "YouTube error:",
                                event.data
                            );
                        }
                    }
                }
            );
    }


    // ==============================
    // LOAD YOUTUBE API
    // ==============================

    if (
        window.YT &&
        window.YT.Player
    ) {

        createPlayer();

    } else {

        window.onYouTubeIframeAPIReady =
            createPlayer;

        const script =
            document.createElement("script");

        script.src =
            "https://www.youtube.com/iframe_api";

        document.head.appendChild(script);
    }

});