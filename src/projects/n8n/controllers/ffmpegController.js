const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const os = require('os');
const multer = require('multer');

// Optional: pureimage for proper Hindi/Emoji text rendering (pure JS, no native deps)
let PImage, opentype, pureImageAvailable = false;
try {
  PImage = require('pureimage');
  opentype = require('opentype.js');
  pureImageAvailable = true;
  console.log('PureImage module loaded - Hindi/Emoji text support enabled');
} catch (err) {
  console.log('PureImage not available - using FFmpeg drawtext (limited Hindi/Emoji support)');
}

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

// Font for Hindi/Devanagari text overlays
// Set FFMPEG_FONT_PATH in .env to a Devanagari-compatible font (e.g. NotoSansDevanagari-Regular.ttf)
// English/Latin text uses FFmpeg's built-in default font (no config needed)
const fontPath = process.env.FFMPEG_FONT_PATH || '';

// Detect if text contains Devanagari (Hindi) characters
const hasDevanagari = (text) => /[\u0900-\u097F]/.test(text);

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

/**
 * Create hook text overlay image using PureImage (pure JS)
 * Supports Hindi, emojis, and proper text shaping
 * @param {string} text - The hook text
 * @param {number} videoWidth - Video width in pixels
 * @param {boolean} isReel - Whether this is a reel/shorts format
 * @param {string} outputPath - Path to save the PNG image
 * @returns {Promise<object>} - { success, height } where height is the banner height
 */
const createTextOverlayImage = async (text, videoWidth, isReel, outputPath) => {
  if (!pureImageAvailable || !PImage || !opentype) {
    return { success: false, error: 'PureImage not available' };
  }
  
  try {
    // Load font - must be a TTF/OTF file
    let font;
    if (fontPath && fs.existsSync(fontPath)) {
      font = await opentype.load(fontPath);
      console.log('Using custom font:', fontPath);
    } else {
      // Try common system fonts
      const defaultFonts = [
        '/usr/share/fonts/truetype/noto/NotoSansDevanagari-Regular.ttf',
        '/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/usr/share/fonts/truetype/freefont/FreeSans.ttf'
      ];
      for (const f of defaultFonts) {
        if (fs.existsSync(f)) {
          font = await opentype.load(f);
          console.log('Using system font:', f);
          break;
        }
      }
    }
    
    if (!font) {
      return { success: false, error: 'No font available' };
    }
    
    const fontSize = isReel ? 36 : 34;
    const lineHeight = fontSize * 1.4;
    const padding = 20;
    const margin = isReel ? 15 : 25;
    const maxTextWidth = videoWidth - (margin * 2) - (padding * 2);
    
    // Word wrap function using opentype for measurement
    const wrapText = (text, maxWidth) => {
      const words = text.split(' ');
      const lines = [];
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const width = font.getAdvanceWidth(testLine, fontSize);
        
        if (width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }
      return lines.slice(0, 3); // Max 3 lines
    };
    
    const lines = wrapText(text, maxTextWidth);
    const numLines = lines.length;
    let bannerHeight = Math.ceil((numLines * lineHeight) + (padding * 2));
    bannerHeight = bannerHeight % 2 === 0 ? bannerHeight : bannerHeight + 1;  // Ensure even height
    
    // Create image with pureimage
    const img = PImage.make(videoWidth, bannerHeight);
    const ctx = img.getContext('2d');
    
    // Draw semi-transparent black background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, videoWidth, bannerHeight);
    
    // Draw text using opentype paths
    ctx.fillStyle = 'white';
    lines.forEach((line, index) => {
      const y = padding + (index * lineHeight) + fontSize; // baseline position
      const x = margin + padding;
      const glyphPath = font.getPath(line, x, y, fontSize);
      
      // Convert opentype path to pureimage path
      ctx.beginPath();
      glyphPath.commands.forEach(cmd => {
        switch (cmd.type) {
          case 'M': ctx.moveTo(cmd.x, cmd.y); break;
          case 'L': ctx.lineTo(cmd.x, cmd.y); break;
          case 'Q': ctx.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y); break;
          case 'C': ctx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y); break;
          case 'Z': ctx.closePath(); break;
        }
      });
      ctx.fill();
    });
    
    // Save as PNG - wrap in promise to ensure stream completes
    await new Promise((resolve, reject) => {
      const stream = fs.createWriteStream(outputPath);
      stream.on('finish', resolve);
      stream.on('error', reject);
      PImage.encodePNGToStream(img, stream).catch(reject);
    });
    
    // Small delay to ensure file is written
    await new Promise(r => setTimeout(r, 100));
    
    console.log(`Text overlay image created: ${outputPath}, height: ${bannerHeight}px`);
    return { success: true, height: bannerHeight };
  } catch (err) {
    console.error('Failed to create text overlay image:', err.message);
    return { success: false, error: err.message };
  }
};

// Helper to decode base64 and save as temp file
const saveBase64Image = (base64String, filename) => {
  // Ensure directory exists before writing
  ensureUploadDir();
  
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
 * Get audio file duration in seconds using ffprobe
 * @param {string} filePath - Path to the audio file
 * @returns {Promise<number>} - Duration in seconds
 */
const getAudioDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      const duration = metadata?.format?.duration;
      if (duration && !isNaN(duration)) {
        resolve(parseFloat(duration));
      } else {
        reject(new Error('Could not determine audio duration'));
      }
    });
  });
};

/**
 * Enhanced video creation with:
 * - Hook text overlay (top of video with black background)
 * - Subtitles with timestamps
 * - Ken Burns effect (zoom/pan animations with fade transitions)
 * - Background music with volume control
 * - Video type: youtube (16:9) or reel (9:16)
 * - Auto image timing based on audio duration
 * 
 * Request body params:
 * - image1, image2, image3, image4: base64 images (required)
 * - hookText: string - text displayed at top (optional)
 * - subtitles: array of {start, end, text} or SRT string (optional)
 * - kenBurns: boolean - apply Ken Burns zoom/pan effect with fades (optional, default false)
 *   When enabled, applies different effects to each image:
 *   - Zoom in from center, Zoom out from center
 *   - Pan left-to-right, Pan right-to-left
 *   - Zoom from corners
 *   - 0.5s fade transitions between images
 * - bgMusicVolume: number 0-100 - background music volume (optional, default 20)
 * - videoType: 'youtube' | 'reel' - aspect ratio (optional, default 'youtube')
 *   Note: Ken Burns is only applied for youtube format, not reels
 *   Note: Reels are capped at 58 seconds total
 * - imageDuration: number - seconds per image (optional, auto-calculated from audio if not provided)
 * 
 * Files:
 * - audio: main audio/voiceover (required)
 * - bgMusic: background music file (optional)
 */
const submitFfmpegEnhanced = async (req, res) => {
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
  const fps = 24;
  const numImages = 4;

  // Auto-calculate image duration from audio length
  let duration;
  try {
    const audioDuration = await getAudioDuration(audioFile);
    console.log(`Audio duration detected: ${audioDuration}s`);

    // For reels/shorts: cap total video at 58 seconds
    const totalDuration = isReel ? Math.min(audioDuration, 58) : audioDuration;
    duration = totalDuration / numImages;

    console.log(`Calculated per-image duration: ${duration}s (total: ${totalDuration}s, type: ${videoType})`);
  } catch (probeErr) {
    console.warn('Could not detect audio duration, using imageDuration param:', probeErr.message);
    duration = parseFloat(imageDuration) || 10;
  }

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
    
    // Verify file was created
    if (!fs.existsSync(concatFile)) {
      throw new Error('Concat file not found after write');
    }
    console.log('Concat file created and verified:', concatFile);
    console.log('Concat content:', concatContent);
  } catch (err) {
    console.error('Concat file creation failed:', err);
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
  let hookImagePath = null;
  let hookImageHeight = 0;
  
  // Scale and pad - ensure even dimensions
  const scaledWidth = Math.floor(width / 2) * 2;
  const scaledHeight = Math.floor(height / 2) * 2;
  
  videoFilters.push(`scale=${scaledWidth}:${scaledHeight}:force_original_aspect_ratio=decrease`);
  videoFilters.push(`pad=${scaledWidth}:${scaledHeight}:(ow-iw)/2:(oh-ih)/2:black`);
  videoFilters.push(`setsar=1`);
  videoFilters.push(`fps=${fps}`);
  
  // Ken Burns effect - only for youtube, disabled for reel
  // Applies zoom/pan animation to make static images feel dynamic
  const useKenBurns = (kenBurns === true || kenBurns === 'true') && !isReel;
  
  // Note: Ken Burns requires complex filter_complex with zoompan
  // We'll handle it differently - not using concat demuxer but individual inputs
  // For now, we add a subtle zoom effect that works with concat

  // Hook text overlay - using FFmpeg drawtext (pureimage disabled for now due to compatibility issues)
  const topMargin = isReel ? 60 : 60;
  
  // Temporarily disabled pureimage - uncomment to re-enable once debugged
  /*
  if (hookText && pureImageAvailable) {
    // Use PureImage for proper text rendering (Hindi, Emoji support)
    hookImagePath = path.join(uploadDir, `hook_${timestamp}.png`);
    filesToCleanup.push(hookImagePath);
    
    try {
      const result = await createTextOverlayImage(hookText, scaledWidth, isReel, hookImagePath);
      if (result.success) {
        hookImageHeight = result.height;
        console.log('Using PureImage for hook text rendering');
      } else {
        console.log('PureImage rendering failed, falling back to FFmpeg drawtext:', result.error);
        hookImagePath = null;
      }
    } catch (imgErr) {
      console.log('PureImage error, falling back to FFmpeg drawtext:', imgErr.message);
      hookImagePath = null;
    }
  }
  */
  
  if (hookText && !hookImagePath) {
    // Fallback: Use FFmpeg drawtext (limited Hindi/Emoji support)
    const fontSize = isReel ? 40 : 38;
    const margin = isReel ? 20 : 30;
    const lineHeight = fontSize + 10;
    const maxCharsPerLine = isReel ? 40 : 70;
    
    const wrapText = (text, maxWidth) => {
      const words = text.split(' ');
      const lines = [];
      let currentLine = '';
      
      for (const word of words) {
        if (word.length > maxWidth) {
          if (currentLine) {
            lines.push(currentLine.trim());
            currentLine = '';
          }
          for (let i = 0; i < word.length; i += maxWidth) {
            lines.push(word.slice(i, i + maxWidth));
          }
        } else if ((currentLine + ' ' + word).trim().length <= maxWidth) {
          currentLine = (currentLine + ' ' + word).trim();
        } else {
          if (currentLine) lines.push(currentLine.trim());
          currentLine = word;
        }
      }
      if (currentLine) lines.push(currentLine.trim());
      return lines.slice(0, 3);
    };
    
    const wrappedLines = wrapText(hookText, maxCharsPerLine);
    const wrappedText = wrappedLines.join('\n');
    const numLines = wrappedLines.length;
    const bannerPadding = 15;
    const bannerHeight = (numLines * lineHeight) + (bannerPadding * 2);
    
    let hookTextCreated = false;
    try {
      ensureUploadDir();
      fs.writeFileSync(hookTextFile, wrappedText, 'utf8');
      hookTextCreated = fs.existsSync(hookTextFile);
      console.log('Hook text file created:', hookTextFile, 'exists:', hookTextCreated);
    } catch (err) {
      console.error('Failed to create hook text file:', err.message);
    }
    
    // Only add drawtext filter if text file was created
    if (hookTextCreated) {
      const escapedHookPath = formatPath(hookTextFile).replace(/:/g, '\\:');
      videoFilters.push(`drawbox=x=0:y=${topMargin}:w=iw:h=${bannerHeight}:color=black@0.85:t=fill`);
      
      let drawTextFilter = `drawtext=textfile='${escapedHookPath}'`;
      drawTextFilter += `:fontsize=${fontSize}:fontcolor=white:x=${margin}:y=${topMargin + bannerPadding}:line_spacing=10`;
      
      // Only set fontfile for Hindi/Devanagari text; English uses FFmpeg's default font
      if (hasDevanagari(hookText) && fontPath && fs.existsSync(fontPath)) {
        const escapedFontPath = formatPath(fontPath).replace(/:/g, '\\:');
        drawTextFilter += `:fontfile='${escapedFontPath}'`;
      }
      
      videoFilters.push(drawTextFilter);
    }
  }

  // Verify all input files exist before starting FFmpeg
  const filesToVerify = [concatFile, audioFile, ...images];
  if (bgMusicFile) filesToVerify.push(bgMusicFile);
  
  for (const file of filesToVerify) {
    if (!fs.existsSync(file)) {
      console.error('Missing file:', file);
      performCleanup();
      return res.status(500).json({
        success: false,
        error: `Missing required file: ${path.basename(file)}`
      });
    }
  }
  console.log('All input files verified');

  // Ken Burns effect patterns (zoom/pan combinations)
  const kenBurnsEffects = [
    // Zoom in from center
    { z: 'min(zoom+0.0015,1.5)', x: 'iw/2-(iw/zoom/2)', y: 'ih/2-(ih/zoom/2)' },
    // Zoom out from center
    { z: 'if(eq(on,1),1.5,max(zoom-0.0015,1))', x: 'iw/2-(iw/zoom/2)', y: 'ih/2-(ih/zoom/2)' },
    // Pan left to right with slight zoom
    { z: 'min(zoom+0.001,1.2)', x: 'if(eq(on,1),0,min(x+2,iw/zoom-iw))', y: 'ih/4' },
    // Pan right to left with slight zoom  
    { z: 'min(zoom+0.001,1.2)', x: 'if(eq(on,1),iw/zoom-iw,max(x-2,0))', y: 'ih/4' },
    // Zoom in from top-left
    { z: 'min(zoom+0.002,1.5)', x: '0', y: '0' },
    // Zoom in from bottom-right
    { z: 'min(zoom+0.002,1.5)', x: 'iw/zoom-iw', y: 'ih/zoom-ih' },
  ];

  // Build ffmpeg command - different approach for Ken Burns
  let ffmpegCmd;
  let filterComplex = '';
  let useFilterComplex = false;
  let videoLabel = '0:v';
  let audioLabel = '';
  let audioIndex, bgMusicIndex;
  
  if (useKenBurns) {
    // Ken Burns mode: add each image as separate input with zoompan
    ffmpegCmd = ffmpeg();
    
    // Add all images as inputs with loop
    images.forEach((img) => {
      ffmpegCmd
        .input(img)
        .inputOptions(['-loop', '1', '-t', String(duration)]);
    });
    
    // Calculate total frames per image
    const framesPerImage = Math.floor(duration * fps);
    const fadeFrames = Math.floor(fps * 0.5); // 0.5 second fade
    
    // Build zoompan filter for each image with different effects + fade in/out
    const imageFilters = images.map((_, i) => {
      const effect = kenBurnsEffects[i % kenBurnsEffects.length];
      // Add fade in at start, fade out at end for smooth transitions
      const fadeIn = i > 0 ? `,fade=t=in:st=0:d=0.5` : '';
      const fadeOut = i < images.length - 1 ? `,fade=t=out:st=${duration - 0.5}:d=0.5` : '';
      return `[${i}:v]scale=8000:-1,zoompan=z='${effect.z}':x='${effect.x}':y='${effect.y}':d=${framesPerImage}:s=${scaledWidth}x${scaledHeight}:fps=${fps}${fadeIn}${fadeOut}[v${i}]`;
    });
    
    // Build concat filter for video
    const concatInputs = images.map((_, i) => `[v${i}]`).join('');
    filterComplex = imageFilters.join(';');
    filterComplex += `;${concatInputs}concat=n=${images.length}:v=1:a=0[vconcat]`;
    
    // Add hook text overlay if exists
    const baseVideoFilters = videoFilters.slice(4).join(','); // Skip scale/pad/setsar/fps (handled by zoompan)
    if (baseVideoFilters) {
      filterComplex += `;[vconcat]${baseVideoFilters}[vout]`;
      videoLabel = '[vout]';
    } else {
      videoLabel = '[vconcat]';
    }
    
    // Add audio input
    audioIndex = images.length;
    ffmpegCmd.input(audioFile);
    
    // Add background music if provided
    if (bgMusicFile) {
      bgMusicIndex = images.length + 1;
      ffmpegCmd.input(bgMusicFile);
    }
    
    useFilterComplex = true;
  } else {
    // Standard mode: use concat demuxer
    ffmpegCmd = ffmpeg()
      .input(concatFile)
      .inputOptions(['-f', 'concat', '-safe', '0']);
    
    ffmpegCmd.input(audioFile);
    audioIndex = 1;

    // Add background music if provided
    if (bgMusicFile) {
      ffmpegCmd.input(bgMusicFile);
      bgMusicIndex = 2;
    }
  }
  
  audioLabel = `${audioIndex}:a`;
  
  // Build video filter chain (for non-Ken Burns mode)
  const videoFilterChain = videoFilters.join(',');
  
  // Handle background music mixing
  if (bgMusicFile) {
    const bgVol = Math.min(100, Math.max(0, parseFloat(bgMusicVolume) || 20)) / 100;
    const audioFilter = `[${audioIndex}:a]volume=1[a1];[${bgMusicIndex}:a]volume=${bgVol}[a2];[a1][a2]amix=inputs=2:duration=first[aout]`;
    
    if (useFilterComplex) {
      // Append audio filter to existing filter_complex
      filterComplex += `;${audioFilter}`;
    } else {
      // Start new filter_complex with video and audio
      filterComplex = `[0:v]${videoFilterChain}[vout];${audioFilter}`;
      videoLabel = '[vout]';
      useFilterComplex = true;
    }
    audioLabel = '[aout]';
  } else if (!useKenBurns && !useFilterComplex) {
    // Simple case: no Ken Burns, no bg music - just use video filters
    // Will use -vf instead of filter_complex
  }

  // Build output options
  let outputOptions = [
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '23',
    '-pix_fmt', 'yuv420p',
    '-r', String(fps)
  ];
  
  if (useFilterComplex) {
    outputOptions.unshift('-filter_complex', filterComplex);
    outputOptions.push('-map', videoLabel);
    outputOptions.push('-map', audioLabel);
  } else {
    // Simple case: just video filter, no overlay or bg music
    outputOptions.unshift('-vf', videoFilterChain);
  }
  
  outputOptions.push('-c:a', 'aac');
  outputOptions.push('-b:a', '192k');
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