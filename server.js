'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {WebSocketServer, WebSocket} = require('ws');

const PORT = Number(process.env.PORT || 3000);
const MAX_PLAYERS = 4;
const players = new Map();
// Fixed Korean-time weather blocks. No dependence on server startup time.
function sharedWeather(now) {
  const kstBlock = Math.floor((now + 9 * 3600000) / (30 * 60000));
  const pattern = ['clear','clear','cloudy','rain','cloudy','clear','clear','rain'];
  return pattern[((kstBlock % pattern.length) + pattern.length) % pattern.length];
}
const base=path.resolve(__dirname);
const server=http.createServer((req,res)=>{
  let pathname;try{pathname=new URL(req.url,'http://localhost').pathname}catch(_){res.writeHead(400);res.end();return}
  if(pathname==='/health'){
    res.writeHead(200,{'content-type':'application/json','access-control-allow-origin':'*','cache-control':'no-store'});
    res.end(JSON.stringify({ok:true,count:players.size,maxPlayers:MAX_PLAYERS,serverTime:Date.now(),timezone:'Asia/Seoul'}));return;
  }
  if(pathname!=='/'&&pathname!=='/index.html'){res.writeHead(404);res.end('Not found');return}
  fs.readFile(path.join(base,'index.html'),(err,data)=>{
    if(err){res.writeHead(500);res.end('Server error');return}
    res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});res.end(data);
  });
});
const wss=new WebSocketServer({server,path:'/ws',maxPayload:4096});
function send(ws,data){if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify(data))}
function broadcast(data,except){for(const [ws,p] of players)if(ws!==except&&p.joined)send(ws,data)}
function status(){const now=Date.now();return {serverTime:now,weather:sharedWeather(now),count:[...players.values()].filter(p=>p.joined).length,maxPlayers:MAX_PLAYERS,timezone:'Asia/Seoul'}}
function publicPlayer(p){return{id:p.id,nick:p.nick,color:p.color,state:p.state}}
function validState(s){
 if(!s||typeof s!=='object')return null;
 const clamp=(n,max)=>Number.isFinite(n)?Math.max(-max,Math.min(max,n)):0;
 return{x:clamp(s.x,100000),y:clamp(s.y,100000),z:clamp(s.z,100000),h:clamp(s.h,100),a:['w','d','j','i'].includes(s.a)?s.a:'i',alt:clamp(s.alt,100000),g:Math.max(0,Math.min(6,s.g|0)),...(s.f&&typeof s.f.k==='string'?{f:{k:s.f.k.slice(0,30),t:clamp(s.f.t,1e15)}}:{})};
}
wss.on('connection',ws=>{
 // Count only fully joined users so aborted connections don't occupy all slots.
 if([...players.values()].filter(p=>p.joined).length>=MAX_PLAYERS){send(ws,{type:'full',...status()});ws.close(1008,'Room full');return}
 const p={id:crypto.randomUUID(),nick:'산객',color:0,joined:false,state:{x:0,y:0,z:0,h:0,a:'i',alt:0,g:0}};
 players.set(ws,p);ws.isAlive=true;
 ws.on('pong',()=>{ws.isAlive=true});
 const joinTimeout=setTimeout(()=>{if(!p.joined)ws.close(1008,'Join timeout')},10000);
 ws.on('message',buf=>{
  let m;try{m=JSON.parse(buf.toString())}catch(_){return}
  if(m.type==='join'&&!p.joined){
    if([...players.values()].filter(x=>x.joined).length>=MAX_PLAYERS){send(ws,{type:'full',...status()});ws.close(1008,'Room full');return}
    clearTimeout(joinTimeout);p.nick=String(m.nick||'산객').trim().slice(0,12);p.color=Math.max(0,Math.min(5,m.color|0));
    p.joined=true;
    send(ws,{type:'welcome',id:p.id,players:[...players.values()].filter(x=>x!==p&&x.joined).map(publicPlayer),...status()});
    broadcast({type:'joined',player:publicPlayer(p),count:status().count},ws);
  }else if(m.type==='move'&&p.joined){
    const s=validState(m.state);if(!s)return;p.state=s;
    if(Date.now()-(p.lastMove||0)>90){p.lastMove=Date.now();broadcast({type:'move',player:publicPlayer(p)},ws)}
  }else if(m.type==='ping'){send(ws,{type:'pong',sent:Number(m.sent)||Date.now(),serverTime:Date.now()})}
 });
 ws.on('close',()=>{clearTimeout(joinTimeout);if(!players.has(ws))return;players.delete(ws);if(p.joined)broadcast({type:'left',id:p.id,count:status().count})});
 ws.on('error',()=>{});
});
const beat=setInterval(()=>{
 for(const ws of wss.clients){if(!ws.isAlive){ws.terminate();continue}ws.isAlive=false;ws.ping()}
 broadcast({type:'state',...status()});
},10000);
beat.unref();
server.listen(PORT,'0.0.0.0',()=>console.log(`Baekyaksan: http://localhost:${PORT}; players <= ${MAX_PLAYERS}; Asia/Seoul`));
