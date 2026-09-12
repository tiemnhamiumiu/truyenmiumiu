(function () {

    "use strict";


    /* =========================================================
       BIẾN DÙNG CHUNG
    ========================================================= */

    let player = null;

    let audioEl = null;

    let sourceType = "";

    let mediaReady = false;

    let updateTimer = null;

    let isDragging = false;

    let currentVideoId = "";

    let currentAudioUrl = "";

    let currentSpeed = 1;

    let musicEnabled = false;

    let currentMusicIndex = -1;

    let pendingResumeAudioTime = null;


    /* =========================================================
       XÁC ĐỊNH ID TRUYỆN

       Ưu tiên ?id=123

       Nếu không có:
       dùng pathname.
    ========================================================= */

    const urlParams =
        new URLSearchParams(
            window.location.search
        );

    const storyId =
        urlParams.get("id") ||
        window.location.pathname;


    /* =========================================================
       KEY LƯU AUDIO
    ========================================================= */

    const AUDIO_POSITION_KEY =
        `reader_audio_position_${storyId}`;

    const AUDIO_DURATION_KEY =
        `reader_audio_duration_${storyId}`;

    const AUDIO_SPEED_KEY =
        `reader_audio_speed_${storyId}`;


    /* =========================================================
       KEY NHẠC NỀN
    ========================================================= */

    const MUSIC_VOLUME_KEY =
        "background_music_volume";


    /* =========================================================
       LẤY YOUTUBE ID
    ========================================================= */

    function getYouTubeId(url) {

        if (!url) {
            return "";
        }


        try {

            const u =
                new URL(
                    url.trim()
                );


            const hostname =
                u.hostname
                    .toLowerCase()
                    .replace(
                        /^www\./,
                        ""
                    );


            if (
                hostname !==
                "youtu.be"
            ) {

                return "";

            }


            return u.pathname
                .replace(
                    /^\/+/,
                    ""
                )
                .split("/")[0] || "";

        }

        catch (error) {

            console.error(
                "URL YouTube không hợp lệ:",
                url
            );

            return "";

        }

    }


    /* =========================================================
       FORMAT TIME
    ========================================================= */

    function formatTime(seconds) {

        if (
            !Number.isFinite(seconds) ||
            seconds < 0
        ) {

            seconds = 0;

        }


        seconds =
            Math.floor(seconds);


        const hours =
            Math.floor(
                seconds / 3600
            );


        const minutes =
            Math.floor(
                (seconds % 3600) / 60
            );


        const secs =
            seconds % 60;


        if (
            hours > 0
        ) {

            return (

                String(hours)
                    .padStart(2, "0") +

                ":" +

                String(minutes)
                    .padStart(2, "0") +

                ":" +

                String(secs)
                    .padStart(2, "0")

            );

        }


        return (

            String(minutes)
                .padStart(2, "0") +

            ":" +

            String(secs)
                .padStart(2, "0")

        );

    }


    /* =========================================================
       AUDIO CARD
    ========================================================= */

    const audioCard =
        document.getElementById(
            "audioCard"
        );


    if (!audioCard) {

        console.warn(
            "Không tìm thấy #audioCard"
        );

        return;

    }


    /* =========================================================
       ELEMENTS
    ========================================================= */

    const audioProgress =
        document.getElementById(
            "audioProgress"
        );

    const currentTimeEl =
        document.getElementById(
            "currentTime"
        );

    const durationEl =
        document.getElementById(
            "duration"
        );

    const playPauseBtn =
        document.getElementById(
            "playPauseBtn"
        );

    const back10Btn =
        document.getElementById(
            "back10Btn"
        );

    const forward10Btn =
        document.getElementById(
            "forward10Btn"
        );

    const audioTimeBubble =
        document.getElementById(
            "audioTimeBubble"
        );

    const youtubePlayerEl =
        document.getElementById(
            "youtubePlayer"
        );

    const musicToggleBtn =
        document.getElementById(
            "musicToggleBtn"
        );

    const musicArrow =
        document.getElementById(
            "musicArrow"
        );

    const musicPanel =
        document.getElementById(
            "musicPanel"
        );

    const musicList =
        document.getElementById(
            "musicList"
        );

    const selectedMusic =
        document.getElementById(
            "selectedMusic"
        );

    const musicVolume =
        document.getElementById(
            "musicVolume"
        );

    const musicVolumeValue =
        document.getElementById(
            "musicVolumeValue"
        );

    const musicPlayPauseBtn =
        document.getElementById(
            "musicPlayPauseBtn"
        );

    const musicUseBtn =
        document.getElementById(
            "musicUseBtn"
        );

    const markerBtn =
        document.getElementById(
            "markerBtn"
        );

    const markerTime =
        document.getElementById(
            "markerTime"
        );

    const storyNameEl =
        document.querySelector(
            ".audio-name"
        );


    /* =========================================================
       AUDIO URL
    ========================================================= */

    const audioUrl =
        audioCard.getAttribute(
            "data-audio"
        ) || "";


    /* =========================================================
       NHẬN DIỆN NGUỒN
    ========================================================= */

    currentVideoId =
        getYouTubeId(
            audioUrl
        );


    if (currentVideoId) {

        sourceType =
            "youtube";

    }

    else if (audioUrl) {

        sourceType =
            "direct";

        currentAudioUrl =
            audioUrl.trim();

    }

    else {

        console.error(
            "audio.js: thiếu data-audio hoặc URL không hợp lệ.",
            audioUrl
        );


        if (playPauseBtn) {

            playPauseBtn.disabled =
                true;

        }


        return;

    }


    /* =========================================================
       AUDIO PROGRESS
    ========================================================= */

    if (audioProgress) {

        audioProgress.min =
            "0";

        audioProgress.max =
            "100";

        audioProgress.step =
            "0.1";

        audioProgress.value =
            "0";

    }


    /* =========================================================
       TẠO AUDIO NHẠC NỀN
    ========================================================= */

    let backgroundMusicAudio =
        document.getElementById(
            "backgroundMusicAudio"
        );


    if (!backgroundMusicAudio) {

        backgroundMusicAudio =
            document.createElement(
                "audio"
            );


        backgroundMusicAudio.id =
            "backgroundMusicAudio";


        backgroundMusicAudio.preload =
            "none";


        document.body.appendChild(
            backgroundMusicAudio
        );

    }


    backgroundMusicAudio.loop =
        true;


    /* =========================================================
       DANH SÁCH NHẠC NỀN
    ========================================================= */

    const musicFiles = [

        {
            title:
                "Thiếu Niên Hoa Hồng VioLin",

            url:
                "../music/thieu-nien-hoa-hong-violin.mp3"
        },

        {
            title:
                "Fallin Flower Piano",

            url:
                "../music/fallin-flower-piano.mp3"
        },

        {
            title:
                "Cause I love you Piano",

            url:
                "../music/cause-i-love-you-piano.mp3"
        },

        {
            title:
                "Người Yêu Bỏ Lỡ",

            url:
                "../music/nguoi-yeu-bo-lo.mp3"
        },

        {
            title:
                "Cry For Me",

            url:
                "../music/cry-for-me.mp3"
        },

        {
            title:
                "Bóng Lá Rơi",

            url:
                "../music/bong-la-roi.mp3"
        },

        {
            title:
                "Komorebi Piano&Violin",

            url:
                "../music/komorebi-piano-violin.mp3"
        },

        {
            title:
                "Cry For Me x Giày Cao Gót Màu Đỏ",

            url:
                "../music/cry-for-me-x-giay-cao-got-mau-do.mp3"
        },

        {
            title:
                "Biển, Đảo Và Em",

            url:
                "../music/bien-dao-va-em.mp3"
        }

    ];


    /* =========================================================
       VOLUME NHẠC
    ========================================================= */

    let savedVolume =
        parseFloat(
            localStorage.getItem(
                MUSIC_VOLUME_KEY
            )
        );


    if (
        !Number.isFinite(
            savedVolume
        )
    ) {

        savedVolume =
            0.35;

    }


    savedVolume =
        Math.max(
            0,
            Math.min(
                1,
                savedVolume
            )
        );


    backgroundMusicAudio.volume =
        savedVolume;


    if (musicVolume) {

        musicVolume.value =
            String(
                savedVolume
            );

    }


    if (musicVolumeValue) {

        musicVolumeValue.textContent =
            Math.round(
                savedVolume * 100
            ) + "%";

    }


    /* =========================================================
       RENDER MUSIC LIST
    ========================================================= */

    function renderMusicList() {

        if (!musicList) {
            return;
        }


        musicList.innerHTML =
            "";


        musicFiles.forEach(
            function (
                music,
                index
            ) {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "music-item";


                if (
                    index ===
                    currentMusicIndex
                ) {

                    item.classList.add(
                        "active"
                    );

                }


                const icon =
                    document.createElement(
                        "span"
                    );


                icon.className =
                    "music-item-icon";


                icon.textContent =
                    "🎵";


                const name =
                    document.createElement(
                        "span"
                    );


                name.className =
                    "music-item-name";


                name.textContent =
                    music.title;


                item.appendChild(
                    icon
                );


                item.appendChild(
                    name
                );


                item.addEventListener(
                    "click",
                    function () {

                        selectMusic(
                            index
                        );

                    }
                );


                musicList.appendChild(
                    item
                );

            }
        );

    }


    /* =========================================================
       SELECT MUSIC
    ========================================================= */

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


        musicEnabled =
            true;


        if (musicUseBtn) {

            musicUseBtn.textContent =
                "☑ Đang dùng nhạc nền";

        }


        backgroundMusicAudio
            .play()
            .then(
                function () {

                    if (musicPlayPauseBtn) {

                        musicPlayPauseBtn.textContent =
                            "⏸ Tạm dừng";

                    }

                }
            )
            .catch(
                function (error) {

                    console.warn(
                        "Trình duyệt chưa cho phép tự động phát nhạc:",
                        error
                    );


                    if (musicPlayPauseBtn) {

                        musicPlayPauseBtn.textContent =
                            "▶ Phát nhạc";

                    }

                }
            );


        renderMusicList();

    }


    renderMusicList();


    /* =========================================================
       MUSIC PLAY / PAUSE
    ========================================================= */

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
                        .then(
                            function () {

                                musicPlayPauseBtn.textContent =
                                    "⏸ Tạm dừng";

                            }
                        )
                        .catch(
                            function (error) {

                                console.error(
                                    "Không thể phát nhạc:",
                                    error
                                );

                            }
                        );

                }

                else {

                    backgroundMusicAudio.pause();

                    musicPlayPauseBtn.textContent =
                        "▶ Phát nhạc";

                }

            }
        );

    }


    /* =========================================================
       MUSIC USE
    ========================================================= */

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
                        .then(
                            function () {

                                if (
                                    musicPlayPauseBtn
                                ) {

                                    musicPlayPauseBtn.textContent =
                                        "⏸ Tạm dừng";

                                }

                            }
                        )
                        .catch(
                            function (error) {

                                console.warn(
                                    "Không thể phát nhạc:",
                                    error
                                );

                            }
                        );

                }

                else {

                    musicUseBtn.textContent =
                        "☑ Dùng nhạc nền";


                    backgroundMusicAudio.pause();


                    if (
                        musicPlayPauseBtn
                    ) {

                        musicPlayPauseBtn.textContent =
                            "▶ Phát nhạc";

                    }

                }

            }
        );

    }


    /* =========================================================
       MUSIC VOLUME
    ========================================================= */

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
                        Math.min(
                            1,
                            volume
                        )
                    );


                localStorage.setItem(
                    MUSIC_VOLUME_KEY,
                    String(volume)
                );


                if (
                    musicVolumeValue
                ) {

                    musicVolumeValue.textContent =
                        Math.round(
                            volume * 100
                        ) + "%";

                }

            }
        );

    }


    /* =========================================================
       TOGGLE MUSIC PANEL
    ========================================================= */

    function toggleMusicPanel() {

        if (!musicPanel) {
            return;
        }


        const isHidden =
            musicPanel.style.display ===
                "none" ||
            musicPanel.style.display ===
                "";


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


    /* =========================================================
       MARKER
    ========================================================= */

    let markerSeconds =
        parseFloat(
            audioCard.getAttribute(
                "data-marker"
            )
        );


    if (
        !Number.isFinite(
            markerSeconds
        )
    ) {

        markerSeconds =
            0;

    }


    const markerLabel =
        audioCard.getAttribute(
            "data-marker-label"
        );


    if (markerTime) {

        markerTime.textContent =
            markerLabel ||
            formatTime(
                markerSeconds
            );

    }


    if (markerBtn) {

        markerBtn.addEventListener(
            "click",
            function () {

                if (!mediaReady) {
                    return;
                }


                mediaSeek(
                    markerSeconds
                );


                mediaPlay();

            }
        );

    }


    /* =========================================================
       ĐỌC TỐC ĐỘ ĐÃ LƯU
    ========================================================= */

    const savedSpeed =
        parseFloat(
            localStorage.getItem(
                AUDIO_SPEED_KEY
            )
        );


    if (
        Number.isFinite(
            savedSpeed
        ) &&
        [1, 1.25, 1.5, 2].includes(
            savedSpeed
        )
    ) {

        currentSpeed =
            savedSpeed;

    }


    /* =========================================================
       LỚP TRUNG GIAN MEDIA
    ========================================================= */

    function mediaPlay() {

        if (
            sourceType ===
            "youtube"
        ) {

            if (player) {

                player.playVideo();

            }

        }

        else if (
            sourceType ===
            "direct"
        ) {

            if (audioEl) {

                audioEl
                    .play()
                    .catch(
                        function (error) {

                            console.warn(
                                "Không thể phát audio:",
                                error
                            );

                        }
                    );

            }

        }

    }


    function mediaPause() {

        if (
            sourceType ===
            "youtube"
        ) {

            if (player) {

                player.pauseVideo();

            }

        }

        else if (
            sourceType ===
            "direct"
        ) {

            if (audioEl) {

                audioEl.pause();

            }

        }

    }


    function mediaIsPlaying() {

        if (
            sourceType ===
            "youtube"
        ) {

            return (

                player &&

                player.getPlayerState &&

                player.getPlayerState() ===
                    YT.PlayerState.PLAYING

            );

        }


        if (
            sourceType ===
            "direct"
        ) {

            return !!(
                audioEl &&
                !audioEl.paused &&
                !audioEl.ended
            );

        }


        return false;

    }


    function mediaSeek(seconds) {

        if (
            !Number.isFinite(
                seconds
            )
        ) {

            return;

        }


        seconds =
            Math.max(
                0,
                seconds
            );


        if (
            sourceType ===
            "youtube"
        ) {

            if (player) {

                player.seekTo(
                    seconds,
                    true
                );

            }

        }

        else if (
            sourceType ===
            "direct"
        ) {

            if (audioEl) {

                audioEl.currentTime =
                    seconds;

            }

        }

    }


    function mediaGetCurrentTime() {

        try {

            if (
                sourceType ===
                "youtube"
            ) {

                return (

                    player &&
                    player.getCurrentTime()

                ) || 0;

            }


            if (
                sourceType ===
                "direct"
            ) {

                return (

                    audioEl &&
                    audioEl.currentTime

                ) || 0;

            }

        }

        catch (error) {

            return 0;

        }


        return 0;

    }


    function mediaGetDuration() {

        try {

            if (
                sourceType ===
                "youtube"
            ) {

                return (

                    player &&
                    player.getDuration()

                ) || 0;

            }


            if (
                sourceType ===
                "direct"
            ) {

                return (

                    audioEl &&
                    audioEl.duration

                ) || 0;

            }

        }

        catch (error) {

            return 0;

        }


        return 0;

    }


    function mediaSetSpeed(speed) {

        if (
            sourceType ===
            "youtube"
        ) {

            if (player) {

                try {

                    player.setPlaybackRate(
                        speed
                    );

                }

                catch (error) {

                    console.warn(
                        "Không đổi được tốc độ:",
                        error
                    );

                }

            }

        }

        else if (
            sourceType ===
            "direct"
        ) {

            if (audioEl) {

                audioEl.playbackRate =
                    speed;

            }

        }

    }


    /* =========================================================
       LƯU AUDIO POSITION
    ========================================================= */

    function saveAudioPosition() {

        if (!mediaReady) {
            return;
        }


        const current =
            mediaGetCurrentTime();


        const duration =
            mediaGetDuration();


        if (
            !Number.isFinite(
                current
            ) ||
            current < 0
        ) {

            return;

        }


        /*
           Nếu audio đã gần hết:
           xóa vị trí để lần sau không quay
           lại đoạn cuối.
        */

        if (
            duration > 0 &&
            current >=
                duration - 5
        ) {

            localStorage.removeItem(
                AUDIO_POSITION_KEY
            );

            localStorage.removeItem(
                AUDIO_DURATION_KEY
            );

            return;

        }


        /*
           Chỉ lưu khi đã nghe ít nhất 2 giây.
        */

        if (
            current < 2
        ) {

            return;

        }


        localStorage.setItem(
            AUDIO_POSITION_KEY,
            String(current)
        );


        if (
            Number.isFinite(
                duration
            ) &&
            duration > 0
        ) {

            localStorage.setItem(
                AUDIO_DURATION_KEY,
                String(duration)
            );

        }

    }


    /* =========================================================
       LẤY AUDIO POSITION
    ========================================================= */

    function getSavedAudioPosition() {

        const saved =
            parseFloat(
                localStorage.getItem(
                    AUDIO_POSITION_KEY
                )
            );


        if (
            !Number.isFinite(
                saved
            ) ||
            saved < 0
        ) {

            return 0;

        }


        return saved;

    }


    /* =========================================================
       KHÔI PHỤC AUDIO
    ========================================================= */

    function restoreAudioPosition() {

        let time = 0;


        /*
           Ưu tiên vị trí do script.js truyền sang.
        */

        if (
            Number.isFinite(
                pendingResumeAudioTime
            ) &&
            pendingResumeAudioTime > 0
        ) {

            time =
                pendingResumeAudioTime;

        }

        else if (
            Number.isFinite(
                window.readerResumeAudioTime
            ) &&
            window.readerResumeAudioTime > 0
        ) {

            time =
                Number(
                    window.readerResumeAudioTime
                );

        }

        else {

            time =
                getSavedAudioPosition();

        }


        if (
            !Number.isFinite(
                time
            ) ||
            time <= 5
        ) {

            return;

        }


        const duration =
            mediaGetDuration();


        if (
            duration > 0
        ) {

            time =
                Math.min(
                    time,
                    Math.max(
                        0,
                        duration - 1
                    )
                );

        }


        try {

            mediaSeek(
                time
            );


            updateAudioUI();


            console.log(
                "🎧 Khôi phục audio:",
                formatTime(time)
            );

        }

        catch (error) {

            console.warn(
                "Không thể khôi phục audio:",
                error
            );

        }

    }


    /* =========================================================
       NHẬN LỆNH "ĐỌC TIẾP"
    ========================================================= */

    window.addEventListener(
        "readerResumeAudio",
        function (event) {

            const time =
                event &&
                event.detail &&
                Number(
                    event.detail.time
                );


            if (
                Number.isFinite(
                    time
                ) &&
                time > 0
            ) {

                pendingResumeAudioTime =
                    time;


                window.readerResumeAudioTime =
                    time;


                /*
                   Nếu player đã sẵn sàng:
                   seek ngay.
                */

                if (
                    mediaReady
                ) {

                    restoreAudioPosition();

                }

            }

        }
    );


    /* =========================================================
       NHẬN LỆNH "ĐỌC TỪ ĐẦU"
    ========================================================= */

    window.addEventListener(
        "readerResetAudio",
        function () {

            pendingResumeAudioTime =
                0;


            window.readerResumeAudioTime =
                0;


            try {

                if (
                    mediaReady
                ) {

                    mediaSeek(
                        0
                    );

                    updateAudioUI();

                }

                /*
                   Xóa vị trí audio cũ.
                */

                localStorage.removeItem(
                    AUDIO_POSITION_KEY
                );

                localStorage.removeItem(
                    AUDIO_DURATION_KEY
                );

            }

            catch (error) {

                console.warn(
                    "Không thể reset audio:",
                    error
                );

            }

        }
    );


    /* =========================================================
       MEDIA STARTED PLAYING
    ========================================================= */

    function onMediaStartedPlaying() {

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
                .then(
                    function () {

                        if (
                            musicPlayPauseBtn
                        ) {

                            musicPlayPauseBtn.textContent =
                                "⏸ Tạm dừng";

                        }

                    }
                )
                .catch(
                    function () {

                        console.warn(
                            "Trình duyệt chặn nhạc nền."
                        );

                    }
                );

        }

    }


    /* =========================================================
       MEDIA STOPPED PLAYING
    ========================================================= */

    function onMediaStoppedPlaying() {

        if (playPauseBtn) {

            playPauseBtn.textContent =
                "▶";

        }


        stopUpdating();


        /*
           Lưu ngay trước khi dừng.
        */

        saveAudioPosition();


        backgroundMusicAudio.pause();


        if (
            musicPlayPauseBtn &&
            currentMusicIndex >= 0
        ) {

            musicPlayPauseBtn.textContent =
                "▶ Phát nhạc";

        }

    }


    /* =========================================================
       TẠO DIRECT AUDIO
    ========================================================= */

    function createDirectAudioPlayer() {

        audioEl =
            document.createElement(
                "audio"
            );


        audioEl.preload =
            "metadata";


        audioEl.src =
            currentAudioUrl;


        audioEl.style.display =
            "none";


        audioEl.setAttribute(
            "playsinline",
            ""
        );


        if (
            youtubePlayerEl &&
            youtubePlayerEl.parentNode
        ) {

            youtubePlayerEl.parentNode.replaceChild(
                audioEl,
                youtubePlayerEl
            );

        }

        else {

            document.body.appendChild(
                audioEl
            );

        }


        /* =====================================================
           LOADED METADATA
        ===================================================== */

        audioEl.addEventListener(
            "loadedmetadata",
            function () {

                mediaReady =
                    true;


                if (durationEl) {

                    durationEl.textContent =
                        formatTime(
                            audioEl.duration
                        );

                }


                updateAudioUI();


                /*
                   Nếu người dùng vừa chọn
                   "Đọc tiếp" thì khôi phục.
                */

                if (
                    Number.isFinite(
                        pendingResumeAudioTime
                    ) &&
                    pendingResumeAudioTime > 0
                ) {

                    restoreAudioPosition();

                }

            }
        );


        /* =====================================================
           PLAY
        ===================================================== */

        audioEl.addEventListener(
            "play",
            onMediaStartedPlaying
        );


        /* =====================================================
           PAUSE
        ===================================================== */

        audioEl.addEventListener(
            "pause",
            function () {

                if (
                    !audioEl.ended
                ) {

                    onMediaStoppedPlaying();

                }

            }
        );


        /* =====================================================
           ENDED
        ===================================================== */

        audioEl.addEventListener(
            "ended",
            function () {

                /*
                   Xóa vị trí khi nghe hết.
                */

                localStorage.removeItem(
                    AUDIO_POSITION_KEY
                );

                localStorage.removeItem(
                    AUDIO_DURATION_KEY
                );


                onMediaStoppedPlaying();

            }
        );


        /* =====================================================
           TIME UPDATE
        ===================================================== */

        audioEl.addEventListener(
            "timeupdate",
            function () {

                if (
                    !isDragging
                ) {

                    updateAudioUI();

                }


                /*
                   Tự lưu vị trí audio.
                */

                saveAudioPosition();

            }
        );


        /* =====================================================
           ERROR
        ===================================================== */

        audioEl.addEventListener(
            "error",
            function () {

                console.error(
                    "Không tải được file audio:",
                    currentAudioUrl
                );


                if (playPauseBtn) {

                    playPauseBtn.disabled =
                        true;

                }

            }
        );


        setupMediaSession();

    }


    /* =========================================================
       MEDIA SESSION
    ========================================================= */

    function setupMediaSession() {

        if (
            !("mediaSession" in navigator)
        ) {

            return;

        }


        const title =
            (
                storyNameEl &&
                storyNameEl.textContent.trim()
            ) ||
            document.title ||
            "Nghe truyện audio";


        navigator.mediaSession.metadata =
            new MediaMetadata({

                title:
                    title,

                artist:
                    "Nghe truyện online"

            });


        try {

            navigator.mediaSession.setActionHandler(
                "play",
                function () {

                    mediaPlay();

                }
            );


            navigator.mediaSession.setActionHandler(
                "pause",
                function () {

                    mediaPause();

                }
            );


            navigator.mediaSession.setActionHandler(
                "seekbackward",
                function () {

                    mediaSeek(
                        Math.max(
                            0,
                            mediaGetCurrentTime() -
                                10
                        )
                    );

                }
            );


            navigator.mediaSession.setActionHandler(
                "seekforward",
                function () {

                    mediaSeek(
                        Math.min(
                            mediaGetDuration() ||
                                Infinity,
                            mediaGetCurrentTime() +
                                10
                        )
                    );

                }
            );


            navigator.mediaSession.setActionHandler(
                "seekto",
                function (details) {

                    if (
                        details &&
                        Number.isFinite(
                            details.seekTime
                        )
                    ) {

                        mediaSeek(
                            details.seekTime
                        );

                    }

                }
            );

        }

        catch (error) {

            console.warn(
                "Trình duyệt không hỗ trợ đầy đủ Media Session API:",
                error
            );

        }

    }


    /* =========================================================
       TẠO YOUTUBE PLAYER
    ========================================================= */

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

                        autoplay:
                            0,

                        controls:
                            0,

                        disablekb:
                            1,

                        fs:
                            0,

                        iv_load_policy:
                            3,

                        modestbranding:
                            1,

                        playsinline:
                            1,

                        rel:
                            0

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


    /* =========================================================
       YOUTUBE READY
    ========================================================= */

    function onPlayerReady() {

        mediaReady =
            true;


        mediaSetSpeed(
            currentSpeed
        );


        if (durationEl) {

            durationEl.textContent =
                formatTime(
                    mediaGetDuration()
                );

        }


        updateAudioUI();


        /*
           Nếu đã có vị trí chờ khôi phục.
        */

        if (
            Number.isFinite(
                pendingResumeAudioTime
            ) &&
            pendingResumeAudioTime > 0
        ) {

            restoreAudioPosition();

        }

    }


    /* =========================================================
       YOUTUBE STATE
    ========================================================= */

    function onPlayerStateChange(
        event
    ) {

        if (!player) {
            return;
        }


        switch (
            event.data
        ) {

            case YT.PlayerState.PLAYING:

                onMediaStartedPlaying();

                break;


            case YT.PlayerState.PAUSED:

                onMediaStoppedPlaying();

                break;


            case YT.PlayerState.ENDED:

                localStorage.removeItem(
                    AUDIO_POSITION_KEY
                );

                localStorage.removeItem(
                    AUDIO_DURATION_KEY
                );

                onMediaStoppedPlaying();

                break;

        }

    }


    /* =========================================================
       YOUTUBE ERROR
    ========================================================= */

    function onPlayerError(
        event
    ) {

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
       UPDATE AUDIO UI
    ========================================================= */

    function updateAudioUI() {

        if (!mediaReady) {
            return;
        }


        const current =
            mediaGetCurrentTime();


        const duration =
            mediaGetDuration();


        /*
           Lưu audio.
        */

        if (
            current > 0
        ) {

            saveAudioPosition();

        }


        /* =====================================================
           CURRENT TIME
        ===================================================== */

        if (currentTimeEl) {

            currentTimeEl.textContent =
                formatTime(
                    current
                );

        }


        /* =====================================================
           DURATION
        ===================================================== */

        if (durationEl) {

            durationEl.textContent =
                formatTime(
                    duration
                );

        }


        /* =====================================================
           PROGRESS
        ===================================================== */

        if (
            audioProgress &&
            !isDragging
        ) {

            let percent =
                0;


            if (
                duration > 0
            ) {

                percent =
                    (
                        current /
                        duration
                    ) * 100;

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


    /* =========================================================
       START UPDATING

       YouTube cần polling.
       MP3 dùng timeupdate.
    ========================================================= */

    function startUpdating() {

        if (
            sourceType !==
            "youtube"
        ) {

            return;

        }


        stopUpdating();


        updateTimer =
            setInterval(
                updateAudioUI,
                250
            );

    }


    /* =========================================================
       STOP UPDATING
    ========================================================= */

    function stopUpdating() {

        if (updateTimer) {

            clearInterval(
                updateTimer
            );


            updateTimer =
                null;

        }

    }


    /* =========================================================
       PLAY / PAUSE
    ========================================================= */

    if (playPauseBtn) {

        playPauseBtn.addEventListener(
            "click",
            function () {

                if (!mediaReady) {
                    return;
                }


                if (
                    mediaIsPlaying()
                ) {

                    mediaPause();

                }

                else {

                    mediaPlay();

                }

            }
        );

    }


    /* =========================================================
       BACK 10
    ========================================================= */

    if (back10Btn) {

        back10Btn.addEventListener(
            "click",
            function () {

                if (!mediaReady) {
                    return;
                }


                const current =
                    mediaGetCurrentTime();


                mediaSeek(
                    Math.max(
                        0,
                        current - 10
                    )
                );


                saveAudioPosition();

            }
        );

    }


    /* =========================================================
       FORWARD 10
    ========================================================= */

    if (forward10Btn) {

        forward10Btn.addEventListener(
            "click",
            function () {

                if (!mediaReady) {
                    return;
                }


                const current =
                    mediaGetCurrentTime();


                const duration =
                    mediaGetDuration();


                mediaSeek(
                    Math.min(
                        duration,
                        current + 10
                    )
                );


                saveAudioPosition();

            }
        );

    }


    /* =========================================================
       THANH TIẾN TRÌNH
    ========================================================= */

    if (audioProgress) {

        /* =====================================================
           POINTER DOWN
        ===================================================== */

        audioProgress.addEventListener(
            "pointerdown",
            function () {

                isDragging =
                    true;


                if (
                    !mediaReady ||
                    !audioTimeBubble
                ) {

                    return;

                }


                const percent =
                    parseFloat(
                        audioProgress.value
                    );


                const duration =
                    mediaGetDuration();


                if (
                    Number.isFinite(
                        percent
                    ) &&
                    duration > 0
                ) {

                    const seconds =
                        duration *
                        (
                            percent /
                            100
                        );


                    audioTimeBubble.textContent =
                        formatTime(
                            seconds
                        );


                    audioTimeBubble.style.left =
                        percent + "%";


                    audioTimeBubble.style.opacity =
                        "1";

                }

            }
        );


        /* =====================================================
           INPUT
        ===================================================== */

        audioProgress.addEventListener(
            "input",
            function () {

                if (!mediaReady) {
                    return;
                }


                const percent =
                    parseFloat(
                        audioProgress.value
                    );


                const duration =
                    mediaGetDuration();


                if (
                    !Number.isFinite(
                        percent
                    ) ||
                    duration <= 0
                ) {

                    return;

                }


                const seconds =
                    duration *
                    (
                        percent /
                        100
                    );


                if (audioTimeBubble) {

                    audioTimeBubble.textContent =
                        formatTime(
                            seconds
                        );


                    audioTimeBubble.style.left =
                        percent + "%";


                    audioTimeBubble.style.opacity =
                        "1";

                }

            }
        );


        /* =====================================================
           POINTER UP
        ===================================================== */

        audioProgress.addEventListener(
            "pointerup",
            function () {

                if (!mediaReady) {

                    isDragging =
                        false;

                    return;

                }


                const percent =
                    parseFloat(
                        audioProgress.value
                    );


                const duration =
                    mediaGetDuration();


                if (
                    Number.isFinite(
                        percent
                    ) &&
                    duration > 0
                ) {

                    const seconds =
                        duration *
                        (
                            percent /
                            100
                        );


                    mediaSeek(
                        seconds
                    );


                    if (currentTimeEl) {

                        currentTimeEl.textContent =
                            formatTime(
                                seconds
                            );

                    }


                    /*
                       Lưu ngay vị trí mới.
                    */

                    saveAudioPosition();

                }


                isDragging =
                    false;


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


        /* =====================================================
           POINTER CANCEL
        ===================================================== */

        audioProgress.addEventListener(
            "pointercancel",
            function () {

                isDragging =
                    false;


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

            const buttonSpeed =
                parseFloat(
                    button.getAttribute(
                        "data-speed"
                    )
                );


            if (
                Number.isFinite(
                    buttonSpeed
                ) &&
                buttonSpeed ===
                    currentSpeed
            ) {

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
                        !Number.isFinite(
                            speed
                        )
                    ) {

                        return;

                    }


                    currentSpeed =
                        speed;


                    localStorage.setItem(
                        AUDIO_SPEED_KEY,
                        String(speed)
                    );


                    if (mediaReady) {

                        mediaSetSpeed(
                            speed
                        );

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

                    }

                    catch (error) {

                        console.error(
                            error
                        );

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


        script.async =
            true;


        document.head.appendChild(
            script
        );

    }


    /* =========================================================
       KHỞI CHẠY
    ========================================================= */

    if (
        sourceType ===
        "youtube"
    ) {

        loadYouTubeAPI();

    }

    else if (
        sourceType ===
        "direct"
    ) {

        createDirectAudioPlayer();

    }


    /* =========================================================
       LƯU AUDIO NGAY KHI RỜI KHỎI TRANG TRUYỆN

       Khi người đọc bấm Trang chủ / thể loại / truyện khác,
       trình duyệt có thể chuyển trang trước khi pagehide chạy.
       Vì vậy lưu ngay trong click nội bộ.
    ========================================================= */

    document.addEventListener(
        "click",
        function (event) {

            const link = event.target.closest("a[href]");

            if (!link) {
                return;
            }

            // Không can thiệp link mở tab mới.
            if (
                link.target === "_blank" ||
                event.defaultPrevented
            ) {
                return;
            }

            saveAudioPosition();

        },
        true
    );


    /* =========================================================
       LƯU AUDIO KHI ĐÓNG TAB
    ========================================================= */

    window.addEventListener(
        "pagehide",
        function () {

            saveAudioPosition();

        }
    );


    /* =========================================================
       LƯU AUDIO KHI TAB CHUYỂN SANG NỀN
    ========================================================= */

    document.addEventListener(
        "visibilitychange",
        function () {

            if (
                document.visibilityState ===
                "hidden"
            ) {

                saveAudioPosition();

            }

        }
    );


})();
