
window.addEventListener("DOMContentLoaded", function () {

"use strict";


/* ==================================================
   KIỂM TRA FACEBOOK / MESSENGER / INSTAGRAM
================================================== */

const ua =
    navigator.userAgent ||
    navigator.vendor ||
    window.opera ||
    "";

const isFacebookBrowser =
    /FBAN|FBAV|FBIOS|FB_IAB|FB4A|FB4i|Messenger|Instagram/i.test(ua);

if (isFacebookBrowser) {

    document.body.innerHTML = `

        <div style="
            min-height:100vh;
            display:flex;
            align-items:center;
            justify-content:center;
            padding:20px;
            box-sizing:border-box;
            background:#111;
            color:white;
            font-family:Arial,sans-serif;
            text-align:center;
        ">

            <div style="
                max-width:420px;
                width:100%;
                background:#1f1f1f;
                border-radius:16px;
                padding:30px 22px;
                box-sizing:border-box;
                box-shadow:0 10px 30px rgba(0,0,0,.4);
            ">

                <div style="
                    font-size:48px;
                    margin-bottom:15px;
                ">
                    🌐
                </div>

                <h2 style="
                    margin:0 0 15px;
                    font-size:22px;
                ">
                    Vui lòng mở bằng trình duyệt
                </h2>

                <p style="
                    color:#ccc;
                    line-height:1.6;
                    margin-bottom:22px;
                ">

                    Bạn đang mở trang bằng trình duyệt
                    tích hợp của Facebook hoặc Messenger.

                    <br><br>

                    Vui lòng chọn
                    <b>“Mở trong trình duyệt”</b>
                    để tiếp tục đọc truyện.

                </p>

                <div style="
                    background:#292929;
                    border-radius:10px;
                    padding:14px;
                    font-size:14px;
                    line-height:1.5;
                    color:#ddd;
                ">

                    📌 Nhấn <b>⋯</b> ở góc màn hình

                    <br>

                    → chọn <b>Mở trong trình duyệt</b>

                </div>

            </div>

        </div>

    `;

    return;

}


/* ==================================================
   PASS THEO NGÀY
================================================== */

const DAILY_PASSES = {

    "2026-09-09": "combo",

    "2026-09-10": "miu123",

    "2026-09-11": "abc456",

    "2026-09-12": "xyz789",

    "2026-09-13": "hello123",

    "2026-09-14": "pass1414"

};


/* ==================================================
   FACEBOOK
================================================== */

const FACEBOOK_URL =
    "https://www.facebook.com/profile.php?id=61578134287179&locale=vi_VN";


/* ==================================================
   ẢNH HƯỚNG DẪN
================================================== */

const GUIDE_IMAGE =
    "../codetruyen/huong-dan.jpg";


/* ==================================================
   LINK TIKTOK + LAZADA
================================================== */

const TIKTOK_URL =
    "https://www.tiktok.com/t/ZSVaFpSNR/";

const LAZADA_URL =
    "https://s.lazada.vn/s.MSUCB?c=c&t=p-ixAY3P-sGQ1lgE";


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

/*
   Lưu tổng thời gian đã sử dụng trong web.

   Không tính thời gian:
   - Đóng web
   - Chuyển sang TikTok
   - Chuyển sang Lazada
   - Chuyển sang ứng dụng khác
   - Tắt màn hình / web bị ẩn

   Mỗi ngày có bộ đếm riêng.
*/

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


if (!storyId) {

    console.warn(
        "⚠️ Không tìm thấy story id."
    );

}


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

const storyElement =
    document.getElementById(
        "story"
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

    createReadingSession();

    console.log(
        "👁️ Tạo phiên đọc mới.",
        "Truyện:",
        storyId
    );

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
                            Number(storyId)

                    })

                }
            );

        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "❌ Supabase lỗi khi cộng view:",
                errorText
            );

            sessionStorage.removeItem(
                readingSessionKey
            );

            return;

        }

        console.log(
            "✅ Đã cộng 1 view.",
            "Truyện:",
            storyId
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

    console.log(
        "▶️ Bắt đầu tính thời gian ở trong web."
    );

}


/* ==================================================
   DỪNG TÍNH THỜI GIAN
================================================== */

function pauseActiveTime() {

    saveActiveTime();

    console.log(
        "⏸️ Dừng tính thời gian ở trong web."
    );

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


    /* ==================================================
       ĐỌC TIẾP
    ================================================== */

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


    /* ==================================================
       ĐỌC TỪ ĐẦU
    ================================================== */

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

        console.log(
            "⏱️ Bắt đầu tính 10 phút sử dụng web."
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
   GÁN LINK FACEBOOK
================================================== */

facebookLink.href =
    FACEBOOK_URL;


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

/*
   Rời truyện sang trang khác trong website:
   → xóa session view.

   Không xóa vị trí đọc.

   Link ngoài website:
   → giữ nguyên session.
*/

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
   KIỂM TRA ĐÚNG LINK REDIRECT
================================================== */

function isTikTokLink(link) {

    if (!link) {
        return false;
    }

    return (
        link.href === TIKTOK_URL ||
        link.href.startsWith(
            "https://vt.tiktok.com/ZS9SXoGBoCjBV-ST96M/"
        )
    );

}


function isLazadaLink(link) {

    if (!link) {
        return false;
    }

    return (
        link.href === LAZADA_URL ||
        link.href.startsWith(
            "https://s.lazada.vn/s.o0ZT2?c=p&t=p-ixAY3P-sGQ1lgE"
        )
    );

}


/* ==================================================
   REDIRECT TIKTOK → LAZADA
================================================== */

/*
   Chỉ bắt đúng link TikTok / Lazada.

   Không ảnh hưởng:
   - Nút audio
   - Nút đọc tiếp
   - Link trang chủ
   - Link thể loại
   - Link truyện khác
*/

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

                console.log(
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

            console.log(
                "⏰ Đủ 10 phút sử dụng web."
            );

            console.log(
                "🎵 Chuyển sang TikTok."
            );

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

                console.log(
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

            console.log(
                "🛒 Chuyển sang Lazada."
            );

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

            console.log(
                "▶️ Tiếp tục tính thời gian ở trong web."
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

            lockContent();

            console.log(
                "🌙 Sang ngày mới theo giờ Việt Nam → reset pass và thời gian."
            );

        }

    },
    60 * 1000
);

});
