import express from 'express';
import ytdl from '@distube/ytdl-core';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 4000;
const downloadDir = path.join(__dirname, 'downloads');

app.use(cors());
app.use('/downloads', express.static(downloadDir));

if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir);
}

app.get('/download', async (req, res) => {
  const url = req.query.url;
  try {
    if (ytdl.validateURL(url)) {
      const info = await ytdl.getInfo(url);
      const videoId = info.videoDetails.videoId;
      const filePath = path.join(downloadDir, `${videoId}.mp4`);

      // Check if the file already exists
      if (fs.existsSync(filePath)) {
        return res.json({ 
          viewLink: `http://localhost:${port}/view/${videoId}`
        });
      }

      const format = ytdl.chooseFormat(info.formats, { quality: 'highestvideo', filter: 'videoandaudio' });
      const videoStream = ytdl(url, { format });
      const fileStream = fs.createWriteStream(filePath);

      videoStream.pipe(fileStream);

      fileStream.on('finish', () => {
        res.json({ 
          viewLink: `http://localhost:${port}/view/${videoId}`
        });
      });

      fileStream.on('error', (error) => {
        console.error(error);
        res.status(500).json({ error: 'Failed to download the video' });
      });
    } else {
      res.status(400).json({ error: 'Invalid URL' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process the request' });
  }
});

app.get('/view/:videoId', (req, res) => {
  const videoId = req.params.videoId;
  const filePath = path.join(downloadDir, `${videoId}.mp4`);
  if (fs.existsSync(filePath)) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Range');
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'Video not found' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});