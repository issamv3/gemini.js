import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import axios from 'axios';

export class Image {
  constructor({ url, title = '[Image]', alt = '', proxy = null }) {
    this.url = url;
    this.title = title;
    this.alt = alt;
    this.proxy = proxy;
  }

  async save(dir = 'temp', name = null, cookies = null, safe = true) {
    name = name || this.url.split('/').pop().split('?')[0];
    const m = name.match(/^(.*\.\w+)/);
    if (m) name = m[1];
    else if (safe) return null;

    await fs.mkdir(dir, { recursive: true });
    const fp = path.join(dir, name);

    const cookieString = cookies && typeof cookies === 'object'
      ? Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ')
      : '';

    const headers = {
      'Cookie': cookieString,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'image/*,*/*;q=0.8'
    };

    const tryDirectDownload = async () => {
      const urlParts = this.url.split('/');
      const fileId = urlParts[urlParts.length - 1].split('?')[0];
      const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      
      try {
        const response = await axios.get(directUrl, {
          responseType: 'arraybuffer',
          maxRedirects: 3,
          timeout: 30000,
          headers
        });
        
        if (response.status === 200 && response.headers['content-type']?.startsWith('image/')) {
          return response.data;
        }
      } catch {}
      return null;
    };

    const tryManualRedirect = async () => {
      let currentUrl = this.url;
      let redirectCount = 0;
      const maxRedirects = 5;
      
      while (redirectCount < maxRedirects) {
        try {
          const response = await axios.get(currentUrl, {
            maxRedirects: 0,
            validateStatus: (status) => status >= 200 && status < 400,
            headers
          });
          
          if (response.status === 200) {
            const imageResponse = await axios.get(currentUrl, {
              responseType: 'arraybuffer',
              headers
            });
            return imageResponse.data;
          }
          
          if (response.status === 302 || response.status === 301) {
            currentUrl = response.headers.location;
            redirectCount++;
          } else {
            break;
          }
        } catch {
          break;
        }
      }
      return null;
    };

    const tryAlternativeUrl = async () => {
      const alternativeUrls = [
        this.url.replace('/gg-dl/', '/d/'),
        this.url + '&export=download',
        this.url.replace('googleusercontent.com', 'drive.google.com'),
        this.url + '&confirm=t'
      ];
      
      for (const altUrl of alternativeUrls) {
        try {
          const response = await axios.get(altUrl, {
            responseType: 'arraybuffer',
            maxRedirects: 2,
            timeout: 20000,
            headers
          });
          
          if (response.status === 200) {
            return response.data;
          }
        } catch {
          continue;
        }
      }
      return null;
    };

    const tryWget = () => {
      return new Promise((resolve) => {
        const command = `wget --header="Cookie: ${cookieString}" --user-agent="Mozilla/5.0" -O "${fp}" "${this.url}"`;
        exec(command, (error) => {
          resolve(!error);
        });
      });
    };

    let data = await tryDirectDownload();
    if (!data) data = await tryManualRedirect();
    if (!data) data = await tryAlternativeUrl();

    if (data) {
      await fs.writeFile(fp, Buffer.from(data));
      return path.resolve(fp);
    } else {
      const success = await tryWget();
      if (success) {
        return path.resolve(fp);
      }
      throw new Error(`Download failed: All methods failed for ${this.url}`);
    }
  }
}

export class WebImage extends Image {}

export class GenImage extends Image {
  constructor({ url, title = '[Generated]', alt = '', proxy = null, cookies }) {
    super({ url, title, alt, proxy });
    this.cookies = cookies;
  }

  async save(dir = 'temp', name = null, cookies = null, safe = true, full = true) {
    const url = full ? this.url + '=s2048' : this.url;
    name = name || `${Date.now()}_${this.url.slice(-10)}.png`;
    const origUrl = this.url;
    this.url = url;
    try {
      return await super.save(dir, name, cookies || this.cookies, safe);
    } finally {
      this.url = origUrl;
    }
  }
}
