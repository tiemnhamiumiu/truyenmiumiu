window.addEventListener("DOMContentLoaded", function () {

    "use strict";

    /* ==================================================
       PASS THEO NGÀY
    ================================================== */

    const DAILY_PASSES = {

        "2026-09-23": "muc",

        "2026-09-22": "co"

    };


    /* ==================================================
       FACEBOOK BÀI VIẾT THEO NGÀY
    ================================================== */

    const DAILY_FACEBOOK_POSTS = {

        "2026-09-23":
            "https://www.facebook.com/photo/?fbid=122112240135467824&set=pcb.122112240423467824&locale=vi_VN",

        "2026-09-22":
            "https://www.facebook.com/photo/?fbid=122111838345467824&set=pcb.122111839269467824"

    };


    /* ==================================================
       ẢNH HƯỚNG DẪN
    ================================================== */

    const GUIDE_IMAGE =
        "../codetruyen/huong-dan.jpg";


    /* ==================================================
       LINK TIKTOK + LAZADA
    ================================================== */

    const TIKTOK_URL =
        "https://vt.tiktok.com/ZS9AhQn6ukYWS-pxrMb/";

    const LAZADA_URL =
        "https://s.lazada.vn/s.oVolr?c=d&t=p-ixAY3P-sGQ1lgE";

    const TIKTOK_LINKS = [
        TIKTOK_URL
    ];

    const LAZADA_LINKS = [
        LAZADA_URL
    ];


    /* ==================================================
       THỜI GIAN CẦN DÙNG TRONG WEB
    ================================================== */

    const TEN_MINUTES =
        10 * 60 * 1000;


    /* ==================================================
       LOCAL STORAGE
    ================================================== */

    const unlockDateKey =
        "reader_unlock_date";

    const unlockTimeKey =
        "reader_unlock_time";

    const redirectStageKey =
        "reader_redirect_stage";

    const redirectDateKey =
        "reader_redirect_date";


    /* ==================================================
       BỘ ĐẾM THỜI GIAN SỬ DỤNG WEB
    ================================================== */

    const activeTimeKey =
        "reader_active_time";

    const activeTimeDateKey =
        "reader_active_time_date";

    let activeStartTime = null;

    let activeTimer = null;


    /* ==================================================
       CẤU HÌNH SUPABASE
    ================================================== */

    const SUPABASE_URL =
        "https://YOUR-PROJECT.supabase.co";

    const SUPABASE_ANON_KEY =
        "YOUR_SUPABASE_ANON_KEY";


    /* ==================================================
       XÁC ĐỊNH ID TRUYỆN
    ================================================== */

    const params =
        new URLSearchParams(
            window.location.search
        );

    const storyId =
        params.get("id") ||
        window.location.pathname;


    /* ==================================================
       KEY PHIÊN ĐỌC
    ================================================== */

    const readingSessionKey =
        `reading_session_${storyId}`;


    /* ==================================================
       KEY LƯU VỊ TRÍ ĐỌC
    ================================================== */

    const readingPositionKey =
        `reader_position_${storyId}`;


    /* ==================================================
       KEY POPUP ĐỌC TIẾP
    ================================================== */

    const resumePromptKey =
        `reader_resume_prompt_${storyId}`;


    /* ==================================================
       CỜ REDIRECT
    ================================================== */

    const redirectLeavingKey =
        "reader_redirect_leaving";


    /* ==================================================
       LẤY NGÀY VIỆT NAM
    ================================================== */

    function getToday() {

        const now =
            new Date();

        const vietnamTime =
            new Date(
                now.getTime() +
                7 * 60 * 60 * 1000
            );

        const year =
            vietnamTime.getUTCFullYear();

        const month =
            String(
                vietnamTime.getUTCMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                vietnamTime.getUTCDate()
            ).padStart(2, "0");

        return `${year}-${month}-${day}`;

    }


    /* ==================================================
       LẤY PASS HÔM NAY
    ================================================== */

    function getTodayPass() {

        return DAILY_PASSES[getToday()] || null;

    }


    /* ==================================================
       LẤY LINK FACEBOOK HÔM NAY
    ================================================== */

    function getTodayFacebookPost() {

        return DAILY_FACEBOOK_POSTS[getToday()] || "";

    }


    /* ==================================================
       ELEMENTS
    ================================================== */

    const lockedContent =
        document.getElementById(
            "lockedContent"
        );

    const unlockBox =
        document.getElementById(
            "unlockBox"
        );

    const passInput =
        document.getElementById(
            "passInput"
        );

    const unlockBtn =
        document.getElementById(
            "unlockBtn"
        );

    const passError =
        document.getElementById(
            "passError"
        );

    const facebookLink =
        document.getElementById(
            "facebookLink"
        );

    const guideImage =
        document.getElementById(
            "guideImage"
        );


    /* ==================================================
       KIỂM TRA HTML
    ================================================== */

    if (
        !lockedContent ||
        !unlockBox ||
        !passInput ||
        !unlockBtn ||
        !passError ||
        !facebookLink ||
        !guideImage
    ) {

        console.error(
            "❌ Thiếu thành phần HTML mở khóa truyện."
        );

        return;

    }


    /* ==================================================
       TẠO BẢNG FACEBOOK
    ================================================== */

    const facebookModal =
        document.createElement("div");

    facebookModal.id =
        "facebookModal";

    facebookModal.innerHTML = `

        <div class="facebook-modal-overlay">

            <div
                class="facebook-modal-box"
                role="dialog"
                aria-modal="true"
                aria-labelledby="facebookModalTitle"
            >

                <button
                    type="button"
                    id="facebookModalClose"
                    class="facebook-modal-close"
                    aria-label="Đóng"
                >
                    ×
                </button>

                <div
                    id="facebookModalTitle"
                    class="facebook-modal-title"
                >
                    Bài đăng Facebook hôm nay
                </div>

                <div
                    id="facebookPostContainer"
                    class="facebook-post-container"
                >
                    <div class="facebook-loading">
                        Đang tải bài đăng Facebook...
                    </div>
                </div>

            </div>

        </div>

    `;

    document.body.appendChild(
        facebookModal
    );


    /* ==================================================
       CSS BẢNG FACEBOOK
    ================================================== */

    const facebookStyle =
        document.createElement("style");

    facebookStyle.textContent = `

        #facebookModal {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 999999;
        }

        #facebookModal.active {
            display: block;
        }

        .facebook-modal-overlay {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 15px;
            background: rgba(0, 0, 0, 0.88);
            overflow-y: auto;
        }

        .facebook-modal-box {
            position: relative;
            width: 100%;
            max-width: 560px;
            max-height: 94vh;
            overflow-y: auto;
            padding: 48px 15px 20px;
            border-radius: 12px;
            background: #ffffff;
            box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
        }

        .facebook-modal-close {
            position: absolute;
            top: 8px;
            right: 10px;
            width: 38px;
            height: 38px;
            border: none;
            border-radius: 50%;
            background: #222222;
            color: #ffffff;
            font-size: 30px;
            line-height: 35px;
            cursor: pointer;
            z-index: 2;
        }

        .facebook-modal-close:hover {
            background: #e53935;
        }

        .facebook-modal-title {
            margin-bottom: 15px;
            color: #222222;
            font-size: 19px;
            font-weight: bold;
            text-align: center;
        }

        .facebook-post-container {
            width: 100%;
            min-height: 180px;
            overflow: hidden;
            text-align: center;
        }

        .facebook-post-container iframe {
            display: block;
            width: 100%;
            max-width: 500px;
            min-height: 650px;
            margin: 0 auto;
            border: none;
        }

        .facebook-loading {
            padding: 35px 10px;
            color: #555555;
            font-size: 15px;
        }

        body.facebook-modal-open {
            overflow: hidden;
        }

        @media (max-width: 600px) {

            .facebook-modal-overlay {
                align-items: flex-start;
                padding: 8px;
            }

            .facebook-modal-box {
                max-height: 96vh;
                padding: 48px 8px 15px;
                border-radius: 10px;
            }

            .facebook-modal-title {
                font-size: 17px;
            }

            .facebook-post-container iframe {
                min-height: 600px;
            }

        }

    `;

    document.head.appendChild(
        facebookStyle
    );


    const facebookModalClose =
        document.getElementById(
            "facebookModalClose"
        );

    const facebookPostContainer =
        document.getElementById(
            "facebookPostContainer"
        );


    /* ==================================================
       MỞ BẢNG FACEBOOK
    ================================================== */

    function openFacebookModal() {

        const facebookPost =
            getTodayFacebookPost();

        if (!facebookPost) {

            alert(
                "⚠️ Chưa có bài đăng Facebook cho ngày hôm nay."
            );

            return;

        }

        const embedUrl =
            "https://www.facebook.com/plugins/post.php" +
            "?href=" +
            encodeURIComponent(facebookPost) +
            "&show_text=true" +
            "&width=500";

        facebookPostContainer.innerHTML = `

            <iframe
                src="${embedUrl}"
                title="Bài đăng Facebook"
                scrolling="no"
                frameborder="0"
                allowfullscreen="true"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            ></iframe>

        `;

        facebookModal.classList.add(
            "active"
        );

        document.body.classList.add(
            "facebook-modal-open"
        );

    }


    /* ==================================================
       ĐÓNG BẢNG FACEBOOK
    ================================================== */

    function closeFacebookModal() {

        facebookModal.classList.remove(
            "active"
        );

        document.body.classList.remove(
            "facebook-modal-open"
        );

        facebookPostContainer.innerHTML = "";

    }


    facebookLink.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            openFacebookModal();

        }
    );


    facebookModalClose.addEventListener(
        "click",
        closeFacebookModal
    );


    facebookModal
        .querySelector(
            ".facebook-modal-overlay"
        )
        .addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    this
                ) {

                    closeFacebookModal();

                }

            }
        );


    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape" &&
                facebookModal.classList.contains(
                    "active"
                )
            ) {

                closeFacebookModal();

            }

        }
    );


    /* ==================================================
       KIỂM TRA ĐÃ MỞ KHÓA HÔM NAY
    ================================================== */

    function isUnlockedToday() {

        return (
            localStorage.getItem(
                unlockDateKey
            ) === getToday()
        );

    }


    /* ==================================================
       LẤY STAGE REDIRECT
    ================================================== */

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


    /* ==================================================
       ĐÃ XONG TIKTOK + LAZADA?
    ================================================== */

    function isRedirectFinishedToday() {

        return (
            getRedirectStage() >= 2
        );

    }


    /* ==================================================
       KHÓA TRUYỆN
    ================================================== */

    function lockContent() {

        pauseActiveTime();

        lockedContent.style.display =
            "none";

        unlockBox.style.display =
            "block";

    }


    /* ==================================================
       TẠO SESSION ĐỌC
    ================================================== */

    function createReadingSession() {

        const token =
            Date.now().toString() +
            "_" +
            Math.random()
                .toString(36)
                .slice(2);

        sessionStorage.setItem(
            readingSessionKey,
            token
        );

        return token;

    }


    /* ==================================================
       KIỂM TRA SESSION
    ================================================== */

    function hasReadingSession() {

        return Boolean(
            sessionStorage.getItem(
                readingSessionKey
            )
        );

    }


    /* ==================================================
       TÍNH VIEW
    ================================================== */

    async function addViewOncePerReadingSession() {

        if (!storyId) {
            return;
        }

        if (hasReadingSession()) {

            console.log(
                "👁️ Phiên đọc đã tồn tại → không cộng view.",
                "Truyện:",
                storyId
            );

            return;

        }

        const numericStoryId =
            Number(storyId);

        if (
            !Number.isFinite(numericStoryId) ||
            numericStoryId <= 0
        ) {

            console.warn(
                "⚠️ Story ID không phải số. Không cộng view:",
                storyId
            );

            return;

        }

        createReadingSession();

        try {

            const response =
                await fetch(
                    `${SUPABASE_URL}/rest/v1/rpc/increment_story_view`,
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "apikey":
                                SUPABASE_ANON_KEY,

                            "Authorization":
                                `Bearer ${SUPABASE_ANON_KEY}`

                        },

                        body: JSON.stringify({

                            story_id:
                                numericStoryId

                        })

                    }
                );

            if (!response.ok) {

                const errorText =
                    await response.text();

                console.error(
                    "❌ Supabase lỗi:",
                    errorText
                );

                sessionStorage.removeItem(
                    readingSessionKey
                );

                return;

            }

            console.log(
                "✅ Đã cộng 1 view."
            );

        }

        catch (error) {

            console.error(
                "❌ Không thể kết nối Supabase:",
                error
            );

            sessionStorage.removeItem(
                readingSessionKey
            );

        }

    }


    /* ==================================================
       LẤY AUDIO POSITION
    ================================================== */

    function getSavedAudioTime() {

        const value =
            parseFloat(
                localStorage.getItem(
                    `reader_audio_position_${storyId}`
                )
            );

        if (
            !Number.isFinite(value) ||
            value < 0
        ) {

            return 0;

        }

        return value;

    }


    /* ==================================================
       LẤY VỊ TRÍ ĐỌC
    ================================================== */

    function getSavedReadingPosition() {

        try {

            const saved =
                localStorage.getItem(
                    readingPositionKey
                );

            if (!saved) {
                return null;
            }

            const data =
                JSON.parse(saved);

            if (
                !data ||
                !Number.isFinite(
                    Number(data.scrollY)
                )
            ) {

                return null;

            }

            return {

                scrollY:
                    Number(data.scrollY) || 0,

                audioTime:
                    Number(data.audioTime) || 0,

                timestamp:
                    Number(data.timestamp) || 0

            };

        }

        catch (error) {

            console.warn(
                "Không đọc được vị trí truyện:",
                error
            );

            return null;

        }

    }


    /* ==================================================
       LƯU VỊ TRÍ ĐỌC
    ================================================== */

    function saveReadingPosition() {

        if (!storyId) {
            return;
        }

        if (!isUnlockedToday()) {
            return;
        }

        const scrollY =
            Math.max(
                0,
                window.scrollY ||
                window.pageYOffset ||
                0
            );

        if (scrollY < 100) {
            return;
        }

        const data = {

            scrollY:
                scrollY,

            audioTime:
                getSavedAudioTime(),

            timestamp:
                Date.now()

        };

        try {

            localStorage.setItem(
                readingPositionKey,
                JSON.stringify(data)
            );

        }

        catch (error) {

            console.warn(
                "Không thể lưu vị trí đọc:",
                error
            );

        }

    }


    /* ==================================================
       XÓA VỊ TRÍ ĐỌC
    ================================================== */

    function clearReadingPosition() {

        try {

            localStorage.removeItem(
                readingPositionKey
            );

            localStorage.removeItem(
                `reader_audio_position_${storyId}`
            );

            localStorage.removeItem(
                `reader_audio_duration_${storyId}`
            );

        }

        catch (error) {

            console.warn(
                "Không thể xóa vị trí đọc:",
                error
            );

        }

    }


    /* ==================================================
       TÍNH THỜI GIAN SỬ DỤNG WEB
    ================================================== */

    function getActiveTime() {

        const today =
            getToday();

        const savedDate =
            localStorage.getItem(
                activeTimeDateKey
            );

        if (
            savedDate !== today
        ) {

            localStorage.setItem(
                activeTimeDateKey,
                today
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


    /* ==================================================
       LƯU THỜI GIAN ĐANG SỬ DỤNG
    ================================================== */

    function saveActiveTime() {

        if (!isUnlockedToday()) {
            return;
        }

        if (activeStartTime === null) {
            return;
        }

        const now =
            Date.now();

        const elapsed =
            now - activeStartTime;

        if (elapsed > 0) {

            const oldTime =
                getActiveTime();

            localStorage.setItem(
                activeTimeKey,
                String(
                    oldTime + elapsed
                )
            );

        }

        activeStartTime = null;

    }


    /* ==================================================
       BẮT ĐẦU TÍNH THỜI GIAN
    ================================================== */

    function startActiveTime() {

        if (!isUnlockedToday()) {
            return;
        }

        if (activeStartTime !== null) {
            return;
        }

        if (
            document.visibilityState !==
            "visible"
        ) {

            return;

        }

        if (
            isTenMinutesPassed()
        ) {

            return;

        }

        activeStartTime =
            Date.now();

    }


    /* ==================================================
       DỪNG TÍNH THỜI GIAN
    ================================================== */

    function pauseActiveTime() {

        saveActiveTime();

    }


    /* ==================================================
       CÒN BAO NHIÊU THỜI GIAN?
    ================================================== */

    function getRemainingTime() {

        const used =
            getActiveTime();

        return Math.max(
            0,
            TEN_MINUTES - used
        );

    }


    /* ==================================================
       ĐỦ 10 PHÚT CHƯA?
    ================================================== */

    function isTenMinutesPassed() {

        return (
            getActiveTime() >= TEN_MINUTES
        );

    }


    /* ==================================================
       THEO DÕI TRẠNG THÁI WEB
    ================================================== */

    document.addEventListener(
        "visibilitychange",
        function () {

            if (
                document.visibilityState ===
                "visible"
            ) {

                if (
                    isUnlockedToday()
                ) {

                    startActiveTime();

                }

            }

            else {

                pauseActiveTime();

            }

        }
    );


    /* ==================================================
       LƯU KHI ĐÓNG TAB / CHUYỂN TRANG
    ================================================== */

    window.addEventListener(
        "pagehide",
        function () {

            pauseActiveTime();

            saveReadingPosition();

        }
    );


    /* ==================================================
       TỰ ĐỘNG LƯU THỜI GIAN MỖI GIÂY
    ================================================== */

    activeTimer =
        setInterval(
            function () {

                if (
                    document.visibilityState ===
                    "visible"
                ) {

                    saveActiveTime();

                    startActiveTime();

                }

            },
            1000
        );


    /* ==================================================
       TẠO POPUP ĐỌC TIẾP
    ================================================== */

    function createResumePopup() {

        if (
            document.getElementById(
                "readerResumePopup"
            )
        ) {

            return;

        }

        const popup =
            document.createElement("div");

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
                        Hệ thống đã lưu vị trí bạn đang đọc.
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

        const yesBtn =
            document.getElementById(
                "resumeYesBtn"
            );

        const noBtn =
            document.getElementById(
                "resumeNoBtn"
            );


        yesBtn.addEventListener(
            "click",
            function () {

                popup.remove();

                sessionStorage.setItem(
                    resumePromptKey,
                    "1"
                );

                const saved =
                    getSavedReadingPosition();

                if (!saved) {
                    return;
                }

                window.readerResumeAudioTime =
                    Number(saved.audioTime) || 0;

                requestAnimationFrame(
                    function () {

                        setTimeout(
                            function () {

                                window.scrollTo({

                                    top:
                                        saved.scrollY,

                                    behavior:
                                        "smooth"

                                });

                            },
                            100
                        );

                    }
                );

                window.dispatchEvent(
                    new CustomEvent(
                        "readerResumeAudio",
                        {

                            detail: {

                                time:
                                    Number(
                                        saved.audioTime
                                    ) || 0

                            }

                        }
                    )
                );

            }
        );


        noBtn.addEventListener(
            "click",
            function () {

                popup.remove();

                sessionStorage.setItem(
                    resumePromptKey,
                    "1"
                );

                clearReadingPosition();

                window.readerResumeAudioTime =
                    0;

                window.dispatchEvent(
                    new CustomEvent(
                        "readerResetAudio"
                    )
                );

                window.scrollTo({

                    top: 0,

                    behavior: "smooth"

                });

            }
        );

    }


    /* ==================================================
       KIỂM TRA POPUP ĐỌC TIẾP
    ================================================== */

    function checkResumeReading() {

        if (!storyId) {
            return;
        }

        if (!isUnlockedToday()) {
            return;
        }

        if (
            sessionStorage.getItem(
                resumePromptKey
            ) === "1"
        ) {

            return;

        }

        const saved =
            getSavedReadingPosition();

        if (!saved) {
            return;
        }

        const hasScrollPosition =
            Number(saved.scrollY) > 300;

        const hasAudioPosition =
            Number(saved.audioTime) > 5;

        if (
            !hasScrollPosition &&
            !hasAudioPosition
        ) {

            return;

        }

        setTimeout(
            function () {

                createResumePopup();

            },
            700
        );

    }


    /* ==================================================
       MỞ KHÓA TRUYỆN
    ================================================== */

    function unlockContent(
        scrollToTop = false
    ) {

        lockedContent.style.display =
            "block";

        unlockBox.style.display =
            "none";

        const today =
            getToday();

        const oldUnlockDate =
            localStorage.getItem(
                unlockDateKey
            );

        if (
            oldUnlockDate !== today
        ) {

            localStorage.setItem(
                unlockDateKey,
                today
            );

            localStorage.setItem(
                unlockTimeKey,
                Date.now().toString()
            );

            localStorage.setItem(
                activeTimeKey,
                "0"
            );

            localStorage.setItem(
                activeTimeDateKey,
                today
            );

            localStorage.setItem(
                redirectStageKey,
                "0"
            );

            localStorage.setItem(
                redirectDateKey,
                today
            );

        }

        startActiveTime();

        addViewOncePerReadingSession();

        passInput.value =
            "";

        passError.textContent =
            "";

        if (scrollToTop) {

            window.scrollTo({

                top: 0,

                behavior: "smooth"

            });

        }

        setTimeout(
            function () {

                checkResumeReading();

            },
            300
        );

    }


    /* ==================================================
       GÁN LINK FACEBOOK THEO NGÀY
    ================================================== */

    const todayFacebookPost =
        getTodayFacebookPost();

    if (!todayFacebookPost) {

        console.warn(
            "⚠️ Chưa có link Facebook cho ngày:",
            getToday()
        );

    }


    /* ==================================================
       GÁN ẢNH HƯỚNG DẪN
    ================================================== */

    guideImage.src =
        GUIDE_IMAGE;


    /* ==================================================
       KIỂM TRA PASS
    ================================================== */

    function checkPass() {

        const enteredPass =
            passInput.value.trim();

        if (!enteredPass) {

            passError.textContent =
                "⚠️ Vui lòng nhập mã mở khóa.";

            passInput.focus();

            return;

        }

        const today =
            getToday();

        const todayPass =
            getTodayPass();

        if (!todayPass) {

            passError.textContent =
                "⚠️ Chưa có mã mở khóa cho ngày hôm nay.";

            console.error(
                "❌ Chưa cấu hình DAILY_PASSES cho ngày:",
                today
            );

            return;

        }

        if (
            enteredPass ===
            todayPass
        ) {

            unlockContent(true);

            console.log(
                "✅ Mở khóa truyện thành công.",
                "Ngày:",
                today
            );

            return;

        }

        passError.textContent =
            "❌ Mã không đúng. Vui lòng kiểm tra lại.";

        passInput.select();

    }


    /* ==================================================
       CLICK MỞ KHÓA
    ================================================== */

    unlockBtn.addEventListener(
        "click",
        checkPass
    );


    /* ==================================================
       ENTER MỞ KHÓA
    ================================================== */

    passInput.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                checkPass();

            }

        }
    );


    /* ==================================================
       TỰ ĐỘNG LƯU VỊ TRÍ CUỘN
    ================================================== */

    let savePositionTimer = null;

    window.addEventListener(
        "scroll",
        function () {

            if (savePositionTimer) {

                clearTimeout(
                    savePositionTimer
                );

            }

            savePositionTimer =
                setTimeout(
                    function () {

                        saveReadingPosition();

                    },
                    700
                );

        },
        {
            passive: true
        }
    );


    /* ==================================================
       LƯU KHI TAB ẨN
    ================================================== */

    document.addEventListener(
        "visibilitychange",
        function () {

            if (
                document.visibilityState ===
                "hidden"
            ) {

                saveReadingPosition();

            }

        }
    );


    /* ==================================================
       INTERNAL NAVIGATION
    ================================================== */

    document.addEventListener(
        "click",
        function (event) {

            const link =
                event.target.closest("a");

            if (!link) {
                return;
            }

            if (!storyId) {
                return;
            }

            let targetUrl;

            try {

                targetUrl =
                    new URL(
                        link.href,
                        window.location.href
                    );

            }

            catch {

                return;

            }

            if (
                targetUrl.origin !==
                window.location.origin
            ) {

                return;

            }

            const currentUrl =
                new URL(
                    window.location.href
                );

            const targetId =
                targetUrl.searchParams.get(
                    "id"
                );

            if (
                targetId ===
                    params.get("id") &&
                targetUrl.pathname ===
                    currentUrl.pathname
            ) {

                return;

            }

            if (
                !params.get("id") &&
                targetUrl.pathname ===
                    currentUrl.pathname
            ) {

                return;

            }

            sessionStorage.removeItem(
                readingSessionKey
            );

            console.log(
                "🚪 Người dùng rời truyện.",
                "Kết thúc phiên đọc:",
                storyId
            );

        },
        true
    );


    /* ==================================================
       CHUẨN BỊ REDIRECT
    ================================================== */

    function prepareRedirect() {

        sessionStorage.setItem(
            redirectLeavingKey,
            "1"
        );

    }


    /* ==================================================
       KIỂM TRA LINK TIKTOK
    ================================================== */

    function isTikTokLink(link) {

        if (!link) {
            return false;
        }

        let href = "";

        try {

            href =
                new URL(
                    link.href,
                    window.location.href
                ).href;

        }

        catch {

            return false;

        }

        return TIKTOK_LINKS.some(
            function (url) {

                return (
                    href === url ||
                    href.startsWith(url)
                );

            }
        );

    }


    /* ==================================================
       KIỂM TRA LINK LAZADA
    ================================================== */

    function isLazadaLink(link) {

        if (!link) {
            return false;
        }

        let href = "";

        try {

            href =
                new URL(
                    link.href,
                    window.location.href
                ).href;

        }

        catch {

            return false;

        }

        return LAZADA_LINKS.some(
            function (url) {

                return (
                    href === url ||
                    href.startsWith(url)
                );

            }
        );

    }


    /* ==================================================
       REDIRECT TIKTOK → LAZADA
    ================================================== */

    document.addEventListener(
        "click",
        function (event) {

            if (
                !isUnlockedToday()
            ) {

                return;

            }

            const link =
                event.target.closest("a");

            if (!link) {
                return;
            }

            const isTikTok =
                isTikTokLink(link);

            const isLazada =
                isLazadaLink(link);

            if (
                !isTikTok &&
                !isLazada
            ) {

                return;

            }


            /* ==================================================
               ĐÃ HOÀN TẤT
            ================================================== */

            if (
                isRedirectFinishedToday()
            ) {

                event.preventDefault();

                console.log(
                    "✅ Đã hoàn thành TikTok và Lazada hôm nay."
                );

                return;

            }


            /* ==================================================
               CHƯA ĐỦ 10 PHÚT
            ================================================== */

            if (
                !isTenMinutesPassed()
            ) {

                event.preventDefault();

                const remaining =
                    Math.ceil(
                        getRemainingTime() / 1000
                    );

                console.log(
                    "⏳ Chưa đủ 10 phút sử dụng web.",
                    "Còn lại:",
                    remaining,
                    "giây"
                );

                alert(
                    "Bạn cần sử dụng web thêm " +
                    Math.ceil(
                        getRemainingTime() / 60000
                    ) +
                    " phút nữa."
                );

                return;

            }


            const stage =
                getRedirectStage();


            /* ==================================================
               STAGE 0 → TIKTOK
            ================================================== */

            if (
                stage === 0
            ) {

                if (!isTikTok) {

                    event.preventDefault();

                    alert(
                        "⚠️ Hãy mở TikTok trước."
                    );

                    return;

                }

                event.preventDefault();

                localStorage.setItem(
                    redirectStageKey,
                    "1"
                );

                localStorage.setItem(
                    redirectDateKey,
                    getToday()
                );

                pauseActiveTime();

                prepareRedirect();

                window.location.href =
                    TIKTOK_URL;

                return;

            }


            /* ==================================================
               STAGE 1 → LAZADA
            ================================================== */

            if (
                stage === 1
            ) {

                if (!isLazada) {

                    event.preventDefault();

                    alert(
                        "⚠️ Hãy quay lại web từ TikTok rồi mở Lazada."
                    );

                    return;

                }

                event.preventDefault();

                localStorage.setItem(
                    redirectStageKey,
                    "2"
                );

                localStorage.setItem(
                    redirectDateKey,
                    getToday()
                );

                pauseActiveTime();

                prepareRedirect();

                window.location.href =
                    LAZADA_URL;

                return;

            }

        },
        true
    );


    /* ==================================================
       KHI QUAY LẠI TỪ TIKTOK / LAZADA
    ================================================== */

    window.addEventListener(
        "pageshow",
        function () {

            if (
                sessionStorage.getItem(
                    redirectLeavingKey
                )
            ) {

                sessionStorage.removeItem(
                    redirectLeavingKey
                );

                startActiveTime();

                console.log(
                    "↩️ Quay lại từ TikTok/Lazada."
                );

            }

        }
    );


    /* ==================================================
       TRẠNG THÁI BAN ĐẦU
    ================================================== */

    if (
        isUnlockedToday()
    ) {

        unlockContent(false);

    }

    else {

        lockContent();

    }


    /* ==================================================
       KIỂM TRA SANG NGÀY MỚI
    ================================================== */

    setInterval(
        function () {

            const savedUnlockDate =
                localStorage.getItem(
                    unlockDateKey
                );

            const today =
                getToday();

            if (
                savedUnlockDate &&
                savedUnlockDate !== today
            ) {

                pauseActiveTime();

                localStorage.removeItem(
                    unlockDateKey
                );

                localStorage.removeItem(
                    unlockTimeKey
                );

                localStorage.removeItem(
                    redirectStageKey
                );

                localStorage.removeItem(
                    redirectDateKey
                );

                localStorage.removeItem(
                    activeTimeKey
                );

                localStorage.removeItem(
                    activeTimeDateKey
                );

                passInput.value =
                    "";

                passError.textContent =
                    "";

                closeFacebookModal();

                lockContent();

                console.log(
                    "🌙 Sang ngày mới → reset pass và thời gian."
                );

            }

        },
        60 * 1000
    );

});
