export interface ExtractedTags {
  title: string;
  artist: string;
  album: string;
  genre: string;
  year: string;
  trackNumber: string;
  duration: number;
  coverArtDataUrl?: string;
}

/**
 * High-performance pure-JS local audio metadata and embedded cover art extractor.
 * Reads binary ID3v1 and ID3v2 tags directly from ArrayBuffers.
 */
export async function extractMetadata(file: File): Promise<ExtractedTags> {
  // 1. Fallbacks from raw filename
  const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
  let defaultTitle = fileNameWithoutExt;
  let defaultArtist = "Unknown Artist";

  if (fileNameWithoutExt.includes(" - ")) {
    const parts = fileNameWithoutExt.split(" - ");
    if (parts.length >= 2) {
      defaultArtist = parts[0].trim();
      defaultTitle = parts.slice(1).join(" - ").trim();
    }
  } else if (fileNameWithoutExt.includes("-")) {
    const parts = fileNameWithoutExt.split("-");
    if (parts.length >= 2) {
      defaultArtist = parts[0].trim();
      defaultTitle = parts.slice(1).join("-").trim();
    }
  }

  // 2. Obtain exact audio duration
  const duration = await getAudioDuration(file);

  let title = "";
  let artist = "";
  let album = "";
  let genre = "";
  let year = "";
  let trackNumber = "";
  let coverArtDataUrl: string | undefined = undefined;

  try {
    // Read the first 256KB to capture embedded covers without exhausting RAM
    const sliceSize = Math.min(file.size, 256 * 1024);
    const buffer = await file.slice(0, sliceSize).arrayBuffer();
    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);

    // Check ID3v2 header
    if (bytes.length >= 10 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
      // ID3v2 detected
      const majorVersion = bytes[3];
      
      // Parse tag size (7 bits per byte)
      const tagSize = (bytes[6] << 21) | (bytes[7] << 14) | (bytes[8] << 7) | bytes[9];
      const maxOffset = Math.min(bytes.length, 10 + tagSize);
      let offset = 10;

      while (offset < maxOffset) {
        // Parse Frame Header
        if (offset + 10 > maxOffset) break;

        // Read Frame ID (4 chars)
        const frameId = String.fromCharCode(bytes[offset], bytes[offset+1], bytes[offset+2], bytes[offset+3]);
        
        // Break if null padding reached
        if (bytes[offset] === 0) break;

        // Read Frame Size
        let frameSize = 0;
        if (majorVersion === 4) {
          // synchsafe integer in v2.4
          frameSize = (bytes[offset+4] << 21) | (bytes[offset+5] << 14) | (bytes[offset+6] << 7) | bytes[offset+7];
        } else {
          frameSize = view.getUint32(offset + 4);
        }

        offset += 10; // Move past frame header

        if (frameSize > 0 && offset + frameSize <= maxOffset) {
          const frameBytes = bytes.subarray(offset, offset + frameSize);

          // Parse Text Information Frames
          if (frameId.startsWith('T') && frameId !== 'TXXX') {
            const encoding = frameBytes[0];
            const textBytes = frameBytes.subarray(1);
            const text = decodeID3Text(textBytes, encoding);

            if (frameId === 'TIT2') title = text;
            else if (frameId === 'TPE1') artist = text;
            else if (frameId === 'TALB') album = text;
            else if (frameId === 'TCON') genre = text;
            else if (frameId === 'TYER' || frameId === 'TDRC') year = text;
            else if (frameId === 'TRCK') trackNumber = text;
          }
          
          // Parse Attached Picture Frame (APIC)
          else if (frameId === 'APIC') {
            if (!coverArtDataUrl) {
              coverArtDataUrl = parseApicFrame(frameBytes);
            }
          }
        }

        offset += frameSize;
      }
    }

    // If ID3v2 title not found, test ID3v1 at the end of the file
    if (!title && file.size >= 128) {
      const v1Buffer = await file.slice(file.size - 128).arrayBuffer();
      const v1Bytes = new Uint8Array(v1Buffer);
      
      if (v1Bytes[0] === 0x54 && v1Bytes[1] === 0x41 && v1Bytes[2] === 0x47) { // "TAG"
        title = decodeAscii(v1Bytes.subarray(3, 33)).trim();
        artist = decodeAscii(v1Bytes.subarray(33, 63)).trim();
        album = decodeAscii(v1Bytes.subarray(63, 93)).trim();
        year = decodeAscii(v1Bytes.subarray(93, 97)).trim();
      }
    }
  } catch (e) {
    console.warn("Pure-JS binary ID3 parsing deferred to basic layout:", e);
  }

  return {
    title: title || defaultTitle,
    artist: artist || defaultArtist,
    album: album || "Unknown Album",
    genre: genre || "Unknown Genre",
    year: year || "",
    trackNumber: trackNumber || "",
    duration: duration > 0 ? duration : 180,
    coverArtDataUrl
  };
}

/**
 * Decodes text strings based on ID3 encoding markers
 */
function decodeID3Text(bytes: Uint8Array, encoding: number): string {
  if (bytes.length === 0) return "";
  
  try {
    if (encoding === 0 || encoding === 3) {
      // ISO-8859-1 or UTF-8
      const decoder = new TextDecoder(encoding === 3 ? 'utf-8' : 'iso-8859-1');
      // Remove trailing nulls
      let len = bytes.length;
      while (len > 0 && bytes[len - 1] === 0) len--;
      return decoder.decode(bytes.subarray(0, len)).trim();
    } else if (encoding === 1 || encoding === 2) {
      // UTF-16 with BOM or UTF-16BE
      let s = "";
      const isLE = encoding === 1 && bytes[0] === 0xFF && bytes[1] === 0xFE;
      const start = (bytes[0] === 0xFF && bytes[1] === 0xFE) || (bytes[0] === 0xFE && bytes[1] === 0xFF) ? 2 : 0;
      
      for (let i = start; i < bytes.length - 1; i += 2) {
        const code = isLE ? (bytes[i+1] << 8) | bytes[i] : (bytes[i] << 8) | bytes[i+1];
        if (code === 0) break;
        s += String.fromCharCode(code);
      }
      return s.trim();
    }
  } catch (e) {
    // Fallback
  }
  return decodeAscii(bytes).trim();
}

function decodeAscii(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] === 0) break;
    s += String.fromCharCode(bytes[i]);
  }
  return s;
}

/**
 * Extracts binary picture data and formats it into a valid Data URL
 */
function parseApicFrame(bytes: Uint8Array): string | undefined {
  if (bytes.length < 4) return undefined;
  
  let offset = 1; // skip text encoding

  // Read MIME type (null terminated)
  let mimeType = "";
  while (offset < bytes.length && bytes[offset] !== 0) {
    mimeType += String.fromCharCode(bytes[offset]);
    offset++;
  }
  offset++; // skip null

  // If MIME type was empty or shorthand
  if (!mimeType || mimeType === 'JPG') mimeType = 'image/jpeg';
  else if (mimeType === 'PNG') mimeType = 'image/png';

  offset++; // skip picture type

  // Skip description (null terminated, accounts for UTF-16 double nulls)
  while (offset < bytes.length) {
    if (bytes[offset] === 0) {
      offset++;
      if (offset < bytes.length && bytes[offset] === 0) offset++;
      break;
    }
    offset++;
  }

  if (offset < bytes.length) {
    const imgBytes = bytes.subarray(offset);
    
    // Convert directly to base64
    let binary = "";
    // Process in clean chunks to avoid call stack limits
    const chunkSize = 8192;
    for (let i = 0; i < imgBytes.length; i += chunkSize) {
      const chunk = imgBytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
    }
    
    const base64 = btoa(binary);
    return `data:${mimeType};base64,${base64}`;
  }

  return undefined;
}

/**
 * Uses a background object URL to get the precise playback duration.
 */
function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const audio = document.createElement('audio');
    const objectUrl = URL.createObjectURL(file);
    audio.src = objectUrl;
    
    audio.addEventListener('loadedmetadata', () => {
      const duration = audio.duration;
      URL.revokeObjectURL(objectUrl);
      resolve(isFinite(duration) ? Math.floor(duration) : 0);
    });

    audio.addEventListener('error', () => {
      URL.revokeObjectURL(objectUrl);
      resolve(0);
    });

    setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
      resolve(0);
    }, 2000);
  });
}

/**
 * Extracts a gorgeous primary and accent color from an image Data URL
 */
export function extractColorsFromImage(dataUrl: string): Promise<{ primary: string; accent: string; darkPrimary: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ primary: '#18181b', accent: '#8B5CF6', darkPrimary: '#09090b' });
        return;
      }
      
      canvas.width = 64;
      canvas.height = 64;
      ctx.drawImage(img, 0, 0, 64, 64);
      
      const data = ctx.getImageData(0, 0, 64, 64).data;
      let r = 0, g = 0, b = 0;
      let count = 0;

      for (let i = 0; i < data.length; i += 16) {
        const pr = data[i];
        const pg = data[i+1];
        const pb = data[i+2];

        if ((pr > 240 && pg > 240 && pb > 240) || (pr < 15 && pg < 15 && pb < 15)) {
          continue;
        }

        r += pr;
        g += pg;
        b += pb;
        count++;
      }

      if (count === 0) {
        resolve({ primary: '#18181b', accent: '#8B5CF6', darkPrimary: '#09090b' });
        return;
      }

      r = Math.floor(r / count);
      g = Math.floor(g / count);
      b = Math.floor(b / count);

      const max = Math.max(r, g, b);
      if (max > 0) {
        const boost = 255 / max;
        r = Math.min(255, Math.floor(r * 0.7 + (r * boost) * 0.3));
        g = Math.min(255, Math.floor(g * 0.7 + (g * boost) * 0.3));
        b = Math.min(255, Math.floor(b * 0.7 + (b * boost) * 0.3));
      }

      const primary = `rgb(${r}, ${g}, ${b})`;
      
      const accentR = Math.min(255, Math.floor(r * 1.3));
      const accentG = Math.min(255, Math.floor(g * 1.3));
      const accentB = Math.min(255, Math.floor(b * 1.3));
      const accent = `rgb(${accentR}, ${accentG}, ${accentB})`;

      const darkR = Math.floor(r * 0.18);
      const darkG = Math.floor(g * 0.18);
      const darkB = Math.floor(b * 0.18);
      const darkPrimary = `rgb(${darkR}, ${darkG}, ${darkB})`;

      resolve({ primary, accent, darkPrimary });
    };

    img.onerror = () => {
      resolve({ primary: '#18181b', accent: '#8B5CF6', darkPrimary: '#09090b' });
    };

    img.src = dataUrl;
  });
}
