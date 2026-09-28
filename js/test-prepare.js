// KhelSetu — Test Preparation
// Mobile/desktop camera readiness + MediaPipe Pose full-body check.
document.addEventListener('DOMContentLoaded', async () => {
  const $=id=>document.getElementById(id);
  const checkLighting=$('checkLighting'), checkCamera=$('checkCamera'), checkBody=$('checkBodyDetected');
  const btnStart=$('btnStartCamera'), btnRetry=$('btnRetryCamera'), heightInput=$('calibrationHeightInput'), backBtn=$('testPrepareBackBtn');
  const video=$('prepareVideo'), canvas=$('prepareCanvas'), message=$('prepareCameraMessage'), select=$('prepareCameraDeviceSelect');
<<<<<<< HEAD
  const sportPreferenceInputs=[...document.querySelectorAll('input[name="sportEnvironment"]')], sportPreferenceMessage=$('sportPreferenceMessage');
=======
>>>>>>> e9199e180df81b64a67cf8fe8546304c2c846031
  // Never use the visible pose canvas for lighting analysis. Drawing the video
  // into the overlay canvas and then resizing it for pose landmarks caused the
  // mobile preview to alternate between camera frames and a black canvas.
  const lightingCanvas=document.createElement('canvas');
  lightingCanvas.width=160; lightingCanvas.height=90;
  let canvasReady=false, canvasW=0, canvasH=0;
  const params=new URLSearchParams(location.search), testId=params.get('test');
  if(testId&&window.KhelSetu)KhelSetu.updateSession({currentTest:testId});
  const session=window.KhelSetu?.getSession?.()||{};
  if(heightInput&&session.calibrationHeight)heightInput.value=session.calibrationHeight;
<<<<<<< HEAD
  let sportEnvironment=session.sportEnvironment||'';
  if (sportEnvironment) {
    const saved=sportPreferenceInputs.find(input=>input.value===sportEnvironment);
    if(saved) saved.checked=true;
  }
=======
>>>>>>> e9199e180df81b64a67cf8fe8546304c2c846031
  const title=document.querySelector('.test-prepare-title');
  if(title&&session.currentTest)title.textContent=session.currentTest.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())+' Test';

  let stream=null,pose=null,raf=0,lastPose=0,stopping=false,retries=0,processing=false;
  const smoother=window.KhelSetuCamera?.createLandmarkSmoother?.(.20);
  let cameraOK=false,lightingOK=false,bodyOK=false,poseOK=false,bodyGoodFrames=0,bodyLostFrames=0;
  let lastStableLandmarks=null;
  const BODY=[0,7,8,11,12,13,14,15,16,23,24,25,26,27,28,29,30,31,32];
  const CORE=[0,11,12,23,24];
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const visible=(p,t=.08)=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1&&(p.visibility==null||p.visibility>=t);

  function setCheck(el,ok,label,wait='Waiting...'){
    if(!el)return; const t=el.querySelector('.test-prepare-check-text'); el.classList.toggle('done',!!ok); el.classList.remove('failed');
    if(t)t.textContent=`${label}: ${ok?'OK':wait}`;
  }
  function failCheck(el,label,msg){if(!el)return;const t=el.querySelector('.test-prepare-check-text');el.classList.remove('done');el.classList.add('failed');if(t)t.textContent=`${label}: ${msg}`;}
  function validate(){
<<<<<<< HEAD
    const ok=cameraOK&&lightingOK&&bodyOK&&poseOK&&!!sportEnvironment;
=======
    const ok=cameraOK&&lightingOK&&bodyOK&&poseOK;
>>>>>>> e9199e180df81b64a67cf8fe8546304c2c846031
    if(btnStart)btnStart.disabled=!ok;
    if(!cameraOK)message.textContent='Start the camera and allow permission.';
    else if(!bodyOK)message.textContent='Keep the phone steady and step back until your whole body is visible.';
    else if(!lightingOK)message.textContent='Body detected. Improve the lighting.';
<<<<<<< HEAD
    else if(!sportEnvironment)message.textContent='Choose Outdoor, Indoor, or Both to personalize your sports recommendations.';
=======
>>>>>>> e9199e180df81b64a67cf8fe8546304c2c846031
    else message.textContent='All checks passed. You can start the assessment.';
  }
  function lightingCheck(){
    if(!cameraOK||video.readyState<2)return false;
    const w=lightingCanvas.width,h=lightingCanvas.height;
    const ctx=lightingCanvas.getContext('2d',{willReadFrequently:true});
    ctx.drawImage(video,0,0,w,h);
    const d=ctx.getImageData(0,0,w,h).data;let sum=0,dark=0,bright=0,n=d.length/4;
    for(let i=0;i<d.length;i+=4){const y=.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];sum+=y;if(y<30)dark++;if(y>245)bright++;}
    const avg=sum/n;return avg>=30&&avg<=240&&dark/n<.82&&bright/n<.60;
  }
  function detectBody(lm){
    if(!Array.isArray(lm)||lm.length<33)return false;
    const core=CORE.filter(i=>visible(lm[i])).length;
    const count=BODY.filter(i=>visible(lm[i])).length;
    if(core<2||count<6)return false;
    const pts=BODY.map(i=>lm[i]).filter(p=>visible(p));
    const h=Math.max(...pts.map(p=>p.y))-Math.min(...pts.map(p=>p.y));
    return h>=.28&&h<=1.08;
  }
  function syncCanvas(){
    if(!video.videoWidth||!video.videoHeight)return false;
    if(!canvasReady || canvasW!==video.videoWidth || canvasH!==video.videoHeight){
      canvasW=video.videoWidth; canvasH=video.videoHeight;
      canvas.width=canvasW; canvas.height=canvasH;
      canvasReady=true;
    }
    return true;
  }
  function drawPose(lm){
    if(!syncCanvas()||!lm?.length)return;
    const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);
    const links=[[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28],[27,31],[28,32]];
    ctx.lineWidth=Math.max(2,canvas.width/320);ctx.strokeStyle='#10B981';ctx.fillStyle='#10B981';
    for(const[a,b]of links){const p=lm[a],q=lm[b];if(!visible(p)||!visible(q))continue;ctx.beginPath();ctx.moveTo(p.x*canvas.width,p.y*canvas.height);ctx.lineTo(q.x*canvas.width,q.y*canvas.height);ctx.stroke();}
    for(const p of lm){if(!visible(p))continue;ctx.beginPath();ctx.arc(p.x*canvas.width,p.y*canvas.height,Math.max(2,canvas.width/180),0,Math.PI*2);ctx.fill();}
  }
  function onPose(r){poseOK=true;const raw=r.poseLandmarks||[];const lm=smoother?smoother.filter(raw):raw;const detected=detectBody(lm);if(detected){bodyGoodFrames++;bodyLostFrames=0;}else{bodyLostFrames++;bodyGoodFrames=0;}if(bodyGoodFrames>=2)bodyOK=true;if(bodyLostFrames>=5)bodyOK=false;if(bodyOK){lastStableLandmarks=lm;drawPose(lm);}else if(lastStableLandmarks&&bodyLostFrames<5){drawPose(lastStableLandmarks);}else if(canvas.width)canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);setCheck(checkBody,bodyOK,'Body Detected','Move into frame');validate();}
  async function initPose(){
    if(!window.Pose)throw new Error('MediaPipe Pose did not load. Check internet connection.');
    pose=new Pose({locateFile:file=>`https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`});
    const mobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);pose.setOptions({modelComplexity:mobile?0:1,smoothLandmarks:true,enableSegmentation:false,minDetectionConfidence:.55,minTrackingConfidence:.60});pose.onResults(onPose);
  }
  async function loop(now){
    if(stopping)return;lightingOK=lightingCheck();setCheck(checkLighting,lightingOK,'Lighting',lightingOK?'Waiting...':'Too dark/bright');
    if(video.readyState>=2&&pose&&!processing&&now-lastPose>=67){lastPose=now;processing=true;try{await pose.send({image:video});}catch(e){console.warn('Pose frame',e);}finally{processing=false;}}
    validate();raf=requestAnimationFrame(loop);
  }
  async function release(){if(stream)stream.getTracks().forEach(t=>{try{t.stop()}catch(_){}});stream=null;if(video)video.srcObject=null;await sleep(250);}
  async function devices(){
    if(!select||!navigator.mediaDevices?.enumerateDevices)return;try{const ds=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==='videoinput');
      if(ds.length<2){select.hidden=true;return;}select.innerHTML='<option value="">Default camera</option>'+ds.map((d,i)=>`<option value="${d.deviceId}">${d.label||`Camera ${i+1}`}</option>`).join('');select.hidden=false;
    }catch(_){}
  }
  function cameraError(e){const n=e?.name||'UnknownError';const map={NotAllowedError:'Permission denied',NotFoundError:'No camera found',NotReadableError:'Camera is busy',OverconstrainedError:'Camera settings unsupported',SecurityError:'Browser blocked camera',TypeError:'Camera requires HTTPS or localhost'};failCheck(checkCamera,'Camera',map[n]||n);message.textContent=map[n]||'Camera could not start. Check browser permission.';if(btnRetry)btnRetry.hidden=false;devices();}
  async function startCamera(deviceId){
    stopping=false;cameraOK=false;bodyOK=false;poseOK=false;lightingOK=false;bodyGoodFrames=0;bodyLostFrames=0;lastStableLandmarks=null;canvasReady=false;canvasW=0;canvasH=0;if(smoother)smoother.reset();processing=false;if(btnRetry)btnRetry.hidden=true;setCheck(checkCamera,false,'Camera');setCheck(checkBody,false,'Body Detected');
    if(!window.KhelSetuCamera?.isSecure?.()){cameraError({name:'TypeError'});return;}
    await release();try{
      const constraints=window.KhelSetuCamera.constraints(deviceId);stream=await navigator.mediaDevices.getUserMedia(constraints);await window.KhelSetuCamera.setVideo(video,stream);syncCanvas();cameraOK=true;setCheck(checkCamera,true,'Camera');message.textContent='Camera is working. Detecting your body...';await initPose();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);await devices();retries=0;
    }catch(e){console.error(e);if(['AbortError','NotReadableError'].includes(e?.name)&&retries<2){retries++;await sleep(700);return startCamera(deviceId);}retries=0;cameraError(e);}validate();
  }
  function stop(){stopping=true;cancelAnimationFrame(raf);if(pose){try{pose.close()}catch(_){}pose=null;}if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;if(video)video.srcObject=null;}
<<<<<<< HEAD
  btnStart?.addEventListener('click',()=>{const h=Number(heightInput?.value);if(!cameraOK||!lightingOK||!bodyOK||!poseOK||!sportEnvironment)return;if(!Number.isFinite(h)||h<100||h>250){message.textContent='Enter a valid height between 100 and 250 cm.';return;}window.KhelSetu?.updateSession?.({calibrationHeight:h,sportEnvironment});stop();location.href='test-record.html';});
  sportPreferenceInputs.forEach(input=>{
    input.addEventListener('change',()=>{
      sportEnvironment=input.value;
      window.KhelSetu?.updateSession?.({sportEnvironment});
      if(sportPreferenceMessage){
        sportPreferenceMessage.textContent=input.value==='both'
          ? 'Indoor and outdoor sports will be considered.'
          : `${input.value.charAt(0).toUpperCase()+input.value.slice(1)} sports will be considered.`;
        sportPreferenceMessage.classList.add('selected');
      }
      validate();
    });
  });
  if(sportEnvironment && sportPreferenceMessage){
    sportPreferenceMessage.textContent=sportEnvironment==='both'
      ? 'Indoor and outdoor sports will be considered.'
      : `${sportEnvironment.charAt(0).toUpperCase()+sportEnvironment.slice(1)} sports will be considered.`;
    sportPreferenceMessage.classList.add('selected');
  }

=======
  btnStart?.addEventListener('click',()=>{const h=Number(heightInput?.value);if(!cameraOK||!lightingOK||!bodyOK||!poseOK)return;if(!Number.isFinite(h)||h<100||h>250){message.textContent='Enter a valid height between 100 and 250 cm.';return;}window.KhelSetu?.updateSession?.({calibrationHeight:h});stop();location.href='test-record.html';});
>>>>>>> e9199e180df81b64a67cf8fe8546304c2c846031
  btnRetry?.addEventListener('click',()=>{retries=0;startCamera(select?.value||undefined)});select?.addEventListener('change',()=>startCamera(select.value||undefined));backBtn?.addEventListener('click',()=>{stop();window.KhelSetu?.navigate('athlete-dashboard.html')||history.back()});window.addEventListener('pagehide',stop);window.addEventListener('beforeunload',stop);
  await startCamera();
});
