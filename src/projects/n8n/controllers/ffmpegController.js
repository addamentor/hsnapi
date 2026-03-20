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

// Public video storage directory (for Instagram posting etc.)
// Set PUBLIC_VIDEO_DIR in .env to your public folder path
// Set PUBLIC_VIDEO_URL in .env to your public URL base
const publicVideoDir = process.env.PUBLIC_VIDEO_DIR || path.join(os.tmpdir(), 'public-videos');
const publicVideoUrl = process.env.PUBLIC_VIDEO_URL || '';

// Font for text overlays (must support Hindi/Devanagari and Unicode)
// Set FFMPEG_FONT_PATH in .env to point to a Unicode-compatible font
// Common options on Linux:
//   /usr/share/fonts/truetype/noto/NotoSans-Regular.ttf
//   /usr/share/fonts/truetype/freefont/FreeSans.ttf
//   /usr/share/fonts/truetype/dejavu/DejaVuSans.ttf
// You can also download and use: NotoSansDevanagari-Regular.ttf for Hindi
const fontPath = process.env.FFMPEG_FONT_PATH || '';

// Ensure directory exists
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Ensure upload directory exists (called before each operation)
const ensureUploadDir = () => {
  ensureDir(uploadDir);
};

// Ensure public video directory exists
const ensurePublicDir = () => {
  ensureDir(publicVideoDir);
};

// Create directories on startup
ensureUploadDir();
ensurePublicDir();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadDir(); // Ensure dir exists before storing
    cb(null, uploadDir);
  },
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
  
  // Ensure upload dir exists
  ensureUploadDir();
  
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
    console.log('Concat file created:', concatFile);
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
    videoType = 'youtube',
    imageDuration = 7,
    saveVideo = false  // If true, saves video to public folder and returns URL
  } = req.body;
  
  const shouldSaveVideo = saveVideo === true || saveVideo === 'true';

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
  // Using conservative dimensions for better encoder compatibility
  const isReel = videoType === 'reel' || videoType === 'shorts';
  const width = isReel ? 608 : 1280;   // 608x1080 for reel (9:16 approx)
  const height = isReel ? 1080 : 720;  // 1280x720 for youtube (16:9)
  const duration = parseFloat(imageDuration) || 7;
  const fps = 24;

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

  // Ensure upload dir exists before creating files
  ensureUploadDir();
  
  const concatFile = path.join(uploadDir, `concat_${timestamp}.txt`);
  const outputFile = path.join(uploadDir, `output_${timestamp}.mp4`);
  const subtitleFile = path.join(uploadDir, `subs_${timestamp}.srt`);
  const hookTextFile = path.join(uploadDir, `hook_${timestamp}.txt`);
  
  filesToCleanup = [
    audioFile, bgMusicFile, 
    image1Path, image2Path, image3Path, image4Path, 
    concatFile, outputFile, subtitleFile, hookTextFile
  ].filter(Boolean);

  // Create concat file
  const formatPath = (p) => p.replace(/\\/g, '/');
  const images = [image1Path, image2Path, image3Path, image4Path];
  const concatContent = images.map((img, i) => {
    let content = `file '${formatPath(img)}'\nduration ${duration}`;
    if (i === images.length - 1) {
      content += `\nfile '${formatPath(img)}'`; // Repeat last image
    }
    return content;
  }).join('\n');

  try {
    ensureUploadDir(); // Double-check before write
    fs.writeFileSync(concatFile, concatContent);
    console.log('Concat file created:', concatFile);
    console.log('Concat content:', concatContent);
  } catch (err) {
    performCleanup();
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to create concat file: ' + err.message 
    });
  }

  // Generate SRT subtitle file if subtitles provided
  let hasSubtitles = false;
  if (subtitles) {
    try {
      let srtContent = '';
      let subsData = subtitles;
      
      // Parse if JSON string
      if (typeof subtitles === 'string' && subtitles.trim().startsWith('[')) {
        try {
          subsData = JSON.parse(subtitles);
        } catch (e) {
          // Not JSON, treat as SRT
          srtContent = subtitles;
        }
      }
      
      if (Array.isArray(subsData)) {
        subsData.forEach((sub, index) => {
          srtContent += `${index + 1}\n`;
          srtContent += `${sub.start} --> ${sub.end}\n`;
          srtContent += `${sub.text}\n\n`;
        });
      }
      
      if (srtContent) {
        fs.writeFileSync(subtitleFile, srtContent);
        hasSubtitles = true;
      }
    } catch (err) {
      console.error('Subtitle parsing error:', err.message);
    }
  }

  // Build filter chain
  let videoFilters = [];
  
  // Scale and pad - ensure even dimensions
  const scaledWidth = Math.floor(width / 2) * 2;
  const scaledHeight = Math.floor(height / 2) * 2;
  
  videoFilters.push(`scale=${scaledWidth}:${scaledHeight}:force_original_aspect_ratio=decrease`);
  videoFilters.push(`pad=${scaledWidth}:${scaledHeight}:(ow-iw)/2:(oh-ih)/2:black`);
  videoFilters.push(`setsar=1`);
  videoFilters.push(`fps=${fps}`);
  
  // Ken Burns effect - only for youtube, disabled for reel
  const useKenBurns = (kenBurns === true || kenBurns === 'true') && !isReel;
  if (useKenBurns) {
    // Ken Burns is complex, add it separately if needed
    // For now keep it simple - just the zoom
  }

  // Hook text overlay - positioned at top with no gap
  // Uses textfile for proper Unicode/Hindi/Emoji support
  if (hookText) {
    const fontSize = isReel ? 44 : 42;
    const padding = isReel ? 12 : 15;
    const yPosition = isReel ? 60 : 30;
    
    // Calculate max characters per line based on video width
    // Approximate: video width / (fontSize * 0.6) gives rough char count
    const maxCharsPerLine = isReel ? 18 : 35;
    
    // Word-wrap function to split text into multiple lines
    const wrapText = (text, maxWidth) => {
      const words = text.split(' ');
      const lines = [];
      let currentLine = '';
      
      for (const word of words) {
        // If single word is longer than maxWidth, force break it
        if (word.length > maxWidth) {
          if (currentLine) {
            lines.push(currentLine.trim());
            currentLine = '';
          }
          // Break long word into chunks
          for (let i = 0; i < word.length; i += maxWidth) {
            lines.push(word.slice(i, i + maxWidth));
          }
        } else if ((currentLine + ' ' + word).trim().length <= maxWidth) {
          currentLine = (currentLine + ' ' + word).trim();
        } else {
          if (currentLine) {
            lines.push(currentLine.trim());
          }
          currentLine = word;
        }
      }
      
      if (currentLine) {
        lines.push(currentLine.trim());
      }
      
      // Limit to 3 lines max
      return lines.slice(0, 3).join('\n');
    };
    
    // Wrap the hook text if too long
    const wrappedText = wrapText(hookText, maxCharsPerLine);
    
    // Save wrapped hook text to a temporary file
    try {
      fs.writeFileSync(hookTextFile, wrappedText, 'utf8');
      console.log('Hook text file created:', hookTextFile, 'Content:', wrappedText);
    } catch (err) {
      console.error('Failed to create hook text file:', err.message);
    }
    
    // Escape the file path for FFmpeg
    const escapedHookPath = formatPath(hookTextFile).replace(/:/g, '\\:');
    
    // Build drawtext filter with proper font support
    let drawTextFilter = `drawtext=textfile='${escapedHookPath}'`;
    drawTextFilter += `:fontsize=${fontSize}`;
    drawTextFilter += `:fontcolor=white`;
    drawTextFilter += `:x=(w-text_w)/2`;
    drawTextFilter += `:y=${yPosition}`;
    drawTextFilter += `:box=1:boxcolor=black@0.8:boxborderw=${padding}`;
    drawTextFilter += `:line_spacing=8`; // Add spacing between lines
    
    // Add font file if configured (required for Hindi/Emoji support)
    if (fontPath && fs.existsSync(fontPath)) {
      const escapedFontPath = formatPath(fontPath).replace(/:/g, '\\:');
      drawTextFilter += `:fontfile='${escapedFontPath}'`;
    }
    
    videoFilters.push(drawTextFilter);
  }

  // Build ffmpeg command
  const ffmpegCmd = ffmpeg()
    .input(concatFile)
    .inputOptions(['-f', 'concat', '-safe', '0'])
    .input(audioFile);

  // Add background music if provided
  if (bgMusicFile) {
    ffmpegCmd.input(bgMusicFile);
  }

  // Build output options
  let outputOptions = [
    '-vf', videoFilters.join(','),
    '-s', `${scaledWidth}x${scaledHeight}`,  // Force output size
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '23',
    '-pix_fmt', 'yuv420p',
    '-r', String(fps)
  ];

  // Handle audio mixing if background music provided
  if (bgMusicFile) {
    const bgVol = Math.min(100, Math.max(0, parseFloat(bgMusicVolume) || 20)) / 100;
    outputOptions.push('-filter_complex', `[1:a]volume=1[a1];[2:a]volume=${bgVol}[a2];[a1][a2]amix=inputs=2:duration=first[aout]`);
    outputOptions.push('-map', '0:v');
    outputOptions.push('-map', '[aout]');
    outputOptions.push('-c:a', 'aac');
    outputOptions.push('-b:a', '192k');
  } else {
    outputOptions.push('-c:a', 'aac');
    outputOptions.push('-b:a', '192k');
  }

  outputOptions.push('-shortest');
  outputOptions.push('-movflags', '+faststart');

  ffmpegProcess = ffmpegCmd
    .outputOptions(outputOptions)
    .on('start', (cmd) => {
      console.log('FFmpeg Enhanced started:', cmd);
    })
    .on('stderr', (line) => {
      console.log('FFmpeg:', line);
    })
    .on('end', () => {
      console.log('Enhanced video generation complete');
      
      if (shouldSaveVideo) {
        // Save to public folder and return URL
        try {
          ensurePublicDir();
          const videoFilename = `video_${timestamp}.mp4`;
          const publicPath = path.join(publicVideoDir, videoFilename);
          
          // Copy to public folder
          fs.copyFileSync(outputFile, publicPath);
          console.log('Video saved to public folder:', publicPath);
          
          // Build public URL
          const videoUrl = publicVideoUrl 
            ? `${publicVideoUrl.replace(/\/$/, '')}/${videoFilename}`
            : `/videos/${videoFilename}`;
          
          // Cleanup temp files (but not the public video)
          cleanupFiles(filesToCleanup.filter(f => f !== outputFile));
          cleanupFiles([outputFile]); // Delete temp output
          isCleanedUp = true;
          
          return res.json({
            success: true,
            url: videoUrl,
            filename: videoFilename,
            message: 'Video generated and saved successfully'
          });
        } catch (err) {
          console.error('Failed to save video to public folder:', err.message);
          performCleanup();
          return res.status(500).json({
            success: false,
            error: 'Failed to save video: ' + err.message
          });
        }
      } else {
        // Stream video directly (default behavior)
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
      }
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

// Cleanup old videos from public folder (call via cron or scheduled task)
const cleanupOldVideos = (daysOld = 7) => {
  ensurePublicDir();
  const now = Date.now();
  const maxAge = daysOld * 24 * 60 * 60 * 1000; // days in ms
  
  try {
    const files = fs.readdirSync(publicVideoDir);
    let deleted = 0;
    
    files.forEach(file => {
      if (file.endsWith('.mp4')) {
        const filePath = path.join(publicVideoDir, file);
        const stat = fs.statSync(filePath);
        const age = now - stat.mtimeMs;
        
        if (age > maxAge) {
          fs.unlinkSync(filePath);
          deleted++;
          console.log(`Deleted old video: ${file}`);
        }
      }
    });
    
    return { success: true, deleted, message: `Deleted ${deleted} old videos` };
  } catch (err) {
    console.error('Cleanup error:', err.message);
    return { success: false, error: err.message };
  }
};

module.exports = {
  uploadFields,
  uploadFieldsEnhanced,
  submitFfmpeg,
  submitFfmpegEnhanced,
  cleanupOldVideos
};