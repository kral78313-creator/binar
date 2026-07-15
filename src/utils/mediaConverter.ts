/**
 * Web-based media conversion utilities running entirely on the client side.
 */

/**
 * Decodes audio from an MP4, WAV, or OGG file and encodes it to a standard playable WAV file.
 */
export async function extractAudioFromVideo(
  file: File,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  onProgress?.(10);
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  onProgress?.(20);

  const arrayBuffer = await file.arrayBuffer();
  onProgress?.(40);

  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  onProgress?.(70);

  const wavBlob = bufferToWav(audioBuffer);
  onProgress?.(100);

  audioCtx.close();
  return wavBlob;
}

/**
 * Encodes an AudioBuffer into a WAV PCM blob.
 */
function bufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArr = new ArrayBuffer(length);
  const view = new DataView(bufferArr);
  const channels: Float32Array[] = [];
  let i;
  let sample;
  let offset = 0;
  let pos = 0;

  const setUint16 = (data: number) => {
    view.setUint16(pos, data, true);
    pos += 2;
  };

  const setUint32 = (data: number) => {
    view.setUint32(pos, data, true);
    pos += 4;
  };

  /* RIFF identifier */
  setUint32(0x46464952);                         // "RIFF"
  setUint32(length - 8);                         // file length - 8
  setUint32(0x45564157);                         // "WAVE"

  /* format chunk identifier */
  setUint32(0x20746d66);                         // "fmt " chunk
  setUint32(16);                                 // chunk length
  setUint16(1);                                  // sample format (raw PCM)
  setUint16(numOfChan);                          // channel count
  setUint32(buffer.sampleRate);                  // sample rate
  setUint32(buffer.sampleRate * 2 * numOfChan);  // byte rate
  setUint16(numOfChan * 2);                      // block align
  setUint16(16);                                 // bits per sample

  /* data chunk identifier */
  setUint32(0x61746164);                         // "data" chunk
  setUint32(length - pos - 4);                   // chunk length

  for (i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < length) {
    for (i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset] || 0));
      sample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF);
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([bufferArr], { type: 'audio/wav' });
}

/**
 * Creates an animated audio visualizer MP4/WebM video file from an MP3 or WAV file.
 */
export async function createAudioVisualizerVideo(
  audioFile: File,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  onProgress?.(10);
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const arrayBuffer = await audioFile.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  onProgress?.(35);
  
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d')!;
  
  // Get audio waveform peaks for the visualizer
  const channelData = audioBuffer.getChannelData(0);
  const step = Math.ceil(channelData.length / 100);
  const peaks: number[] = [];
  for (let i = 0; i < 100; i++) {
    let max = 0;
    const start = i * step;
    for (let j = 0; j < step; j++) {
      const val = Math.abs(channelData[start + j] || 0);
      if (val > max) max = val;
    }
    peaks.push(max);
  }
  
  const canvasStream = canvas.captureStream(24);
  const audioDestination = audioCtx.createMediaStreamDestination();
  const source = audioCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioDestination);
  
  const tracks = [...canvasStream.getVideoTracks(), ...audioDestination.stream.getAudioTracks()];
  const combinedStream = new MediaStream(tracks);
  
  let mimeType = 'video/mp4';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm';
  }
  
  const recorder = new MediaRecorder(combinedStream, { mimeType, videoBitsPerSecond: 2500000 });
  const chunks: Blob[] = [];
  
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  
  const promise = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: mimeType }));
    };
    recorder.onerror = reject;
  });
  
  recorder.start();
  source.start(0);
  
  let frame = 0;
  const totalFrames = 24 * 6; // 6-second preview video
  
  const drawFrame = () => {
    if (frame >= totalFrames) {
      source.stop();
      recorder.stop();
      audioCtx.close();
      return;
    }
    
    // Background dynamic canvas design
    const grad = ctx.createLinearGradient(0, 0, 1280, 720);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#311042');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1280, 720);
    
    // Draw neon wireframe borders
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 6;
    ctx.strokeRect(30, 30, 1220, 660);
    
    // Draw titles
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 36px Inter, system-ui, sans-serif';
    ctx.fillText(audioFile.name, 80, 140);
    
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'black 14px JetBrains Mono, monospace';
    ctx.fillText('NEO-NEON SOUND CONVERTER PRO', 80, 85);
    
    // Dynamic waveform animation
    const barWidth = 8;
    const barGap = 4;
    const startX = 80;
    const startY = 460;
    
    for (let i = 0; i < 90; i++) {
      const peak = peaks[i % peaks.length] || 0.1;
      const waveVal = Math.sin(frame * 0.15 + i * 0.2) * 12;
      const height = Math.max(15, peak * 260 + waveVal);
      
      // Reflection glow
      ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
      ctx.fillRect(startX + i * (barWidth + barGap), startY, barWidth, height * 0.5);
      
      // Draw bar with gradient
      const barGrad = ctx.createLinearGradient(0, startY - height, 0, startY);
      barGrad.addColorStop(0, '#fbbf24');
      barGrad.addColorStop(1, '#f59e0b');
      ctx.fillStyle = barGrad;
      ctx.fillRect(startX + i * (barWidth + barGap), startY - height, barWidth, height);
    }
    
    // Progress line
    const progress = frame / totalFrames;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(80, 560, 1120, 8);
    
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(80, 560, 1120 * progress, 8);
    
    // Timer display
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '14px JetBrains Mono, monospace';
    const curTime = (frame / 24).toFixed(1);
    ctx.fillText(`TIME: ${curTime}s / 6.0s`, 80, 600);
    
    frame++;
    onProgress?.(35 + Math.floor((frame / totalFrames) * 65));
    
    setTimeout(drawFrame, 1000 / 24);
  };
  
  drawFrame();
  return promise;
}

/**
 * Renders a cinematic 5-second panning & zoom video file from a static image.
 */
export async function convertImageToVideo(
  imageFile: File,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  onProgress?.(15);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = e.target?.result as string;
    };
    reader.readAsDataURL(imageFile);
  });
  onProgress?.(35);
  
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d')!;
  
  const canvasStream = canvas.captureStream(24);
  let mimeType = 'video/mp4';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm';
  }
  
  const recorder = new MediaRecorder(canvasStream, { mimeType, videoBitsPerSecond: 2500000 });
  const chunks: Blob[] = [];
  
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  
  const promise = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: mimeType }));
    };
    recorder.onerror = reject;
  });
  
  recorder.start();
  
  let frame = 0;
  const totalFrames = 24 * 5; // 5-second video
  
  const drawFrame = () => {
    if (frame >= totalFrames) {
      recorder.stop();
      return;
    }
    
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1280, 720);
    
    const progress = frame / totalFrames;
    const baseScale = Math.max(1280 / img.width, 720 / img.height);
    const currentScale = baseScale * (1.0 + progress * 0.15); // zoom in 15%
    
    const w = img.width * currentScale;
    const h = img.height * currentScale;
    
    const x = (1280 - w) / 2 + progress * 40;
    const y = (720 - h) / 2 + progress * 20;
    
    ctx.drawImage(img, x, y, w, h);
    
    // Ambient cinematic vignette
    const vig = ctx.createRadialGradient(640, 360, 250, 640, 360, 680);
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, 1280, 720);
    
    frame++;
    onProgress?.(35 + Math.floor((frame / totalFrames) * 65));
    
    setTimeout(drawFrame, 1000 / 24);
  };
  
  drawFrame();
  return promise;
}
