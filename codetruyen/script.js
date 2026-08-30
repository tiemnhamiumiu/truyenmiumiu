
window.addEventListener("DOMContentLoaded", function () {

  /* ==================================================
     ID QUẢNG CÁO
  ================================================== */

  const QC_ID = "sp02";


  /* ==================================================
     ELEMENTS
  ================================================== */

  const lockedContent = document.getElementById("lockedContent");
  const story = document.getElementById("story");

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
    !story ||
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

    console.error("❌ Thiếu thành phần HTML khóa.");

    return;
  }


  /* ==================================================
     LOCAL STORAGE
  ================================================== */

  const stepKey = "reader_step";
  const waitKey = "waiting_return";


  let step = Number(
    localStorage.getItem(stepKey) || "0"
  );


  /* ==================================================
     HÀM KHÓA
  ================================================== */

  function hideContent() {

    lockedContent.style.display = "none";

  }


  /* ==================================================
     MỞ NỘI DUNG
  ================================================== */

  function unlockContent() {

    lockedContent.style.display = "block";

    step1Box.style.display = "none";
    step2Box.style.display = "none";

  }


  /* ==================================================
     BƯỚC 1
  ================================================== */

  function showStep1() {

    lockedContent.style.display = "none";

    step1Box.style.display = "block";
    step2Box.style.display = "none";

  }


  /* ==================================================
     BƯỚC 2
  ================================================== */

  function showStep2() {

    lockedContent.style.display = "none";

    step1Box.style.display = "none";
    step2Box.style.display = "block";

  }


  /* ==================================================
     QUẢNG CÁO
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
     GÁN QUẢNG CÁO SHOPEE
  ================================================== */

  if (shopee) {

    step1Url.href = shopee.link;
    step1Url.textContent = shopee.link;

    step1Link.href = shopee.link;

    step1Image.src = shopee.image;
    step1Image.alt = shopee.name;

    step1Name.textContent = shopee.name;
    step1Desc.textContent = shopee.description;

  }
  else {

    console.error(
      "❌ Không tìm thấy quảng cáo Shopee:",
      QC_ID
    );

  }


  /* ==================================================
     GÁN QUẢNG CÁO SHOPEEFOOD
  ================================================== */

  if (spf) {

    step2Url.href = spf.link;
    step2Url.textContent = spf.link;

    step2Link.href = spf.link;

    step2Image.src = spf.image;
    step2Image.alt = spf.name;

    step2Name.textContent = spf.name;
    step2Desc.textContent = spf.description;

  }
  else {

    console.error(
      "❌ Không tìm thấy quảng cáo ShopeeFood:",
      QC_ID
    );

  }


  /* ==================================================
     TRẠNG THÁI BAN ĐẦU
  ================================================== */

  if (step >= 2) {

    unlockContent();

  }
  else if (step === 1) {

    showStep2();

  }
  else {

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

    const waiting =
      localStorage.getItem(waitKey);

    const currentStep =
      Number(
        localStorage.getItem(stepKey) || "0"
      );


    /* -----------------------------------------------
       SHOPEE → BƯỚC 2
    ----------------------------------------------- */

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


    /* -----------------------------------------------
       SHOPEEFOOD → MỞ TRUYỆN
    ----------------------------------------------- */

    if (
      waiting === "2" &&
      currentStep === 1
    ) {

      localStorage.setItem(
        stepKey,
        "2"
      );

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


});
```
