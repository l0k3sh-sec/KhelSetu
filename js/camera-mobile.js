/* KhelSetu shared camera helpers - stable desktop + mobile camera */
(function(){
  'use strict';
  window.KhelSetuCamera = {
    isSecure: function(){
      return window.isSecureContext === true || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    },
    constraints: function(deviceId){
      // Keep the capture resolution moderate. Very large portrait streams make
      // MediaPipe work harder and can cause dropped frames/jitter on phones.
      const video = deviceId
        ? {deviceId:{exact:deviceId}}
        : {facingMode:{ideal:'user'}};
      Object.assign(video, {
        width:{ideal:640, max:1280},
        height:{ideal:480, max:720},
        frameRate:{ideal:30, max:30}
      });
      return {video, audio:false};
    },
    setVideo: async function(video, stream){
      video.srcObject = stream;
      try { const track=stream.getVideoTracks?.()[0]; if(track) track.contentHint='motion'; } catch(_) {}
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('playsinline','');
      video.setAttribute('webkit-playsinline','');
      video.setAttribute('disablePictureInPicture','');
      try { await video.play(); } catch(e) {
        video.muted = true;
        await video.play().catch(()=>{});
      }
      if (video.readyState < 2) await new Promise(resolve=>{
        const done=()=>{video.removeEventListener('loadeddata',done);resolve();};
        video.addEventListener('loadeddata',done,{once:true});
        setTimeout(resolve,2500);
      });
    },
    createLandmarkSmoother: function(alpha){
      const a = Math.min(.5, Math.max(.08, Number(alpha)||.22));
      let previous = null;
      return {
        reset(){ previous=null; },
        filter(landmarks){
          if(!Array.isArray(landmarks) || landmarks.length < 33) return landmarks || [];
          if(!previous){ previous=landmarks.map(p=>({...p})); return previous.map(p=>({...p})); }
          const out = landmarks.map((p,i)=>{
            const old=previous[i]||p;
            const visibility = p.visibility == null ? old.visibility : p.visibility;
            const presence = p.presence == null ? old.presence : p.presence;
            const x=old.x+(p.x-old.x)*a;
            const y=old.y+(p.y-old.y)*a;
            const z=(old.z??0)+((p.z??0)-(old.z??0))*a;
            return {...p,x,y,z,visibility,presence};
          });
          previous=out;
          return out.map(p=>({...p}));
        }
      };
    }
  };
})();
