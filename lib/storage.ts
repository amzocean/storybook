import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const PUBLIC_IMAGES = path.join(process.cwd(), 'public', 'story-images');

if (!fs.existsSync(PUBLIC_IMAGES)) {
  fs.mkdirSync(PUBLIC_IMAGES, { recursive: true });
}

export async function downloadAndSaveImage(url: string, storyId: string, filename: string): Promise<string> {
  const storyDir = path.join(PUBLIC_IMAGES, storyId);
  if (!fs.existsSync(storyDir)) {
    fs.mkdirSync(storyDir, { recursive: true });
  }

  const filePath = path.join(storyDir, filename);
  const relativePath = `/story-images/${storyId}/${filename}`;

  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadAndSaveImage(response.headers.location!, storyId, filename)
          .then(resolve)
          .catch(reject);
        return;
      }
      const fileStream = fs.createWriteStream(filePath);
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(relativePath);
      });
      fileStream.on('error', reject);
    }).on('error', reject);
  });
}

export function deleteStoryImages(storyId: string) {
  const storyDir = path.join(PUBLIC_IMAGES, storyId);
  if (fs.existsSync(storyDir)) {
    fs.rmSync(storyDir, { recursive: true });
  }
}
