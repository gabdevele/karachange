import express from 'express';
import ytdl from '@distube/ytdl-core';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';
import helmet from 'helmet';
import dotenv from 'dotenv';
import morgan from 'morgan';
import logger from './logger.js';
import yts from 'yt-search';
dotenv.config();

const app = express();

const DOWNLOAD_DIR = process.env.DOWNLOAD_DIR;
const BASE_URL = process.env.BASE_URL;
const CORS_ORIGIN = process.env.CORS_ORIGIN;
const PORT = process.env.PORT || 3000;

if (!DOWNLOAD_DIR || !BASE_URL || !CORS_ORIGIN) {
  logger.error('Missing required environment variables');
  throw new Error('Missing required environment variables. Follow the instructions in the README');
}

if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  logger.info(`Created download directory: ${DOWNLOAD_DIR}`);
}

app.set('trust proxy', true);

app.use(cors({
  origin: CORS_ORIGIN,
  methods: 'GET',
}));
app.use(helmet());
app.use(morgan('combined'));

const limiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 5,
  message: { error: 'Rate limit exceeded: 5 downloads per day allowed' },
});

app.use('/download', limiter);

const validateUrl = (req, res, next) => {
  const url = req.query.url;
  if (!url || typeof url !== 'string' || !ytdl.validateURL(url)) {
    logger.warn('Invalid URL request', { url });
    return res.status(400).json({ error: 'Invalid URL' });
  }
  next();
};

//TODO: absolutely have to divide this function into smaller functions
const downloadVideo = async (req, res) => {
  const url = req.query.url;

  try {
    const info = await ytdl.getInfo(url);
    if (info.videoDetails.isLiveContent) {
      logger.warn('Attempt to download a live stream', { url });
      return res.status(400).json({ error: 'Live streams are not supported' });
    }

    const durationSeconds = parseInt(info.videoDetails.lengthSeconds, 10);
    if (durationSeconds > 8 * 60) {
      logger.warn('Video exceeds max duration', { url, duration: durationSeconds });
      return res.status(400).json({ error: 'Video exceeds the maximum allowed duration of 8 minutes' });
    }

    const videoId = info.videoDetails.videoId;
    const filePath = path.join(DOWNLOAD_DIR, `${videoId}.mp4`);

    if (fs.existsSync(filePath)) {
      logger.info('Video already downloaded', { videoId });
      return res.json({ viewLink: `${BASE_URL}/${videoId}.mp4` });
    }

    const format = ytdl.chooseFormat(info.formats, {
      quality: 'highestvideo',
      filter: 'videoandaudio',
    });

    const videoStream = ytdl(url, { format });
    const fileStream = fs.createWriteStream(filePath);

    videoStream.pipe(fileStream);

    videoStream.on('error', (error) => {
      logger.error('Video stream error', { error });
      res.status(500).json({ error: 'Failed to download the video' });
    });

    fileStream.on('finish', () => {
      logger.info('Video downloaded successfully', { videoId });
      res.json({ viewLink: `${BASE_URL}/${videoId}.mp4` });
    });

    fileStream.on('error', (error) => {
      logger.error('File stream error', { error });
      res.status(500).json({ error: 'Failed to download the video' });
    });
  } catch (error) {
    logger.error('Error processing request', { error });
    res.status(500).json({ error: 'Failed to process the request' });
  }
};

app.get('/download', validateUrl, downloadVideo);

app.get('/search', async (req, res) => {
  const query = req.query.query;
  if (!query || typeof query !== 'string') {
    logger.warn('Invalid search query', { query });
    return res.status(400).json({ error: 'Invalid search query' });
  }

  try {
    const searchResults = await yts(query);
    const videos = searchResults.videos.slice(0, 5).map((video) => ({
      title: video.title,
      url: video.url,
      thumbnail: video.thumbnail,
    }));
    res.json({ videos });
  } catch (error) {
    logger.error('Error processing search request', { error });
    res.status(500).json({ error: 'Failed to process the request' });
  }
});

//TODO: make dev choose the time
cron.schedule('* * * * *', () => {
  const now = Date.now();
  const expirationTime = 20 * 60 * 1000;

  fs.readdir(DOWNLOAD_DIR, (err, files) => {
    if (err) {
      logger.error('Failed to read download directory', { error: err });
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(DOWNLOAD_DIR, file);
      fs.stat(filePath, (err, stats) => {
        if (err) {
          logger.error('Failed to stat file', { file, error: err });
          return;
        }

        if (now - stats.mtimeMs > expirationTime) {
          fs.unlink(filePath, (err) => {
            if (err) {
              logger.error('Failed to delete file', { file, error: err });
            } else {
              logger.info('Deleted old video', { file });
            }
          });
        }
      });
    });
  });
});

app.listen(PORT, () => {
  logger.info(`Server is running on ${BASE_URL}`);
});
