if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
}

let scrollTrackingReady = true;

/* =========================================================
   ★★★ CHỈ CẦN THÊM DÒNG MỚI CHO MỖI NGÀY ★★★
   Ngày tính theo giờ quốc tế (UTC), đổi ngày vào 0h UTC
   (= 7h sáng giờ Việt Nam). Định dạng ngày: "YYYY-MM-DD"
========================================================= */

/* Mật khẩu của từng ngày */
const DAILY_PASSWORDS = {
    "2026-10-05": "411694"
};

/* Link 1 của từng ngày */
const DAILY_LINK_1 = {
    "2026-10-05":
        "https://link-center.net/1317435/aUjWtfCxSnm9"
};

/* Link 2 của từng ngày */
const DAILY_LINK_2 = {
    "2026-10-05":
        "https://link-center.net/1317435/dPrrnlP3Skkb"
};

/* true  = nếu hôm nay chưa khai báo thì dùng dữ liệu của ngày gần nhất trước đó
   false = nếu hôm nay chưa khai báo thì truyện giữ khóa và báo lỗi */
const FALLBACK_TO_LATEST = true;

/* true  = không phân biệt chữ hoa / thường khi nhập mật khẩu
   false = phải nhập đúng chữ hoa / thường */
const PASSWORD_IGNORE_CASE = true;

/* =========================================================
   SUPABASE (để trống nếu không dùng)
========================================================= */

const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

/* =========================================================
   LOCAL STORAGE KEYS
========================================================= */

/* Lưu "ngày UTC|mật khẩu". Sang ngày mới (0h UTC) hoặc bạn đổi
   mật khẩu thì giá trị này không còn khớp → truyện tự khóa lại.
   Trong cùng 1 ngày chỉ cần nhập 1 lần. */
const unlockKey = "reader_password_unlock";

/* =========================================================
   STORY ID
========================================================= */

const urlParams = new URLSearchParams(window.location.search);
const storyId = urlParams.get("id") || window.location.pathname;

const readingPositionKey = "reader_position_" + storyId;
const readingSessionKey = "reading_session_" + storyId;

/* =========================================================
   BIẾN TOÀN CỤC
========================================================= */

let storyUnlocked = false;
let resumePopupShown = false;

/* =========================================================
   TIỆN ÍCH NGÀY / CẤU HÌNH
========================================================= */

/* Ngày theo giờ quốc tế UTC: "YYYY-MM-DD" */
function getToday() {
    return new Date().toISOString().slice(0, 10);
}

function normalizePassword(value) {

    let text = String(value || "").trim();

    if (PASSWORD_IGNORE_CASE) {
        text = text.toLowerCase();
    }

    return text;
}

/* Lấy giá trị của ngày `dateStr` trong bảng `table`.
   Nếu không có và bật FALLBACK_TO_LATEST thì lấy ngày gần nhất trước đó. */
function pickByDate(table, dateStr) {

    if (Object.prototype.hasOwnProperty.call(table, dateStr)) {
        return table[dateStr];
    }

    if (!FALLBACK_TO_LATEST) {
        return "";
    }

    const earlier = Object.keys(table)
        .filter(function (d) { return d <= dateStr; })
        .sort();

    if (earlier.length === 0) {
        return "";
    }

    return table[earlier[earlier.length - 1]];
}

function getTodayPassword() {
    return String(pickByDate(DAILY_PASSWORDS, getToday()) || "");
}

function getTodayLinks() {
    const today = getToday();
    return [
        pickByDate(DAILY_LINK_1, today) || "",
        pickByDate(DAILY_LINK_2, today) || ""
    ];
}

function getUnlockToken() {
    return getToday() + "|" + normalizePassword(getTodayPassword());
}

/* =========================================================
   TRẠNG THÁI MỞ KHÓA
========================================================= */

function isUnlockedToday() {

    /* Chưa có mật khẩu hôm nay thì không cho mở */
    if (!getTodayPassword()) {
        return false;
    }

    return localStorage.getItem(unlockKey) === getUnlockToken();
}

function markUnlockedToday() {
    localStorage.setItem(unlockKey, getUnlockToken());
}

function lockStory() {
    storyUnlocked = false;
    document.body.classList.add("storyLocked");
}

function unlockStory() {
    storyUnlocked = true;
    document.body.classList.remove("storyLocked");
    increaseStoryView();
}

/* =========================================================
   CỔNG MẬT KHẨU
========================================================= */

/* Gắn link 1 và link 2 của hôm nay vào 2 nút .password-link theo thứ tự */
function applyPasswordLinks() {

    const links = document.querySelectorAll("#passwordGate .password-link");
    const urls = getTodayLinks();

    links.forEach(function (link, index) {

        const url = urls[index];

        if (!url) {
            link.style.display = "none";
            return;
        }

        link.style.display = "";
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
    });
}

function showPasswordError(message) {

    const error = document.getElementById("passwordError");

    if (!error) {
        return;
    }

    error.textContent = message;
}

function tryUnlockWithPassword() {

    const input = document.getElementById("storyPassword");

    if (!input) {
        return;
    }

    const todayPassword = getTodayPassword();

    if (!todayPassword) {
        showPasswordError("Hôm nay chưa có mật khẩu. Vui lòng quay lại sau.");
        return;
    }

    const typed = normalizePassword(input.value);

    if (!typed) {
        showPasswordError("Vui lòng nhập mật khẩu.");
        input.focus();
        return;
    }

    if (typed !== normalizePassword(todayPassword)) {
        showPasswordError("Mật khẩu chưa đúng. Hãy kiểm tra lại.");
        input.select();
        return;
    }

    showPasswordError("");
    input.value = "";

    markUnlockedToday();
    unlockStory();

    window.scrollTo({ top: 0, behavior: "auto" });

    setTimeout(showResumePopup, 400);
}

function initPasswordGate() {

    applyPasswordLinks();

    const button = document.getElementById("unlockStoryBtn");
    const input = document.getElementById("storyPassword");

    if (button) {
        button.addEventListener("click", tryUnlockWithPassword);
    }

    if (input) {

        input.addEventListener("keydown", function (event) {

            if (event.key === "Enter") {
                event.preventDefault();
                tryUnlockWithPassword();
            }
        });

        input.addEventListener("input", function () {
            showPasswordError("");
        });
    }
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
   POPUP ĐỌC TIẾP
========================================================= */

function showResumePopup() {

    if (resumePopupShown) {
        return;
    }

    if (!storyUnlocked) {
        return;
    }

    const saved = localStorage.getItem(readingPositionKey);

    if (!saved || Number(saved) <= 50) {
        return;
    }

    resumePopupShown = true;

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
            window.location.href = "https://tiemnhamiumiu.neocities.org/";
        });
    }

    if (no) {

        no.addEventListener("click", function () {
            popup.style.display = "none";
        });
    }
}

/* =========================================================
   LINK NỘI BỘ (lưu vị trí đọc trước khi chuyển trang)
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
   TỰ KHÓA KHI QUA 0H UTC LÚC ĐANG MỞ TRANG
========================================================= */

function initDayChangeWatcher() {

    const loadedDay = getToday();

    setInterval(function () {

        if (getToday() !== loadedDay) {
            saveReadingPosition();
            location.reload();
        }

    }, 30000);
}

/* =========================================================
   KHỞI TẠO
========================================================= */

function initReader() {

    initPasswordGate();
    initXoiThitPopup();
    initInternalNavigation();
    initDayChangeWatcher();

    if (isUnlockedToday()) {

        unlockStory();

        setTimeout(showResumePopup, 800);

    } else {

        lockStory();
    }
}

/* =========================================================
   LƯU TRƯỚC KHI RỜI TRANG / ẨN TAB
========================================================= */

window.addEventListener("beforeunload", saveReadingPosition);

document.addEventListener("visibilitychange", function () {

    if (document.visibilityState === "hidden") {
        saveReadingPosition();
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