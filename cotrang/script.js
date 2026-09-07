window.addEventListener("DOMContentLoaded", function(){

  const modal = document.getElementById("modal");
  const story = document.getElementById("story");
  const unlockBtn = document.getElementById("unlockBtn");

  if(!modal || !story || !unlockBtn){
    return;
  }

  /* ===== LINK QUẢNG CÁO ===== */

  const links = [
    "https://s.shopee.vn/10zkRbGJLm",
    "https://s.lazada.vn/s.NcuoU?c=b",
    "https://vt.tiktok.com/ZS9FvVXpLV"
  ];

  /* ===== 1 GIỜ ===== */

  const ONE_HOUR = 60 * 60 * 1000;

  /* ===== STORY ID ===== */

  const storyId = location.pathname;

  /* ===== GET LINK ===== */

  function getLink(){

    const index =
      Math.floor(Date.now() / ONE_HOUR);

    return links[index % links.length];
  }

  /* ===== CHECK LOCK ===== */

  function checkLock(){

    const unlockTime =
      localStorage.getItem("unlock_" + storyId);

    if(!unlockTime){

      lockStory();
      return;

    }

    const now = Date.now();

    const diff = now - parseInt(unlockTime);

    if(diff >= ONE_HOUR){

      lockStory();

    } else {

      unlockStory();

    }

  }

  /* ===== LOCK ===== */

  function lockStory(){

    modal.style.display = "flex";

    story.style.display = "none";

  }

  /* ===== UNLOCK ===== */

  function unlockStory(){

    modal.style.display = "none";

    story.style.display = "block";

  }

  /* ===== CLICK UNLOCK ===== */

  unlockBtn.addEventListener("click", function(){

    const link = getLink();

    window.open(link, "_blank");

    localStorage.setItem(
      "unlock_" + storyId,
      Date.now()
    );

    unlockStory();

  });

  /* ===== START ===== */

  checkLock();

  /* ===== AUTO CHECK ===== */

  setInterval(checkLock, 5000);

});