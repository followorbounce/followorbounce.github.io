<script>
(function(){
  var TOPICS = [
    { key:'earthquakes',
      url:'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/1.0_day.geojson',
      parse:function(d){ return d.metadata ? d.metadata.count : null; } },
    { key:'aircraft',
      url:'https://opensky-network.org/api/states/all',
      parse:function(d){ return d.states ? d.states.length : null; } },
    { key:'ships', url:null },
    { key:'volcanoes',
      url:'https://eonet.gsfc.nasa.gov/api/v3/events?category=volcanoes&status=open',
      parse:function(d){ return d.events ? d.events.length : null; } },
    { key:'wildfires',
      url:'https://eonet.gsfc.nasa.gov/api/v3/events?category=wildfires&status=open',
      parse:function(d){ return d.events ? d.events.length : null; } },
    { key:'waves',
      url:'https://marine-api.open-meteo.com/v1/marine?latitude=40&longitude=-30&current=wave_height',
      parse:function(d){ return d.current ? d.current.wave_height + ' m' : null; },
      small:true },
    { key:'solar',
      url:'https://services.swpc.noaa.gov/products/summary/solar-wind-speed.json',
      parse:function(d){ return d.WindSpeed ? Math.round(parseFloat(d.WindSpeed)) + ' km/s' : null; },
      small:true },
    { key:'satellites', url:null }
  ];

  var card = document.getElementById('od-card');
  var tsEl = document.getElementById('od-ts');
  if(!card) return;

  function fmt(v){
    if(typeof v === 'number') return v.toLocaleString();
    return String(v);
  }

  function pad(n){ return (n < 10 ? '0' : '') + n; }

  function setCell(key, val, small){
    var cell = card.querySelector('[data-key="' + key + '"]');
    if(!cell) return;
    var el = cell.querySelector('.od-val');
    el.textContent = val != null ? fmt(val) : '—';
    el.className = 'od-val' + (small ? ' sm' : '');
  }

  function fetchTopic(t){
    if(!t.url){ setCell(t.key, null); return Promise.resolve(); }
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var tid = setTimeout(function(){ if(ctrl) ctrl.abort(); }, 12000);
    return fetch(t.url, ctrl ? {signal:ctrl.signal} : {})
      .then(function(r){
        clearTimeout(tid);
        if(!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then(function(d){
        var val = t.parse(d);
        setCell(t.key, val, t.small);
      })
      .catch(function(){
        clearTimeout(tid);
        setCell(t.key, null);
      });
  }

  function update(){
    var promises = TOPICS.map(fetchTopic);
    Promise.all(promises).then(function(){
      card.classList.remove('od-skel');
      var now = new Date();
      tsEl.textContent = pad(now.getHours()) + ':' + pad(now.getMinutes());
    });
  }

  update();
  setInterval(update, 300000);
  var btn = document.getElementById('od-refresh');
  if(btn) btn.addEventListener('click', function(e){ e.preventDefault(); update(); });
})();
</script>
