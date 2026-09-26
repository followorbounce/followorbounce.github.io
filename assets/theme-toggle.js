/* Unified light/dark theme toggle — shared across all followorbounce.github.io pages.
   Uses localStorage key 'fb-theme'; sets data-theme on :root.
   Load in <head> (without defer) so the attribute is set before first paint. */
(function(){
  try{
    var s=localStorage.getItem('fb-theme');
    if(s) document.documentElement.setAttribute('data-theme',s);
    else if(window.matchMedia('(prefers-color-scheme:dark)').matches)
      document.documentElement.setAttribute('data-theme','dark');
  }catch(e){}

  document.addEventListener('DOMContentLoaded',function(){
    if(document.getElementById('btn-theme')) return;
    var hdr=document.querySelector('header .wrap')||document.getElementById('chrome');
    if(!hdr) return;
    var btn=document.createElement('button');
    btn.id='btn-theme';
    btn.setAttribute('aria-label','Toggle theme');
    var st=btn.style;
    st.fontFamily='var(--font-mono,monospace)';st.fontSize='10px';st.letterSpacing='0.08em';
    st.padding='5px 8px';st.border='1px solid currentColor';st.background='transparent';
    st.color='inherit';st.cursor='pointer';st.textTransform='uppercase';st.lineHeight='1';
    st.whiteSpace='nowrap';st.marginLeft='auto';
    function upd(){btn.textContent=document.documentElement.getAttribute('data-theme')==='dark'?'Light':'Dark';}
    btn.addEventListener('click',function(){
      var cur=document.documentElement.getAttribute('data-theme')||'light';
      var next=cur==='dark'?'light':'dark';
      document.documentElement.setAttribute('data-theme',next);
      try{localStorage.setItem('fb-theme',next);}catch(e){}
      upd();
    });
    upd();
    hdr.appendChild(btn);
  });
})();
