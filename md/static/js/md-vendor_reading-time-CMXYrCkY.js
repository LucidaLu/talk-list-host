import{g as y}from"./md-cytoscape-BS5BTURY.js";import{r as C}from"./md-vendor_stream-browserify-DeHv-uE2.js";import{r as M}from"./md-vendor_util-DfCORzJs.js";var f={exports:{}};/*!
 * reading-time
 * Copyright (c) Nicolas Gryman <ngryman@gmail.com>
 * MIT Licensed
 */var l,g;function R(){if(g)return l;g=1;function m(t,r){return r.some(([i,u])=>i<=t&&t<=u)}function a(t){if(typeof t!="string")return!1;const r=t.charCodeAt(0);return m(r,[[12352,12447],[19968,40959],[44032,55203],[131072,191456]])}function x(t){return` 
\r	`.includes(t)}function n(t){if(typeof t!="string")return!1;const r=t.charCodeAt(0);return m(r,[[33,47],[58,64],[91,96],[123,126],[12288,12351],[65280,65519]])}function s(t,r={}){let i=0,u=0,c=t.length-1;const q=r.wordsPerMinute||200,d=r.wordBound||x;for(;d(t[u]);)u++;for(;d(t[c]);)c--;const o=`${t}
`;for(let e=u;e<=c;e++)if((a(o[e])||!d(o[e])&&(d(o[e+1])||a(o[e+1])))&&i++,a(o[e]))for(;e<=c&&(n(o[e+1])||d(o[e+1]));)e++;const h=i/q,v=Math.round(h*60*1e3);return{text:Math.ceil(h.toFixed(2))+" min read",minutes:h,time:v,words:i}}return l=s,l}/*!
 * reading-time
 * Copyright (c) Nicolas Gryman <ngryman@gmail.com>
 * MIT Licensed
 */var p,T;function S(){if(T)return p;T=1;const m=R(),a=C().Transform,x=M();function n(s){if(!(this instanceof n))return new n(s);a.call(this,{objectMode:!0}),this.options=s||{},this.stats={minutes:0,time:0,words:0}}return x.inherits(n,a),n.prototype._transform=function(s,t,r){const i=m(s.toString(t),this.options);this.stats.minutes+=i.minutes,this.stats.time+=i.time,this.stats.words+=i.words,r()},n.prototype._flush=function(s){this.stats.text=Math.ceil(this.stats.minutes.toFixed(2))+" min read",this.push(this.stats),s()},p=n,p}var w;function B(){return w||(w=1,f.exports.default=f.exports=R(),f.exports.readingTimeStream=S()),f.exports}var $=B();const _=y($);export{_ as r};
