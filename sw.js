self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open('hairtry-men-v1').then(c=>c.addAll([
    './','./index.html','./style.css','./script.js','./manifest.json','./icon.png',
    './hairstyles/fade.png','./hairstyles/undercut.png','./hairstyles/quiff.png','./hairstyles/buzz.png','./hairstyles/curly.png'
  ])));
});
self.addEventListener('fetch', (e)=>{
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});