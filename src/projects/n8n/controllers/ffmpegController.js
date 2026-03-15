const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const os = require('os');
const multer = require('multer');

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

// Multer middleware for handling the 5 files
const uploadFields = upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'image3', maxCount: 1 },
  { name: 'image4', maxCount: 1 }
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

// Controller function to create video from images + audio
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

  // Validate all required files are present
  const requiredFields = ['audio', 'image1', 'image2', 'image3', 'image4'];
  for (const field of requiredFields) {
    if (!req.files || !req.files[field] || !req.files[field][0]) {
      // Clean up any files that were uploaded before the error
      if (req.files) {
        Object.values(req.files).flat().forEach(f => {
          if (f && f.path) cleanupFiles([f.path]);
        });
      }
      return res.status(400).json({ 
        success: false, 
        error: `Missing required file: ${field}` 
      });
    }
  }

  const audioFile = req.files.audio[0].path;
  const image1 = req.files.image1[0].path;
  const image2 = req.files.image2[0].path;
  const image3 = req.files.image3[0].path;
  const image4 = req.files.image4[0].path;
  
  const timestamp = Date.now();
  const concatFile = path.join(uploadDir, `concat_${timestamp}.txt`);
  const outputFile = path.join(uploadDir, `output_${timestamp}.mp4`);
  
  filesToCleanup = [audioFile, image1, image2, image3, image4, concatFile, outputFile];

  // Create concat file with absolute paths (use forward slashes for FFmpeg)
  const formatPath = (p) => p.replace(/\\/g, '/');
  const concatContent = [
    `file '${formatPath(image1)}'`,
    `duration 7`,
    `file '${formatPath(image2)}'`,
    `duration 7`,
    `file '${formatPath(image3)}'`,
    `duration 7`,
    `file '${formatPath(image4)}'`,
    `duration 7`,
    `file '${formatPath(image4)}'`  // Last image repeated to ensure final duration
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
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-shortest',
      '-movflags', '+faststart'
    ])
    .on('start', (cmd) => {
      console.log('FFmpeg started, processing...');
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

module.exports = {
  uploadFields,
  submitFfmpeg
};