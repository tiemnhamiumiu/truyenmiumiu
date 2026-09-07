
(function () {
    "use strict";

    let player = null;
    let playerReady = false;
    let updateTimer = null;

    /* Đang kéo thanh tiến trình */
    let isDragging = false;

    let currentVideoId = "";
    let currentSpeed = 1;

    let musicEnabled = false;
    let currentMusicIndex = -1;

    const MUSIC_VOLUME_KEY = "background_music_volume";

    function getYouTubeId(url) {
        if (!url) return "";

        try {
            const u = new URL(url.trim());

            const hostname = u.hostname
                .toLowerCase()
                .replace(/^www\./, "");

            if (hostname !== "youtu.be") {
                return "";
            }

            return u.pathname
                .replace(/^\/+/, "")
                .split("/")[0] || "";

        } catch (error) {
            console.error("URL YouTube không hợp lệ:", url);
            return "";
        }
    }

    function formatTime(seconds) {
        if (!Number.isFinite(seconds) || seconds < 0) {
            seconds = 0;
        }

        seconds = Math.floor(seconds);

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return (
                String(hours).padStart(2, "0") +
                ":" +
                String(minutes).padStart(2, "0") +
                ":" +
                String(secs).padStart(2, "0")
            );
        }

        return (
            String(minutes).padStart(2, "0") +
            ":" +
            String(secs).padStart(2, "0")
        );
    }

    const audioCard =
        document.getElementById("audioCard");

    if (!audioCard) {
        console.warn("Không tìm thấy #audioCard");
        return;
    }

    const audioProgress =
        document.getElementById("audioProgress");

    const currentTimeEl =
        document.getElementById("currentTime");

    const durationEl =
        document.getElementById("duration");

    const playPauseBtn =
        document.getElementById("playPauseBtn");

    const back10Btn =
        document.getElementById("back10Btn");

    const forward10Btn =
        document.getElementById("forward10Btn");

    const audioTimeBubble =
        document.getElementById("audioTimeBubble");

    const youtubePlayerEl =
        document.getElementById("youtubePlayer");

    const musicToggleBtn =
        document.getElementById("musicToggleBtn");

    const musicArrow =
        document.getElementById("musicArrow");

    const musicPanel =
        document.getElementById("musicPanel");

    const musicList =
        document.getElementById("musicList");

    const selectedMusic =
        document.getElementById("selectedMusic");

    const musicVolume =
        document.getElementById("musicVolume");

    const musicVolumeValue =
        document.getElementById("musicVolumeValue");

    const musicPlayPauseBtn =
        document.getElementById("musicPlayPauseBtn");

    const musicUseBtn =
        document.getElementById("musicUseBtn");

    const markerBtn =
        document.getElementById("markerBtn");

    const markerTime =
        document.getElementById("markerTime");

    const audioUrl =
        audioCard.getAttribute("data-audio") || "";

    currentVideoId =
        getYouTubeId(audioUrl);

    if (!currentVideoId) {
        console.error(
            "audio.js chỉ hỗ trợ URL dạng https://youtu.be/VIDEO_ID",
            audioUrl
        );

        if (playPauseBtn) {
            playPauseBtn.disabled = true;
        }

        return;
    }

    if (audioProgress) {
        audioProgress.min = "0";
        audioProgress.max = "100";
        audioProgress.step = "0.1";
        audioProgress.value = "0";
    }

    let backgroundMusicAudio =
        document.getElementById("backgroundMusicAudio");

    if (!backgroundMusicAudio) {
        backgroundMusicAudio =
            document.createElement("audio");

        backgroundMusicAudio.id =
            "backgroundMusicAudio";

        backgroundMusicAudio.preload =
            "none";

        document.body.appendChild(
            backgroundMusicAudio
        );
    }

    backgroundMusicAudio.loop = true;

    const musicFiles = [
        {
            title: "Thiếu Niên Hoa Hồng VioLin",
            url: "../music/thieu-nien-hoa-hong-violin.mp3"
        },
        {
            title: "Fallin Flower Piano",
            url: "../music/fallin-flower-piano.mp3"
        },
        {
            title: "Cause I love you Piano",
            url: "../music/cause-i-love-you-piano.mp3"
        },
        {
            title: "Người Yêu Bỏ Lỡ",
            url: "../music/nguoi-yeu-bo-lo.mp3"
        },
        {
            title: "Cry For Me",
            url: "../music/cry-for-me.mp3"
        },
        {
            title: "Bóng Lá Rơi",
            url: "../music/bong-la-roi.mp3"
        },
        {
            title: "Komorebi Piano&Violin",
            url: "../music/komorebi-piano-violin.mp3"
        },
        {
            title: "Cry For Me x Giày Cao Gót Màu Đỏ",
            url: "../music/cry-for-me-x-giay-cao-got-mau-do.mp3"
        },
        {
            title: "Biển, Đảo Và Em",
            url: "../music/bien-dao-va-em.mp3"
        }
    ];

    let savedVolume =
        parseFloat(
            localStorage.getItem(
                MUSIC_VOLUME_KEY
            )
        );

    if (!Number.isFinite(savedVolume)) {
        savedVolume = 0.35;
    }

    savedVolume =
        Math.max(
            0,
            Math.min(1, savedVolume)
        );

    backgroundMusicAudio.volume =
        savedVolume;

    if (musicVolume) {
        musicVolume.value =
            String(savedVolume);
    }

    if (musicVolumeValue) {
        musicVolumeValue.textContent =
            Math.round(savedVolume * 100) + "%";
    }

    function renderMusicList() {
        if (!musicList) return;

        musicList.innerHTML = "";

        musicFiles.forEach(
            function (music, index) {

                const item =
                    document.createElement("div");

                item.className =
                    "music-item";

                if (
                    index === currentMusicIndex
                ) {
                    item.classList.add(
                        "active"
                    );
                }

                const icon =
                    document.createElement("span");

                icon.className =
                    "music-item-icon";

                icon.textContent = "🎵";

                const name =
                    document.createElement("span");

                name.className =
                    "music-item-name";

                name.textContent =
                    music.title;

                item.appendChild(icon);
                item.appendChild(name);

                item.addEventListener(
                    "click",
                    function () {
                        selectMusic(index);
                    }
                );

                musicList.appendChild(item);
            }
        );
    }

    function selectMusic(index) {
        if (!musicFiles[index]) {
            return;
        }

        currentMusicIndex =
            index;

        const music =
            musicFiles[index];

        backgroundMusicAudio.pause();

        backgroundMusicAudio.src =
            music.url;

        backgroundMusicAudio.load();

        if (selectedMusic) {
            selectedMusic.textContent =
                "Đang chọn: " +
                music.title;
        }

        if (musicPlayPauseBtn) {
            musicPlayPauseBtn.disabled =
                false;

            musicPlayPauseBtn.textContent =
                "▶ Phát nhạc";
        }

        if (musicUseBtn) {
            musicUseBtn.disabled =
                false;

            musicUseBtn.textContent =
                "☑ Dùng nhạc nền";
        }

        musicEnabled = true;

        if (musicUseBtn) {
            musicUseBtn.textContent =
                "☑ Đang dùng nhạc nền";
        }

        backgroundMusicAudio
            .play()
            .then(function () {

                if (musicPlayPauseBtn) {
                    musicPlayPauseBtn.textContent =
                        "⏸ Tạm dừng";
                }

            })
            .catch(function (error) {

                console.warn(
                    "Trình duyệt chưa cho phép tự động phát nhạc:",
                    error
                );

                if (musicPlayPauseBtn) {
                    musicPlayPauseBtn.textContent =
                        "▶ Phát nhạc";
                }

            });

        renderMusicList();
    }

    renderMusicList();

    if (musicPlayPauseBtn) {
        musicPlayPauseBtn.addEventListener(
            "click",
            function () {

                if (
                    currentMusicIndex < 0
                ) {
                    return;
                }

                if (
                    backgroundMusicAudio.paused
                ) {

                    backgroundMusicAudio
                        .play()
                        .then(function () {

                            musicPlayPauseBtn.textContent =
                                "⏸ Tạm dừng";

                        })
                        .catch(function (error) {

                            console.error(
                                "Không thể phát nhạc:",
                                error
                            );

                        });

                } else {

                    backgroundMusicAudio.pause();

                    musicPlayPauseBtn.textContent =
                        "▶ Phát nhạc";
                }
            }
        );
    }

    if (musicUseBtn) {
        musicUseBtn.addEventListener(
            "click",
            function () {

                if (
                    currentMusicIndex < 0
                ) {
                    return;
                }

                musicEnabled =
                    !musicEnabled;

                if (musicEnabled) {

                    musicUseBtn.textContent =
                        "☑ Đang dùng nhạc nền";

                    backgroundMusicAudio
                        .play()
                        .then(function () {

                            if (musicPlayPauseBtn) {
                                musicPlayPauseBtn.textContent =
                                    "⏸ Tạm dừng";
                            }

                        })
                        .catch(function (error) {

                            console.warn(
                                "Không thể phát nhạc:",
                                error
                            );

                        });

                } else {

                    musicUseBtn.textContent =
                        "☑ Dùng nhạc nền";

                    backgroundMusicAudio.pause();

                    if (musicPlayPauseBtn) {
                        musicPlayPauseBtn.textContent =
                            "▶ Phát nhạc";
                    }
                }
            }
        );
    }

    if (musicVolume) {
        musicVolume.addEventListener(
            "input",
            function () {

                const volume =
                    parseFloat(
                        musicVolume.value
                    );

                backgroundMusicAudio.volume =
                    Math.max(
                        0,
                        Math.min(1, volume)
                    );

                localStorage.setItem(
                    MUSIC_VOLUME_KEY,
                    String(volume)
                );

                if (musicVolumeValue) {
                    musicVolumeValue.textContent =
                        Math.round(
                            volume * 100
                        ) + "%";
                }
            }
        );
    }

    function toggleMusicPanel() {

        if (!musicPanel) {
            return;
        }

        const isHidden =
            musicPanel.style.display === "none" ||
            musicPanel.style.display === "";

        musicPanel.style.display =
            isHidden
                ? "block"
                : "none";

        if (musicArrow) {
            musicArrow.textContent =
                isHidden
                    ? "▲"
                    : "▼";
        }
    }

    if (musicToggleBtn) {
        musicToggleBtn.addEventListener(
            "click",
            function () {
                toggleMusicPanel();
            }
        );
    }

    let markerSeconds =
        parseFloat(
            audioCard.getAttribute(
                "data-marker"
            )
        );

    if (
        !Number.isFinite(markerSeconds)
    ) {
        markerSeconds = 0;
    }

    const markerLabel =
        audioCard.getAttribute(
            "data-marker-label"
        );

    if (markerTime) {
        markerTime.textContent =
            markerLabel ||
            formatTime(markerSeconds);
    }

    if (markerBtn) {
        markerBtn.addEventListener(
            "click",
            function () {

                if (
                    !playerReady ||
                    !player
                ) {
                    return;
                }

                player.seekTo(
                    markerSeconds,
                    true
                );

                player.playVideo();
            }
        );
    }

    function createYouTubePlayer() {

        if (
            !window.YT ||
            !window.YT.Player
        ) {
            return;
        }

        if (!youtubePlayerEl) {

            console.error(
                "Không tìm thấy #youtubePlayer"
            );

            return;
        }

        if (player) {
            return;
        }

        player =
            new YT.Player(
                youtubePlayerEl,
                {
                    videoId:
                        currentVideoId,

                    playerVars: {
                        autoplay: 0,
                        controls: 0,
                        disablekb: 1,
                        fs: 0,
                        iv_load_policy: 3,
                        modestbranding: 1,
                        playsinline: 1,
                        rel: 0
                    },

                    events: {

                        onReady:
                            onPlayerReady,

                        onStateChange:
                            onPlayerStateChange,

                        onError:
                            onPlayerError
                    }
                }
            );
    }

    function onPlayerReady() {

        playerReady = true;

        try {

            player.setPlaybackRate(
                currentSpeed
            );

        } catch (error) {

            console.warn(error);

        }

        if (durationEl) {

            durationEl.textContent =
                formatTime(
                    player.getDuration()
                );
        }

        updateAudioUI();
    }

    function onPlayerStateChange(event) {

        if (!player) {
            return;
        }

        switch (event.data) {

            case YT.PlayerState.PLAYING:

                if (playPauseBtn) {
                    playPauseBtn.textContent =
                        "⏸";
                }

                startUpdating();

                if (
                    musicEnabled &&
                    currentMusicIndex >= 0
                ) {

                    backgroundMusicAudio
                        .play()
                        .then(function () {

                            if (
                                musicPlayPauseBtn
                            ) {

                                musicPlayPauseBtn.textContent =
                                    "⏸ Tạm dừng";
                            }

                        })
                        .catch(function () {

                            console.warn(
                                "Trình duyệt chặn nhạc nền."
                            );

                        });
                }

                break;


            case YT.PlayerState.PAUSED:

                if (playPauseBtn) {
                    playPauseBtn.textContent =
                        "▶";
                }

                stopUpdating();

                backgroundMusicAudio.pause();

                if (
                    musicPlayPauseBtn &&
                    currentMusicIndex >= 0
                ) {

                    musicPlayPauseBtn.textContent =
                        "▶ Phát nhạc";
                }

                break;


            case YT.PlayerState.ENDED:

                if (playPauseBtn) {
                    playPauseBtn.textContent =
                        "▶";
                }

                stopUpdating();

                backgroundMusicAudio.pause();

                if (
                    musicPlayPauseBtn &&
                    currentMusicIndex >= 0
                ) {

                    musicPlayPauseBtn.textContent =
                        "▶ Phát nhạc";
                }

                break;
        }
    }

    function onPlayerError(event) {

        console.error(
            "YouTube Player Error:",
            event.data
        );

        if (
            event.data === 101 ||
            event.data === 150
        ) {

            console.error(
                "Video này không cho phép nhúng."
            );
        }
    }


    /* =========================================================
       CẬP NHẬT AUDIO UI
    ========================================================= */

    function updateAudioUI() {

        if (
            !playerReady ||
            !player
        ) {
            return;
        }

        let current = 0;
        let duration = 0;

        try {

            current =
                player.getCurrentTime() || 0;

            duration =
                player.getDuration() || 0;

        } catch (error) {

            return;
        }


        /*
         * THỜI GIAN ĐANG PHÁT
         *
         * Luôn lấy từ YouTube.
         * Không liên quan đến vị trí đang kéo.
         */
        if (currentTimeEl) {

            currentTimeEl.textContent =
                formatTime(current);
        }


        /*
         * TỔNG THỜI GIAN
         */
        if (durationEl) {

            durationEl.textContent =
                formatTime(duration);
        }


        /*
         * THANH TIẾN TRÌNH
         *
         * Khi người dùng đang kéo:
         * KHÔNG được ghi đè vị trí slider.
         *
         * Khi không kéo:
         * slider chạy theo voice.
         */
        if (
            audioProgress &&
            !isDragging
        ) {

            let percent = 0;

            if (duration > 0) {

                percent =
                    (current / duration) * 100;
            }

            audioProgress.value =
                Math.max(
                    0,
                    Math.min(
                        100,
                        percent
                    )
                );
        }
    }


    function startUpdating() {

        stopUpdating();

        updateTimer =
            setInterval(
                updateAudioUI,
                250
            );
    }


    function stopUpdating() {

        if (updateTimer) {

            clearInterval(
                updateTimer
            );

            updateTimer = null;
        }
    }


    /* =========================================================
       PLAY / PAUSE
    ========================================================= */

    if (playPauseBtn) {

        playPauseBtn.addEventListener(
            "click",
            function () {

                if (
                    !playerReady ||
                    !player
                ) {
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
    }


    /* =========================================================
       BACK 10 SECONDS
    ========================================================= */

    if (back10Btn) {

        back10Btn.addEventListener(
            "click",
            function () {

                if (
                    !playerReady ||
                    !player
                ) {
                    return;
                }

                const current =
                    player.getCurrentTime();

                player.seekTo(
                    Math.max(
                        0,
                        current - 10
                    ),
                    true
                );
            }
        );
    }


    /* =========================================================
       FORWARD 10 SECONDS
    ========================================================= */

    if (forward10Btn) {

        forward10Btn.addEventListener(
            "click",
            function () {

                if (
                    !playerReady ||
                    !player
                ) {
                    return;
                }

                const current =
                    player.getCurrentTime();

                const duration =
                    player.getDuration();

                player.seekTo(
                    Math.min(
                        duration,
                        current + 10
                    ),
                    true
                );
            }
        );
    }


    /* =========================================================
       THANH TIẾN TRÌNH
    ========================================================= */

    if (audioProgress) {

        /*
         * BẮT ĐẦU KÉO
         */
        audioProgress.addEventListener(
            "pointerdown",
            function () {

                isDragging = true;

                if (
                    !playerReady ||
                    !player ||
                    !audioTimeBubble
                ) {
                    return;
                }

                const percent =
                    parseFloat(
                        audioProgress.value
                    );

                const duration =
                    player.getDuration();

                if (
                    Number.isFinite(percent) &&
                    duration > 0
                ) {

                    const seconds =
                        duration *
                        (percent / 100);

                    audioTimeBubble.textContent =
                        formatTime(seconds);

                    audioTimeBubble.style.left =
                        percent + "%";

                    audioTimeBubble.style.opacity =
                        "1";
                }
            }
        );


        /*
         * ĐANG KÉO
         *
         * Chỉ thay đổi:
         * - vị trí nút
         * - vị trí bóng
         * - số trên bóng
         *
         * KHÔNG thay đổi currentTimeEl.
         *
         * KHÔNG seek YouTube.
         */
        audioProgress.addEventListener(
            "input",
            function () {

                if (
                    !playerReady ||
                    !player
                ) {
                    return;
                }

                const percent =
                    parseFloat(
                        audioProgress.value
                    );

                const duration =
                    player.getDuration();

                if (
                    !Number.isFinite(percent) ||
                    duration <= 0
                ) {
                    return;
                }

                const seconds =
                    duration *
                    (percent / 100);


                /*
                 * Bóng thời gian
                 */
                if (audioTimeBubble) {

                    audioTimeBubble.textContent =
                        formatTime(seconds);

                    audioTimeBubble.style.left =
                        percent + "%";

                    audioTimeBubble.style.opacity =
                        "1";
                }


                /*
                 * CỐ Ý KHÔNG CÓ:
                 *
                 * currentTimeEl.textContent = ...
                 *
                 * Vì số bên trái phải là thời gian
                 * voice thực tế đang phát.
                 */
            }
        );


        /*
         * THẢ CHUỘT
         */
        audioProgress.addEventListener(
            "pointerup",
            function () {

                if (
                    !playerReady ||
                    !player
                ) {

                    isDragging = false;

                    return;
                }

                const percent =
                    parseFloat(
                        audioProgress.value
                    );

                const duration =
                    player.getDuration();

                if (
                    Number.isFinite(percent) &&
                    duration > 0
                ) {

                    const seconds =
                        duration *
                        (percent / 100);


                    /*
                     * CHỈ LÚC THẢ:
                     * voice mới nhảy đến vị trí
                     * người dùng vừa kéo.
                     */
                    player.seekTo(
                        seconds,
                        true
                    );


                    /*
                     * Cập nhật ngay số bên trái
                     * sang vị trí mới.
                     */
                    if (currentTimeEl) {

                        currentTimeEl.textContent =
                            formatTime(seconds);
                    }
                }


                /*
                 * Bây giờ cho phép timer
                 * cập nhật slider lại theo YouTube.
                 */
                isDragging = false;


                /*
                 * Giữ bóng thêm 500ms
                 */
                if (audioTimeBubble) {

                    setTimeout(
                        function () {

                            audioTimeBubble.style.opacity =
                                "0";

                        },
                        500
                    );
                }
            }
        );


        /*
         * Nếu trình duyệt hủy thao tác kéo
         */
        audioProgress.addEventListener(
            "pointercancel",
            function () {

                isDragging = false;

                if (audioTimeBubble) {

                    audioTimeBubble.style.opacity =
                        "0";
                }
            }
        );
    }


    /* =========================================================
       TỐC ĐỘ
    ========================================================= */

    const speedButtons =
        document.querySelectorAll(
            ".speed-btn"
        );

    speedButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const speed =
                        parseFloat(
                            button.getAttribute(
                                "data-speed"
                            )
                        );

                    if (
                        !Number.isFinite(speed)
                    ) {
                        return;
                    }

                    currentSpeed =
                        speed;

                    if (
                        playerReady &&
                        player
                    ) {

                        try {

                            player.setPlaybackRate(
                                speed
                            );

                        } catch (error) {

                            console.warn(
                                "Không đổi được tốc độ:",
                                error
                            );
                        }
                    }

                    speedButtons.forEach(
                        function (btn) {

                            btn.classList.remove(
                                "active"
                            );
                        }
                    );

                    button.classList.add(
                        "active"
                    );
                }
            );
        }
    );


    /* =========================================================
       LOAD YOUTUBE API
    ========================================================= */

    function loadYouTubeAPI() {

        if (
            window.YT &&
            window.YT.Player
        ) {

            createYouTubePlayer();

            return;
        }

        if (
            document.querySelector(
                'script[src="https://www.youtube.com/iframe_api"]'
            )
        ) {

            return;
        }

        const oldCallback =
            window.onYouTubeIframeAPIReady;

        window.onYouTubeIframeAPIReady =
            function () {

                if (
                    typeof oldCallback ===
                    "function"
                ) {

                    try {

                        oldCallback();

                    } catch (error) {

                        console.error(error);
                    }
                }

                createYouTubePlayer();
            };

        const script =
            document.createElement(
                "script"
            );

        script.src =
            "https://www.youtube.com/iframe_api";

        script.async = true;

        document.head.appendChild(
            script
        );
    }

    loadYouTubeAPI();

})();