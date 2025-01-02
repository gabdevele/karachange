import express from 'express';
import ytdl from '@distube/ytdl-core';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';
import helmet from 'helmet';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 8341;
const downloadDir = "/var/www/html/karachange/download";
const BASE_URL = `https://gabdevele.ddns.net/karachange/view`;

if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir);
}

app.use(cors(
  {
    origin: 'https://gabdevele.ddns.net',
    methods: 'GET',
  }
));
app.use(helmet());

const limiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 10, 
  message: { error: 'Rate limit exceeded: 10 downloads per day allowed' },
});
app.use('/download', limiter);

app.get('/download', async (req, res) => {
  const url = req.query.url;
  if (!url || typeof url !== 'string' || !ytdl.validateURL(url)) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    const info = await ytdl.getInfo(url);
    const durationSeconds = parseInt(info.videoDetails.lengthSeconds, 10);
    if (durationSeconds > 8 * 60) {
      return res.status(400).json({ error: 'Video exceeds the maximum allowed duration of 8 minutes' });
    }

    const videoId = info.videoDetails.videoId;
    const filePath = path.join(downloadDir, `${videoId}.mp4`);

    if (fs.existsSync(filePath)) {
      return res.json({
        viewLink: `${BASE_URL}/${videoId}.mp4`,
      });
    }

    const format = ytdl.chooseFormat(info.formats, {
      quality: 'highestvideo',
      filter: 'videoandaudio',
    });
    
    const videoStream = ytdl(url, { format });
    const fileStream = fs.createWriteStream(filePath);

    videoStream.pipe(fileStream);

    videoStream.on('error', (error) => {
      console.error('Video stream error:', error);
      res.status(500).json({ error: 'Failed to download the video' });
    });

    fileStream.on('finish', () => {
      res.json({
        viewLink: `${BASE_URL}/${videoId}.mp4`,
      });
    });

    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      res.status(500).json({ error: 'Failed to download the video' });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process the request' });
  }
});

cron.schedule('* * * * *', () => {
  const now = Date.now();
  const expirationTime = 20 * 60 * 1000;

  fs.readdir(downloadDir, (err, files) => {
    if (err) {
      return console.error('Failed to read download directory:', err);
    }

    files.forEach((file) => {
      const filePath = path.join(downloadDir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) {
          return console.error('Failed to stat file:', err);
        }

        if (now - stats.mtimeMs > expirationTime) {
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error('Failed to delete file:', err);
            } else {
              console.log(`Deleted old video: ${file}`);
            }
          });
        }
      });
    });
  });
});

app.listen(port, () => {
  console.log(`Server is running on ${BASE_URL}`);
});