"use strict";(self.webpackChunkhealthcare_sync_client=self.webpackChunkhealthcare_sync_client||[]).push([[488],{107:(e,n,t)=>{t.r(n),t.d(n,{CLSThresholds:()=>P,FCPThresholds:()=>w,FIDThresholds:()=>ne,INPThresholds:()=>j,LCPThresholds:()=>G,TTFBThresholds:()=>Q,onCLS:()=>A,onFCP:()=>I,onFID:()=>te,onINP:()=>z,onLCP:()=>K,onTTFB:()=>V});var r,i,o,a,c,u=-1,s=function(e){addEventListener("pageshow",(function(n){n.persisted&&(u=n.timeStamp,e(n))}),!0)},f=function(){var e=self.performance&&performance.getEntriesByType&&performance.getEntriesByType("navigation")[0];if(e&&e.responseStart>0&&e.responseStart<performance.now())return e},d=function(){var e=f();return e&&e.activationStart||0},l=function(e,n){var t=f(),r="navigate";return u>=0?r="back-forward-cache":t&&(document.prerendering||d()>0?r="prerender":document.wasDiscarded?r="restore":t.type&&(r=t.type.replace(/_/g,"-"))),{name:e,value:void 0===n?-1:n,rating:"good",delta:0,entries:[],id:"v4-".concat(Date.now(),"-").concat(Math.floor(8999999999999*Math.random())+1e12),navigationType:r}},p=function(e,n,t){try{if(PerformanceObserver.supportedEntryTypes.includes(e)){var r=new PerformanceObserver((function(e){Promise.resolve().then((function(){n(e.getEntries())}))}));return r.observe(Object.assign({type:e,buffered:!0},t||{})),r}}catch(e){}},v=function(e,n,t,r){var i,o;return function(a){n.value>=0&&(a||r)&&((o=n.value-(i||0))||void 0===i)&&(i=n.value,n.delta=o,n.rating=function(e,n){return e>n[1]?"poor":e>n[0]?"needs-improvement":"good"}(n.value,t),e(n))}},h=function(e){requestAnimationFrame((function(){return requestAnimationFrame((function(){return e()}))}))},m=function(e){document.addEventListener("visibilitychange",(function(){"hidden"===document.visibilityState&&e()}))},g=function(e){var n=!1;return function(){n||(e(),n=!0)}},T=-1,y=function(){return"hidden"!==document.visibilityState||document.prerendering?1/0:0},E=function(e){"hidden"===document.visibilityState&&T>-1&&(T="visibilitychange"===e.type?e.timeStamp:0,b())},C=function(){addEventListener("visibilitychange",E,!0),addEventListener("prerenderingchange",E,!0)},b=function(){removeEventListener("visibilitychange",E,!0),removeEventListener("prerenderingchange",E,!0)},L=function(){return T<0&&(T=y(),C(),s((function(){setTimeout((function(){T=y(),C()}),0)}))),{get firstHiddenTime(){return T}}},S=function(e){document.prerendering?addEventListener("prerenderingchange",(function(){return e()}),!0):e()},w=[1800,3e3],I=function(e,n){n=n||{},S((function(){var t,r=L(),i=l("FCP"),o=p("paint",(function(e){e.forEach((function(e){"first-contentful-paint"===e.name&&(o.disconnect(),e.startTime<r.firstHiddenTime&&(i.value=Math.max(e.startTime-d(),0),i.entries.push(e),t(!0)))}))}));o&&(t=v(e,i,w,n.reportAllChanges),s((function(r){i=l("FCP"),t=v(e,i,w,n.reportAllChanges),h((function(){i.value=performance.now()-r.timeStamp,t(!0)}))})))}))},P=[.1,.25],A=function(e,n){n=n||{},I(g((function(){var t,r=l("CLS",0),i=0,o=[],a=function(e){e.forEach((function(e){if(!e.hadRecentInput){var n=o[0],t=o[o.length-1];i&&e.startTime-t.startTime<1e3&&e.startTime-n.startTime<5e3?(i+=e.value,o.push(e)):(i=e.value,o=[e])}})),i>r.value&&(r.value=i,r.entries=o,t())},c=p("layout-shift",a);c&&(t=v(e,r,P,n.reportAllChanges),m((function(){a(c.takeRecords()),t(!0)})),s((function(){i=0,r=l("CLS",0),t=v(e,r,P,n.reportAllChanges),h((function(){return t()}))})),setTimeout(t,0))})))},F=0,k=1/0,M=0,D=function(e){e.forEach((function(e){e.interactionId&&(k=Math.min(k,e.interactionId),M=Math.max(M,e.interactionId),F=M?(M-k)/7+1:0)}))},B=function(){return r?F:performance.interactionCount||0},R=function(){"interactionCount"in performance||r||(r=p("event",D,{type:"event",buffered:!0,durationThreshold:0}))},_=[],x=new Map,H=0,N=[],q=function(e){if(N.forEach((function(n){return n(e)})),e.interactionId||"first-input"===e.entryType){var n=_[_.length-1],t=x.get(e.interactionId);if(t||_.length<10||e.duration>n.latency){if(t)e.duration>t.latency?(t.entries=[e],t.latency=e.duration):e.duration===t.latency&&e.startTime===t.entries[0].startTime&&t.entries.push(e);else{var r={id:e.interactionId,latency:e.duration,entries:[e]};x.set(r.id,r),_.push(r)}_.sort((function(e,n){return n.latency-e.latency})),_.length>10&&_.splice(10).forEach((function(e){return x.delete(e.id)}))}}},O=function(e){var n=self.requestIdleCallback||self.setTimeout,t=-1;return e=g(e),"hidden"===document.visibilityState?e():(t=n(e),m(e)),t},j=[200,500],z=function(e,n){"PerformanceEventTiming"in self&&"interactionId"in PerformanceEventTiming.prototype&&(n=n||{},S((function(){var t;R();var r,i=l("INP"),o=function(e){O((function(){e.forEach(q);var n=function(){var e=Math.min(_.length-1,Math.floor((B()-H)/50));return _[e]}();n&&n.latency!==i.value&&(i.value=n.latency,i.entries=n.entries,r())}))},a=p("event",o,{durationThreshold:null!==(t=n.durationThreshold)&&void 0!==t?t:40});r=v(e,i,j,n.reportAllChanges),a&&(a.observe({type:"first-input",buffered:!0}),m((function(){o(a.takeRecords()),r(!0)})),s((function(){H=B(),_.length=0,x.clear(),i=l("INP"),r=v(e,i,j,n.reportAllChanges)})))})))},G=[2500,4e3],J={},K=function(e,n){n=n||{},S((function(){var t,r=L(),i=l("LCP"),o=function(e){n.reportAllChanges||(e=e.slice(-1)),e.forEach((function(e){e.startTime<r.firstHiddenTime&&(i.value=Math.max(e.startTime-d(),0),i.entries=[e],t())}))},a=p("largest-contentful-paint",o);if(a){t=v(e,i,G,n.reportAllChanges);var c=g((function(){J[i.id]||(o(a.takeRecords()),a.disconnect(),J[i.id]=!0,t(!0))}));["keydown","click"].forEach((function(e){addEventListener(e,(function(){return O(c)}),{once:!0,capture:!0})})),m(c),s((function(r){i=l("LCP"),t=v(e,i,G,n.reportAllChanges),h((function(){i.value=performance.now()-r.timeStamp,J[i.id]=!0,t(!0)}))}))}}))},Q=[800,1800],U=function e(n){document.prerendering?S((function(){return e(n)})):"complete"!==document.readyState?addEventListener("load",(function(){return e(n)}),!0):setTimeout(n,0)},V=function(e,n){n=n||{};var t=l("TTFB"),r=v(e,t,Q,n.reportAllChanges);U((function(){var i=f();i&&(t.value=Math.max(i.responseStart-d(),0),t.entries=[i],r(!0),s((function(){t=l("TTFB",0),(r=v(e,t,Q,n.reportAllChanges))(!0)})))}))},W={passive:!0,capture:!0},X=new Date,Y=function(e,n){i||(i=n,o=e,a=new Date,ee(removeEventListener),Z())},Z=function(){if(o>=0&&o<a-X){var e={entryType:"first-input",name:i.type,target:i.target,cancelable:i.cancelable,startTime:i.timeStamp,processingStart:i.timeStamp+o};c.forEach((function(n){n(e)})),c=[]}},$=function(e){if(e.cancelable){var n=(e.timeStamp>1e12?new Date:performance.now())-e.timeStamp;"pointerdown"==e.type?function(e,n){var t=function(){Y(e,n),i()},r=function(){i()},i=function(){removeEventListener("pointerup",t,W),removeEventListener("pointercancel",r,W)};addEventListener("pointerup",t,W),addEventListener("pointercancel",r,W)}(n,e):Y(n,e)}},ee=function(e){["mousedown","keydown","touchstart","pointerdown"].forEach((function(n){return e(n,$,W)}))},ne=[100,300],te=function(e,n){n=n||{},S((function(){var t,r=L(),a=l("FID"),u=function(e){e.startTime<r.firstHiddenTime&&(a.value=e.processingStart-e.startTime,a.entries.push(e),t(!0))},f=function(e){e.forEach(u)},d=p("first-input",f);t=v(e,a,ne,n.reportAllChanges),d&&(m(g((function(){f(d.takeRecords()),d.disconnect()}))),s((function(){var r;a=l("FID"),t=v(e,a,ne,n.reportAllChanges),c=[],o=-1,i=null,ee(addEventListener),r=u,c.push(r),Z()})))}))}}}]);
//# sourceMappingURL=488.1ee0528f.chunk.js.map