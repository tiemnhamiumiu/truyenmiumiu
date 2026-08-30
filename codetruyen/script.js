window.addEventListener("DOMContentLoaded", function () {

  /* ==================================================
     ID QUẢNG CÁO
  ================================================== */

  const QC_ID = "sp02";


  /* ==================================================
     ELEMENTS
  ================================================== */

  const lockedContent = document.getElementById("lockedContent");

  const step1Box = document.getElementById("step1Box");
  const step2Box = document.getElementById("step2Box");

  const step1Url = document.getElementById("step1Url");
  const step1Link = document.getElementById("step1Link");
  const step1Image = document.getElementById("step1Image");
  const step1Name = document.getElementById("step1Name");
  const step1Desc = document.getElementById("step1Desc");

  const step2Url = document.getElementById("step2Url");
  const step2Link = document.getElementById("step2Link");
  const step2Image = document.getElementById("step2Image");
  const step2Name = document.getElementById("step2Name");
  const step2Desc = document.getElementById("step2Desc");


  /* ==================================================
     KIỂM TRA HTML
  ================================================== */

  if (
    !lockedContent ||
    !step1Box ||
    !step2Box ||
    !step1Url ||
    !step1Link ||
    !step1Image ||
    !step1Name ||
    !step1Desc ||
    !step2Url ||
    !step2Link ||
    !step2Image ||
    !step2Name ||
    !step2Desc
  ) {

    console.error("❌ Thiếu thành phần HTML.");
    return;

  }


  /* ==================================================
     LOCAL STORAGE
  ================================================== */

  const stepKey = "reader_step";
  const waitKey = "waiting_return";
  const unlockDateKey = "reader_unlock_date";


  /* ==================================================
     LẤY NGÀY HIỆN TẠI
     
     Dạng:
     2026-08-30
  ================================================== */

  function getToday() {

    const now = new Date();

    const year = now.getFullYear();

    const month =
      String(now.getMonth() + 1).padStart(2, "0");

    const day =
      String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;

  }


  /* ==================================================
     KIỂM TRA ĐÃ MỞ KHÓA HÔM NAY
  ================================================== */

  function isUnlockedToday() {

    return (
      localStorage.getItem(unlockDateKey)
      ===
      getToday()
    );

  }


  /* ==================================================
     RESET
  ================================================== */

  function resetForNewDay() {

    localStorage.removeItem(stepKey);
    localStorage.removeItem(waitKey);
    localStorage.removeItem(unlockDateKey);

  }


  /* ==================================================
     ẨN TOÀN BỘ NỘI DUNG TRUYỆN
     
     Khi khóa:
     lockedContent = NONE

     Không hiện audio.
     Không hiện story.
     Không hiện Facebook.
     Không hiện bất kỳ nội dung nào bên trong.
  ================================================== */

  function hideContent() {

    lockedContent.style.display = "none";

  }


  /* ==================================================
     HIỆN NỘI DUNG TRUYỆN
     
     Chỉ gọi sau khi hoàn thành:
     SHOPEE + SHOPEEFOOD
  ================================================== */

  function unlockContent() {

    lockedContent.style.display = "block";

    step1Box.style.display = "none";
    step2Box.style.display = "none";

    localStorage.setItem(
      unlockDateKey,
      getToday()
    );

    localStorage.setItem(
      stepKey,
      "2"
    );

  }


  /* ==================================================
     CHỈ HIỆN BẢNG SHOPEE
  ================================================== */

  function showStep1() {

    lockedContent.style.display = "none";

    step1Box.style.display = "block";
    step2Box.style.display = "none";

  }


  /* ==================================================
     CHỈ HIỆN BẢNG SHOPEEFOOD
  ================================================== */

  function showStep2() {

    lockedContent.style.display = "none";

    step1Box.style.display = "none";
    step2Box.style.display = "block";

  }


  /* ==================================================
     LẤY QUẢNG CÁO
     
     KHÔNG TẠO HTML MỚI.
     
     Chỉ lấy dữ liệu từ:
     
     QC_SHOPEE[QC_ID]
     QC_SPF[QC_ID]
  ================================================== */

  let shopee = null;
  let spf = null;


  if (typeof QC_SHOPEE !== "undefined") {

    shopee = QC_SHOPEE[QC_ID];

  }


  if (typeof QC_SPF !== "undefined") {

    spf = QC_SPF[QC_ID];

  }


  /* ==================================================
     SHOPEE
  ================================================== */

  if (shopee) {

    step1Url.href = shopee.link;
    step1Url.textContent = shopee.link;

    step1Link.href = shopee.link;

    step1Image.src = shopee.image;
    step1Image.alt = shopee.name;

    step1Name.textContent = shopee.name;

    step1Desc.textContent =
      shopee.description;

  }
  else {

    console.error(
      "❌ Không tìm thấy QC_SHOPEE:",
      QC_ID
    );

  }


  /* ==================================================
     SHOPEEFOOD
  ================================================== */

  if (spf) {

    step2Url.href = spf.link;
    step2Url.textContent = spf.link;

    step2Link.href = spf.link;

    step2Image.src = spf.image;
    step2Image.alt = spf.name;

    step2Name.textContent = spf.name;

    step2Desc.textContent =
      spf.description;

  }
  else {

    console.error(
      "❌ Không tìm thấy QC_SPF:",
      QC_ID
    );

  }


  /* ==================================================
     TRẠNG THÁI BAN ĐẦU
  ================================================== */

  let step =
    Number(
      localStorage.getItem(stepKey) || "0"
    );


  /*
     Nếu đã hoàn thành hôm nay
     → mở truyện.
  */

  if (isUnlockedToday()) {

    unlockContent();

  }

  /*
     Nếu chưa hoàn thành nhưng đã qua bước Shopee
     → chỉ hiện bảng SPF.
  */

  else if (step === 1) {

    showStep2();

  }

  /*
     Chưa làm gì
     → chỉ hiện bảng Shopee.
  */

  else {

    resetForNewDay();

    showStep1();

  }


  /* ==================================================
     CLICK SHOPEE
  ================================================== */

  function clickedShopee() {

    localStorage.setItem(
      waitKey,
      "1"
    );

  }


  step1Link.addEventListener(
    "click",
    clickedShopee
  );


  step1Url.addEventListener(
    "click",
    clickedShopee
  );


  /* ==================================================
     CLICK SHOPEEFOOD
  ================================================== */

  function clickedSPF() {

    localStorage.setItem(
      waitKey,
      "2"
    );

  }


  step2Link.addEventListener(
    "click",
    clickedSPF
  );


  step2Url.addEventListener(
    "click",
    clickedSPF
  );


  /* ==================================================
     KIỂM TRA QUAY LẠI
  ================================================== */

  function checkReturn() {

    /*
       Nếu sang ngày mới
       → reset.
    */

    if (
      localStorage.getItem(unlockDateKey) &&
      !isUnlockedToday()
    ) {

      resetForNewDay();

      showStep1();

      return;

    }


    const waiting =
      localStorage.getItem(waitKey);

    const currentStep =
      Number(
        localStorage.getItem(stepKey) || "0"
      );


    /* ==================================================
       SHOPEE → SPF
    ================================================== */

    if (
      waiting === "1" &&
      currentStep === 0
    ) {

      localStorage.setItem(
        stepKey,
        "1"
      );

      localStorage.removeItem(
        waitKey
      );

      step = 1;

      showStep2();

      return;

    }


    /* ==================================================
       SPF → MỞ TRUYỆN
    ================================================== */

    if (
      waiting === "2" &&
      currentStep === 1
    ) {

      localStorage.removeItem(
        waitKey
      );

      step = 2;

      unlockContent();

    }

  }


  /* ==================================================
     QUAY LẠI TAB
  ================================================== */

  document.addEventListener(
    "visibilitychange",
    function () {

      if (!document.hidden) {

        checkReturn();

      }

    }
  );


  window.addEventListener(
    "focus",
    checkReturn
  );


  window.addEventListener(
    "pageshow",
    checkReturn
  );


  /* ==================================================
     KIỂM TRA 00:00 MỖI PHÚT
     
     Nếu người dùng mở trang xuyên qua 00:00:
     
     23:59 → mở
     00:00 → khóa
  ================================================== */

  setInterval(
    function () {

      if (
        localStorage.getItem(unlockDateKey) &&
        !isUnlockedToday()
      ) {

        resetForNewDay();

        showStep1();

        console.log(
          "🌙 Sang ngày mới → khóa lại."
        );

      }

    },
    60 * 1000
  );

});
