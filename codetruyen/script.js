/* =========================================================
   PHIM.JS - TRANG XEM PHIM (YouTube)

   Dựng lại từ script.js + audio.js của web truyện:
   - Player YouTube HIỆN HÌNH trong thẻ phim (điều khiển tự làm)
   - Cổng quảng cáo Facebook 2 bước (Shopee -> ShopeeFood)
     dạng THẺ SẢN PHẨM nhỏ gọn, bấm vào mở bài Facebook
   - Xem đủ 10 phút: chạm nền trang mở TikTok -> Lazada
   - Nhớ vị trí xem + popup "Xem tiếp"
   - Mốc xem, tốc độ, tua 10s, toàn màn hình
   - Mở bằng trình duyệt Facebook / Messenger: yêu cầu chuyển
     sang Chrome / Safari (Android tự mở Chrome)
   - Popup Xôi Thịt
========================================================= */

(function () {

    "use strict";

    if ("scrollRestoration" in history) {
        history.scrollRestoration = "manual";
    }


    /* =====================================================
       CẤU HÌNH
    ===================================================== */

    /* url = link BÀI FACEBOOK (bài có thẻ xem trước s.shopee.vn) */
    const FACEBOOK_ADS = {
        shopee: {
            title: "Quảng cáo Shopee",
            url: "https://www.facebook.com/permalink.php?story_fbid=pfbid03WuEfswyLJv9MeBfepsmqU9dSGBoYAEVTFew9VrU1Dgoc52U1XDWnHfWmEDwDRTml&id=61594034743775&locale=vi_VN"
        },
        shopeefood: {
            title: "Quảng cáo ShopeeFood",
            url: "https://www.facebook.com/permalink.php?story_fbid=pfbid0vFZruXeCQhF5oqkQghUPKaKV5wKMP3WYxCwp6DAy4fErZQYWkAamoKqNbKBMt7URl&id=61594034743775&locale=vi_VN"
        }
    };

    /* Khung Facebook dựng ở kích thước cố định rồi thu phóng cho vừa màn hình */
    const FB_DESIGN_WIDTH = 450;
    const FB_DESIGN_HEIGHT = 450;

    /* true = vùng bị chặn hiện màu đỏ để canh chỉnh.
       Canh xong thì đổi lại false. */
    const FACEBOOK_ZONE_DEBUG = false;

    /* PHÓNG TO để cắt viền trắng quanh bài.
       left / right = số px viền trắng bị cắt ở mỗi bên.
       top = số px cắt ở phía trên để ẨN dòng link https://s.shopee.vn/... */
    const FACEBOOK_CROP = { left: 14, right: 2, top: 40 };

    /* ẢNH CHÈN LÊN TRÊN CÙNG (chỉ để nhìn, bấm xuyên qua xuống bài Facebook).
       Đường dẫn tính từ trang phim: trang nằm trong cotrang/, ảnh nằm trong codetruyen/.
       height = chiều cao vùng ảnh của thẻ xem trước (hệ 480 x 355). */
    const FACEBOOK_COVER = {
        shopee: "../codetruyen/anhs.jpg",
        shopeefood: "../codetruyen/anhf.jpg",
        height: 350
    };

    /* VÙNG ĐƯỢC PHÉP BẤM (hệ 480 x 355).
       Chỉ bấm được trong hình chữ nhật này, mọi chỗ khác bị chặn.
       Nếu vùng đỏ lệch thẻ thì chỉnh left / top / width / height. */
    const FACEBOOK_CLICK_ZONE = {
        shopee:     { left: 0, top: 0, width: 700, height: 500 },
        shopeefood: { left: 0, top: 0, width: 480, height: 500 }
    };

    /* Phóng riêng theo chiều dọc để cắt khoảng trắng phía dưới */
    const FACEBOOK_VERTICAL_ZOOM = 1.18;

    const TIKTOK_URL = "https://vt.tiktok.com/ZS9ff2HHvvJve-waSqH/";
    const LAZADA_URL = "";

    const XOI_THIT_URL = "https://tiemnhamiumiu.neocities.org/";

    const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
    const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

    const FACEBOOK_SHOPEE_MIN_LEAVE_TIME = 1500;
    const FACEBOOK_SHOPEEFOOD_MIN_LEAVE_TIME = 0;

    /* Xem đủ 10 phút (giây) mới kích hoạt link TikTok / Lazada */
    const WATCH_TIME_LIMIT = 10 * 60;

    const REDIRECT_GESTURE_COOLDOWN = 1500;

    const SPEEDS = [1, 1.25, 1.5, 2];

    /* Chỉ hỏi "Xem tiếp" khi đã xem quá số giây này */
    const RESUME_MIN_SECONDS = 30;


    /* =====================================================
       LOCAL STORAGE KEYS
    ===================================================== */

    const unlockDateKey = "phim_unlock_date";
    const redirectStageKey = "phim_redirect_stage";
    const redirectDateKey = "phim_redirect_date";
    const watchTimeKey = "phim_watch_time";
    const watchTimeDateKey = "phim_watch_time_date";
    const facebookAdStageKey = "phim_facebook_ad_stage";
    const facebookAdStageDateKey = "phim_facebook_ad_stage_date";
    const facebookAdCompletedDateKey = "phim_facebook_ad_completed_date";
    const facebookAdLeftKey = "phim_facebook_ad_left";
    const speedKey = "phim_speed";


    /* =====================================================
       ID PHIM
    ===================================================== */

    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get("id") || window.location.pathname;

    const positionKey = "phim_position_" + movieId;
    const viewSessionKey = "phim_view_session_" + movieId;


    /* =====================================================
       TRÌNH DUYỆT FACEBOOK / MESSENGER -> CHUYỂN SANG CHROME / SAFARI
       (đặt trước phần kiểm tra thẻ phim để Android luôn được chuyển)
    ===================================================== */

    function isMessengerBrowser() {

        const ua = navigator.userAgent || navigator.vendor || "";

        return /FB_IAB|FBAN|FBAV|Messenger|Orca-Android/i.test(ua);
    }

    function isAndroid() {
        return /Android/i.test(navigator.userAgent || "");
    }

    /* Android: mở trang bằng Chrome thông qua intent */
    function openInChrome() {

        const url = window.location;

        const intent =
            "intent://" + url.host + url.pathname + url.search +
            "#Intent;scheme=https;package=com.android.chrome;" +
            "S.browser_fallback_url=" + encodeURIComponent(url.href) +
            ";end";

        window.location.href = intent;
    }


    /* =====================================================
       PHẦN TỬ GIAO DIỆN
    ===================================================== */

    const card = document.getElementById("movieCard");

    if (!card) {
        console.warn("phim.js: không tìm thấy #movieCard");
        return;
    }

    const screenEl = document.getElementById("movieScreen");
    const overlay = document.getElementById("movieOverlay");
    const overlayBtn = document.getElementById("movieOverlayBtn");
    const errorEl = document.getElementById("movieError");

    const progress = document.getElementById("movieProgress");
    const bubble = document.getElementById("movieTimeBubble");
    const currentTimeEl = document.getElementById("currentTime");
    const durationEl = document.getElementById("duration");

    const playBtn = document.getElementById("playPauseBtn");
    const back10Btn = document.getElementById("back10Btn");
    const forward10Btn = document.getElementById("forward10Btn");
    const fullscreenBtn = document.getElementById("fullscreenBtn");

    const markerBox = document.getElementById("movieMarker");
    const markerBtn = document.getElementById("markerBtn");
    const markerTimeEl = document.getElementById("markerTime");

    const titleEl = document.querySelector(".movie-title");


    /* =====================================================
       BIẾN TOÀN CỤC
    ===================================================== */

    let player = null;
    let mediaReady = false;
    let updateTimer = null;
    let saveCounter = 0;
    let isDragging = false;
    let currentSpeed = 1;

    let movieUnlocked = false;
    let resumeShown = false;

    let everPlayed = false;
    let hudTimer = null;
    const HUD_HIDE_DELAY = 3500;

    let watchSeconds = 0;
    let watchTimer = null;
    let lastTick = null;

    let lastRedirectGestureAt = 0;

    let facebookAdsModal = null;
    let facebookAdHiddenAt = null;
    let facebookAdWaiting = false;
    let facebookAdCurrentType = null;
    let fbResizeObserver = null;


    /* =====================================================
       TIỆN ÍCH
    ===================================================== */

    function getToday() {
        return new Date().toLocaleDateString("en-CA", {
            timeZone: "Asia/Ho_Chi_Minh"
        });
    }

    function formatTime(seconds) {

        if (!Number.isFinite(seconds) || seconds < 0) {
            seconds = 0;
        }

        seconds = Math.floor(seconds);

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        const mm = String(minutes).padStart(2, "0");
        const ss = String(secs).padStart(2, "0");

        if (hours > 0) {
            return String(hours).padStart(2, "0") + ":" + mm + ":" + ss;
        }

        return mm + ":" + ss;
    }

    /* "15:44", "1:12:57" hoặc số giây "777" */
    function parseTime(value) {

        if (value === null || value === undefined) {
            return 0;
        }

        value = String(value).trim();

        if (value === "") {
            return 0;
        }

        if (value.indexOf(":") !== -1) {

            const parts = value.split(":").map(Number);

            if (
                parts.length > 3 ||
                parts.some(function (n) {
                    return !Number.isFinite(n) || n < 0;
                })
            ) {
                return 0;
            }

            let seconds = 0;

            parts.forEach(function (n) {
                seconds = seconds * 60 + n;
            });

            return seconds;
        }

        const num = parseFloat(value);

        return Number.isFinite(num) ? num : 0;
    }

    /* Nhận youtu.be/ID, youtube.com/watch?v=ID, /embed/, /shorts/, /live/ */
    function getYouTubeId(url) {

        if (!url) {
            return "";
        }

        try {

            const u = new URL(String(url).trim());

            const host = u.hostname
                .toLowerCase()
                .replace(/^(www|m)\./, "");

            if (host === "youtu.be") {
                return u.pathname.replace(/^\/+/, "").split("/")[0] || "";
            }

            if (host === "youtube.com" || host === "youtube-nocookie.com") {

                if (u.pathname === "/watch") {
                    return u.searchParams.get("v") || "";
                }

                const m = u.pathname.match(/^\/(embed|shorts|live)\/([^/?]+)/);

                if (m) {
                    return m[2];
                }
            }

            return "";

        } catch (error) {

            console.error("URL YouTube không hợp lệ:", url);

            return "";
        }
    }

    function showMovieError(message) {

        if (!errorEl) {
            return;
        }

        errorEl.textContent = message;
        errorEl.style.display = "block";
    }


    /* =====================================================
       KIỂM TRA LINK VIDEO
    ===================================================== */

    const videoUrl = card.getAttribute("data-video") || "";
    const videoId = getYouTubeId(videoUrl);

    if (!videoId) {

        console.error("phim.js: thiếu data-video hoặc link YouTube không hợp lệ:", videoUrl);

        card.classList.remove("is-loading");

        showMovieError("Link video chưa đúng. Hãy dán link dạng https://youtu.be/ID_VIDEO");

        if (playBtn) {
            playBtn.disabled = true;
        }

        return;
    }


    /* =====================================================
       POPUP CHUYỂN SANG TRÌNH DUYỆT (Facebook / Messenger)
    ===================================================== */

    function copyPageLink(button) {

        const url = window.location.href;

        const done = function () {

            if (!button) {
                return;
            }

            button.textContent = "✓ Đã sao chép link";

            setTimeout(function () {
                button.textContent = "📋 Sao chép link";
            }, 2000);
        };

        const fallback = function () {

            try {

                const input = document.createElement("textarea");

                input.value = url;
                input.style.position = "fixed";
                input.style.left = "-10000px";
                input.style.top = "0";

                document.body.appendChild(input);

                input.focus();
                input.select();

                document.execCommand("copy");

                input.remove();

                done();

            } catch (error) {

                alert("Không thể tự sao chép. Link phim:\n" + url);
            }
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {

            navigator.clipboard.writeText(url).then(done).catch(fallback);

        } else {

            fallback();
        }
    }

    function showMessengerNotice() {

        if (!isMessengerBrowser()) {
            return;
        }

        if (document.getElementById("messengerNoticePopup")) {
            return;
        }

        const android = isAndroid();

        const chromeButton = android
            ? '<button id="messengerChromeBtn" class="movie-popup-btn primary" type="button">🌐 Mở bằng Chrome</button>'
            : '';

        const copyClass = android ? "secondary" : "primary";

        const popup = document.createElement("div");

        popup.id = "messengerNoticePopup";
        popup.className = "movie-popup-overlay";

        /* nền đặc hơn để che hẳn bảng quảng cáo phía sau */
        popup.style.background = "rgba(0, 0, 0, 0.92)";

        popup.innerHTML = `

            <div class="movie-popup-box" role="dialog" aria-modal="true">

                <div class="movie-popup-icon">⚠️</div>

                <div class="movie-popup-title">Bạn đang mở bằng trình duyệt Facebook</div>

                <div class="movie-popup-text">
                    Trình duyệt trong Facebook / Messenger <strong>không ghi nhận được quảng cáo Shopee</strong>,
                    nên bạn sẽ không mở khóa được phim.
                    Hãy chuyển sang Chrome / Safari để xem bình thường.
                </div>

                <div class="movie-popup-steps">
                    <b>Cách chuyển:</b><br>
                    1. Bấm nút <b>⋯ (3 chấm)</b> ở góc trên bên phải<br>
                    2. Chọn <b>"Mở trong trình duyệt"</b><br>
                    &nbsp;&nbsp;&nbsp;(hoặc <b>"Mở bằng Chrome" / "Mở bằng Safari"</b>)
                </div>

                <div class="movie-popup-buttons">

                    ${chromeButton}

                    <button id="messengerCopyBtn" class="movie-popup-btn ${copyClass}" type="button">
                        📋 Sao chép link
                    </button>

                </div>

            </div>

        `;

        document.body.appendChild(popup);

        const copyBtn = document.getElementById("messengerCopyBtn");
        const chromeBtn = document.getElementById("messengerChromeBtn");

        if (copyBtn) {
            copyBtn.addEventListener("click", function () {
                copyPageLink(copyBtn);
            });
        }

        if (chromeBtn) {
            chromeBtn.addEventListener("click", openInChrome);
        }
    }


    /* =====================================================
       RESET DỮ LIỆU MỖI NGÀY
    ===================================================== */

    function resetDailyDataIfNeeded() {

        const today = getToday();

        if (localStorage.getItem(facebookAdStageDateKey) !== today) {

            localStorage.removeItem(facebookAdStageKey);
            localStorage.removeItem(facebookAdCompletedDateKey);
            localStorage.removeItem(facebookAdLeftKey);
            localStorage.removeItem(redirectStageKey);
            localStorage.removeItem(redirectDateKey);
            localStorage.removeItem(unlockDateKey);

            localStorage.setItem(facebookAdStageDateKey, today);
        }

        if (localStorage.getItem(watchTimeDateKey) !== today) {

            localStorage.removeItem(watchTimeKey);
            localStorage.setItem(watchTimeDateKey, today);
        }
    }


    /* =====================================================
       MỞ KHÓA HÔM NAY
    ===================================================== */

    function isUnlockedToday() {
        return localStorage.getItem(unlockDateKey) === getToday();
    }

    function markUnlockedToday() {
        localStorage.setItem(unlockDateKey, getToday());
        movieUnlocked = true;
    }


    /* =====================================================
       STAGE FACEBOOK
       0 = chưa xong Shopee, 1 = xong Shopee,
       2 = xong ShopeeFood, 3 = xong toàn bộ
    ===================================================== */

    function getFacebookAdStage() {

        if (localStorage.getItem(facebookAdStageDateKey) !== getToday()) {
            return 0;
        }

        return Number(localStorage.getItem(facebookAdStageKey)) || 0;
    }

    function setFacebookAdStage(stage) {
        localStorage.setItem(facebookAdStageKey, String(stage));
        localStorage.setItem(facebookAdStageDateKey, getToday());
    }

    function isFacebookAdsCompletedToday() {
        return localStorage.getItem(facebookAdCompletedDateKey) === getToday();
    }

    function markFacebookAdsCompletedToday() {
        localStorage.setItem(facebookAdCompletedDateKey, getToday());
        setFacebookAdStage(3);
        markUnlockedToday();
    }


    /* =====================================================
       STAGE REDIRECT
       0 = chưa mở gì, 1 = đã mở TikTok, 2 = đã mở Lazada
    ===================================================== */

    function getRedirectStage() {

        if (localStorage.getItem(redirectDateKey) !== getToday()) {
            return 0;
        }

        return Number(localStorage.getItem(redirectStageKey)) || 0;
    }

    function setRedirectStage(stage) {
        localStorage.setItem(redirectStageKey, String(stage));
        localStorage.setItem(redirectDateKey, getToday());
    }

    function isRedirectFinishedToday() {
        return getRedirectStage() >= 2;
    }


    /* =====================================================
       KHÓA / MỞ PHIM
    ===================================================== */

    function lockMovie() {
        movieUnlocked = false;
        document.body.classList.add("movieLocked");
    }

    function unlockMovie() {

        movieUnlocked = true;

        document.body.classList.remove("movieLocked");

        increaseMovieView();

        lastTick = Date.now();

        maybeShowResume();
    }


    /* =====================================================
       MODAL FACEBOOK
    ===================================================== */

    function createFacebookAdModal() {

        const existing = document.getElementById("facebookAdsModal");

        if (existing) {
            facebookAdsModal = existing;
            return existing;
        }

        const modal = document.createElement("div");

        modal.id = "facebookAdsModal";
        modal.className = "facebookAdsOverlay";

        modal.innerHTML = `

            <div id="facebookAdsBox" class="facebookAdsBox" role="dialog" aria-modal="true">

                <div class="facebookAdsHeader">
                    <div id="facebookAdsTitle" class="facebookAdsTitle">Quảng cáo</div>
                    <div id="facebookAdsProgress" class="facebookAdsProgress">
                        Vui lòng hoàn thành quảng cáo để tiếp tục xem phim
                    </div>
                </div>

                <div id="facebookAdsSteps" class="facebookAdsSteps">
                    <div id="facebookStep1" class="facebookStep">1/2 Shopee</div>
                    <div class="facebookStepArrow">→</div>
                    <div id="facebookStep2" class="facebookStep">2/2 ShopeeFood</div>
                </div>

                <div id="facebookAdInstruction" class="facebookAdInstruction">
                    Hãy mở quảng cáo và ở lại ít nhất <strong>3 giây</strong> rồi quay lại đây.
                </div>

                <div id="facebookAdFrame" class="facebookAdFrame"></div>

                <div id="facebookAdReturnMessage" class="facebookAdReturnMessage" style="display:none;"></div>

                <div id="facebookAdFinished" class="facebookAdFinished" style="display:none;">
                    <div class="facebookFinishedIcon">✓</div>
                    <p class="facebookFinishedText">
                        Bạn đã hoàn thành 2 bước quảng cáo.
                        Bây giờ có thể tắt quảng cáo và xem phim.
                    </p>
                    <button id="facebookAdCloseButton" type="button">
                        ✕ TẮT QUẢNG CÁO → XEM PHIM
                    </button>
                </div>

            </div>

        `;

        document.body.appendChild(modal);

        facebookAdsModal = modal;

        const closeButton = document.getElementById("facebookAdCloseButton");

        if (closeButton) {

            closeButton.addEventListener("click", function () {

                if (getFacebookAdStage() < 2) {
                    return;
                }

                markFacebookAdsCompletedToday();
                closeFacebookAdModal();
                unlockMovie();
            });
        }

        return modal;
    }

    function fitFacebookFrame() {

        const frame = document.getElementById("facebookAdFrame");

        if (!frame) {
            return;
        }

        const scaler = frame.querySelector(".fbScaler");

        if (!scaler || frame.clientWidth === 0) {
            return;
        }

        scaler.style.transform =
            "scale(" + (frame.clientWidth / FB_DESIGN_WIDTH) + ")";
    }

    /* Nhúng bài Facebook, rồi phủ lớp chặn lên MỌI chỗ trừ thẻ xem trước
       Shopee. Bấm vào thẻ = đi thẳng sang Shopee. */
    function createFacebookIframe(postUrl) {

        const frame = document.getElementById("facebookAdFrame");

        if (!frame) {
            return;
        }

        frame.innerHTML = "";

        const scaler = document.createElement("div");

        scaler.className = "fbScaler";

        const iframe = document.createElement("iframe");

        iframe.src =
            "https://www.facebook.com/plugins/post.php" +
            "?href=" + encodeURIComponent(postUrl) +
            "&show_text=true" +
            "&width=" + FB_DESIGN_WIDTH;

        iframe.loading = "eager";
        iframe.allow = "autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share";
        iframe.scrolling = "no";
        iframe.frameBorder = "0";

        /* Lớp phóng to: đẩy bài sang trái rồi phóng lên cho viền trắng nằm ngoài khung */
        const zoom = document.createElement("div");

        const cropWidth = FB_DESIGN_WIDTH - FACEBOOK_CROP.left - FACEBOOK_CROP.right;
        const zoomScale = FB_DESIGN_WIDTH / cropWidth;

        zoom.className = "fbZoom";

        zoom.style.transform =
            "scale(" + zoomScale + ", " +
            (zoomScale * FACEBOOK_VERTICAL_ZOOM) + ") translate(-" +
            FACEBOOK_CROP.left + "px, -" +
            FACEBOOK_CROP.top + "px)";

        /* Cắt phần thừa bên ngoài khung */
        frame.style.overflow = "hidden";
        frame.style.position = "relative";

        zoom.appendChild(iframe);
        scaler.appendChild(zoom);

        /* Ảnh chèn lên trên cùng: chỉ để nhìn, pointer-events:none nên bấm xuyên xuống bài */
        const coverUrl = FACEBOOK_COVER[facebookAdCurrentType];

        if (coverUrl) {

            const cover = document.createElement("div");

            cover.className = "fbCover";
            cover.style.backgroundImage = 'url("' + coverUrl + '")';
            cover.style.height = FACEBOOK_COVER.height + "px";

            scaler.appendChild(cover);
        }

        const zone = FACEBOOK_CLICK_ZONE[facebookAdCurrentType];

        if (zone) {

            const maskBase =
                "position:absolute;z-index:5;cursor:default;" +
                "-webkit-tap-highlight-color:transparent;" +
                (FACEBOOK_ZONE_DEBUG
                    ? "background:rgba(255,0,0,.35);"
                    : "background:transparent;");

            const addMask = function (top, left, width, height) {

                if (width <= 0 || height <= 0) {
                    return;
                }

                const mask = document.createElement("div");

                mask.style.cssText =
                    maskBase +
                    "top:" + top + "px;left:" + left + "px;" +
                    "width:" + width + "px;height:" + height + "px;";

                mask.addEventListener("click", function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                });

                scaler.appendChild(mask);
            };

            const zoneRight = zone.left + zone.width;
            const zoneBottom = zone.top + zone.height;

            /* 4 mảnh chặn bao quanh vùng được bấm */
            addMask(0, 0, FB_DESIGN_WIDTH, zone.top);
            addMask(zone.top, 0, zone.left, zone.height);
            addMask(zone.top, zoneRight, FB_DESIGN_WIDTH - zoneRight, zone.height);
            addMask(zoneBottom, 0, FB_DESIGN_WIDTH, FB_DESIGN_HEIGHT - zoneBottom);
        }

        frame.appendChild(scaler);

        fitFacebookFrame();

        if ("ResizeObserver" in window) {

            if (fbResizeObserver) {
                fbResizeObserver.disconnect();
            }

            fbResizeObserver = new ResizeObserver(fitFacebookFrame);
            fbResizeObserver.observe(frame);

        } else {

            window.removeEventListener("resize", fitFacebookFrame);
            window.addEventListener("resize", fitFacebookFrame);
        }
    }

    function updateFacebookSteps() {

        const stage = getFacebookAdStage();

        const step1 = document.getElementById("facebookStep1");
        const step2 = document.getElementById("facebookStep2");

        if (!step1 || !step2) {
            return;
        }

        step1.classList.remove("active", "done");
        step2.classList.remove("active", "done");

        if (stage === 0) {
            step1.classList.add("active");
        }

        if (stage >= 1) {
            step1.classList.add("done");
            step2.classList.add("active");
        }

        if (stage >= 2) {
            step1.classList.add("done");
            step2.classList.add("done");
        }
    }

    function updateFacebookInstruction(message) {

        const instruction = document.getElementById("facebookAdInstruction");

        if (instruction) {
            instruction.innerHTML = message;
        }
    }

    function showFacebookAdStep(type, titleText, progressText, instructionHtml, url) {

        facebookAdCurrentType = type;
        facebookAdWaiting = false;
        facebookAdHiddenAt = null;

        const title = document.getElementById("facebookAdsTitle");
        const progressEl = document.getElementById("facebookAdsProgress");

        if (title) {
            title.innerHTML = titleText;
        }

        if (progressEl) {
            progressEl.textContent = progressText;
        }

        updateFacebookInstruction(instructionHtml);

        createFacebookIframe(url);

        const finished = document.getElementById("facebookAdFinished");

        if (finished) {
            finished.style.display = "none";
        }

        const frame = document.getElementById("facebookAdFrame");

        if (frame) {
            frame.style.display = "";
        }

        const returnMessage = document.getElementById("facebookAdReturnMessage");

        if (returnMessage) {
            returnMessage.style.display = "none";
        }

        updateFacebookSteps();

        fitFacebookFrame();
    }

    function openShopeeAd() {

        showFacebookAdStep(
            "shopee",
            "Quảng cáo Shopee <br> Vui lòng nhấn vào ảnh sản phẩm",
            "Bước 1/2 — Hãy mở quảng cáo và ở lại ít nhất 3 giây rồi quay lại",
            '👉 <strong>Hãy mở quảng cáo Shopee và ở lại ít nhất 3 giây rồi quay lại đây.</strong><br>' +
            'Đây là bước 1/2. Sau khi quay lại, hệ thống sẽ kiểm tra thời gian.',
            FACEBOOK_ADS.shopee.url
        );
    }

    function openShopeeFoodAd() {

        showFacebookAdStep(
            "shopeefood",
            "Quảng cáo ShopeeFood <br> Vui lòng nhấn vào ảnh sản phẩm",
            "Bước 2/2 — Hãy mở quảng cáo rồi quay lại",
            '👉 <strong>Hãy mở quảng cáo ShopeeFood rồi quay lại đây.</strong><br>' +
            'Đây là bước 2/2. Sau khi quay lại, hệ thống sẽ kiểm tra và hoàn tất.',
            FACEBOOK_ADS.shopeefood.url
        );
    }

    function startFacebookAdFlow() {

        createFacebookAdModal();

        const stage = getFacebookAdStage();

        facebookAdsModal.classList.add("active");
        facebookAdsModal.style.display = "flex";

        document.body.classList.add("facebookAdsOpen");

        if (stage === 0) {
            openShopeeAd();
            return;
        }

        if (stage === 1) {
            openShopeeFoodAd();
            return;
        }

        if (stage >= 2) {
            showFacebookAdFinished();
        }
    }

    function markFacebookAdLeft() {

        if (!facebookAdsModal || !facebookAdsModal.classList.contains("active")) {
            return;
        }

        if (facebookAdWaiting) {
            return;
        }

        facebookAdHiddenAt = Date.now();
        facebookAdWaiting = true;

        localStorage.setItem(facebookAdLeftKey, String(facebookAdHiddenAt));

        if (facebookAdCurrentType === "shopeefood") {

            updateFacebookInstruction(
                '⏳ <strong>Đã ghi nhận bạn rời trang.</strong><br>' +
                'Hãy quay lại để hoàn tất bước ShopeeFood.'
            );

        } else {

            updateFacebookInstruction(
                '⏳ <strong>Đang tính 3 giây...</strong><br>' +
                'Hãy ở lại trang quảng cáo Shopee ít nhất <strong>3 giây</strong> rồi quay lại.'
            );
        }
    }

    function checkFacebookAdReturn() {

        if (!facebookAdWaiting || facebookAdHiddenAt === null) {
            return;
        }

        const hiddenDuration = Date.now() - facebookAdHiddenAt;

        const requiredTime =
            facebookAdCurrentType === "shopee"
                ? FACEBOOK_SHOPEE_MIN_LEAVE_TIME
                : FACEBOOK_SHOPEEFOOD_MIN_LEAVE_TIME;

        if (hiddenDuration < requiredTime) {

            const remain = Math.max(
                1,
                Math.ceil((requiredTime - hiddenDuration) / 1000)
            );

            facebookAdWaiting = false;
            facebookAdHiddenAt = null;

            localStorage.removeItem(facebookAdLeftKey);

            const message = document.getElementById("facebookAdReturnMessage");

            if (message) {
                message.style.display = "block";
                message.textContent =
                    "Bạn quay lại quá sớm. Hãy ở lại quảng cáo thêm " + remain + " giây.";
            }

            updateFacebookInstruction(
                '⚠️ <strong>Chưa đủ 3 giây.</strong><br>' +
                'Hãy mở quảng cáo và ở lại thêm ít nhất ' + remain + ' giây rồi quay lại.'
            );

            return;
        }

        facebookAdWaiting = false;
        facebookAdHiddenAt = null;

        localStorage.removeItem(facebookAdLeftKey);

        markFacebookAdCompletedStep();
    }

    function markFacebookAdCompletedStep() {

        const stage = getFacebookAdStage();

        if (stage === 0 && facebookAdCurrentType === "shopee") {

            setFacebookAdStage(1);

            const message = document.getElementById("facebookAdReturnMessage");

            if (message) {
                message.style.display = "block";
                message.textContent = "✓ Đã hoàn thành bước Shopee.";
            }

            updateFacebookSteps();

            updateFacebookInstruction(
                '✓ <strong>Đã hoàn thành bước 1/2.</strong><br>' +
                'Bây giờ hãy thực hiện tiếp quảng cáo ShopeeFood.'
            );

            setTimeout(openShopeeFoodAd, 500);

            return;
        }

        if (stage === 1 && facebookAdCurrentType === "shopeefood") {

            setFacebookAdStage(2);

            updateFacebookSteps();

            updateFacebookInstruction(
                '✓ <strong>Đã hoàn thành bước 2/2.</strong><br>' +
                'Bạn đã hoàn thành đủ hai quảng cáo.'
            );

            setTimeout(showFacebookAdFinished, 300);
        }
    }

    function showFacebookAdFinished() {

        const frame = document.getElementById("facebookAdFrame");
        const finished = document.getElementById("facebookAdFinished");
        const title = document.getElementById("facebookAdsTitle");
        const progressEl = document.getElementById("facebookAdsProgress");

        if (frame) {
            frame.style.display = "none";
        }

        if (finished) {
            finished.style.display = "block";
        }

        if (title) {
            title.textContent = "Quảng cáo đã hoàn thành";
        }

        if (progressEl) {
            progressEl.textContent = "Đã hoàn thành đủ 2/2 bước";
        }

        updateFacebookSteps();

        updateFacebookInstruction(
            '✓ <strong>Hoàn tất quảng cáo.</strong><br>' +
            'Bạn có thể nhấn nút bên dưới để bắt đầu xem phim.'
        );
    }

    function closeFacebookAdModal() {

        if (!facebookAdsModal) {
            return;
        }

        facebookAdsModal.classList.remove("active");
        facebookAdsModal.style.display = "none";

        document.body.classList.remove("facebookAdsOpen");

        facebookAdWaiting = false;
        facebookAdHiddenAt = null;

        if (fbResizeObserver) {
            fbResizeObserver.disconnect();
            fbResizeObserver = null;
        }
    }

    document.addEventListener("visibilitychange", function () {

        if (!facebookAdsModal || !facebookAdsModal.classList.contains("active")) {
            return;
        }

        if (document.visibilityState === "hidden") {
            markFacebookAdLeft();
            return;
        }

        if (document.visibilityState === "visible") {
            checkFacebookAdReturn();
        }
    });

    window.addEventListener("pagehide", function () {

        if (!facebookAdsModal || !facebookAdsModal.classList.contains("active")) {
            return;
        }

        markFacebookAdLeft();
    });

    window.addEventListener("pageshow", function () {

        if (facebookAdWaiting) {
            checkFacebookAdReturn();
        }
    });


    /* =====================================================
       THỜI GIAN XEM THỰC TẾ

       Chỉ đếm khi: phim đã mở khóa + tab đang hiển thị
       + video đang phát.
    ===================================================== */

    function isYouTubePlaying() {

        try {

            return !!(
                player &&
                typeof player.getPlayerState === "function" &&
                window.YT &&
                player.getPlayerState() === YT.PlayerState.PLAYING
            );

        } catch (error) {

            return false;
        }
    }

    function getWatchSeconds() {

        if (localStorage.getItem(watchTimeDateKey) !== getToday()) {
            localStorage.setItem(watchTimeDateKey, getToday());
            localStorage.setItem(watchTimeKey, "0");
            return 0;
        }

        return Number(localStorage.getItem(watchTimeKey)) || 0;
    }

    function saveWatchSeconds() {
        localStorage.setItem(watchTimeKey, String(watchSeconds));
        localStorage.setItem(watchTimeDateKey, getToday());
    }

    function hasWatchedEnough() {
        return movieUnlocked && watchSeconds >= WATCH_TIME_LIMIT;
    }

    function startWatchTimer() {

        if (watchTimer) {
            return;
        }

        watchSeconds = getWatchSeconds();
        lastTick = Date.now();

        watchTimer = setInterval(function () {

            const now = Date.now();

            if (
                !movieUnlocked ||
                document.visibilityState !== "visible" ||
                !isYouTubePlaying()
            ) {
                lastTick = now;
                return;
            }

            const elapsed = Math.floor((now - lastTick) / 1000);

            if (elapsed > 0) {

                watchSeconds += elapsed;
                lastTick += elapsed * 1000;

                if (watchSeconds >= WATCH_TIME_LIMIT) {
                    watchSeconds = WATCH_TIME_LIMIT;
                }

                saveWatchSeconds();
            }

        }, 1000);
    }

    function stopWatchTimer() {

        if (watchTimer) {
            clearInterval(watchTimer);
            watchTimer = null;
        }

        saveWatchSeconds();
    }


    /* =====================================================
       REDIRECT: XEM ĐỦ 10 PHÚT

       Chạm / vuốt / bấm vào NỀN trang:
         lần 1 -> mở TikTok, lần 2 -> mở Lazada.
       Bỏ qua khi chạm vào video, nút, link, popup...
    ===================================================== */

    function openRedirectLink(url, nextStage) {

        if (!url) {
            return false;
        }

        const win = window.open(url, "_blank");

        if (!win) {
            return false;
        }

        setRedirectStage(nextStage);

        return true;
    }

    function openNextRedirect() {

        if (!hasWatchedEnough()) {
            return false;
        }

        const stage = getRedirectStage();

        if (stage === 0) {
            return openRedirectLink(TIKTOK_URL, 1);
        }

        if (stage === 1) {
            return openRedirectLink(LAZADA_URL, 2);
        }

        return false;
    }

    const REDIRECT_IGNORE_SELECTOR = [
        "a",
        "button",
        "input",
        "textarea",
        "select",
        "label",
        "iframe",
        "#movieScreen",
        "#facebookAdsModal",
        "#movieResumePopup",
        "#xoiThitPopup",
        "#messengerNoticePopup"
    ].join(",");

    function handleRedirectGesture(event) {

        if (!hasWatchedEnough() || isRedirectFinishedToday()) {
            return;
        }

        if (
            (facebookAdsModal && facebookAdsModal.classList.contains("active")) ||
            document.getElementById("movieResumePopup") ||
            document.getElementById("messengerNoticePopup")
        ) {
            return;
        }

        if (
            event.target &&
            event.target.closest &&
            event.target.closest(REDIRECT_IGNORE_SELECTOR)
        ) {
            return;
        }

        const now = Date.now();

        if (now - lastRedirectGestureAt < REDIRECT_GESTURE_COOLDOWN) {
            return;
        }

        lastRedirectGestureAt = now;

        openNextRedirect();
    }

    function initBackgroundRedirect() {

        document.addEventListener("click", handleRedirectGesture);

        document.addEventListener("touchend", handleRedirectGesture, { passive: true });

        document.addEventListener("pointerup", function (event) {

            if (event.pointerType === "mouse") {
                return;
            }

            handleRedirectGesture(event);

        }, { passive: true });
    }


    /* =====================================================
       LƯU / KHÔI PHỤC VỊ TRÍ XEM
    ===================================================== */

    function getSavedPosition() {

        const saved = parseFloat(localStorage.getItem(positionKey));

        if (!Number.isFinite(saved) || saved < 0) {
            return 0;
        }

        return saved;
    }

    function savePosition() {

        if (!mediaReady || !movieUnlocked) {
            return;
        }

        const current = mediaGetCurrentTime();
        const duration = mediaGetDuration();

        if (!Number.isFinite(current) || current < 2) {
            return;
        }

        /* Gần hết phim: xóa vị trí để lần sau xem lại từ đầu */
        if (duration > 0 && current >= duration - 5) {
            localStorage.removeItem(positionKey);
            return;
        }

        localStorage.setItem(positionKey, String(current));
    }

    function maybeShowResume() {

        if (resumeShown || !movieUnlocked || !mediaReady) {
            return;
        }

        /* Đang bị yêu cầu chuyển trình duyệt thì không hỏi xem tiếp */
        if (isMessengerBrowser()) {
            return;
        }

        resumeShown = true;

        const saved = getSavedPosition();
        const duration = mediaGetDuration();

        if (saved < RESUME_MIN_SECONDS) {
            return;
        }

        if (duration > 0 && saved > duration - RESUME_MIN_SECONDS) {
            return;
        }

        const popup = document.createElement("div");

        popup.id = "movieResumePopup";
        popup.className = "movie-popup-overlay";

        popup.innerHTML = `

            <div class="movie-popup-box" role="dialog" aria-modal="true">

                <div class="movie-popup-icon">🎬</div>

                <div class="movie-popup-title">Bạn có muốn xem tiếp?</div>

                <div class="movie-popup-text">
                    Bạn đang xem dở đến <strong>${formatTime(saved)}</strong>.
                    Bạn có muốn tiếp tục từ đoạn đó không?
                </div>

                <div class="movie-popup-buttons">

                    <button id="resumeYesBtn" class="movie-popup-btn primary" type="button">
                        ▶ Xem tiếp
                    </button>

                    <button id="resumeNoBtn" class="movie-popup-btn secondary" type="button">
                        ↩ Xem từ đầu
                    </button>

                </div>

            </div>

        `;

        document.body.appendChild(popup);

        const yes = document.getElementById("resumeYesBtn");
        const no = document.getElementById("resumeNoBtn");

        if (yes) {

            yes.addEventListener("click", function () {

                popup.remove();

                mediaSeek(saved);
                updateUI();
                mediaPlay();
            });
        }

        if (no) {

            no.addEventListener("click", function () {

                localStorage.removeItem(positionKey);

                popup.remove();

                mediaSeek(0);
                updateUI();
            });
        }
    }


    /* =====================================================
       LƯỢT XEM (SUPABASE)
    ===================================================== */

    async function increaseMovieView() {

        if (!movieUnlocked) {
            return;
        }

        if (
            !SUPABASE_URL ||
            !SUPABASE_ANON_KEY ||
            SUPABASE_URL.includes("YOUR-PROJECT")
        ) {
            return;
        }

        if (sessionStorage.getItem(viewSessionKey)) {
            return;
        }

        try {

            const response = await fetch(
                SUPABASE_URL + "/rest/v1/rpc/increment_story_view",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "apikey": SUPABASE_ANON_KEY,
                        "Authorization": "Bearer " + SUPABASE_ANON_KEY
                    },

                    body: JSON.stringify({
                        story_id: String(movieId)
                    })
                }
            );

            if (response.ok) {
                sessionStorage.setItem(viewSessionKey, "1");
            }

        } catch (error) {

            console.warn("Không thể tăng lượt xem:", error);
        }
    }


    /* =====================================================
       ĐIỀU KHIỂN PLAYER YOUTUBE
    ===================================================== */

    function mediaPlay() {

        if (player && movieUnlocked) {
            player.playVideo();
        }
    }

    function mediaPause() {

        if (player) {
            player.pauseVideo();
        }
    }

    function mediaSeek(seconds) {

        if (!player || !Number.isFinite(seconds)) {
            return;
        }

        const duration = mediaGetDuration();

        seconds = Math.max(0, seconds);

        if (duration > 0) {
            seconds = Math.min(seconds, duration);
        }

        player.seekTo(seconds, true);
    }

    function mediaGetCurrentTime() {

        try {
            return (player && player.getCurrentTime()) || 0;
        } catch (error) {
            return 0;
        }
    }

    function mediaGetDuration() {

        try {
            return (player && player.getDuration()) || 0;
        } catch (error) {
            return 0;
        }
    }

    function mediaSetSpeed(speed) {

        if (!player) {
            return;
        }

        try {
            player.setPlaybackRate(speed);
        } catch (error) {
            console.warn("Không đổi được tốc độ:", error);
        }
    }

    function togglePlay() {

        if (!mediaReady || !movieUnlocked) {
            return;
        }

        if (isYouTubePlaying()) {
            mediaPause();
        } else {
            mediaPlay();
        }
    }


    /* =====================================================
       CẬP NHẬT GIAO DIỆN
    ===================================================== */

    function setProgressVisual(percent) {

        if (!progress) {
            return;
        }

        progress.style.setProperty("--p", percent + "%");
    }

    function updateUI() {

        if (!mediaReady) {
            return;
        }

        const current = mediaGetCurrentTime();
        const duration = mediaGetDuration();

        if (currentTimeEl) {
            currentTimeEl.textContent = formatTime(current);
        }

        if (durationEl) {
            durationEl.textContent = formatTime(duration);
        }

        if (progress && !isDragging) {

            let percent = 0;

            if (duration > 0) {
                percent = (current / duration) * 100;
            }

            percent = Math.max(0, Math.min(100, percent));

            progress.value = String(percent);

            setProgressVisual(percent);
        }
    }

    function startUpdating() {

        stopUpdating();

        saveCounter = 0;

        updateTimer = setInterval(function () {

            updateUI();

            saveCounter++;

            /* Lưu vị trí mỗi ~5 giây */
            if (saveCounter >= 20) {
                saveCounter = 0;
                savePosition();
            }

        }, 250);
    }

    function stopUpdating() {

        if (updateTimer) {
            clearInterval(updateTimer);
            updateTimer = null;
        }
    }

    function onMediaStartedPlaying() {

        /* Chưa mở khóa mà video lỡ chạy: dừng ngay */
        if (!movieUnlocked) {
            mediaPause();
            return;
        }

        card.classList.add("is-playing");

        everPlayed = true;
        scheduleHideHud();

        if (playBtn) {
            playBtn.textContent = "⏸";
        }

        if (overlayBtn) {
            overlayBtn.textContent = "⏸";
        }

        /* YouTube hay reset tốc độ khi bắt đầu phát */
        mediaSetSpeed(currentSpeed);

        startUpdating();
    }

    function onMediaStoppedPlaying() {

        card.classList.remove("is-playing");

        /* Tạm dừng: giữ thanh điều khiển luôn hiện */
        if (everPlayed) {
            showHud();
        }

        if (playBtn) {
            playBtn.textContent = "▶";
        }

        if (overlayBtn) {
            overlayBtn.textContent = "▶";
        }

        stopUpdating();

        updateUI();

        savePosition();
    }


    /* =====================================================
       MEDIA SESSION (điều khiển ở màn hình khóa)
    ===================================================== */

    function setupMediaSession() {

        if (!("mediaSession" in navigator)) {
            return;
        }

        const title =
            (titleEl && titleEl.textContent.trim()) ||
            document.title ||
            "Xem phim";

        try {

            navigator.mediaSession.metadata = new MediaMetadata({
                title: title,
                artist: "Xem phim online"
            });

            navigator.mediaSession.setActionHandler("play", mediaPlay);
            navigator.mediaSession.setActionHandler("pause", mediaPause);

            navigator.mediaSession.setActionHandler("seekbackward", function () {
                mediaSeek(mediaGetCurrentTime() - 10);
            });

            navigator.mediaSession.setActionHandler("seekforward", function () {
                mediaSeek(mediaGetCurrentTime() + 10);
            });

            navigator.mediaSession.setActionHandler("seekto", function (details) {

                if (details && Number.isFinite(details.seekTime)) {
                    mediaSeek(details.seekTime);
                }
            });

        } catch (error) {

            console.warn("Trình duyệt không hỗ trợ đầy đủ Media Session API:", error);
        }
    }


    /* =====================================================
       TẠO PLAYER YOUTUBE
    ===================================================== */

    function createYouTubePlayer() {

        if (player || !window.YT || !window.YT.Player) {
            return;
        }

        const playerVars = {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            enablejsapi: 1
        };

        if (/^https?:$/.test(window.location.protocol)) {
            playerVars.origin = window.location.origin;
        }

        player = new YT.Player("youtubePlayer", {

            videoId: videoId,

            playerVars: playerVars,

            events: {
                onReady: onPlayerReady,
                onStateChange: onPlayerStateChange,
                onError: onPlayerError
            }
        });
    }

    function onPlayerReady() {

        mediaReady = true;

        card.classList.remove("is-loading");

        mediaSetSpeed(currentSpeed);

        updateUI();

        setupMediaSession();

        maybeShowResume();
    }

    function onPlayerStateChange(event) {

        if (!player || !window.YT) {
            return;
        }

        switch (event.data) {

            case YT.PlayerState.PLAYING:
                onMediaStartedPlaying();
                break;

            case YT.PlayerState.PAUSED:
                onMediaStoppedPlaying();
                break;

            case YT.PlayerState.ENDED:
                localStorage.removeItem(positionKey);
                onMediaStoppedPlaying();
                break;
        }
    }

    function onPlayerError(event) {

        console.error("YouTube Player Error:", event.data);

        card.classList.remove("is-loading");

        if (event.data === 101 || event.data === 150) {
            showMovieError("Video này không cho phép nhúng. Hãy bật cho phép nhúng trong YouTube Studio hoặc dùng video khác.");
            return;
        }

        if (event.data === 100) {
            showMovieError("Video không còn tồn tại hoặc đang ở chế độ riêng tư.");
            return;
        }

        showMovieError("Không phát được video. Hãy tải lại trang hoặc thử lại sau.");
    }

    function loadYouTubeAPI() {

        if (window.YT && window.YT.Player) {
            createYouTubePlayer();
            return;
        }

        if (document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
            return;
        }

        const oldCallback = window.onYouTubeIframeAPIReady;

        window.onYouTubeIframeAPIReady = function () {

            if (typeof oldCallback === "function") {

                try {
                    oldCallback();
                } catch (error) {
                    console.error(error);
                }
            }

            createYouTubePlayer();
        };

        const script = document.createElement("script");

        script.src = "https://www.youtube.com/iframe_api";
        script.async = true;

        document.head.appendChild(script);
    }


    /* =====================================================
       NÚT ĐIỀU KHIỂN
    ===================================================== */

    /* ---------- Thanh điều khiển nổi trên video ---------- */

    function showHud() {

        clearTimeout(hudTimer);

        card.classList.add("hud-show");
    }

    function hideHud() {

        clearTimeout(hudTimer);

        card.classList.remove("hud-show");
    }

    /* Đang phát thì tự ẩn sau vài giây, đang dừng thì giữ nguyên */
    function scheduleHideHud() {

        clearTimeout(hudTimer);

        if (!card.classList.contains("hud-show")) {
            return;
        }

        if (!isYouTubePlaying()) {
            return;
        }

        hudTimer = setTimeout(hideHud, HUD_HIDE_DELAY);
    }

    function onScreenTap() {

        /* Chưa toàn màn hình: chạm vào video = phát / tạm dừng như cũ */
        if (!card.classList.contains("fs-on")) {
            togglePlay();
            return;
        }

        /* Toàn màn hình, chưa từng phát: chạm = bắt đầu phát */
        if (!everPlayed) {
            togglePlay();
            return;
        }

        if (card.classList.contains("hud-show")) {

            /* Đang phát thì chạm lần nữa sẽ ẩn, đang dừng thì giữ */
            if (isYouTubePlaying()) {
                hideHud();
            }

            return;
        }

        showHud();
        scheduleHideHud();
    }

    /* Vào toàn màn hình: đưa thanh điều khiển vào trong video (ẩn sẵn).
       Thoát ra: trả thanh điều khiển về chỗ cũ dưới video. */

    let hudHome = null;
    let hudHomeNext = null;

    function updateFullscreenLabel() {

        const current =
            document.fullscreenElement ||
            document.webkitFullscreenElement;

        const hud = document.getElementById("movieHud");

        if (fullscreenBtn) {
            fullscreenBtn.textContent = current
                ? "⤡ Thu nhỏ màn hình"
                : "⛶ Toàn màn hình";
        }

        if (!hud || !screenEl) {
            return;
        }

        if (current === screenEl) {

            if (hud.parentNode !== screenEl) {
                hudHome = hud.parentNode;
                hudHomeNext = hud.nextSibling;
                screenEl.appendChild(hud);
            }

            hud.classList.add("in-screen");
            card.classList.add("fs-on");
            card.classList.remove("hud-show");

        } else {

            clearTimeout(hudTimer);

            hud.classList.remove("in-screen");
            card.classList.remove("fs-on");
            card.classList.remove("hud-show");

            if (hudHome && hud.parentNode !== hudHome) {
                hudHome.insertBefore(hud, hudHomeNext);
            }
        }
    }

    function initControls() {

        /* ---------- Chạm vào màn hình: hiện thanh điều khiển ---------- */

        if (overlay) {
            overlay.addEventListener("click", onScreenTap);
        }

        /* Thao tác trên thanh điều khiển thì gia hạn thời gian hiện */

        const hud = document.getElementById("movieHud");

        if (hud) {

            ["click", "touchstart", "input"].forEach(function (name) {

                hud.addEventListener(name, function () {
                    scheduleHideHud();
                }, { passive: true });

            });
        }

        document.addEventListener("fullscreenchange", updateFullscreenLabel);
        document.addEventListener("webkitfullscreenchange", updateFullscreenLabel);

        if (playBtn) {
            playBtn.addEventListener("click", togglePlay);
        }

        /* ---------- Tua 10 giây ---------- */

        if (back10Btn) {

            back10Btn.addEventListener("click", function () {

                if (!mediaReady || !movieUnlocked) {
                    return;
                }

                mediaSeek(mediaGetCurrentTime() - 10);
                updateUI();
                savePosition();
            });
        }

        if (forward10Btn) {

            forward10Btn.addEventListener("click", function () {

                if (!mediaReady || !movieUnlocked) {
                    return;
                }

                mediaSeek(mediaGetCurrentTime() + 10);
                updateUI();
                savePosition();
            });
        }

        /* ---------- Thanh tiến trình ---------- */

        if (progress) {

            progress.min = "0";
            progress.max = "100";
            progress.step = "0.1";
            progress.value = "0";

            progress.addEventListener("pointerdown", function () {
                isDragging = true;
            });

            progress.addEventListener("input", function () {

                isDragging = true;

                if (!mediaReady) {
                    return;
                }

                const percent = parseFloat(progress.value);
                const duration = mediaGetDuration();

                if (!Number.isFinite(percent) || duration <= 0) {
                    return;
                }

                const seconds = duration * (percent / 100);

                setProgressVisual(percent);

                if (currentTimeEl) {
                    currentTimeEl.textContent = formatTime(seconds);
                }

                if (bubble) {
                    bubble.textContent = formatTime(seconds);
                    bubble.style.left = percent + "%";
                    bubble.style.opacity = "1";
                }
            });

            /* "change" chỉ bắn khi người dùng thả tay */
            progress.addEventListener("change", function () {

                if (mediaReady && movieUnlocked) {

                    const percent = parseFloat(progress.value);
                    const duration = mediaGetDuration();

                    if (Number.isFinite(percent) && duration > 0) {
                        mediaSeek(duration * (percent / 100));
                        savePosition();
                    }
                }

                isDragging = false;

                if (bubble) {

                    setTimeout(function () {
                        bubble.style.opacity = "0";
                    }, 500);
                }
            });

            progress.addEventListener("pointercancel", function () {

                isDragging = false;

                if (bubble) {
                    bubble.style.opacity = "0";
                }
            });
        }

        /* ---------- Tốc độ ---------- */

        const savedSpeed = parseFloat(localStorage.getItem(speedKey));

        if (SPEEDS.indexOf(savedSpeed) !== -1) {
            currentSpeed = savedSpeed;
        }

        const speedButtons = card.querySelectorAll(".speed-btn");

        function markActiveSpeed() {

            speedButtons.forEach(function (btn) {

                const value = parseFloat(btn.getAttribute("data-speed"));

                btn.classList.toggle("active", value === currentSpeed);
            });
        }

        markActiveSpeed();

        speedButtons.forEach(function (button) {

            button.addEventListener("click", function () {

                const speed = parseFloat(button.getAttribute("data-speed"));

                if (!Number.isFinite(speed)) {
                    return;
                }

                currentSpeed = speed;

                localStorage.setItem(speedKey, String(speed));

                if (mediaReady) {
                    mediaSetSpeed(speed);
                }

                markActiveSpeed();
            });
        });

        /* ---------- Mốc xem ---------- */

        const markerAttr = card.getAttribute("data-marker");
        const markerSeconds = parseTime(markerAttr);

        if (!markerAttr || markerSeconds <= 0) {

            if (markerBox) {
                markerBox.style.display = "none";
            }

        } else {

            if (markerTimeEl) {

                markerTimeEl.textContent =
                    card.getAttribute("data-marker-label") ||
                    formatTime(markerSeconds);
            }

            if (markerBtn) {

                markerBtn.addEventListener("click", function () {

                    if (!mediaReady || !movieUnlocked) {
                        return;
                    }

                    mediaSeek(markerSeconds);
                    updateUI();
                    mediaPlay();
                });
            }
        }

        /* ---------- Toàn màn hình ---------- */

        if (fullscreenBtn) {

            const canFullscreen =
                document.fullscreenEnabled ||
                document.webkitFullscreenEnabled;

            if (!canFullscreen || !screenEl) {

                fullscreenBtn.style.display = "none";

            } else {

                fullscreenBtn.addEventListener("click", function () {

                    const current =
                        document.fullscreenElement ||
                        document.webkitFullscreenElement;

                    if (current) {

                        const exit =
                            document.exitFullscreen ||
                            document.webkitExitFullscreen;

                        if (exit) {
                            exit.call(document);
                        }

                        return;
                    }

                    const request =
                        screenEl.requestFullscreen ||
                        screenEl.webkitRequestFullscreen;

                    if (request) {
                        request.call(screenEl);
                    }
                });
            }
        }
    }


    /* =====================================================
       POPUP XÔI THỊT
    ===================================================== */

    function initXoiThitPopup() {

        const link = document.getElementById("xoiThitLink");
        const popup = document.getElementById("xoiThitPopup");
        const yes = document.getElementById("xoiThitYes");
        const no = document.getElementById("xoiThitNo");

        if (!link || !popup) {
            return;
        }

        link.addEventListener("click", function (event) {

            event.preventDefault();

            popup.style.display = "flex";
        });

        if (yes) {

            yes.addEventListener("click", function () {
                window.location.href = XOI_THIT_URL;
            });
        }

        if (no) {

            no.addEventListener("click", function () {
                popup.style.display = "none";
            });
        }

        popup.addEventListener("click", function (event) {

            if (event.target === popup) {
                popup.style.display = "none";
            }
        });
    }


    /* =====================================================
       LƯU VỊ TRÍ KHI RỜI TRANG / ẨN TAB
    ===================================================== */

    function initSaveOnLeave() {

        /* Bấm link nội bộ: lưu ngay trước khi chuyển trang */
        document.addEventListener("click", function (event) {

            const link = event.target.closest("a[href]");

            if (!link || link.target === "_blank" || event.defaultPrevented) {
                return;
            }

            savePosition();

        }, true);

        window.addEventListener("pagehide", function () {
            savePosition();
            stopWatchTimer();
        });

        document.addEventListener("visibilitychange", function () {

            if (document.visibilityState === "hidden") {

                savePosition();

            } else {

                lastTick = Date.now();
            }
        });
    }


    /* =====================================================
       KHỞI TẠO
    ===================================================== */

    function init() {

        /* Android + trình duyệt Facebook/Messenger: tự mở Chrome */
        if (isMessengerBrowser() && isAndroid()) {
            openInChrome();
        }

        resetDailyDataIfNeeded();

        card.classList.add("is-loading");

        initControls();

        if (isFacebookAdsCompletedToday() || isUnlockedToday()) {

            markUnlockedToday();
            unlockMovie();

        } else {

            lockMovie();
            startFacebookAdFlow();
        }

        /* Đang mở bằng trình duyệt Facebook/Messenger: yêu cầu chuyển sang
           Chrome/Safari (hiện cả với người đã mở khóa, popup chặn phía sau) */
        showMessengerNotice();

        initXoiThitPopup();
        initBackgroundRedirect();
        initSaveOnLeave();

        startWatchTimer();

        loadYouTubeAPI();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

})();