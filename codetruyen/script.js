if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
}

let scrollTrackingReady = true;

/* =========================================================
   QUẢNG CÁO FACEBOOK
========================================================= */

const FACEBOOK_ADS = {
    shopee: {
        title: "Quảng cáo Shopee",
        url: "https://www.facebook.com/photo/?fbid=122118782913467824&set=pcb.122118783141467824&locale=vi_VN"
    },
    shopeefood: {
        title: "Quảng cáo ShopeeFood",
        url: "https://www.facebook.com/photo/?fbid=122118783639467824&set=pcb.122118783783467824&locale=vi_VN"
    }
};

/* =========================================================
   KÍCH THƯỚC THIẾT KẾ CỦA KHUNG FACEBOOK

   Khung luôn được dựng ở 480 x 355 (giống máy tính),
   rồi thu phóng bằng transform: scale() cho vừa màn hình.
   => Điện thoại hiện giống hệt máy tính, chỉ nhỏ hơn.
========================================================= */

const FB_DESIGN_WIDTH = 480;
const FB_DESIGN_HEIGHT = 355;

/* =========================================================
   VÙNG CHO PHÉP CLICK TRONG BÀI FACEBOOK

   TOÀN BỘ số ở đây tính theo hệ 480 x 355 (không phải px thật),
   nên điện thoại và máy tính dùng chung 1 bộ số.

   top    = khoảng cách từ mép trên khung tới đầu dòng link
   height = chiều cao dòng link
   left   = khoảng cách từ mép trái khung tới đầu chữ link
   width  = chiều rộng chữ link

   Chỉ vùng này bấm xuyên xuống được link. Ngoài vùng bị chặn.

   Đã đo từ ảnh chụp thật: dòng link https://s.shopee.vn/...
   nằm ở y ≈ 66 → 88, x ≈ 8 → 218 (hệ 480 x 355).

   CÁCH CHỈNH: đặt FACEBOOK_ZONE_DEBUG = true → vùng chặn hiện
   màu đỏ, phần trong suốt ở giữa là vùng bấm được. Chỉnh số sao
   cho khe trong suốt nằm đúng dòng link, xong đặt lại false.
========================================================= */

const FACEBOOK_ZONE_DEBUG = false;

const FACEBOOK_CLICK_ZONE = {
    shopee: { top: 66, height: 24, left: 8, width: 212 },
    shopeefood: { top: 66, height: 24, left: 8, width: 212 }
};

/* =========================================================
   LINK REDIRECT (mở lần lượt: TikTok -> Lazada)
========================================================= */

const TIKTOK_URL = "https://shop.tiktok.com/vn/pdp/1732783764793230583?_t=ZS-9AEgaeOhV1p";
const LAZADA_URL = "https://s.lazada.vn/s.okH5n?c=d&t=p-i1ME0Lk-sEGIPzZ";

/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

/* =========================================================
   CẤU HÌNH
========================================================= */

const FACEBOOK_SHOPEE_MIN_LEAVE_TIME = 3000;
const FACEBOOK_SHOPEEFOOD_MIN_LEAVE_TIME = 0;

/* Đọc đủ 10 phút (tính bằng giây) thì mới kích hoạt link TikTok/Lazada */
const ACTIVE_TIME_LIMIT = 10 * 60;

/* =========================================================
   LOCAL STORAGE KEYS
========================================================= */

const unlockDateKey = "reader_unlock_date";
const unlockTimeKey = "reader_unlock_time";
const redirectStageKey = "reader_redirect_stage";
const redirectDateKey = "reader_redirect_date";
const activeTimeKey = "reader_active_time";
const activeTimeDateKey = "reader_active_time_date";
const facebookAdStageKey = "reader_facebook_ad_stage";
const facebookAdStageDateKey = "reader_facebook_ad_stage_date";
const facebookAdCompletedDateKey = "reader_facebook_ad_completed_date";
const facebookAdStartedKey = "reader_facebook_ad_started";
const facebookAdLeftKey = "reader_facebook_ad_left";
const redirectLeavingKey = "reader_redirect_leaving";

/* =========================================================
   STORY ID
========================================================= */

const urlParams = new URLSearchParams(window.location.search);
const storyId = urlParams.get("id") || window.location.pathname;

const readingPositionKey = "reader_position_" + storyId;
const audioPositionKey = "reader_audio_position_" + storyId;
const readingSessionKey = "reading_session_" + storyId;

/* =========================================================
   BIẾN TOÀN CỤC
========================================================= */

let facebookAdsModal = null;
let facebookAdHiddenAt = null;
let facebookAdWaiting = false;
let facebookAdCurrentType = null;

let fbResizeObserver = null;

let activeSeconds = 0;
let activeTimer = null;
let lastActiveTimestamp = null;

let storyUnlocked = false;
let resumePopupShown = false;

/* =========================================================
   NGÀY VIỆT NAM
========================================================= */

function getToday() {
    return new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Ho_Chi_Minh"
    });
}

/* =========================================================
   CẢNH BÁO MESSENGER

   Trình duyệt trong Messenger không ghi nhận được việc
   rời trang / quay lại khi bấm link Shopee, nên quảng cáo
   sẽ không được tính. Popup này hướng dẫn người đọc bấm
   nút 3 chấm để mở bằng trình duyệt (Chrome / Safari).

   Chỉ nhận diện Messenger. Facebook không bị ảnh hưởng.
   CSS của popup được chèn ngay trong JS, không cần sửa file CSS.
========================================================= */

function isMessengerBrowser() {

    const ua = navigator.userAgent || navigator.vendor || "";

    return /FB_IAB\/MESSENGER|FBAN\/Messenger|MessengerForiOS|MessengerLite|Orca-Android/i.test(ua);
}

function injectMessengerNoticeStyle() {

    if (document.getElementById("messengerNoticeStyle")) {
        return;
    }

    const style = document.createElement("style");

    style.id = "messengerNoticeStyle";

    style.textContent = `
        #messengerNoticePopup {
            position: fixed;
            inset: 0;
            z-index: 1000000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 18px;
            background: rgba(0, 0, 0, 0.82);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
        }

        .messenger-notice-box {
            width: 100%;
            max-width: 400px;
            max-height: calc(100vh - 36px);
            max-height: calc(100dvh - 36px);
            overflow-y: auto;
            padding: 26px 20px 20px;
            background: #1d1d1d;
            border: 1px solid #333333;
            border-radius: 18px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
            font-family: Arial, sans-serif;
        }

        .messenger-notice-icon {
            font-size: 44px;
            line-height: 1;
            margin-bottom: 10px;
        }

        .messenger-notice-title {
            color: #ff7043;
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 12px;
            line-height: 1.3;
        }

        .messenger-notice-text {
            color: #cccccc;
            font-size: 14px;
            line-height: 1.65;
            margin-bottom: 14px;
        }

        .messenger-notice-text strong {
            color: #ff9b7a;
        }

        .messenger-notice-steps {
            margin: 0 0 16px;
            padding: 12px 14px;
            text-align: left;
            background: rgba(255, 112, 67, 0.07);
            border: 1px solid rgba(255, 112, 67, 0.2);
            border-radius: 10px;
            color: #dddddd;
            font-size: 14px;
            line-height: 1.7;
        }

        .messenger-notice-steps b {
            color: #ffffff;
        }

        .messenger-notice-buttons {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .messenger-notice-btn {
            width: 100%;
            min-height: 46px;
            border: none;
            border-radius: 10px;
            font-size: 15px;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.15s ease, opacity 0.15s ease;
        }

        .messenger-notice-btn:hover {
            transform: translateY(-1px);
            opacity: 0.92;
        }

        .messenger-notice-copy {
            background: #ff5722;
            color: #ffffff;
        }

        .messenger-notice-close {
            background: #333333;
            color: #dddddd;
        }

        @media (max-width: 380px) {
            .messenger-notice-box {
                padding: 22px 14px 16px;
            }

            .messenger-notice-title {
                font-size: 18px;
            }

            .messenger-notice-text,
            .messenger-notice-steps {
                font-size: 13px;
            }
        }
    `;

    document.head.appendChild(style);
}

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

            alert("Không thể tự sao chép. Link truyện:\n" + url);
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

    injectMessengerNoticeStyle();

    const popup = document.createElement("div");

    popup.id = "messengerNoticePopup";

    popup.innerHTML = `

        <div class="messenger-notice-box" role="dialog" aria-modal="true">

            <div class="messenger-notice-icon">⚠️</div>

            <div class="messenger-notice-title">
                Bạn đang mở bằng Messenger
            </div>

            <div class="messenger-notice-text">
                Trình duyệt trong Messenger <strong>không ghi nhận được quảng cáo Shopee</strong>,
                nên bạn sẽ không mở khóa được truyện.
                Hãy chuyển sang trình duyệt (Chrome / Safari) để đọc bình thường.
            </div>

            <div class="messenger-notice-steps">
                <b>Cách chuyển:</b><br>
                1. Bấm nút <b>⋯ (3 chấm)</b> ở góc trên bên phải<br>
                2. Chọn <b>"Mở trong trình duyệt"</b><br>
                &nbsp;&nbsp;&nbsp;(hoặc <b>"Mở bằng Chrome" / "Mở bằng Safari"</b>)
            </div>

            <div class="messenger-notice-buttons">

                <button id="messengerCopyBtn" class="messenger-notice-btn messenger-notice-copy" type="button">
                    📋 Sao chép link
                </button>

                <button id="messengerCloseBtn" class="messenger-notice-btn messenger-notice-close" type="button">
                    Đã hiểu
                </button>

            </div>

        </div>

    `;

    document.body.appendChild(popup);

    const copyBtn = document.getElementById("messengerCopyBtn");
    const closeBtn = document.getElementById("messengerCloseBtn");

    if (copyBtn) {

        copyBtn.addEventListener("click", function () {
            copyPageLink(copyBtn);
        });
    }

    if (closeBtn) {

        closeBtn.addEventListener("click", function () {
            popup.remove();
        });
    }
}

/* =========================================================
   RESET DATA MỖI NGÀY
========================================================= */

function resetDailyDataIfNeeded() {

    const today = getToday();

    const savedDate = localStorage.getItem(facebookAdStageDateKey);

    if (savedDate !== today) {

        localStorage.removeItem(facebookAdStageKey);
        localStorage.removeItem(facebookAdCompletedDateKey);
        localStorage.removeItem(facebookAdStartedKey);
        localStorage.removeItem(facebookAdLeftKey);
        localStorage.removeItem(redirectStageKey);
        localStorage.removeItem(redirectDateKey);
        localStorage.removeItem(redirectLeavingKey);
        localStorage.removeItem(unlockDateKey);
        localStorage.removeItem(unlockTimeKey);

        localStorage.setItem(facebookAdStageDateKey, today);
    }

    const activeDate = localStorage.getItem(activeTimeDateKey);

    if (activeDate !== today) {

        localStorage.removeItem(activeTimeKey);
        localStorage.setItem(activeTimeDateKey, today);
    }
}

/* =========================================================
   MỞ KHÓA HÔM NAY
========================================================= */

function isUnlockedToday() {
    return localStorage.getItem(unlockDateKey) === getToday();
}

function markUnlockedToday() {
    localStorage.setItem(unlockDateKey, getToday());
    localStorage.setItem(unlockTimeKey, Date.now().toString());
    storyUnlocked = true;
}

/* =========================================================
   STAGE FACEBOOK
   0 = chưa xong Shopee
   1 = xong Shopee
   2 = xong ShopeeFood
   3 = xong toàn bộ
========================================================= */

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

/* =========================================================
   STAGE REDIRECT
   0 = chưa mở gì
   1 = đã mở TikTok
   2 = đã mở Lazada (xong)
========================================================= */

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

/* =========================================================
   KHÓA / MỞ TRUYỆN
   (không ẩn #lockedContent, chỉ phủ lớp quảng cáo)
========================================================= */

function lockStory() {
    storyUnlocked = false;
    document.body.classList.add("facebookStoryLocked");
}

function unlockStory() {
    storyUnlocked = true;
    document.body.classList.remove("facebookStoryLocked");
    increaseStoryView();
}

function checkStoryLock() {

    resetDailyDataIfNeeded();

    if (isFacebookAdsCompletedToday() || isUnlockedToday()) {
        markUnlockedToday();
        unlockStory();
        return true;
    }

    lockStory();
    startFacebookAdFlow();
    return false;
}

/* =========================================================
   TẠO MODAL FACEBOOK
========================================================= */

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
                    Vui lòng hoàn thành quảng cáo để tiếp tục đọc
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
                <div id="facebookFinishedIcon" class="facebookFinishedIcon">✓</div>
                <p id="facebookFinishedText" class="facebookFinishedText">
                    Bạn đã hoàn thành 2 bước quảng cáo.
                    Bây giờ có thể tắt quảng cáo và đọc truyện.
                </p>
                <button id="facebookAdCloseButton" type="button">
                    ✕ TẮT QUẢNG CÁO → ĐỌC TRUYỆN
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
            unlockStory();

            /* Bắt đầu tính giờ đọc từ lúc này */
            lastActiveTimestamp = Date.now();
        });
    }

    return modal;
}

/* =========================================================
   THU PHÓNG KHUNG FACEBOOK CHO VỪA MÀN HÌNH
========================================================= */

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

/* =========================================================
   IFRAME FACEBOOK

   Cấu trúc:
   #facebookAdFrame
     └─ .fbScaler (480 x 355, bị scale)
          ├─ iframe (480 rộng)
          └─ 4 lớp chặn (toạ độ theo hệ 480 x 355)

   Lớp chặn nằm TRONG .fbScaler nên co giãn cùng bài Facebook,
   luôn khớp dòng link trên cả máy tính lẫn điện thoại.
========================================================= */

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

    scaler.appendChild(iframe);

    const zone = FACEBOOK_CLICK_ZONE[facebookAdCurrentType];

    if (zone) {

        const maskBase =
            "position:absolute;z-index:5;cursor:default;" +
            "-webkit-tap-highlight-color:transparent;" +
            (FACEBOOK_ZONE_DEBUG
                ? "background:rgba(255,0,0,.35);"
                : "background:transparent;");

        const zoneBottom = zone.top + zone.height;
        const zoneRight = zone.left + zone.width;

        /* trên, dưới, trái, phải — chừa đúng ô chứa link ở giữa */
        const maskCss = [
            "top:0;left:0;right:0;height:" + zone.top + "px;",
            "top:" + zoneBottom + "px;left:0;right:0;bottom:0;",
            "top:" + zone.top + "px;left:0;width:" + zone.left + "px;height:" + zone.height + "px;",
            "top:" + zone.top + "px;left:" + zoneRight + "px;right:0;height:" + zone.height + "px;"
        ];

        maskCss.forEach(function (css) {

            const mask = document.createElement("div");

            mask.style.cssText = maskBase + css;

            /* chặn click / chạm, không cho xuyên xuống bài Facebook */
            mask.addEventListener("click", function (event) {
                event.preventDefault();
                event.stopPropagation();
            });

            scaler.appendChild(mask);
        });
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

/* =========================================================
   CẬP NHẬT 2 BƯỚC
========================================================= */

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

    if (!instruction) {
        return;
    }

    instruction.innerHTML = message;
}

/* =========================================================
   HIỂN THỊ 1 QUẢNG CÁO (dùng chung Shopee / ShopeeFood)
========================================================= */

function showFacebookAdStep(type, titleText, progressText, instructionHtml, url) {

    facebookAdCurrentType = type;
    facebookAdWaiting = false;
    facebookAdHiddenAt = null;

    const title = document.getElementById("facebookAdsTitle");
    const progress = document.getElementById("facebookAdsProgress");

    if (title) {
        title.textContent = titleText;
    }

    if (progress) {
        progress.textContent = progressText;
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

    /* tính lại tỉ lệ sau khi khung hiện ra */
    fitFacebookFrame();
}

function openShopeeAd() {

    showFacebookAdStep(
        "shopee",
        "Quảng cáo Shopee",
        "Bước 1/2 — Hãy mở quảng cáo và ở lại ít nhất 3 giây rồi quay lại",
        '👉 <strong>Hãy mở quảng cáo Shopee và ở lại ít nhất 3 giây rồi quay lại đây.</strong><br>' +
        'Đây là bước 1/2. Sau khi quay lại, hệ thống sẽ kiểm tra thời gian.',
        FACEBOOK_ADS.shopee.url
    );
}

function openShopeeFoodAd() {

    showFacebookAdStep(
        "shopeefood",
        "Quảng cáo ShopeeFood",
        "Bước 2/2 — Hãy mở quảng cáo rồi quay lại",
        '👉 <strong>Hãy mở quảng cáo ShopeeFood rồi quay lại đây.</strong><br>' +
        'Đây là bước 2/2. Sau khi quay lại, hệ thống sẽ kiểm tra và hoàn tất.',
        FACEBOOK_ADS.shopeefood.url
    );
}

/* =========================================================
   BẮT ĐẦU FACEBOOK ADS
========================================================= */

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

/* =========================================================
   GHI NHẬN RỜI TRANG
========================================================= */

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

/* =========================================================
   KIỂM TRA QUAY LẠI
========================================================= */

function checkFacebookAdReturn() {

    if (!facebookAdWaiting) {
        return;
    }

    if (facebookAdHiddenAt === null) {
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

/* =========================================================
   HOÀN THÀNH TỪNG BƯỚC
========================================================= */

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

        return;
    }
}

/* =========================================================
   HIỆN HOÀN TẤT
========================================================= */

function showFacebookAdFinished() {

    const frame = document.getElementById("facebookAdFrame");
    const finished = document.getElementById("facebookAdFinished");
    const title = document.getElementById("facebookAdsTitle");
    const progress = document.getElementById("facebookAdsProgress");

    if (frame) {
        frame.style.display = "none";
    }

    if (finished) {
        finished.style.display = "block";
    }

    if (title) {
        title.textContent = "Quảng cáo đã hoàn thành";
    }

    if (progress) {
        progress.textContent = "Đã hoàn thành đủ 2/2 bước";
    }

    updateFacebookSteps();

    updateFacebookInstruction(
        '✓ <strong>Hoàn tất quảng cáo.</strong><br>' +
        'Bạn có thể nhấn nút bên dưới để bắt đầu đọc truyện.'
    );
}

/* =========================================================
   ĐÓNG MODAL
========================================================= */

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

/* =========================================================
   THEO DÕI TAB / TRANG (quảng cáo Facebook)
========================================================= */

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

/* =========================================================
   ACTIVE TIME (thời gian đọc thực tế)

   CHỈ ĐẾM KHI:
   - truyện đã mở khóa (đã xong quảng cáo Shopee + ShopeeFood)
   - tab đang hiển thị
========================================================= */

function getActiveSeconds() {

    if (localStorage.getItem(activeTimeDateKey) !== getToday()) {
        localStorage.setItem(activeTimeDateKey, getToday());
        localStorage.setItem(activeTimeKey, "0");
        return 0;
    }

    return Number(localStorage.getItem(activeTimeKey)) || 0;
}

function saveActiveSeconds() {
    localStorage.setItem(activeTimeKey, String(activeSeconds));
    localStorage.setItem(activeTimeDateKey, getToday());
}

function hasReadEnough() {
    return storyUnlocked && activeSeconds >= ACTIVE_TIME_LIMIT;
}

function startActiveTime() {

    if (activeTimer) {
        return;
    }

    activeSeconds = getActiveSeconds();
    lastActiveTimestamp = Date.now();

    activeTimer = setInterval(function () {

        /* Chưa mở khóa hoặc đang ẩn tab: không tính giờ */
        if (document.visibilityState !== "visible" || !storyUnlocked) {
            lastActiveTimestamp = Date.now();
            return;
        }

        const now = Date.now();
        const elapsed = Math.floor((now - lastActiveTimestamp) / 1000);

        if (elapsed > 0) {

            activeSeconds += elapsed;

            /* Giữ phần lẻ để không bị mất giây */
            lastActiveTimestamp += elapsed * 1000;

            if (activeSeconds >= ACTIVE_TIME_LIMIT) {
                activeSeconds = ACTIVE_TIME_LIMIT;
            }

            saveActiveSeconds();
        }

    }, 1000);
}

function stopActiveTime() {

    if (activeTimer) {
        clearInterval(activeTimer);
        activeTimer = null;
    }

    saveActiveSeconds();
}

/* =========================================================
   REDIRECT: SAU KHI ĐỌC ĐỦ 10 PHÚT
   Bấm vào NỀN trang:
     lần 1 → mở TikTok
     lần 2 → mở Lazada
   Sau đó không mở nữa (trong ngày).
========================================================= */

function openRedirectLink(url, nextStage) {

    if (!url) {
        return false;
    }

    localStorage.setItem(redirectLeavingKey, Date.now().toString());

    const win = window.open(url, "_blank");

    /* Trình duyệt chặn popup → không tính là đã mở */
    if (!win) {
        localStorage.removeItem(redirectLeavingKey);
        return false;
    }

    setRedirectStage(nextStage);

    return true;
}

/* Mở bước tiếp theo theo thứ tự TikTok → Lazada */
function openNextRedirect() {

    if (!hasReadEnough()) {
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

/* Các phần tử KHÔNG được coi là "nền" */
const REDIRECT_IGNORE_SELECTOR = [
    "a",
    "button",
    "input",
    "textarea",
    "select",
    "label",
    "audio",
    "video",
    "iframe",
    "[data-audio]",
    "#facebookAdsModal",
    "#readerResumePopup",
    "#xoiThitPopup",
    "#messengerNoticePopup"
].join(",");

function initBackgroundRedirect() {

    document.addEventListener("click", function (event) {

        /* Chưa mở khóa / chưa đọc đủ 10 phút / đã xong cả hai link */
        if (!hasReadEnough() || isRedirectFinishedToday()) {
            return;
        }

        /* Đang hiện quảng cáo Facebook hoặc popup đọc tiếp */
        if (
            (facebookAdsModal && facebookAdsModal.classList.contains("active")) ||
            document.getElementById("readerResumePopup")
        ) {
            return;
        }

        /* Chỉ nhận click vào nền, bỏ qua nút/link/audio... */
        if (event.target.closest(REDIRECT_IGNORE_SELECTOR)) {
            return;
        }

        openNextRedirect();

    });
}

/* Nút tiktok-read / lazada-read (nếu có trong HTML) */
function initRedirectButtons() {

    const tiktokButton = document.getElementById("tiktok-read");
    const lazadaButton = document.getElementById("lazada-read");

    if (tiktokButton) {

        tiktokButton.addEventListener("click", function () {

            if (!hasReadEnough()) {
                showNotEnoughTime();
                return;
            }

            if (getRedirectStage() >= 1) {
                return;
            }

            openRedirectLink(TIKTOK_URL, 1);
        });
    }

    if (lazadaButton) {

        lazadaButton.addEventListener("click", function () {

            if (!hasReadEnough()) {
                showNotEnoughTime();
                return;
            }

            if (getRedirectStage() < 1) {
                alert("Hãy mở link TikTok trước.");
                return;
            }

            if (getRedirectStage() >= 2) {
                return;
            }

            openRedirectLink(LAZADA_URL, 2);
        });
    }
}

function showNotEnoughTime() {

    const remain = Math.max(0, ACTIVE_TIME_LIMIT - activeSeconds);
    const m = Math.floor(remain / 60);
    const s = remain % 60;

    alert("Bạn cần đọc thêm " + m + " phút " + s + " giây nữa để mở link.");
}

/* =========================================================
   LƯU / KHÔI PHỤC VỊ TRÍ ĐỌC
========================================================= */

function saveReadingPosition() {

    if (!storyUnlocked) {
        return;
    }

    if (!scrollTrackingReady) {
        return;
    }

    localStorage.setItem(readingPositionKey, String(window.scrollY));
}

function restoreReadingPosition() {

    const saved = localStorage.getItem(readingPositionKey);

    if (saved === null) {
        return;
    }

    const position = Number(saved);

    if (!Number.isFinite(position) || position <= 0) {
        return;
    }

    setTimeout(function () {

        window.scrollTo({
            top: position,
            behavior: "auto"
        });

    }, 300);
}

/* =========================================================
   AUDIO
========================================================= */

function saveAudioPosition(audio) {

    if (!audio) {
        return;
    }

    if (!storyUnlocked) {
        return;
    }

    if (!Number.isFinite(audio.currentTime)) {
        return;
    }

    localStorage.setItem(audioPositionKey, String(audio.currentTime));
}

function restoreAudioPosition() {

    const audio = document.querySelector("audio");

    if (!audio) {
        return;
    }

    const saved = localStorage.getItem(audioPositionKey);

    if (saved === null) {
        return;
    }

    const position = Number(saved);

    if (!Number.isFinite(position) || position <= 0) {
        return;
    }

    const restore = function () {

        try {

            if (position < audio.duration) {
                audio.currentTime = position;
            }

        } catch (error) {

            console.warn("Không thể khôi phục audio:", error);
        }
    };

    if (audio.readyState >= 1) {
        restore();
    } else {
        audio.addEventListener("loadedmetadata", restore, { once: true });
    }
}

/* =========================================================
   POPUP ĐỌC TIẾP
========================================================= */

function showResumePopup() {

    if (resumePopupShown) {
        return;
    }

    resumePopupShown = true;

    const saved = localStorage.getItem(readingPositionKey);

    if (!saved || Number(saved) <= 50) {
        return;
    }

    /* Khóa lưu scroll trong lúc chờ người dùng trả lời */
    scrollTrackingReady = false;

    const popup = document.createElement("div");

    popup.id = "readerResumePopup";

    popup.innerHTML = `

        <div class="reader-resume-overlay">

            <div class="reader-resume-box">

                <div class="reader-resume-icon">📖</div>

                <div class="reader-resume-title">Bạn có muốn đọc tiếp?</div>

                <div class="reader-resume-description">
                    Hệ thống đã lưu vị trí đọc trước đó.
                    Bạn có muốn tiếp tục từ vị trí đó không?
                </div>

                <div class="reader-resume-buttons">

                    <button id="resumeYesBtn" class="reader-resume-btn reader-resume-yes" type="button">
                        ▶ Đọc tiếp
                    </button>

                    <button id="resumeNoBtn" class="reader-resume-btn reader-resume-no" type="button">
                        ↩ Đọc từ đầu
                    </button>

                </div>

            </div>

        </div>

    `;

    document.body.appendChild(popup);

    const yes = document.getElementById("resumeYesBtn");
    const no = document.getElementById("resumeNoBtn");

    if (yes) {

        yes.addEventListener("click", function () {

            popup.remove();

            restoreReadingPosition();

            setTimeout(function () {
                scrollTrackingReady = true;
            }, 400);
        });
    }

    if (no) {

        no.addEventListener("click", function () {

            localStorage.removeItem(readingPositionKey);
            localStorage.removeItem(audioPositionKey);

            const audio = document.querySelector("audio");

            if (audio) {

                try {
                    audio.currentTime = 0;
                    audio.pause();
                } catch (error) {
                    console.warn("Không thể đưa audio về đầu:", error);
                }
            }

            window.scrollTo({
                top: 0,
                behavior: "auto"
            });

            popup.remove();

            scrollTrackingReady = true;
        });
    }
}

/* =========================================================
   SCROLL
========================================================= */

let saveScrollTimer = null;

window.addEventListener("scroll", function () {

    if (!storyUnlocked) {
        return;
    }

    if (!scrollTrackingReady) {
        return;
    }

    if (saveScrollTimer) {
        clearTimeout(saveScrollTimer);
    }

    saveScrollTimer = setTimeout(saveReadingPosition, 500);

}, { passive: true });

/* =========================================================
   SUPABASE - TĂNG LƯỢT XEM
========================================================= */

async function increaseStoryView() {

    if (!storyUnlocked) {
        return;
    }

    if (
        !SUPABASE_URL ||
        !SUPABASE_ANON_KEY ||
        SUPABASE_URL.includes("YOUR-PROJECT")
    ) {
        return;
    }

    if (sessionStorage.getItem(readingSessionKey)) {
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
                    story_id: String(storyId)
                })
            }
        );

        if (response.ok) {
            sessionStorage.setItem(readingSessionKey, "1");
        }

    } catch (error) {

        console.warn("Không thể tăng lượt xem:", error);
    }
}

/* =========================================================
   POPUP XÔI THỊT
========================================================= */

function initXoiThitPopup() {

    const popup = document.getElementById("xoiThitPopup");

    if (!popup) {
        return;
    }

    const yes = document.getElementById("xoiThitYes");
    const no = document.getElementById("xoiThitNo");

    if (yes) {

        yes.addEventListener("click", function () {
            window.location.href = "https://truyenxoithitmiumiu.nekoweb.org/";
        });
    }

    if (no) {

        no.addEventListener("click", function () {
            popup.style.display = "none";
        });
    }
}

/* =========================================================
   LINK NỘI BỘ
========================================================= */

function initInternalNavigation() {

    document.addEventListener("click", function (event) {

        const link = event.target.closest("a");

        if (!link) {
            return;
        }

        const href = link.getAttribute("href");

        if (
            !href ||
            href.startsWith("#") ||
            href.startsWith("javascript:") ||
            href.startsWith("http://") ||
            href.startsWith("https://")
        ) {
            return;
        }

        saveReadingPosition();
    });
}

/* =========================================================
   AUDIO MARKER
========================================================= */

function initAudioMarkers() {

    const audioCards = document.querySelectorAll("[data-audio]");

    if (!audioCards.length) {
        return;
    }

    audioCards.forEach(function (card) {

        const markerButton = card.querySelector("#markerBtn");

        if (!markerButton) {
            return;
        }

        markerButton.addEventListener("click", function (event) {

            event.stopPropagation();

            const audio = document.querySelector("audio");

            if (!audio) {
                return;
            }

            const marker = Number(card.dataset.marker);

            if (!Number.isFinite(marker)) {
                return;
            }

            audio.currentTime = marker;

            audio.play().catch(function () {});
        });
    });
}

function initAudio() {

    const audio = document.querySelector("audio");

    if (!audio) {
        return;
    }

    restoreAudioPosition();

    audio.addEventListener("timeupdate", function () {
        saveAudioPosition(audio);
    });

    window.addEventListener("beforeunload", function () {
        saveAudioPosition(audio);
    });
}

/* =========================================================
   KHỞI TẠO
========================================================= */

function initReader() {

    resetDailyDataIfNeeded();

    if (isFacebookAdsCompletedToday() || isUnlockedToday()) {

        markUnlockedToday();
        unlockStory();

    } else {

        lockStory();
        startFacebookAdFlow();

        /* Đang mở bằng Messenger: báo người đọc chuyển sang trình duyệt */
        showMessengerNotice();
    }

    initXoiThitPopup();
    initRedirectButtons();
    initBackgroundRedirect();
    initInternalNavigation();
    initAudioMarkers();
    initAudio();

    startActiveTime();

    if (storyUnlocked) {

        setTimeout(function () {
            showResumePopup();
        }, 800);
    }
}

/* =========================================================
   LƯU TRƯỚC KHI RỜI TRANG
========================================================= */

window.addEventListener("beforeunload", function () {

    saveReadingPosition();
    stopActiveTime();

    const audio = document.querySelector("audio");

    if (audio) {
        saveAudioPosition(audio);
    }
});

/* =========================================================
   KHI TAB HIỆN / ẨN
========================================================= */

document.addEventListener("visibilitychange", function () {

    if (document.visibilityState === "visible") {

        lastActiveTimestamp = Date.now();

    } else {

        saveReadingPosition();

        const audio = document.querySelector("audio");

        if (audio) {
            saveAudioPosition(audio);
        }
    }
});

/* =========================================================
   CHỜ DOM
========================================================= */

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initReader);
} else {
    initReader();
}