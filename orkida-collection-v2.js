(function () {
  "use strict";
  
  var COLLECTIONS = [
    ["all-products", "الكل"],
    ["home-products", "المنزل والمطبخ"],
    ["car-products", "إكسسوارات السيارات"],
    ["personal-products", "العناية الشخصية"],
    ["phone-products", "إكسسوارات الجوال"]
  ];
  var currentPath = location.pathname.replace(/\/+$/, "");
  var activeCollection = COLLECTIONS.find(function(c){ return currentPath === "/collections/" + c[0]; });
  if (!activeCollection) return;
  if (window.__orkidaCol) return;
  window.__orkidaCol = true;

  /* ---------- config ---------- */
  var PRODUCTS_API = "https://api.easy-orders.net/api/v1/products";
  var CART_API     = "https://api.easy-orders.net/api/v1/cart-items/guest";
  var PER_PAGE = 20;
  var CUR = "ر.س";

  function catId() {
    try { return JSON.parse(document.getElementById("__NEXT_DATA__").textContent).props.pageProps.category.id; }
    catch (e) { return null; }
  }
  function guestId() {
    try { return JSON.parse(localStorage.getItem("guest-id")).state.guestId; } catch (e) {}
    var id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
      : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
          var r = Math.random()*16|0, v = c === "x" ? r : (r&0x3|0x8); return v.toString(16); });
    try { localStorage.setItem("guest-id", JSON.stringify({ state:{ guestId:id }, version:0 })); } catch (e) {}
    return id;
  }

  /* ---------- styles ---------- */
  var CSS =
  ':root{--ok-pri:#5F1EA4;--ok-prid:#4A1780;--ok-bg:#EFEEF2;--ok-card:#fff;--ok-tx:#131316;--ok-mut:#6B7280;--ok-line:#E3D7F4;--ok-sale:#F2600C}' +
  'html.ok-col header.default_header{display:none!important}' +
  'html.ok-col footer{display:none!important}' +
  'html.ok-col .category_section_header,html.ok-col .category_products_grid_container,' +
  'html.ok-col .relative.z-10.ms-2,html.ok-col .pt-8.text-center{display:none!important}' +
  'html.ok-col main > div:not(#ok-root){display:none!important}' +
  'html.ok-col body{background:var(--ok-bg)}' +
  'html.ok-col main{max-width:1180px!important;padding-bottom:40px!important}' +
  '#ok-root{font-family:Almarai,system-ui,sans-serif;color:var(--ok-tx);direction:rtl}' +
  '#ok-root *{box-sizing:border-box}' +
  '.ok-head{text-align:center;padding:14px 0 18px}' +
  '.ok-head h1{font-size:clamp(30px,5vw,48px);font-weight:800;margin:0;letter-spacing:-.5px}' +
  '.ok-head .ok-sub{color:var(--ok-mut);margin-top:8px;font-size:15px}' +
  '.ok-head .ok-rule{width:70px;height:4px;border-radius:4px;background:var(--ok-pri);margin:14px auto 0}' +
  '.ok-toolbar{position:sticky;top:8px;z-index:40;display:flex;justify-content:center;margin:0 0 20px}' +
  '.ok-pill{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--ok-line);' +
    'box-shadow:0 6px 20px rgba(19,19,22,.10);border-radius:999px;padding:8px 10px;width:100%;max-width:560px}' +
  '.ok-dbtn{width:44px;height:44px;border-radius:999px;border:none;background:#f3f2f7;color:var(--ok-pri);display:flex;' +
    'align-items:center;justify-content:center;cursor:pointer;flex:none;position:relative}' +
  '.ok-dbtn:hover{background:var(--ok-line)}' +
  '.ok-dbtn svg{width:22px;height:22px}' +
  '.ok-dbtn.ok-cart{background:var(--ok-pri);color:#fff}' +
  '.ok-dbtn.ok-cart:hover{background:var(--ok-prid)}' +
  '.ok-cnt{position:absolute;top:-4px;inset-inline-end:-4px;background:var(--ok-sale);color:#fff;font-size:11px;font-weight:800;' +
    'min-width:18px;height:18px;border-radius:999px;display:flex;align-items:center;justify-content:center;padding:0 4px}' +
  '#ok-search{flex:1;min-width:100px;border:none;outline:none;background:transparent;font-family:inherit;font-size:15px;color:var(--ok-tx);padding:0 6px}' +
  '#ok-search::placeholder{color:var(--ok-mut)}' +
  '.ok-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:16px}' +
  '.ok-count{color:var(--ok-mut);font-size:14px}' +
  '.ok-chip{display:inline-flex;align-items:center;gap:6px;background:#fff;border:1px solid var(--ok-line);' +
    'color:var(--ok-pri);border-radius:999px;padding:5px 12px;font-size:13px;font-weight:700}' +
  '.ok-chip b{cursor:pointer}' +
  '.ok-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}' +
  '@media(min-width:640px){.ok-grid{grid-template-columns:repeat(3,1fr)}}' +
  '@media(min-width:900px){.ok-grid{grid-template-columns:repeat(4,1fr)}}' +
  '@media(min-width:1120px){.ok-grid{grid-template-columns:repeat(5,1fr)}}' +
  '.ok-card{background:var(--ok-card);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;' +
    'border:1px solid #ecebf1;transition:transform .2s,box-shadow .2s}' +
  '.ok-card:hover{transform:translateY(-4px);box-shadow:0 14px 30px rgba(95,30,164,.14)}' +
  '.ok-cardlink{text-decoration:none;color:inherit;display:flex;flex-direction:column;flex:1}' +
  '.ok-thumb{position:relative;aspect-ratio:1/1;overflow:hidden;background:#f3f2f7}' +
  '.ok-thumb img{width:100%;height:100%;object-fit:cover;transition:transform .45s ease}' +
  '.ok-card:hover .ok-thumb img{transform:scale(1.07)}' +
  '.ok-badge{position:absolute;top:0;inset-inline-start:0;background:linear-gradient(135deg,#FF8A3D,var(--ok-sale));' +
    'color:#fff;font-size:12px;font-weight:800;padding:5px 11px;border-end-end-radius:12px}' +
  '.ok-info{padding:10px 12px 6px;display:flex;flex-direction:column;gap:8px;flex:1}' +
  '.ok-name{font-size:14px;font-weight:700;line-height:1.5;margin:0;display:-webkit-box;-webkit-line-clamp:2;' +
    '-webkit-box-orient:vertical;overflow:hidden;min-height:42px}' +
  '.ok-price{display:flex;align-items:baseline;gap:8px;margin-top:auto}' +
  '.ok-cur{color:var(--ok-pri);font-weight:800;font-size:22px}' +
  '.ok-old{color:var(--ok-mut);text-decoration:line-through;font-size:14px}' +
  '.ok-add{margin:2px 12px 14px;background:var(--ok-pri);color:#fff;border:none;border-radius:10px;padding:11px 0;' +
    'font-family:inherit;font-weight:800;font-size:14px;cursor:pointer;transition:background .2s;display:flex;' +
    'align-items:center;justify-content:center;gap:7px}' +
  '.ok-add:hover{background:var(--ok-prid)}' +
  '.ok-add:disabled{opacity:.85;cursor:default}' +
  '.ok-add.ok-added{background:#0f9d58}' +
  '.ok-add svg{width:17px;height:17px}' +
  '.ok-empty{text-align:center;padding:60px 0;color:var(--ok-mut)}' +
  '.ok-pag{display:flex;justify-content:center;align-items:center;gap:6px;flex-wrap:wrap;margin:30px 0 8px}' +
  '.ok-pag button{min-width:40px;height:40px;border-radius:10px;border:1px solid var(--ok-line);background:#fff;' +
    'color:var(--ok-tx);font-weight:700;cursor:pointer;font-family:inherit;transition:.15s}' +
  '.ok-pag button:hover:not(:disabled){border-color:var(--ok-pri);color:var(--ok-pri)}' +
  '.ok-pag button.ok-on{background:var(--ok-pri);color:#fff;border-color:var(--ok-pri)}' +
  '.ok-pag button:disabled{opacity:.4;cursor:default}' +
  '.ok-pag .ok-dots{color:var(--ok-mut);padding:0 4px}' +
  '.ok-strip{margin-top:34px;background:var(--ok-pri);color:#fff;border-radius:16px;overflow:hidden;position:relative;height:52px;display:flex;align-items:center}' +
  '.ok-strip .ok-track{display:flex;gap:44px;white-space:nowrap;animation:ok-marq 24s linear infinite;padding-inline-start:44px}' +
  '.ok-strip span{font-weight:700;font-size:15px}' +
  '@keyframes ok-marq{from{transform:translateX(0)}to{transform:translateX(-50%)}}' +
  '.ok-foot{text-align:center;color:var(--ok-mut);font-size:12px;padding:16px 0 4px}' +
  '#ok-toast{position:fixed;bottom:24px;inset-inline:0;display:flex;justify-content:center;z-index:95;pointer-events:none}' +
  '#ok-toast span{background:#131316;color:#fff;padding:11px 20px;border-radius:999px;font-family:Almarai,sans-serif;' +
    'font-weight:700;font-size:14px;box-shadow:0 8px 24px rgba(0,0,0,.25);opacity:0;transform:translateY(12px);transition:.25s}' +
  '#ok-toast.ok-show span{opacity:1;transform:translateY(0)}' +
  '#ok-sheet{position:fixed;inset:0;z-index:88;display:none}' +
  '#ok-sheet.ok-open{display:block}' +
  '#ok-sheet .ok-scrim{position:absolute;inset:0;background:rgba(19,19,22,.45)}' +
  '#ok-sheet .ok-panel{position:absolute;inset-inline:0;bottom:0;background:#fff;border-radius:22px 22px 0 0;padding:20px 20px 26px;direction:rtl;max-width:560px;margin:0 auto}' +
  '.ok-panel h3{margin:0 0 4px;font-size:18px;font-weight:800}' +
  '.ok-grip{width:44px;height:5px;border-radius:5px;background:#e5e3ec;margin:0 auto 14px}' +
  '.ok-lab{font-size:13px;color:var(--ok-mut);margin:16px 0 8px;font-weight:700}' +
  '.ok-sorts{display:flex;flex-wrap:wrap;gap:8px}' +
  '.ok-sorts button{border:1px solid var(--ok-line);background:#fff;border-radius:999px;padding:8px 14px;font-family:inherit;font-size:13px;font-weight:700;color:var(--ok-tx);cursor:pointer}' +
  '.ok-sorts button.ok-on{background:var(--ok-pri);color:#fff;border-color:var(--ok-pri)}' +
  '.ok-range{position:relative;height:36px;margin-top:8px}' +
  '.ok-range input{position:absolute;width:100%;top:8px;margin:0;-webkit-appearance:none;background:transparent;pointer-events:none}' +
  '.ok-range input::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:var(--ok-pri);border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3);cursor:pointer;pointer-events:auto}' +
  '.ok-range input::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:var(--ok-pri);border:3px solid #fff;cursor:pointer;pointer-events:auto}' +
  '.ok-rtrack{position:absolute;top:16px;inset-inline:0;height:5px;border-radius:5px;background:#e5e3ec}' +
  '.ok-rfill{position:absolute;top:16px;height:5px;border-radius:5px;background:var(--ok-pri)}' +
  '.ok-rvals{display:flex;justify-content:space-between;margin-top:14px;font-weight:700;font-size:14px}' +
  '.ok-apply{margin-top:22px;width:100%;background:var(--ok-pri);color:#fff;border:none;border-radius:12px;padding:14px;font-family:inherit;font-weight:800;font-size:16px;cursor:pointer}' +
  '.ok-apply:hover{background:var(--ok-prid)}' +
  '.ok-reset{background:none;border:none;color:var(--ok-mut);font-family:inherit;font-weight:700;cursor:pointer;margin-top:10px;width:100%}';

  CSS += '.ok-categories{display:flex;gap:8px;overflow-x:auto;padding:4px 2px 12px;margin:0 0 16px;scrollbar-width:thin}' +
    '.ok-category{flex:none;display:inline-flex;align-items:center;gap:6px;padding:10px 15px;border:1px solid var(--ok-line);border-radius:999px;background:#fff;color:var(--ok-pri);text-decoration:none;font-size:14px;font-weight:700}' +
    '.ok-category[aria-current="page"]{background:var(--ok-pri);border-color:var(--ok-pri);color:#fff}' +
    '.ok-category:focus-visible{outline:3px solid var(--ok-sale);outline-offset:2px}';
  function categoriesHTML(){
    return '<nav class="ok-categories" aria-label="أقسام المنتجات">' + COLLECTIONS.map(function(c){
      var active = c[0] === activeCollection[0];
      return '<a class="ok-category" href="/collections/' + c[0] + '"' +
        (active ? ' aria-current="page"' : '') + '>' + esc(c[1]) +
        (active ? ' <span aria-hidden="true">✓</span>' : '') + '</a>';
    }).join("") + '</nav>';
  }

  /* ---------- state ---------- */
  var ALL = [], BYID = {}, VIEW = [];
  var page = 1, sortKey = "new", q = "";
  var priceMin = 0, priceMax = 0, curMin = 0, curMax = 0;

  /* ---------- helpers ---------- */
  function cur(p){ return (p.sale_price && p.sale_price > 0) ? p.sale_price : p.price; }
  function old(p){ return (p.sale_price && p.sale_price > 0 && p.price > p.sale_price) ? p.price : 0; }
  function esc(s){ return (s||"").replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];}); }
  function el(html){ var d=document.createElement("div"); d.innerHTML=html.trim(); return d.firstElementChild; }
  function money(n){ return Number(n).toLocaleString("en-US") + " " + CUR; }

  /* ---------- data ---------- */
  function fetchAll(){
    var category = catId();
    if (!category) return Promise.reject(new Error("Category data unavailable"));
    var u = PRODUCTS_API + "?limit=1000&page=1&sort=created_at,DESC&category_id=" + encodeURIComponent(category) +
            "&join=variants&fields=id,name,thumb,price,sale_price,slug,created_at";
    return fetch(u,{headers:{Accept:"application/json"}}).then(function(r){if(!r.ok) throw new Error("Products HTTP " + r.status); return r.json();}).then(function(j){
      if (!Array.isArray(j.data)) throw new Error("Unexpected products response");
      ALL = (j.data||[]).map(function(p){ p.__hasVariants = Array.isArray(p.variants) && p.variants.length>0; BYID[p.id]=p; return p; });
      var prices = ALL.map(cur).filter(function(n){return n>0;});
      curMin = priceMin = prices.length ? Math.floor(Math.min.apply(null,prices)) : 0;
      curMax = priceMax = prices.length ? Math.ceil(Math.max.apply(null,prices)) : 0;
    });
  }
  function recompute(){
    var qq = q.trim().toLowerCase();
    VIEW = ALL.filter(function(p){
      var c = cur(p);
      if (c < curMin || c > curMax) return false;
      if (qq && (p.name||"").toLowerCase().indexOf(qq) === -1) return false;
      return true;
    });
    VIEW.sort(function(a,b){
      if (sortKey==="new")  return new Date(b.created_at) - new Date(a.created_at);
      if (sortKey==="plow") return cur(a) - cur(b);
      if (sortKey==="phigh")return cur(b) - cur(a);
      if (sortKey==="name") return (a.name||"").localeCompare(b.name||"","ar");
      if (sortKey==="namez")return (b.name||"").localeCompare(a.name||"","ar");
      return 0;
    });
    var pages = Math.max(1, Math.ceil(VIEW.length/PER_PAGE));
    if (page > pages) page = 1;
  }

  /* ---------- render grid ---------- */
  var CARTICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2.5 3h2l2.2 12.3a1.5 1.5 0 0 0 1.5 1.2h8.7a1.5 1.5 0 0 0 1.5-1.2L21 7H6"/></svg>';
  function cardHTML(p){
    var c = cur(p), o = old(p);
    var pct = o ? Math.round((o - c)/o*100) : 0;
    return '<div class="ok-card">' +
      '<a class="ok-cardlink" href="/products/'+encodeURIComponent(p.slug)+'">' +
        '<div class="ok-thumb">' +
          (pct>0 ? '<span class="ok-badge">تخفيض '+pct+'%</span>' : '') +
          '<img loading="lazy" src="'+esc(p.thumb)+'" alt="'+esc(p.name)+'"></div>' +
        '<div class="ok-info"><h3 class="ok-name">'+esc(p.name)+'</h3>' +
          '<div class="ok-price"><span class="ok-cur">'+money(c)+'</span>' +
            (o ? '<span class="ok-old">'+money(o)+'</span>' : '') + '</div></div>' +
      '</a>' +
      '<button class="ok-add" data-id="'+p.id+'">'+CARTICON+'<span>أضف إلى السلة</span></button>' +
    '</div>';
  }
  function paginationHTML(){
    var pages = Math.max(1, Math.ceil(VIEW.length/PER_PAGE));
    if (pages <= 1) return "";
    var out = '<button data-go="prev" '+(page===1?'disabled':'')+'>‹</button>';
    var list=[];
    for (var i=1;i<=pages;i++){
      if (i===1||i===pages||Math.abs(i-page)<=1) list.push(i);
      else if (list[list.length-1] !== "…") list.push("…");
    }
    list.forEach(function(i){
      if (i==="…") out += '<span class="ok-dots">…</span>';
      else out += '<button data-go="'+i+'" class="'+(i===page?'ok-on':'')+'">'+i+'</button>';
    });
    out += '<button data-go="next" '+(page===pages?'disabled':'')+'>›</button>';
    return out;
  }
  function renderGrid(){
    recompute();
    var root = document.getElementById("ok-root"); if(!root) return;
    var start = (page-1)*PER_PAGE, slice = VIEW.slice(start, start+PER_PAGE);
    var chips = "";
    if (q.trim()) chips += '<span class="ok-chip">بحث: '+esc(q)+' <b data-clr="q">✕</b></span>';
    if (curMin>priceMin || curMax<priceMax) chips += '<span class="ok-chip">السعر: '+curMin+'–'+curMax+' <b data-clr="price">✕</b></span>';
    root.querySelector(".ok-bar").innerHTML = '<div class="ok-count">'+VIEW.length+' منتج</div><div style="display:flex;gap:8px;flex-wrap:wrap">'+chips+'</div>';
    root.querySelector(".ok-grid").innerHTML = slice.length ? slice.map(cardHTML).join("") : '<div class="ok-empty" style="grid-column:1/-1">'+(ALL.length ? "لا توجد نتائج مطابقة 🔍" : "لا توجد منتجات في هذا القسم حاليًا")+'</div>';
    root.querySelector(".ok-pag").innerHTML = paginationHTML();
  }
  function strip(){
    return ["🚚 شحن مجاني لكل السعودية","💵 الدفع عند الاستلام","⭐ منتجات أصلية 100%","⚡ توصيل سريع خلال أيام","🔄 استبدال سهل"]
      .map(function(t){return '<span>'+t+'</span>';}).join("");
  }

  /* ---------- toast + badge ---------- */
  function toast(msg){
    var t=document.getElementById("ok-toast");
    if(!t){ t=el('<div id="ok-toast"><span></span></div>'); document.body.appendChild(t); }
    t.querySelector("span").textContent=msg; t.classList.add("ok-show");
    clearTimeout(t.__tm); t.__tm=setTimeout(function(){ t.classList.remove("ok-show"); },1800);
  }
  function setBadge(n){ var b=document.getElementById("ok-cnt"); if(!b) return; b.textContent=n; b.style.display=n>0?"flex":"none"; }
  function refreshCartCount(){
    fetch(CART_API+"?guest_id="+guestId()+"&limit=200",{headers:{Accept:"application/json"}})
      .then(function(r){return r.json();}).then(function(j){ var arr=Array.isArray(j)?j:(j.data||[]); setBadge(arr.length); })
      .catch(function(){});
  }

  /* ---------- add to cart ---------- */
  function addToCart(id, btn){
    var p = BYID[id]; if(!p) return;
    if (p.__hasVariants){ location.href = "/products/"+encodeURIComponent(p.slug); return; }
    btn.disabled=true; var label=btn.querySelector("span"); var prev=label.textContent; label.textContent="…";
    fetch(CART_API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({product_id:id,quantity:1,guest_id:guestId()})})
      .then(function(r){ if(r.status>=300) throw 0; return r.json(); })
      .then(function(){
        btn.classList.add("ok-added"); label.textContent="✓ تمت الإضافة";
        refreshCartCount();
        refreshNativeCart();
        setTimeout(openNativeDrawer, 350);
        setTimeout(function(){ btn.classList.remove("ok-added"); label.textContent=prev; btn.disabled=false; },1600);
      })
      .catch(function(){ label.textContent=prev; btn.disabled=false; toast("تعذّرت الإضافة، حاول مجددًا"); });
  }

  /* ---------- native cart drawer ---------- */
  function findNativeCart(){
    var h=document.querySelector("header.default_header"); if(!h) return null;
    var btns=[].slice.call(h.querySelectorAll("button"));
    for(var i=btns.length-1;i>=0;i--){ if(btns[i].querySelector("svg")) return btns[i]; }
    return null;
  }
  function refreshNativeCart(){
    try{ Object.defineProperty(document,"visibilityState",{configurable:true,get:function(){return "visible";}}); }catch(e){}
    try{ document.dispatchEvent(new Event("visibilitychange")); }catch(e){}
    try{ window.dispatchEvent(new Event("focus")); }catch(e){}
    try{ window.dispatchEvent(new Event("online")); }catch(e){}
  }
  function openNativeDrawer(){ var c=findNativeCart(); if(c) c.click(); }
  function openCart(){ refreshNativeCart(); setTimeout(openNativeDrawer, 250); }

  /* ---------- filter sheet ---------- */
  function buildSheet(){
    var sorts=[["new","الأحدث"],["plow","السعر: الأقل أولاً"],["phigh","السعر: الأعلى أولاً"],["name","الاسم أ–ي"],["namez","الاسم ي–أ"]];
    var sheet=el('<div id="ok-sheet"><div class="ok-scrim"></div><div class="ok-panel">' +
      '<div class="ok-grip"></div><h3>الفرز والتصفية</h3>' +
      '<div class="ok-lab">الترتيب</div><div class="ok-sorts">' +
        sorts.map(function(s){return '<button data-sort="'+s[0]+'" class="'+(s[0]===sortKey?'ok-on':'')+'">'+s[1]+'</button>';}).join("") +
      '</div>' +
      '<div class="ok-lab">نطاق السعر ('+CUR+')</div>' +
      '<div class="ok-range"><div class="ok-rtrack"></div><div class="ok-rfill" id="ok-rfill"></div>' +
        '<input type="range" id="ok-rmin" min="'+priceMin+'" max="'+priceMax+'" value="'+curMin+'">' +
        '<input type="range" id="ok-rmax" min="'+priceMin+'" max="'+priceMax+'" value="'+curMax+'"></div>' +
      '<div class="ok-rvals"><span id="ok-vmin">'+curMin+'</span><span id="ok-vmax">'+curMax+'</span></div>' +
      '<button class="ok-apply">عرض النتائج</button><button class="ok-reset">إعادة تعيين</button></div></div>');
    document.body.appendChild(sheet);
    var rmin=sheet.querySelector("#ok-rmin"), rmax=sheet.querySelector("#ok-rmax");
    function drawRange(){
      var a=Math.min(+rmin.value,+rmax.value), b=Math.max(+rmin.value,+rmax.value);
      curMin=a; curMax=b;
      sheet.querySelector("#ok-vmin").textContent=a; sheet.querySelector("#ok-vmax").textContent=b;
      var span=priceMax-priceMin||1, l=(a-priceMin)/span*100, r=(b-priceMin)/span*100;
      var f=sheet.querySelector("#ok-rfill"); f.style.right=l+"%"; f.style.width=(r-l)+"%";
    }
    rmin.addEventListener("input",drawRange); rmax.addEventListener("input",drawRange);
    sheet.querySelector(".ok-scrim").addEventListener("click",closeSheet);
    sheet.querySelector(".ok-apply").addEventListener("click",function(){ page=1; renderGrid(); closeSheet(); });
    sheet.querySelector(".ok-reset").addEventListener("click",function(){
      sortKey="new"; curMin=priceMin; curMax=priceMax;
      sheet.querySelectorAll("[data-sort]").forEach(function(b){ b.classList.toggle("ok-on", b.getAttribute("data-sort")==="new"); });
      rmin.value=priceMin; rmax.value=priceMax; drawRange();
    });
    sheet.querySelectorAll("[data-sort]").forEach(function(b){
      b.addEventListener("click",function(){ sortKey=b.getAttribute("data-sort");
        sheet.querySelectorAll("[data-sort]").forEach(function(x){x.classList.remove("ok-on");}); b.classList.add("ok-on"); });
    });
    drawRange();
  }
  function openSheet(){ var s=document.getElementById("ok-sheet"); if(s) s.classList.add("ok-open"); }
  function closeSheet(){ var s=document.getElementById("ok-sheet"); if(s) s.classList.remove("ok-open"); }

  /* ---------- mount ---------- */
  var IC = {
    search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
    filter:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M7 12h10M10 18h4"/></svg>'
  };
  function mount(){
    var main=document.querySelector("main"); if(!main||document.getElementById("ok-root")) return;
    var root=el('<div id="ok-root">' +
      '<div class="ok-head"><h1>المنتجات</h1>' +
        '<div class="ok-sub">تشكيلة أوركيدا المختارة · شحن مجاني والدفع عند الاستلام</div><div class="ok-rule"></div></div>' +
      '<div class="ok-toolbar"><div class="ok-pill">' +
        '<button class="ok-dbtn ok-cart" id="ok-cartbtn">'+CARTICON+'<span class="ok-cnt" id="ok-cnt" style="display:none">0</span></button>' +
        '<button class="ok-dbtn" id="ok-filterbtn">'+IC.filter+'</button>' +
        '<span class="ok-dbtn" style="background:transparent;cursor:default">'+IC.search+'</span>' +
        '<input id="ok-search" placeholder="ابحث في المنتجات…"></div></div>' +
      categoriesHTML() + '<div class="ok-bar"></div><div class="ok-grid"></div><div class="ok-pag"></div>' +
      '<div class="ok-strip"><div class="ok-track">'+strip()+strip()+'</div></div>' +
      '<div class="ok-foot">أوركيدا © 2026 · جميع الحقوق محفوظة</div></div>');
    main.insertBefore(root, main.firstChild);

    var s=root.querySelector("#ok-search"), t;
    s.addEventListener("input",function(){ clearTimeout(t); t=setTimeout(function(){ q=s.value; page=1; renderGrid(); },150); });
    root.querySelector("#ok-filterbtn").addEventListener("click",openSheet);
    root.querySelector("#ok-cartbtn").addEventListener("click",openCart);

    root.querySelector(".ok-grid").addEventListener("click",function(e){
      var b=e.target.closest(".ok-add"); if(!b) return; e.preventDefault(); addToCart(b.getAttribute("data-id"),b);
    });
    root.querySelector(".ok-pag").addEventListener("click",function(e){
      var b=e.target.closest("button[data-go]"); if(!b) return;
      var g=b.getAttribute("data-go"), pages=Math.max(1,Math.ceil(VIEW.length/PER_PAGE));
      if(g==="prev") page=Math.max(1,page-1); else if(g==="next") page=Math.min(pages,page+1); else page=+g;
      renderGrid(); window.scrollTo({top:0,behavior:"smooth"});
    });
    root.querySelector(".ok-bar").addEventListener("click",function(e){
      var b=e.target.closest("[data-clr]"); if(!b) return;
      var w=b.getAttribute("data-clr");
      if(w==="q"){ q=""; var si=document.getElementById("ok-search"); if(si) si.value=""; }
      if(w==="price"){ curMin=priceMin; curMax=priceMax; }
      page=1; renderGrid();
    });

    buildSheet(); renderGrid(); refreshCartCount();
    root.querySelector(".ok-grid").setAttribute("aria-live","polite");
    var activeLink = root.querySelector('.ok-category[aria-current="page"]');
    if (activeLink) activeLink.scrollIntoView({block:"nearest", inline:"nearest"});
  }

  /* ---------- boot (tightened: MutationObserver-first, bounded fallback
     instead of a 100ms setInterval running for up to 15 seconds) ---------- */
  function boot(){
    document.documentElement.classList.add("ok-col");
    var st=document.createElement("style"); st.id="ok-style"; st.textContent=CSS; document.head.appendChild(st);

    var dataReady=false, mounted=false;
    function tryMount(){
      if (mounted || !dataReady || !document.querySelector("main")) return;
      mount();
      mounted = true;
      if (mo) mo.disconnect();
    }

    fetchAll().then(function(){ dataReady=true; tryMount(); }).catch(function(e){ console.warn("ORKIDA collection error",e);
      document.documentElement.classList.remove("ok-col");
      if (mo) mo.disconnect(); });

    var mo = new MutationObserver(tryMount);
    if (document.body) mo.observe(document.body,{childList:true,subtree:true});

    // Bounded fallback only, in case MutationObserver never fires
    // (e.g. <main> was already present before dataReady resolved) —
    // a few checks over 3s instead of 150 checks over 15s.
    var fallbackTries = 0;
    var fallback = setInterval(function () {
      fallbackTries++;
      tryMount();
      if (mounted || fallbackTries >= 15) clearInterval(fallback);
    }, 200);
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot);
  else boot();
})();

