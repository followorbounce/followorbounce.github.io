<script>
(function(){
  /* Open data · live. Browser-friendly sources are fetched directly; aircraft (OpenSky), ships (Digitraffic)
     and satellites (CelesTrak) come from our relay, workers/open-data, because those APIs block browsers on
     other sites or rate-limit per IP. Each tile shows when its number is from, and "—" if it is too old. */
  var RELAY = 'https://fob-open-data.followorbounce.workers.dev/summary';
  var STALE = {aircraft: 3*3600e3, ships: 3*3600e3, satellites: 12*3600e3};

  var card = document.getElementById('od-card');
  var tsEl = document.getElementById('od-ts');
  if(!card) return;

  function pad(n){ return (n < 10 ? '0' : '') + n; }
  function hhmm(d){ return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function fmt(v){ return typeof v === 'number' ? v.toLocaleString() : String(v); }
  function cell(key){ return card.querySelector('[data-key="' + key + '"]'); }
  function setCell(key, val, opt){
    opt = opt || {};
    var c = cell(key); if(!c) return;
    var el = c.querySelector('.od-val');
    el.textContent = val != null ? fmt(val) : '—';
    el.className = 'od-val' + (opt.small ? ' sm' : '');
    var sub = c.querySelector('.od-sub');
    if(sub){ if(!sub.dataset.base) sub.dataset.base = sub.textContent; sub.textContent = sub.dataset.base + (opt.note ? ' · ' + opt.note : ''); }
    c.title = opt.title || '';
  }
  function getJSON(url){
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var tid = setTimeout(function(){ if(ctrl) ctrl.abort(); }, 12000);
    return fetch(url, ctrl ? {signal: ctrl.signal, cache: 'no-store'} : {cache: 'no-store'})
      .then(function(r){ clearTimeout(tid); if(!r.ok) throw new Error(r.status); return r.json(); })
      .catch(function(e){ clearTimeout(tid); throw e; });
  }

  var direct = [
    function(){ return getJSON('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/1.0_day.geojson')
      .then(function(d){ setCell('earthquakes', d.metadata ? d.metadata.count : null); }); },
    function(){ return getJSON('https://eonet.gsfc.nasa.gov/api/v3/events?category=volcanoes&status=open')
      .then(function(d){ setCell('volcanoes', d.events ? d.events.length : null); }); },
    function(){ return getJSON('https://eonet.gsfc.nasa.gov/api/v3/events?category=wildfires&status=open')
      .then(function(d){ setCell('wildfires', d.events ? d.events.length : null); }); },
    function(){ return getJSON('https://marine-api.open-meteo.com/v1/marine?latitude=40&longitude=-30&current=wave_height')
      .then(function(d){ setCell('waves', d.current ? d.current.wave_height + ' m' : null, {small: true}); }); },
    /* NOAA SWPC: solar wind speed now ([{proton_speed, time_tag}]) + the latest planetary Kp index */
    function(){ return Promise.all([
        getJSON('https://services.swpc.noaa.gov/products/summary/solar-wind-speed.json'),
        getJSON('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json').catch(function(){ return null; })
      ]).then(function(r){
        var w = r[0] && r[0][0], kp = r[1] && r[1].length ? r[1][r[1].length - 1] : null;
        var kpv = kp ? parseFloat(kp.Kp != null ? kp.Kp : kp[1]) : NaN;
        setCell('solar', w && w.proton_speed != null ? Math.round(w.proton_speed) + ' km/s' : null,
          {small: true, note: isFinite(kpv) ? 'Kp ' + kpv.toFixed(1) + (kpv >= 5 ? ' storm' : '') : '', title: w ? 'Solar wind at ' + w.time_tag + ' UTC' : ''});
      }); }
  ];

  function relay(){
    return getJSON(RELAY).then(function(d){
      ['aircraft', 'ships', 'satellites'].forEach(function(k){
        var v = d[k], t = v && Date.parse(v.asOf), fresh = v && isFinite(t) && Date.now() - t < STALE[k];
        setCell(k, fresh ? v.count : null, {note: fresh ? 'as of ' + hhmm(new Date(t)) : 'no recent data', title: v ? v.source + ', ' + v.asOf : ''});
      });
    }).catch(function(){ ['aircraft', 'ships', 'satellites'].forEach(function(k){ setCell(k, null); }); });
  }
  /* the ISS, live, on the Satellites tile */
  function iss(){
    return getJSON('https://api.wheretheiss.at/v1/satellites/25544').then(function(d){
      var s = cell('satellites') && cell('satellites').querySelector('.od-iss'); if(!s) return;
      var la = d.latitude, lo = d.longitude;
      s.textContent = 'ISS now ' + Math.abs(la).toFixed(1) + '°' + (la >= 0 ? 'N' : 'S') + ' ' + Math.abs(lo).toFixed(1) + '°' + (lo >= 0 ? 'E' : 'W') + ' · ' + Math.round(d.altitude) + ' km';
    }).catch(function(){});
  }

  function update(){
    var jobs = direct.map(function(f){ return f().catch(function(){}); }).concat([relay(), iss()]);
    Promise.all(jobs).then(function(){
      card.classList.remove('od-skel');
      tsEl.textContent = hhmm(new Date());
    });
  }

  update();
  setInterval(update, 300000);
  var btn = document.getElementById('od-refresh');
  if(btn) btn.addEventListener('click', function(e){ e.preventDefault(); update(); });
})();
</script>
