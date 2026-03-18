const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const os = require('os');
const multer = require('multer');

// Set FFmpeg path if specified in environment variable
// On Hostinger, set FFMPEG_PATH=/home/YOUR_USERNAME/bin/ffmpeg in .env
if (process.env.FFMPEG_PATH) {
  ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
}
if (process.env.FFPROBE_PATH) {
  ffmpeg.setFfprobePath(process.env.FFPROBE_PATH);
}

// Use system temp directory - files are automatically cleaned by OS if not deleted
const uploadDir = path.join(os.tmpdir(), 'ffmpeg-temp');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.originalname}`)
});

const upload = multer({ storage });

// Multer middleware - only for audio file now
const uploadFields = upload.fields([
  { name: 'audio', maxCount: 1 }
]);

// Multer middleware for enhanced video - audio + optional background music
const uploadFieldsEnhanced = upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'bgMusic', maxCount: 1 }
]);

// Helper to safely delete files immediately
const cleanupFiles = (files) => {
  files.forEach(file => {
    if (file && fs.existsSync(file)) {
      try {
        fs.unlinkSync(file);
        console.log(`Deleted temp file: ${path.basename(file)}`);
      } catch (err) {
        console.error(`Failed to delete file: ${file}`, err.message);
      }
    }
  });
};

// Helper to decode base64 and save as temp file
const saveBase64Image = (base64String, filename) => {
  // Remove data URL prefix if present (e.g., "data:image/png;base64,")
  let base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
  
  // Also handle whitespace/newlines that might be in the base64 string
  base64Data = base64Data.replace(/\s/g, '');
  
  // Detect image format from data URL prefix first
  let extension = null;
  const match = base64String.match(/^data:image\/(\w+);base64,/);
  if (match) {
    extension = match[1] === 'jpeg' ? 'jpg' : match[1];
  }
  
  // If no prefix, detect from base64 signature (magic bytes)
  if (!extension) {
    if (base64Data.startsWith('/9j/')) {
      extension = 'jpg';  // JPEG
    } else if (base64Data.startsWith('iVBOR')) {
      extension = 'png';  // PNG
    } else if (base64Data.startsWith('R0lG')) {
      extension = 'gif';  // GIF
    } else if (base64Data.startsWith('UklGR')) {
      extension = 'webp'; // WebP
    } else {
      extension = 'jpg';  // Default to jpg
    }
  }
  
  const filePath = path.join(uploadDir, `${filename}.${extension}`);
  const buffer = Buffer.from(base64Data, 'base64');
  fs.writeFileSync(filePath, buffer);
  
  return filePath;
};

// Controller function to create video from images (base64) + audio (file)
const submitFfmpeg = (req, res) => {
  let filesToCleanup = [];
  let ffmpegProcess = null;
  let isCleanedUp = false;

  // Ensure cleanup happens only once
  const performCleanup = () => {
    if (!isCleanedUp) {
      isCleanedUp = true;
      if (ffmpegProcess) {
        try {
          ffmpegProcess.kill('SIGKILL');
        } catch (e) {}
      }
      cleanupFiles(filesToCleanup);
    }
  };

  // Handle client disconnect - cleanup immediately
  req.on('close', () => {
    if (!res.writableEnded) {
      console.log('Client disconnected, cleaning up...');
      performCleanup();
    }
  });

  // Validate audio file
  if (!req.files || !req.files.audio || !req.files.audio[0]) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required file: audio' 
    });
  }

  // Validate base64 images from body
  const { image1, image2, image3, image4 } = req.body;
  if (!image1 || !image2 || !image3 || !image4) {
    // Cleanup uploaded audio
    if (req.files && req.files.audio) {
      cleanupFiles([req.files.audio[0].path]);
    }
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required base64 images. Provide image1, image2, image3, image4 in request body.' 
    });
  }

  const audioFile = req.files.audio[0].path;
  const timestamp = Date.now();
  
  let image1Path, image2Path, image3Path, image4Path;
  
  try {
    // Decode and save base64 images
    image1Path = saveBase64Image(image1, `image1_${timestamp}`);
    image2Path = saveBase64Image(image2, `image2_${timestamp}`);
    image3Path = saveBase64Image(image3, `image3_${timestamp}`);
    image4Path = saveBase64Image(image4, `image4_${timestamp}`);
  } catch (err) {
    cleanupFiles([audioFile]);
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid base64 image data: ' + err.message 
    });
  }
  
  const concatFile = path.join(uploadDir, `concat_${timestamp}.txt`);
  const outputFile = path.join(uploadDir, `output_${timestamp}.mp4`);
  
  filesToCleanup = [audioFile, image1Path, image2Path, image3Path, image4Path, concatFile, outputFile];

  // Create concat file with absolute paths (use forward slashes for FFmpeg)
  const formatPath = (p) => p.replace(/\\/g, '/');
  const concatContent = [
    `file '${formatPath(image1Path)}'`,
    `duration 7`,
    `file '${formatPath(image2Path)}'`,
    `duration 7`,
    `file '${formatPath(image3Path)}'`,
    `duration 7`,
    `file '${formatPath(image4Path)}'`,
    `duration 7`,
    `file '${formatPath(image4Path)}'`  // Last image repeated to ensure final duration
  ].join('\n');

  try {
    fs.writeFileSync(concatFile, concatContent);
  } catch (err) {
    performCleanup();
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to create concat file: ' + err.message 
    });
  }

  ffmpegProcess = ffmpeg()
    .input(concatFile)
    .inputOptions(['-f', 'concat', '-safe', '0'])
    .input(audioFile)
    .outputOptions([
      '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1',  // Scale to 720p, pad to fit, fix aspect ratio
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-shortest',
      '-movflags', '+faststart'
    ])
    .on('start', (cmd) => {
      console.log('FFmpeg started:', cmd);
    })
    .on('end', () => {
      console.log('Video generation complete, sending to client...');
      
      // Stream the file and delete immediately after
      const fileStream = fs.createReadStream(outputFile);
      const stat = fs.statSync(outputFile);
      
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', 'attachment; filename="generated_video.mp4"');
      res.setHeader('Content-Length', stat.size);
      
      fileStream.pipe(res);
      
      fileStream.on('end', () => {
        console.log('Video sent successfully, deleting all temp files...');
        performCleanup();
      });
      
      fileStream.on('error', (err) => {
        console.error('Stream error:', err.message);
        performCleanup();
        if (!res.headersSent) {
          res.status(500).json({ success: false, error: 'Failed to stream video' });
        }
      });
    })
    .on('error', (err) => {
      console.error('FFmpeg error:', err.message);
      performCleanup();
      if (!res.headersSent) {
        res.status(500).json({ 
          success: false, 
          error: 'Video processing failed: ' + err.message 
        });
      }
    })
    .save(outputFile);
};

/**
 * Enhanced video creation with:
 * - Hook text overlay (top of video with black background)
 * - Subtitles with timestamps
 * - Ken Burns effect (zoom/pan)
 * - Background music with volume control
 * - Video type: youtube (16:9) or reel (9:16)
 * 
 * Request body params:
 * - image1, image2, image3, image4: base64 images (required)
 * - hookText: string - text displayed at top (optional)
 * - subtitles: array of {start, end, text} or SRT string (optional)
 * - kenBurns: boolean - apply Ken Burns zoom effect (optional, default false)
 * - bgMusicVolume: number 0-100 - background music volume (optional, default 20)
 * - videoType: 'youtube' | 'reel' - aspect ratio (optional, default 'youtube')
 * - imageDuration: number - seconds per image (optional, default 7)
 * 
 * Files:
 * - audio: main audio/voiceover (required)
 * - bgMusic: background music file (optional)
 */
const submitFfmpegEnhanced = (req, res) => {
  let filesToCleanup = [];
  let ffmpegProcess = null;
  let isCleanedUp = false;

  const performCleanup = () => {
    if (!isCleanedUp) {
      isCleanedUp = true;
      if (ffmpegProcess) {
        try { ffmpegProcess.kill('SIGKILL'); } catch (e) {}
      }
      cleanupFiles(filesToCleanup);
    }
  };

  req.on('close', () => {
    if (!res.writableEnded) {
      console.log('Client disconnected, cleaning up...');
      performCleanup();
    }
  });

  // Validate audio file
  if (!req.files || !req.files.audio || !req.files.audio[0]) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required file: audio' 
    });
  }

  // Extract parameters from body
  const { 
    image1, image2, image3, image4,
    hookText,
    subtitles,
    kenBurns = false,
    bgMusicVolume = 20,
    videoType = 'youtube',  // 'youtube' (16:9) or 'reel' (9:16)
    imageDuration = 7
  } = req.body;

  // Validate images
  if (!image1 || !image2 || !image3 || !image4) {
    if (req.files) {
      Object.values(req.files).flat().forEach(f => {
        if (f && f.path) cleanupFiles([f.path]);
      });
    }
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required base64 images. Provide image1, image2, image3, image4.' 
    });
  }

  const audioFile = req.files.audio[0].path;
  const bgMusicFile = req.files.bgMusic?.[0]?.path || null;
  const timestamp = Date.now();

  // Determine dimensions based on video type
  const isReel = videoType === 'reel' || videoType === 'shorts';
  const width = isReel ? 1080 : 1920;
  const height = isReel ? 1920 : 1080;
  const duration = parseFloat(imageDuration) || 7;

  let image1Path, image2Path, image3Path, image4Path;
  
  try {
    image1Path = saveBase64Image(image1, `image1_${timestamp}`);
    image2Path = saveBase64Image(image2, `image2_${timestamp}`);
    image3Path = saveBase64Image(image3, `image3_${timestamp}`);
    image4Path = saveBase64Image(image4, `image4_${timestamp}`);
  } catch (err) {
    cleanupFiles([audioFile, bgMusicFile].filter(Boolean));
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid base64 image data: ' + err.message 
    });
  }

  const outputFile = path.join(uploadDir, `output_${timestamp}.mp4`);
  const subtitleFile = path.join(uploadDir, `subs_${timestamp}.srt`);
  
  filesToCleanup = [
    audioFile, bgMusicFile, 
    image1Path, image2Path, image3Path, image4Path, 
    outputFile, subtitleFile
  ].filter(Boolean);

  // Generate SRT subtitle file if subtitles provided
  if (subtitles) {
    try {
      let srtContent = '';
      
      if (typeof subtitles === 'string') {
        // Already in SRT format
        srtContent = subtitles;
      } else if (Array.isArray(subtitles)) {
        // Convert array format to SRT
        // Expected: [{start: "00:00:01,000", end: "00:00:05,000", text: "Hello"}]
        subtitles.forEach((sub, index) => {
          srtContent += `${index + 1}\n`;
          srtContent += `${sub.start} --> ${sub.end}\n`;
          srtContent += `${sub.text}\n\n`;
        });
      }
      
      if (srtContent) {
        fs.writeFileSync(subtitleFile, srtContent);
      }
    } catch (err) {
      console.error('Subtitle parsing error:', err.message);
      // Continue without subtitles
    }
  }

  // Build FFmpeg command
  const ffmpegCmd = ffmpeg();
  const images = [image1Path, image2Path, image3Path, image4Path];
  
  // Add each image as input
  images.forEach(img => {
    ffmpegCmd.input(img).inputOptions(['-loop', '1', '-t', String(duration)]);
  });

  // Add audio input
  ffmpegCmd.input(audioFile);
  
  // Add background music if provided
  if (bgMusicFile) {
    ffmpegCmd.input(bgMusicFile);
  }

  // Build complex filter
  let filterComplex = [];
  const numImages = images.length;
  
  // Process each image
  for (let i = 0; i < numImages; i++) {
    let imgFilter = `[${i}:v]`;
    
    // Scale and pad to target dimensions
    imgFilter += `scale=${width}:${height}:force_original_aspect_ratio=decrease,`;
    imgFilter += `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black,`;
    imgFilter += `setsar=1`;
    
    // Ken Burns effect (zoom and pan)
    if (kenBurns === true || kenBurns === 'true') {
      // Alternate between zoom in/out and pan directions
      const fps = 30;
      const totalFrames = duration * fps;
      const zoomStart = i % 2 === 0 ? 1 : 1.2;
      const zoomEnd = i % 2 === 0 ? 1.2 : 1;
      const zoomStep = (zoomEnd - zoomStart) / totalFrames;
      
      // Different pan directions for variety
      const panX = i % 2 === 0 ? `iw/2-(iw/zoom/2)` : `(iw-iw/zoom)/2*on/${totalFrames}`;
      const panY = i % 3 === 0 ? `ih/2-(ih/zoom/2)` : `(ih-ih/zoom)/2`;
      
      imgFilter += `,zoompan=z='${zoomStart}+${zoomStep}*on':x='${panX}':y='${panY}':d=${totalFrames}:s=${width}x${height}:fps=${fps}`;
    }
    
    imgFilter += `[v${i}]`;
    filterComplex.push(imgFilter);
  }

  // Concat all video streams
  let concatInput = '';
  for (let i = 0; i < numImages; i++) {
    concatInput += `[v${i}]`;
  }
  filterComplex.push(`${concatInput}concat=n=${numImages}:v=1:a=0[vconcat]`);

  // Add hook text overlay if provided
  let videoStream = '[vconcat]';
  if (hookText) {
    // Escape special characters for FFmpeg drawtext
    const escapedText = hookText
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "'\\''")
      .replace(/:/g, '\\:');
    
    const fontSize = isReel ? 42 : 48;
    const boxPadding = 20;
    
    filterComplex.push(
      `${videoStream}drawtext=text='${escapedText}':fontsize=${fontSize}:fontcolor=white:` +
      `x=(w-text_w)/2:y=${boxPadding + 10}:` +
      `box=1:boxcolor=black@0.7:boxborderw=${boxPadding}[vtext]`
    );
    videoStream = '[vtext]';
  }

  // Add subtitles if file exists and has content
  if (subtitles && fs.existsSync(subtitleFile) && fs.statSync(subtitleFile).size > 0) {
    const subPath = subtitleFile.replace(/\\/g, '/').replace(/:/g, '\\:');
    const subFontSize = isReel ? 24 : 28;
    
    filterComplex.push(
      `${videoStream}subtitles='${subPath}':force_style='FontSize=${subFontSize},PrimaryColour=&HFFFFFF,OutlineColour=&H000000,BorderStyle=3,Outline=2,Shadow=1,MarginV=50'[vsub]`
    );
    videoStream = '[vsub]';
  }

  // Audio mixing
  const audioInputIndex = numImages;
  const bgMusicInputIndex = numImages + 1;
  
  if (bgMusicFile) {
    // Mix main audio with background music
    const mainVol = 1.0;
    const bgVol = Math.min(100, Math.max(0, parseFloat(bgMusicVolume) || 20)) / 100;
    
    filterComplex.push(
      `[${audioInputIndex}:a]volume=${mainVol}[amain]`,
      `[${bgMusicInputIndex}:a]volume=${bgVol},aloop=loop=-1:size=2e+09[abg]`,
      `[amain][abg]amix=inputs=2:duration=shortest:dropout_transition=2[aout]`
    );
  } else {
    filterComplex.push(`[${audioInputIndex}:a]anull[aout]`);
  }

  // Apply filter complex
  ffmpegCmd
    .complexFilter(filterComplex.join(';'))
    .outputOptions([
      '-map', videoStream,
      '-map', '[aout]',
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-shortest',
      '-movflags', '+faststart'
    ]);

  ffmpegProcess = ffmpegCmd
    .on('start', (cmd) => {
      console.log('FFmpeg Enhanced started:', cmd);
    })
    .on('end', () => {
      console.log('Enhanced video generation complete');
      
      const fileStream = fs.createReadStream(outputFile);
      const stat = fs.statSync(outputFile);
      
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', 'attachment; filename="generated_video.mp4"');
      res.setHeader('Content-Length', stat.size);
      
      fileStream.pipe(res);
      
      fileStream.on('end', () => {
        console.log('Video sent successfully, cleaning up...');
        performCleanup();
      });
      
      fileStream.on('error', (err) => {
        console.error('Stream error:', err.message);
        performCleanup();
        if (!res.headersSent) {
          res.status(500).json({ success: false, error: 'Failed to stream video' });
        }
      });
    })
    .on('error', (err) => {
      console.error('FFmpeg error:', err.message);
      performCleanup();
      if (!res.headersSent) {
        res.status(500).json({ 
          success: false, 
          error: 'Video processing failed: ' + err.message 
        });
      }
    })
    .save(outputFile);
};

module.exports = {
  uploadFields,
  uploadFieldsEnhanced,
  submitFfmpeg,
  submitFfmpegEnhanced
};