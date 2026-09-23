<script>
(function(){
  /* Today's date in eight calendar systems, computed in the browser by World Calendar Explorer's own
     conversion code (loaded from that site, so there is one canonical implementation — nothing is copied here).
     Absolute URLs so a local preview of this page works too. */
  var BASE = 'https://followorbounce.github.io/world-calendar-explorer/js/';
  var FILES = ['core.js','calendars/ancient.js','calendars/asian.js','calendars/abrahamic.js','calendars/maya.js','registry.js'];
  var SHOW = ['julian','hebrew','islamic','persian','indian','ethiopian','chinesezodiac','maya'];
  var SHORT = {julian:'Julian', hebrew:'Hebrew', islamic:'Islamic (tabular)', persian:'Persian', indian:'Indian (Saka)', ethiopian:'Ethiopian', chinesezodiac:'Chinese zodiac', maya:'Maya (GMT)'};
  var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var card = document.getElementById('cw-card'), grid = document.getElementById('cw-grid'), clock = document.getElementById('cw-clock');
  var shownDay = '', clockEls = null, dead = false;
  function el(tag, cls, text){ var e = document.createElement(tag); if(cls) e.className = cls; if(text != null) e.textContent = text; return e; }
  function fail(){
    if(dead) return; dead = true;
    card.classList.remove('cw-skel'); card.textContent = '';
    var b = el('div','bf-body'); b.appendChild(el('div','bf-cat','Calendars'));
    var t = el('h2','bf-title'); var a = el('a',null,'What day is it — see today in 28 calendar systems'); a.href = '/world-calendar-explorer/'; t.appendChild(a);
    b.appendChild(t); card.style.gridTemplateColumns = '1fr'; card.appendChild(b);
  }
  function load(i, done){
    if(i >= FILES.length) return done();
    var s = document.createElement('script'); s.src = BASE + FILES[i];
    s.onload = function(){ load(i + 1, done); }; s.onerror = fail;
    document.head.appendChild(s);
  }
  function cell(r){
    var c = el('div','cw-cell'); c.appendChild(el('div','k', SHORT[r.key] || r.name));
    if(r.error){ c.appendChild(el('div','d sm','—')); c.appendChild(el('div','m','unavailable')); return c; }
    if(r.key === 'maya'){ c.appendChild(el('div','d sm', r.longCount)); c.appendChild(el('div','m', r.tzolkin + ' · ' + r.haab)); return c; }
    if(r.key === 'chinesezodiac'){ c.appendChild(el('div','d sm', r.animal)); c.appendChild(el('div','m', r.sexagenaryYear + ' · ' + r.element)); return c; }
    c.appendChild(el('div','d', String(r.day)));
    c.appendChild(el('div','m', (r.monthName || ('M' + r.month)) + ' ' + r.year));
    return c;
  }
  function renderDay(now){
    var y = now.getFullYear(), m = now.getMonth() + 1, d = now.getDate();
    var jdn = Core.gregorianToJDN(y, m, d);
    var all = Registry.computeAll({ jdn: jdn, y: y, m: m, d: d, isBCE: false, hoursUTC: 12, weekday: Core.weekdayFromJDN(jdn) });
    var byKey = {}; all.forEach(function(r){ byKey[r.key] = r; });
    card.classList.remove('cw-skel');
    var today = card.querySelector('.cw-today');
    today.children[0].textContent = String(d);
    today.children[1].textContent = MON[m - 1] + ' ' + y;
    today.children[2].textContent = Core.weekdayName(jdn);
    grid.textContent = '';
    SHOW.forEach(function(k){ if(byKey[k]) grid.appendChild(cell(byKey[k])); });
    clock.textContent = ''; clockEls = {};
    [['local','Local'],['utc','UTC'],['jdn','JDN'],['unix','Unix']].forEach(function(p){
      var s = el('span', null, p[1] + ' '); clockEls[p[0]] = el('b'); s.appendChild(clockEls[p[0]]); clock.appendChild(s);
    });
    clockEls.jdn.textContent = String(jdn);
    var more = el('a','bf-all','Convert any date →'); more.href = '/world-calendar-explorer/#converter'; more.style.marginLeft = 'auto'; clock.appendChild(more);
  }
  function pad(n){ return (n < 10 ? '0' : '') + n; }
  function tick(){
    var now = new Date(), key = now.toDateString();
    if(key !== shownDay){ shownDay = key; renderDay(now); }   /* re-renders at local midnight */
    clockEls.local.textContent = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
    clockEls.utc.textContent = pad(now.getUTCHours()) + ':' + pad(now.getUTCMinutes()) + ':' + pad(now.getUTCSeconds());
    clockEls.unix.textContent = String(Math.floor(now.getTime() / 1000));
  }
  var to = setTimeout(fail, 8000);
  load(0, function(){
    clearTimeout(to); if(dead) return;
    try { tick(); setInterval(tick, 1000); } catch(e){ fail(); }
  });
})();
</script>
