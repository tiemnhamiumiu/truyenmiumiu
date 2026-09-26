
if ("scrollRestoration" in history) {

    history.scrollRestoration = "manual";

}

let scrollTrackingReady = true;


const FACEBOOK_ADS = {

    shopee: {
        title: "Quảng cáo Shopee",

        url:
            "https://www.facebook.com/photo/?fbid=122114034549467824&set=pcb.122114034717467824&locale=vi_VN"
    },

    shopeefood: {
        title: "Quảng cáo ShopeeFood",

        url:
            "https://www.facebook.com/permalink.php?story_fbid=pfbid02igsynfyc8SmkPpvUk2Kbvyhxb4B6BCkMuJdERqeGx3bcEEdz2s3ju54Lf83PXj6Yl&id=61594034743775&locale=vi_VN"
    }

};


/* =========================================================
   LINK REDIRECT
========================================================= */

const TIKTOK_URL = "";
const LAZADA_URL = "";


/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
    "https://YOUR-PROJECT.supabase.co";

const SUPABASE_ANON_KEY =
    "YOUR_SUPABASE_ANON_KEY";


/* =========================================================
   CẤU HÌNH QUẢNG CÁO
========================================================= */

/*
   CẢ HAI QUẢNG CÁO ĐỀU PHẢI RỜI TRANG ÍT NHẤT 3 GIÂY.
*/

const FACEBOOK_SHOPEE_MIN_LEAVE_TIME = 3000;

const FACEBOOK_SHOPEEFOOD_MIN_LEAVE_TIME = 0;


/*
   Thời gian đọc thực tế tối đa.
*/

const ACTIVE_TIME_LIMIT = 10 * 60;


/* =========================================================
   LOCAL STORAGE KEYS
========================================================= */

const unlockDateKey =
    "reader_unlock_date";

const unlockTimeKey =
    "reader_unlock_time";

const redirectStageKey =
    "reader_redirect_stage";

const redirectDateKey =
    "reader_redirect_date";

const activeTimeKey =
    "reader_active_time";

const activeTimeDateKey =
    "reader_active_time_date";

const facebookAdStageKey =
    "reader_facebook_ad_stage";

const facebookAdStageDateKey =
    "reader_facebook_ad_stage_date";

const facebookAdCompletedDateKey =
    "reader_facebook_ad_completed_date";

const facebookAdStartedKey =
    "reader_facebook_ad_started";

const facebookAdLeftKey =
    "reader_facebook_ad_left";

const redirectLeavingKey =
    "reader_redirect_leaving";


/* =========================================================
   STORY ID
========================================================= */

const urlParams =
    new URLSearchParams(
        window.location.search
    );

const storyId =
    urlParams.get("id") ||
    window.location.pathname;


/* =========================================================
   KEY LƯU VỊ TRÍ
========================================================= */

const readingPositionKey =
    "reader_position_" + storyId;

const audioPositionKey =
    "reader_audio_position_" + storyId;

const readingSessionKey =
    "reading_session_" + storyId;


/* =========================================================
   BIẾN TOÀN CỤC
========================================================= */

let facebookAdsModal = null;

let facebookAdHiddenAt = null;

let facebookAdWaiting = false;

let facebookAdCurrentType = null;

let activeSeconds = 0;

let activeTimer = null;

let lastActiveTimestamp = null;

let storyUnlocked = false;

let resumePopupShown = false;


/* =========================================================
   NGÀY VIỆT NAM
========================================================= */

function getToday() {

    return new Date().toLocaleDateString(
        "en-CA",
        {
            timeZone: "Asia/Ho_Chi_Minh"
        }
    );

}


/* =========================================================
   RESET DATA MỖI NGÀY
========================================================= */

function resetDailyDataIfNeeded() {

    const today =
        getToday();

    const savedDate =
        localStorage.getItem(
            facebookAdStageDateKey
        );


    if (savedDate !== today) {

        localStorage.removeItem(
            facebookAdStageKey
        );

        localStorage.removeItem(
            facebookAdCompletedDateKey
        );

        localStorage.removeItem(
            facebookAdStartedKey
        );

        localStorage.removeItem(
            facebookAdLeftKey
        );

        localStorage.removeItem(
            redirectStageKey
        );

        localStorage.removeItem(
            redirectDateKey
        );

        localStorage.removeItem(
            redirectLeavingKey
        );

        localStorage.removeItem(
            unlockDateKey
        );

        localStorage.removeItem(
            unlockTimeKey
        );

        localStorage.setItem(
            facebookAdStageDateKey,
            today
        );

    }


    const activeDate =
        localStorage.getItem(
            activeTimeDateKey
        );


    if (activeDate !== today) {

        localStorage.removeItem(
            activeTimeKey
        );

        localStorage.setItem(
            activeTimeDateKey,
            today
        );

    }

}


/* =========================================================
   KIỂM TRA ĐÃ MỞ KHÓA HÔM NAY
========================================================= */

function isUnlockedToday() {

    return (
        localStorage.getItem(
            unlockDateKey
        ) === getToday()
    );

}


/* =========================================================
   ĐÁNH DẤU ĐÃ MỞ KHÓA
========================================================= */

function markUnlockedToday() {

    localStorage.setItem(
        unlockDateKey,
        getToday()
    );

    localStorage.setItem(
        unlockTimeKey,
        Date.now().toString()
    );

    storyUnlocked = true;

}


/* =========================================================
   LẤY STAGE FACEBOOK

   0 = chưa xong Shopee
   1 = xong Shopee
   2 = xong ShopeeFood
   3 = xong toàn bộ
========================================================= */

function getFacebookAdStage() {

    if (
        localStorage.getItem(
            facebookAdStageDateKey
        ) !== getToday()
    ) {

        return 0;

    }


    return Number(
        localStorage.getItem(
            facebookAdStageKey
        )
    ) || 0;

}


/* =========================================================
   SET STAGE FACEBOOK
========================================================= */

function setFacebookAdStage(stage) {

    localStorage.setItem(
        facebookAdStageKey,
        String(stage)
    );

    localStorage.setItem(
        facebookAdStageDateKey,
        getToday()
    );

}


/* =========================================================
   KIỂM TRA ĐÃ XONG QUẢNG CÁO HÔM NAY
========================================================= */

function isFacebookAdsCompletedToday() {

    return (
        localStorage.getItem(
            facebookAdCompletedDateKey
        ) === getToday()
    );

}


/* =========================================================
   ĐÁNH DẤU HOÀN THÀNH QUẢNG CÁO
========================================================= */

function markFacebookAdsCompletedToday() {

    localStorage.setItem(
        facebookAdCompletedDateKey,
        getToday()
    );

    setFacebookAdStage(3);

    markUnlockedToday();

}


/* =========================================================
   LẤY STAGE REDIRECT
========================================================= */

function getRedirectStage() {

    if (
        localStorage.getItem(
            redirectDateKey
        ) !== getToday()
    ) {

        return 0;

    }


    return Number(
        localStorage.getItem(
            redirectStageKey
        )
    ) || 0;

}


/* =========================================================
   SET STAGE REDIRECT
========================================================= */

function setRedirectStage(stage) {

    localStorage.setItem(
        redirectStageKey,
        String(stage)
    );

    localStorage.setItem(
        redirectDateKey,
        getToday()
    );

}


/* =========================================================
   ĐÃ XONG REDIRECT?
========================================================= */

function isRedirectFinishedToday() {

    return (
        getRedirectStage() >= 2
    );

}


/* =========================================================
   KHÓA TRUYỆN

   QUAN TRỌNG:
   KHÔNG ẨN #lockedContent.

   Nội dung HTML truyện vẫn tồn tại và vẫn giữ nguyên.

   Chỉ khóa thao tác trang bằng lớp Facebook Ads.
========================================================= */

function lockStory() {

    storyUnlocked = false;

    document.body.classList.add(
        "facebookStoryLocked"
    );

}


/* =========================================================
   MỞ TRUYỆN

   KHÔNG ĐỘNG VÀO #lockedContent.

   ĐÃ SỬA LỖI:
   Trước đây hàm này gọi saveReadingPosition() ngay khi
   mở khóa, kể cả khi trang vừa tải lại (scrollY = 0),
   nên vô tình GHI ĐÈ vị trí đọc đã lưu trước đó thành 0,
   khiến popup "đọc tiếp" không bao giờ hiện ra nữa.
   Đã bỏ dòng gọi đó — việc lưu vị trí đọc đã được xử lý
   ở các nơi khác (khi cuộn trang, khi rời tab, khi đóng
   trang), không cần lưu lại tại thời điểm mở khóa.
========================================================= */

function unlockStory() {

    storyUnlocked = true;

    document.body.classList.remove(
        "facebookStoryLocked"
    );

    increaseStoryView();

}


/* =========================================================
   KIỂM TRA KHÓA
========================================================= */

function checkStoryLock() {

    resetDailyDataIfNeeded();


    if (
        isFacebookAdsCompletedToday() ||
        isUnlockedToday()
    ) {

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

    const existing =
        document.getElementById(
            "facebookAdsModal"
        );


    if (existing) {

        facebookAdsModal =
            existing;

        return existing;

    }


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "facebookAdsModal";

    modal.className =
        "facebookAdsOverlay";


    modal.innerHTML = `

        <div
            id="facebookAdsBox"
            class="facebookAdsBox"
            role="dialog"
            aria-modal="true"
        >

            <div class="facebookAdsHeader">

                <div
                    id="facebookAdsTitle"
                    class="facebookAdsTitle"
                >
                    Quảng cáo
                </div>

                <div
                    id="facebookAdsProgress"
                    class="facebookAdsProgress"
                >
                    Vui lòng hoàn thành quảng cáo để tiếp tục đọc
                </div>

            </div>


            <div
                id="facebookAdsSteps"
                class="facebookAdsSteps"
            >

                <div
                    id="facebookStep1"
                    class="facebookStep"
                >
                    1/2 Shopee
                </div>

                <div
                    class="facebookStepArrow"
                >
                    →
                </div>

                <div
                    id="facebookStep2"
                    class="facebookStep"
                >
                    2/2 ShopeeFood
                </div>

            </div>


            <div
                id="facebookAdInstruction"
                class="facebookAdInstruction"
            >
                Hãy mở quảng cáo và ở lại ít nhất
                <strong>3 giây</strong>
                rồi quay lại đây.
            </div>


            <div
                id="facebookAdFrame"
                class="facebookAdFrame"
            ></div>


            <div
                id="facebookAdReturnMessage"
                class="facebookAdReturnMessage"
                style="display:none;"
            ></div>


            <div
                id="facebookAdFinished"
                class="facebookAdFinished"
                style="display:none;"
            >

                <div
                    id="facebookFinishedIcon"
                    class="facebookFinishedIcon"
                >
                    ✓
                </div>

                <p
                    id="facebookFinishedText"
                    class="facebookFinishedText"
                >
                    Bạn đã hoàn thành 2 bước quảng cáo.
                    Bây giờ có thể tắt quảng cáo và đọc truyện.
                </p>

                <button
                    id="facebookAdCloseButton"
                    type="button"
                >
                    ✕ TẮT QUẢNG CÁO → ĐỌC TRUYỆN
                </button>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    facebookAdsModal =
        modal;


    const closeButton =
        document.getElementById(
            "facebookAdCloseButton"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            function () {

                if (
                    getFacebookAdStage() < 2
                ) {

                    return;

                }


                markFacebookAdsCompletedToday();

                closeFacebookAdModal();

                unlockStory();

            }
        );

    }


    return modal;

}


/* =========================================================
   TẠO IFRAME FACEBOOK
========================================================= */

function createFacebookIframe(postUrl) {

    const frame =
        document.getElementById(
            "facebookAdFrame"
        );


    if (!frame) {
        return;
    }


    frame.innerHTML = "";


    const iframe =
        document.createElement(
            "iframe"
        );


    const embedUrl =
        "https://www.facebook.com/plugins/post.php" +
        "?href=" +
        encodeURIComponent(
            postUrl
        ) +
        "&show_text=true" +
        "&width=480";


    iframe.src =
        embedUrl;

    iframe.loading =
        "eager";

    iframe.allow =
        "autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share";

    iframe.scrolling =
        "yes";

    iframe.frameBorder =
        "0";


    frame.appendChild(
        iframe
    );

}


/* =========================================================
   CẬP NHẬT 2 BƯỚC
========================================================= */

function updateFacebookSteps() {

    const stage =
        getFacebookAdStage();


    const step1 =
        document.getElementById(
            "facebookStep1"
        );

    const step2 =
        document.getElementById(
            "facebookStep2"
        );


    if (!step1 || !step2) {
        return;
    }


    step1.classList.remove(
        "active",
        "done"
    );

    step2.classList.remove(
        "active",
        "done"
    );


    if (stage === 0) {

        step1.classList.add(
            "active"
        );

    }


    if (stage >= 1) {

        step1.classList.add(
            "done"
        );

        step2.classList.add(
            "active"
        );

    }


    if (stage >= 2) {

        step1.classList.add(
            "done"
        );

        step2.classList.add(
            "done"
        );

    }

}


/* =========================================================
   CẬP NHẬT HƯỚNG DẪN
========================================================= */

function updateFacebookInstruction(message) {

    const instruction =
        document.getElementById(
            "facebookAdInstruction"
        );


    if (!instruction) {
        return;
    }


    instruction.innerHTML =
        message;

}


/* =========================================================
   MỞ SHOPEE
========================================================= */

function openShopeeAd() {

    facebookAdCurrentType =
        "shopee";

    facebookAdWaiting =
        false;

    facebookAdHiddenAt =
        null;


    const title =
        document.getElementById(
            "facebookAdsTitle"
        );

    const progress =
        document.getElementById(
            "facebookAdsProgress"
        );


    if (title) {

        title.textContent =
            "Quảng cáo Shopee";

    }


    if (progress) {

        progress.textContent =
            "Bước 1/2 — Hãy mở quảng cáo và ở lại ít nhất 3 giây rồi quay lại";

    }


    updateFacebookInstruction(
        '👉 <strong>Hãy mở quảng cáo Shopee và ở lại ít nhất 3 giây rồi quay lại đây.</strong><br>' +
        'Đây là bước 1/2. Sau khi quay lại, hệ thống sẽ kiểm tra thời gian.'
    );


    createFacebookIframe(
        FACEBOOK_ADS.shopee.url
    );


    const finished =
        document.getElementById(
            "facebookAdFinished"
        );


    if (finished) {

        finished.style.display =
            "none";

    }


    const frame =
        document.getElementById(
            "facebookAdFrame"
        );


    if (frame) {

        frame.style.display =
            "";

    }


    const returnMessage =
        document.getElementById(
            "facebookAdReturnMessage"
        );


    if (returnMessage) {

        returnMessage.style.display =
            "none";

    }


    updateFacebookSteps();

}


/* =========================================================
   MỞ SHOPEEFOOD
========================================================= */

function openShopeeFoodAd() {

    facebookAdCurrentType =
        "shopeefood";

    facebookAdWaiting =
        false;

    facebookAdHiddenAt =
        null;


    const title =
        document.getElementById(
            "facebookAdsTitle"
        );

    const progress =
        document.getElementById(
            "facebookAdsProgress"
        );


    if (title) {

        title.textContent =
            "Quảng cáo ShopeeFood";

    }


    if (progress) {

        progress.textContent =
    "Bước 2/2 — Hãy mở quảng cáo rồi quay lại";
    }


    updateFacebookInstruction(
    '👉 <strong>Hãy mở quảng cáo ShopeeFood rồi quay lại đây.</strong><br>' +
    'Đây là bước 2/2. Sau khi quay lại, hệ thống sẽ kiểm tra và hoàn tất.'
);


    createFacebookIframe(
        FACEBOOK_ADS.shopeefood.url
    );


    const finished =
        document.getElementById(
            "facebookAdFinished"
        );


    if (finished) {

        finished.style.display =
            "none";

    }


    const frame =
        document.getElementById(
            "facebookAdFrame"
        );


    if (frame) {

        frame.style.display =
            "";

    }


    const returnMessage =
        document.getElementById(
            "facebookAdReturnMessage"
        );


    if (returnMessage) {

        returnMessage.style.display =
            "none";

    }


    updateFacebookSteps();

}


/* =========================================================
   BẮT ĐẦU FACEBOOK ADS
========================================================= */

function startFacebookAdFlow() {

    createFacebookAdModal();


    const stage =
        getFacebookAdStage();


    facebookAdsModal.classList.add(
        "active"
    );

    facebookAdsModal.style.display =
        "flex";


    document.body.classList.add(
        "facebookAdsOpen"
    );


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

    if (
        !facebookAdsModal ||
        !facebookAdsModal.classList.contains(
            "active"
        )
    ) {

        return;

    }


    if (facebookAdWaiting) {
        return;
    }


    facebookAdHiddenAt =
        Date.now();

    facebookAdWaiting =
        true;


    localStorage.setItem(
        facebookAdLeftKey,
        String(
            facebookAdHiddenAt
        )
    );


    if (
    facebookAdCurrentType ===
    "shopeefood"
) {

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


    const hiddenDuration =
        Date.now() -
        facebookAdHiddenAt;


    const requiredTime =
        facebookAdCurrentType === "shopee"
            ? FACEBOOK_SHOPEE_MIN_LEAVE_TIME
            : FACEBOOK_SHOPEEFOOD_MIN_LEAVE_TIME;


    /*
       Nếu chưa đủ 3 giây,
       KHÔNG hoàn thành bước.
    */

    if (
        hiddenDuration <
        requiredTime
    ) {

        const remain =
            Math.max(
                1,
                Math.ceil(
                    (
                        requiredTime -
                        hiddenDuration
                    ) / 1000
                )
            );


        facebookAdWaiting =
            false;

        facebookAdHiddenAt =
            null;


        localStorage.removeItem(
            facebookAdLeftKey
        );


        const message =
            document.getElementById(
                "facebookAdReturnMessage"
            );


        if (message) {

            message.style.display =
                "block";

            message.textContent =
                "Bạn quay lại quá sớm. Hãy ở lại quảng cáo thêm " +
                remain +
                " giây.";

        }


        updateFacebookInstruction(
            '⚠️ <strong>Chưa đủ 3 giây.</strong><br>' +
            'Hãy mở quảng cáo và ở lại thêm ít nhất ' +
            remain +
            ' giây rồi quay lại.'
        );


        return;

    }


    /*
       ĐỦ 3 GIÂY.
    */

    facebookAdWaiting =
        false;

    facebookAdHiddenAt =
        null;


    localStorage.removeItem(
        facebookAdLeftKey
    );


    markFacebookAdCompletedStep();

}


/* =========================================================
   HOÀN THÀNH TỪNG BƯỚC
========================================================= */

function markFacebookAdCompletedStep() {

    const stage =
        getFacebookAdStage();


    /* =====================================================
       SHOPEE
    ===================================================== */

    if (
        stage === 0 &&
        facebookAdCurrentType === "shopee"
    ) {

        setFacebookAdStage(1);


        const message =
            document.getElementById(
                "facebookAdReturnMessage"
            );


        if (message) {

            message.style.display =
                "block";

            message.textContent =
                "✓ Đã hoàn thành bước Shopee.";

        }


        updateFacebookSteps();


        updateFacebookInstruction(
            '✓ <strong>Đã hoàn thành bước 1/2.</strong><br>' +
            'Bây giờ hãy thực hiện tiếp quảng cáo ShopeeFood.'
        );


        setTimeout(
            function () {

                openShopeeFoodAd();

            },
            500
        );


        return;

    }


    /* =====================================================
       SHOPEEFOOD
    ===================================================== */

    if (
        stage === 1 &&
        facebookAdCurrentType === "shopeefood"
    ) {

        setFacebookAdStage(2);


        updateFacebookSteps();


        updateFacebookInstruction(
            '✓ <strong>Đã hoàn thành bước 2/2.</strong><br>' +
            'Bạn đã hoàn thành đủ hai quảng cáo.'
        );


        setTimeout(
            function () {

                showFacebookAdFinished();

            },
            300
        );


        return;

    }

}


/* =========================================================
   HIỆN HOÀN TẤT
========================================================= */

function showFacebookAdFinished() {

    const frame =
        document.getElementById(
            "facebookAdFrame"
        );

    const finished =
        document.getElementById(
            "facebookAdFinished"
        );

    const title =
        document.getElementById(
            "facebookAdsTitle"
        );

    const progress =
        document.getElementById(
            "facebookAdsProgress"
        );


    if (frame) {

        frame.style.display =
            "none";

    }


    if (finished) {

        finished.style.display =
            "block";

    }


    if (title) {

        title.textContent =
            "Quảng cáo đã hoàn thành";

    }


    if (progress) {

        progress.textContent =
            "Đã hoàn thành đủ 2/2 bước";

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


    facebookAdsModal.classList.remove(
        "active"
    );

    facebookAdsModal.style.display =
        "none";


    document.body.classList.remove(
        "facebookAdsOpen"
    );


    facebookAdWaiting =
        false;

    facebookAdHiddenAt =
        null;

}


/* =========================================================
   THEO DÕI TAB / TRANG
========================================================= */

document.addEventListener(
    "visibilitychange",
    function () {

        if (
            !facebookAdsModal ||
            !facebookAdsModal.classList.contains(
                "active"
            )
        ) {

            return;

        }


        /*
           NGƯỜI DÙNG RỜI TRANG
        */

        if (
            document.visibilityState ===
            "hidden"
        ) {

            markFacebookAdLeft();

            return;

        }


        /*
           NGƯỜI DÙNG QUAY LẠI

           KHÔNG DELAY 300ms.
           Date.now() đã tính thời gian thực.
        */

        if (
            document.visibilityState ===
            "visible"
        ) {

            checkFacebookAdReturn();

        }

    }
);


/* =========================================================
   PAGEHIDE
========================================================= */

window.addEventListener(
    "pagehide",
    function () {

        if (
            !facebookAdsModal ||
            !facebookAdsModal.classList.contains(
                "active"
            )
        ) {

            return;

        }


        markFacebookAdLeft();

    }
);


/* =========================================================
   PAGESHOW
========================================================= */

window.addEventListener(
    "pageshow",
    function () {

        if (
            facebookAdWaiting
        ) {

            checkFacebookAdReturn();

        }

    }
);


/* =========================================================
   ACTIVE TIME
========================================================= */

function getActiveSeconds() {

    const savedDate =
        localStorage.getItem(
            activeTimeDateKey
        );


    if (
        savedDate !== getToday()
    ) {

        localStorage.setItem(
            activeTimeDateKey,
            getToday()
        );

        localStorage.setItem(
            activeTimeKey,
            "0"
        );

        return 0;

    }


    return Number(
        localStorage.getItem(
            activeTimeKey
        )
    ) || 0;

}


/* =========================================================
   LƯU ACTIVE TIME
========================================================= */

function saveActiveSeconds() {

    localStorage.setItem(
        activeTimeKey,
        String(activeSeconds)
    );

    localStorage.setItem(
        activeTimeDateKey,
        getToday()
    );

}


/* =========================================================
   BẮT ĐẦU ĐẾM THỜI GIAN ĐỌC
========================================================= */

function startActiveTime() {

    if (activeTimer) {
        return;
    }


    activeSeconds =
        getActiveSeconds();

    lastActiveTimestamp =
        Date.now();


    activeTimer =
        setInterval(
            function () {

                if (
                    document.visibilityState !==
                    "visible"
                ) {

                    lastActiveTimestamp =
                        Date.now();

                    return;

                }


                const now =
                    Date.now();


                const elapsed =
                    Math.floor(
                        (
                            now -
                            lastActiveTimestamp
                        ) / 1000
                    );


                if (elapsed > 0) {

                    activeSeconds +=
                        elapsed;

                    lastActiveTimestamp =
                        now;

                    saveActiveSeconds();

                }


                if (
                    activeSeconds >=
                    ACTIVE_TIME_LIMIT
                ) {

                    activeSeconds =
                        ACTIVE_TIME_LIMIT;

                    saveActiveSeconds();

                }

            },
            1000
        );

}


/* =========================================================
   DỪNG ACTIVE TIME
========================================================= */

function stopActiveTime() {

    if (activeTimer) {

        clearInterval(
            activeTimer
        );

        activeTimer =
            null;

    }


    saveActiveSeconds();

}


/* =========================================================
   LƯU VỊ TRÍ ĐỌC

   ĐÃ SỬA LỖI:
   Thêm kiểm tra scrollTrackingReady để không ghi đè vị trí
   đã lưu trong lúc đang chờ người dùng trả lời popup
   "Đọc tiếp?" (xem showResumePopup() bên dưới).
========================================================= */

function saveReadingPosition() {

    if (!storyUnlocked) {
        return;
    }


    if (!scrollTrackingReady) {
        return;
    }


    localStorage.setItem(
        readingPositionKey,
        String(
            window.scrollY
        )
    );

}


/* =========================================================
   KHÔI PHỤC VỊ TRÍ ĐỌC
========================================================= */

function restoreReadingPosition() {

    const saved =
        localStorage.getItem(
            readingPositionKey
        );


    if (saved === null) {
        return;
    }


    const position =
        Number(saved);


    if (
        !Number.isFinite(position) ||
        position <= 0
    ) {

        return;

    }


    setTimeout(
        function () {

            window.scrollTo(
                {
                    top: position,
                    behavior: "auto"
                }
            );

        },
        300
    );

}


/* =========================================================
   LƯU VỊ TRÍ AUDIO
========================================================= */

function saveAudioPosition(audio) {

    if (!audio) {
        return;
    }


    if (!storyUnlocked) {
        return;
    }


    if (
        !Number.isFinite(
            audio.currentTime
        )
    ) {

        return;

    }


    localStorage.setItem(
        audioPositionKey,
        String(
            audio.currentTime
        )
    );

}


/* =========================================================
   KHÔI PHỤC AUDIO
========================================================= */

function restoreAudioPosition() {

    const audio =
        document.querySelector(
            "audio"
        );


    if (!audio) {
        return;
    }


    const saved =
        localStorage.getItem(
            audioPositionKey
        );


    if (saved === null) {
        return;
    }


    const position =
        Number(saved);


    if (
        !Number.isFinite(position) ||
        position <= 0
    ) {

        return;

    }


    const restore =
        function () {

            try {

                if (
                    position <
                    audio.duration
                ) {

                    audio.currentTime =
                        position;

                }

            } catch (error) {

                console.warn(
                    "Không thể khôi phục audio:",
                    error
                );

            }

        };


    if (
        audio.readyState >= 1
    ) {

        restore();

    } else {

        audio.addEventListener(
            "loadedmetadata",
            restore,
            {
                once: true
            }
        );

    }


    audio.addEventListener(
        "timeupdate",
        function () {

            saveAudioPosition(
                audio
            );

        }
    );

}


/* =========================================================
   POPUP ĐỌC TIẾP

   ĐÃ SỬA LỖI (id/class khớp CSS — giữ như bản gốc):
   Trước đây JS tạo popup với id "resumeReadingPopup" và các
   class "resumeReadingBox" / "resumeReadingTitle" / ...
   nhưng file CSS lại định nghĩa style cho các tên khác hẳn:
   "#readerResumePopup", ".reader-resume-overlay",
   ".reader-resume-box", ".reader-resume-btn" v.v.
   Đã đổi toàn bộ id/class trong JS để khớp đúng với CSS
   sẵn có, giữ nguyên logic.

   ĐÃ SỬA LỖI THÊM (lần này):
   Khóa scrollTrackingReady = false ngay khi bắt đầu hiện
   popup, và chỉ mở lại (= true) sau khi người dùng đã bấm
   "Đọc tiếp" hoặc "Đọc từ đầu". Nhờ vậy, mọi sự kiện scroll
   xảy ra trong lúc popup đang chờ người dùng sẽ không ghi
   đè vị trí đã lưu trong localStorage.
========================================================= */

function showResumePopup() {

    if (resumePopupShown) {
        return;
    }


    resumePopupShown =
        true;


    const saved =
        localStorage.getItem(
            readingPositionKey
        );


    if (
        !saved ||
        Number(saved) <= 50
    ) {

        return;

    }


    /*
       Tạm khóa việc lưu scroll trong lúc chờ
       người dùng trả lời popup.
    */

    scrollTrackingReady =
        false;


    const popup =
        document.createElement(
            "div"
        );


    popup.id =
        "readerResumePopup";


    popup.innerHTML = `

        <div class="reader-resume-overlay">

            <div class="reader-resume-box">

                <div class="reader-resume-icon">
                    📖
                </div>

                <div class="reader-resume-title">
                    Bạn có muốn đọc tiếp?
                </div>

                <div class="reader-resume-description">
                    Hệ thống đã lưu vị trí đọc trước đó.
                    Bạn có muốn tiếp tục từ vị trí đó không?
                </div>

                <div class="reader-resume-buttons">

                    <button
                        id="resumeYesBtn"
                        class="reader-resume-btn reader-resume-yes"
                        type="button"
                    >
                        ▶ Đọc tiếp
                    </button>

                    <button
                        id="resumeNoBtn"
                        class="reader-resume-btn reader-resume-no"
                        type="button"
                    >
                        ↩ Đọc từ đầu
                    </button>

                </div>

            </div>

        </div>

    `;


    document.body.appendChild(
        popup
    );


    const yes =
        document.getElementById(
            "resumeYesBtn"
        );

    const no =
        document.getElementById(
            "resumeNoBtn"
        );


    if (yes) {

        yes.addEventListener(
            "click",
            function () {

                popup.remove();

                restoreReadingPosition();

                /*
                   Mở lại việc lưu scroll SAU khi
                   restoreReadingPosition() đã cuộn xong
                   (setTimeout 300ms bên trong hàm đó),
                   để lần cuộn tự động này không bị coi
                   là thao tác của người dùng.
                */

                setTimeout(
                    function () {

                        scrollTrackingReady =
                            true;

                    },
                    400
                );

            }
        );

    }


    if (no) {

        no.addEventListener(
            "click",
            function () {

                localStorage.removeItem(
                    readingPositionKey
                );

                /*
                   ĐÃ SỬA LỖI:
                   Trước đây chỉ xóa vị trí CUỘN TRANG
                   (readingPositionKey), nhưng vị trí AUDIO
                   (audioPositionKey) vẫn còn nguyên trong
                   localStorage. Kết quả: bấm "Đọc từ đầu"
                   thì phần chữ về đầu, nhưng audio vẫn tua
                   tới đoạn đang nghe dở trước đó.

                   Giờ xóa luôn audioPositionKey, và nếu
                   đang có thẻ <audio> trên trang thì tua nó
                   về 0 giây ngay lập tức.
                */

                localStorage.removeItem(
                    audioPositionKey
                );


                const audio =
                    document.querySelector(
                        "audio"
                    );


                if (audio) {

                    try {

                        audio.currentTime = 0;

                        audio.pause();

                    } catch (error) {

                        console.warn(
                            "Không thể đưa audio về đầu:",
                            error
                        );

                    }

                }


                /*
                   Đưa trang về đầu truyện cho khớp với
                   việc "đọc từ đầu".
                */

                window.scrollTo(
                    {
                        top: 0,
                        behavior: "auto"
                    }
                );


                popup.remove();

                scrollTrackingReady =
                    true;

            }
        );

    }

}


/* =========================================================
   SCROLL
========================================================= */

let saveScrollTimer = null;


window.addEventListener(
    "scroll",
    function () {

        if (!storyUnlocked) {
            return;
        }


        if (!scrollTrackingReady) {
            return;
        }


        if (saveScrollTimer) {

            clearTimeout(
                saveScrollTimer
            );

        }


        saveScrollTimer =
            setTimeout(
                function () {

                    saveReadingPosition();

                },
                500
            );

    },
    {
        passive: true
    }
);


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
        SUPABASE_URL.includes(
            "YOUR-PROJECT"
        )
    ) {

        return;

    }


    if (
        sessionStorage.getItem(
            readingSessionKey
        )
    ) {

        return;

    }


    try {

        const response =
            await fetch(
                SUPABASE_URL +
                "/rest/v1/rpc/increment_story_view",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "apikey":
                            SUPABASE_ANON_KEY,

                        "Authorization":
                            "Bearer " +
                            SUPABASE_ANON_KEY
                    },

                    body: JSON.stringify(
                        {
                            story_id:
                                String(
                                    storyId
                                )
                        }
                    )
                }
            );


        if (response.ok) {

            sessionStorage.setItem(
                readingSessionKey,
                "1"
            );

        }

    } catch (error) {

        console.warn(
            "Không thể tăng lượt xem:",
            error
        );

    }

}


/* =========================================================
   POPUP XÔI THỊT
========================================================= */

function initXoiThitPopup() {

    const popup =
        document.getElementById(
            "xoiThitPopup"
        );


    if (!popup) {
        return;
    }


    const yes =
        document.getElementById(
            "xoiThitYes"
        );

    const no =
        document.getElementById(
            "xoiThitNo"
        );


    if (yes) {

        yes.addEventListener(
            "click",
            function () {

                window.location.href =
                    "https://truyenxoithitmiumiu.nekoweb.org/";

            }
        );

    }


    if (no) {

        no.addEventListener(
            "click",
            function () {

                popup.style.display =
                    "none";

            }
        );

    }

}


/* =========================================================
   REDIRECT TIKTOK / LAZADA
========================================================= */

function initRedirectButtons() {

    const tiktokButton =
        document.getElementById(
            "tiktok-read"
        );

    const lazadaButton =
        document.getElementById(
            "lazada-read"
        );


    if (tiktokButton) {

        tiktokButton.addEventListener(
            "click",
            function () {

                if (!TIKTOK_URL) {
                    return;
                }


                localStorage.setItem(
                    redirectLeavingKey,
                    Date.now().toString()
                );


                setRedirectStage(
                    Math.max(
                        1,
                        getRedirectStage()
                    )
                );


                window.open(
                    TIKTOK_URL,
                    "_blank"
                );

            }
        );

    }


    if (lazadaButton) {

        lazadaButton.addEventListener(
            "click",
            function () {

                if (!LAZADA_URL) {
                    return;
                }


                localStorage.setItem(
                    redirectLeavingKey,
                    Date.now().toString()
                );


                setRedirectStage(2);


                window.open(
                    LAZADA_URL,
                    "_blank"
                );

            }
        );

    }

}


/* =========================================================
   LINK NỘI BỘ
========================================================= */

function initInternalNavigation() {

    document.addEventListener(
        "click",
        function (event) {

            const link =
                event.target.closest(
                    "a"
                );


            if (!link) {
                return;
            }


            const href =
                link.getAttribute(
                    "href"
                );


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

        }
    );

}


/* =========================================================
   AUDIO MARKER
========================================================= */

function initAudioMarkers() {

    const audioCards =
        document.querySelectorAll(
            "[data-audio]"
        );


    if (!audioCards.length) {
        return;
    }


    audioCards.forEach(
        function (card) {



            const markerButton =
                card.querySelector(
                    "#markerBtn"
                );


            if (!markerButton) {
                return;
            }


            markerButton.addEventListener(
                "click",
                function (event) {

                    /*
                       Không cho click của marker
                       tiếp tục nổi lên phần tử cha.
                    */

                    event.stopPropagation();


                    const audio =
                        document.querySelector(
                            "audio"
                        );


                    if (!audio) {
                        return;
                    }


                    const marker =
                        Number(
                            card.dataset.marker
                        );


                    if (
                        !Number.isFinite(
                            marker
                        )
                    ) {

                        return;

                    }


                    /*
                       CHỈ NÚT MARKER MỚI TUA AUDIO.
                    */

                    audio.currentTime =
                        marker;


                    /*
                       Phát audio ngay tại marker.
                    */

                    audio.play().catch(
                        function () {}
                    );

                }
            );

        }
    );

}


/* =========================================================
   KIỂM TRA AUDIO
========================================================= */

function initAudio() {

    const audio =
        document.querySelector(
            "audio"
        );


    if (!audio) {
        return;
    }


    restoreAudioPosition();


    audio.addEventListener(
        "timeupdate",
        function () {

            saveAudioPosition(
                audio
            );

        }
    );


    window.addEventListener(
        "beforeunload",
        function () {

            saveAudioPosition(
                audio
            );

        }
    );

}


/* =========================================================
   KHỞI TẠO
========================================================= */

function initReader() {

    resetDailyDataIfNeeded();


    /*
       ĐÃ XONG QUẢNG CÁO HÔM NAY
       → CHO ĐỌC THẲNG.
    */

    if (
        isFacebookAdsCompletedToday() ||
        isUnlockedToday()
    ) {

        markUnlockedToday();

        unlockStory();

    } else {

        /*
           KHÔNG ẨN NỘI DUNG TRUYỆN.

           Chỉ mở lớp quảng cáo Facebook
           phủ lên phía trên.
        */

        lockStory();

        startFacebookAdFlow();

    }


    initXoiThitPopup();

    initRedirectButtons();

    initInternalNavigation();

    initAudioMarkers();

    initAudio();

    startActiveTime();


    if (storyUnlocked) {

        setTimeout(
            function () {

                showResumePopup();

            },
            800
        );

    }

}


/* =========================================================
   LƯU TRƯỚC KHI RỜI TRANG
========================================================= */

window.addEventListener(
    "beforeunload",
    function () {

        saveReadingPosition();

        stopActiveTime();


        const audio =
            document.querySelector(
                "audio"
            );


        if (audio) {

            saveAudioPosition(
                audio
            );

        }

    }
);


/* =========================================================
   KHI TAB HIỆN / ẨN
========================================================= */

document.addEventListener(
    "visibilitychange",
    function () {

        if (
            document.visibilityState ===
            "visible"
        ) {

            lastActiveTimestamp =
                Date.now();

        } else {

            saveReadingPosition();


            const audio =
                document.querySelector(
                    "audio"
                );


            if (audio) {

                saveAudioPosition(
                    audio
                );

            }

        }

    }
);


/* =========================================================
   CHỜ DOM
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initReader
    );

} else {

    initReader();

}