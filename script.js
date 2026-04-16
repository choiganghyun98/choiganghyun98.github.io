const sections=[...document.querySelectorAll(".section")];
const body=document.body;
const topNav=document.getElementById("topNav");
const navLinks=[...document.querySelectorAll(".topnav-link")];
const posterLinks=[...document.querySelectorAll(".poster-link")];

const lightbox=document.getElementById("lightbox");
const lbImg=document.getElementById("lbImg");
const lbClose=document.getElementById("lbClose");

const guard=document.getElementById("topnavGuard");

const FADE=360;

function syncNavGuardHeight(){
  if(!guard||!topNav)return;
  const h=Math.ceil(topNav.getBoundingClientRect().height);
  guard.style.height=h+"px";
}

function updateNavGuard(){
  const id=document.querySelector(".section.active")?.id||"main";
  if(id==="main"){body.classList.remove("nav-guard");return;}
  if(window.scrollY>10){body.classList.add("nav-guard");}else{body.classList.remove("nav-guard");}
}

function setActive(id){
  sections.forEach(s=>s.classList.toggle("active",s.id===id));
  navLinks.forEach(a=>a.classList.toggle("is-active",a.dataset.target===id));
  if(id==="main"){body.classList.remove("sub");body.style.overflow="hidden";}else{body.classList.add("sub");body.style.overflow="hidden";}
  window.scrollTo({top:0,left:0,behavior:"instant"});
  syncNavGuardHeight();
  setTimeout(updateNavGuard,50);
}

function fadeTo(id){
  const current=document.querySelector(".section.active");
  if(!current||current.id===id)return;
  current.style.opacity="0";
  setTimeout(()=>{
    setActive(id);
    const next=document.getElementById(id);
    next.style.opacity="0";
    requestAnimationFrame(()=>{next.style.opacity="1";});
  },FADE);
}

function go(id){
  fadeTo(id);
  history.replaceState(null,"",`#${id}`);
}

document.querySelectorAll("[data-target]").forEach(el=>{
  el.addEventListener("click",e=>{
    e.preventDefault();
    go(el.dataset.target);
  });
});

window.addEventListener("load",()=>{
  const id=(location.hash||"#main").replace("#","");
  if(document.getElementById(id))setActive(id);
  syncNavGuardHeight();
  updateNavGuard();
});

window.addEventListener("hashchange",()=>{
  const id=(location.hash||"#main").replace("#","");
  if(document.getElementById(id))go(id);
});

window.addEventListener("scroll",updateNavGuard,{passive:true});

/* ✅ 이 한 줄만 추가됨: 회전/리사이즈 시 guard 높이 자동 보정 */
window.addEventListener("resize",syncNavGuardHeight);

document.querySelectorAll(".accordion").forEach(acc=>{
  const head=acc.querySelector(".acc-head");
  const bodyEl=acc.querySelector(".acc-body");
  const ico=acc.querySelector(".acc-ico");
  head.addEventListener("click",()=>{
    const open=head.getAttribute("aria-expanded")==="true";
    head.setAttribute("aria-expanded",open?"false":"true");
    ico.textContent=open?"+":"-";
    if(open){bodyEl.style.maxHeight="0";bodyEl.classList.remove("open");}else{bodyEl.classList.add("open");bodyEl.style.maxHeight=(bodyEl.scrollHeight+24)+"px";}
  });
});

document.querySelectorAll("img.zoom").forEach(img=>{
  img.addEventListener("click",()=>{
    lbImg.src=img.src;
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden","false");
  });
});

function closeLB(){
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden","true");
  lbImg.src="";
}

lbClose.addEventListener("click",closeLB);
lightbox.addEventListener("click",e=>{if(e.target===lightbox)closeLB();});
window.addEventListener("keydown",e=>{if(e.key==="Escape")closeLB();});


/* =========================================================
   STRIP → FEATURED swap (WORK + PROFILE 공용)
   - data-featured="work" / "profile"
========================================================= */
function initStripSwap(targetName){
  const featured=document.querySelector(`[data-featured="${targetName}"]`);
  const items=[...document.querySelectorAll(`.strip__item[data-target="${targetName}"]`)];
  if(!featured || items.length===0) return;

  items.forEach(btn=>{
    btn.addEventListener("click",()=>{
      const src=btn.dataset.src;
      if(!src) return;

      featured.src=src;

      items.forEach(b=>b.classList.remove("is-selected"));
      btn.classList.add("is-selected");
      const track = btn.closest(".strip")?.querySelector(".strip__track");
      if(track){
        const left = btn.offsetLeft - (track.clientWidth/2) + (btn.clientWidth/2);
        track.scrollTo({ left, behavior: "smooth" });
      }
    });
  });
}

window.addEventListener("load",()=>{
  initStripSwap("work");
  initStripSwap("profile");
});

/* =========================================================
   STRIP SLIDER: edge click + drag/touch swipe + snap settle
========================================================= */
function initStripSlider(stripEl){
  const track=stripEl.querySelector(".strip__track");
  const items=[...stripEl.querySelectorAll(".strip__item")];
  const prevBtn=stripEl.querySelector(".strip__edge--left");
  const nextBtn=stripEl.querySelector(".strip__edge--right");
  if(!track || items.length===0) return;

  // 1) edge click => move by 1 item
  function scrollByItem(dir){
    // 현재 중앙에 가장 가까운 아이템 찾기
    const center=track.scrollLeft + track.clientWidth/2;
    let idx=0;
    let best=Infinity;
    items.forEach((it,i)=>{
      const mid=it.offsetLeft + it.offsetWidth/2;
      const d=Math.abs(mid-center);
      if(d<best){best=d;idx=i;}
    });

    let nextIdx=Math.max(0, Math.min(items.length-1, idx+dir));
    items[nextIdx].scrollIntoView({behavior:"smooth",inline:"center",block:"nearest"});
  }

  if(prevBtn) prevBtn.addEventListener("click",()=>scrollByItem(-1));
  if(nextBtn) nextBtn.addEventListener("click",()=>scrollByItem(1));

  // 2) drag / touch swipe
  let isDown=false;
  let startX=0;
  let startScroll=0;
  let moved=false;

  function onDown(clientX){
    isDown=true;
    moved=false;
    startX=clientX;
    startScroll=track.scrollLeft;
    track.classList.add("is-dragging");
  }
  function onMove(clientX){
    if(!isDown) return;
    const dx=clientX-startX;
    if(Math.abs(dx)>4) moved=true;
    track.scrollLeft = startScroll - dx;
  }
  function onUp(){
    if(!isDown) return;
    isDown=false;
    track.classList.remove("is-dragging");

    // 드래그했다면 => 가장 가까운 아이템으로 정렬
    if(moved){
      const center=track.scrollLeft + track.clientWidth/2;
      let bestItem=items[0];
      let best=Infinity;
      items.forEach(it=>{
        const mid=it.offsetLeft + it.offsetWidth/2;
        const d=Math.abs(mid-center);
        if(d<best){best=d;bestItem=it;}
      });
      bestItem.scrollIntoView({behavior:"smooth",inline:"center",block:"nearest"});
    }
  }

  // mouse
  track.addEventListener("mousedown",(e)=>onDown(e.clientX));
  window.addEventListener("mousemove",(e)=>onMove(e.clientX));
  window.addEventListener("mouseup",onUp);

  // touch
  track.addEventListener("touchstart",(e)=>onDown(e.touches[0].clientX),{passive:true});
  track.addEventListener("touchmove",(e)=>onMove(e.touches[0].clientX),{passive:true});
  track.addEventListener("touchend",onUp);

  // 드래그 중에는 click이 잘못 먹는 것 방지(이미지 교체/라이트박스)
  items.forEach(btn=>{
    btn.addEventListener("click",(e)=>{
      if(moved){ e.preventDefault(); e.stopPropagation(); }
    }, true);
  });
}

window.addEventListener("load",()=>{
  document.querySelectorAll(".strip").forEach(initStripSlider);
});

/* ===== MENU TOGGLE ===== */
const menuBtn=document.getElementById("menuBtn");
const menuPanel=document.getElementById("menuPanel");

if(menuBtn && menuPanel){

  menuBtn.addEventListener("click",(e)=>{
    e.stopPropagation();
    menuPanel.classList.toggle("open");
  });

  // 메뉴 클릭 시 닫기
  menuPanel.querySelectorAll("a").forEach(link=>{
    link.addEventListener("click",()=>{
      menuPanel.classList.remove("open");
    });
  });

  // 바깥 클릭 시 닫기
  document.addEventListener("click",(e)=>{
    if(!menuPanel.contains(e.target) && !menuBtn.contains(e.target)){
      menuPanel.classList.remove("open");
    }
  });

}
