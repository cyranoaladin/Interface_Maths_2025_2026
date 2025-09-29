(function(){
  try {
    var dnt = (navigator.doNotTrack === '1') || (window.doNotTrack === '1') || (navigator.msDoNotTrack === '1');
    if (dnt) return;
    var s = document.createElement('script');
    s.defer = true;
    s.setAttribute('data-domain','maths.labomaths.tn');
    s.src = 'https://plausible.io/js/script.js';
    document.head.appendChild(s);
  } catch(_){}
})();

