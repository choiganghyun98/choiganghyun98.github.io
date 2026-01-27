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
  if(id==="main"){body.classList.remove("sub");body.style.overflow="hidden";}else{body.classList.add("sub");body.style.overflow="auto";}
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
