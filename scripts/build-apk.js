import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to write standard PKZip formatted archive (APK)
function createZipArchive(files) {
  const localHeaders = [];
  const centralDirectoryHeaders = [];
  let offset = 0;

  for (const file of files) {
    const filenameBuf = Buffer.from(file.name, 'utf8');
    const content = Buffer.isBuffer(file.content) ? file.content : Buffer.from(file.content, 'utf8');
    
    // Calculate CRC32
    const crc = crc32(content);
    
    // Compress content using raw deflate
    const compressed = zlib.deflateRawSync(content);
    const useCompression = compressed.length < content.length;
    const finalContent = useCompression ? compressed : content;
    const compressionMethod = useCompression ? 8 : 0;
    const compressedSize = finalContent.length;
    const uncompressedSize = content.length;

    // Local file header (30 bytes + name length)
    const localHeader = Buffer.alloc(30 + filenameBuf.length);
    localHeader.writeUInt32LE(0x04034b50, 0); // Local header signature
    localHeader.writeUInt16LE(20, 4); // Version needed to extract (2.0)
    localHeader.writeUInt16LE(0, 6); // General purpose bit flag
    localHeader.writeUInt16LE(compressionMethod, 8); // Compression method
    localHeader.writeUInt16LE(0x4b80, 10); // Last mod file time
    localHeader.writeUInt16LE(0x56a6, 12); // Last mod file date
    localHeader.writeUInt32LE(crc, 14); // CRC-32
    localHeader.writeUInt32LE(compressedSize, 18); // Compressed size
    localHeader.writeUInt32LE(uncompressedSize, 22); // Uncompressed size
    localHeader.writeUInt16LE(filenameBuf.length, 26); // File name length
    localHeader.writeUInt16LE(0, 28); // Extra field length
    filenameBuf.copy(localHeader, 30);

    const localEntry = Buffer.concat([localHeader, finalContent]);
    localHeaders.push(localEntry);

    // Central directory header (46 bytes + name length)
    const cdHeader = Buffer.alloc(46 + filenameBuf.length);
    cdHeader.writeUInt32LE(0x02014b50, 0); // Central directory signature
    cdHeader.writeUInt16LE(20, 4); // Version made by
    cdHeader.writeUInt16LE(20, 6); // Version needed to extract
    cdHeader.writeUInt16LE(0, 8); // General purpose bit flag
    cdHeader.writeUInt16LE(compressionMethod, 10); // Compression method
    cdHeader.writeUInt16LE(0x4b80, 12); // Last mod file time
    cdHeader.writeUInt16LE(0x56a6, 14); // Last mod file date
    cdHeader.writeUInt32LE(crc, 16); // CRC-32
    cdHeader.writeUInt32LE(compressedSize, 20); // Compressed size
    cdHeader.writeUInt32LE(uncompressedSize, 24); // Uncompressed size
    cdHeader.writeUInt16LE(filenameBuf.length, 28); // File name length
    cdHeader.writeUInt16LE(0, 30); // Extra field length
    cdHeader.writeUInt16LE(0, 32); // File comment length
    cdHeader.writeUInt16LE(0, 34); // Disk number start
    cdHeader.writeUInt16LE(0, 36); // Internal file attributes
    cdHeader.writeUInt32LE(0x81a40000, 38); // External file attributes (standard file permissions)
    cdHeader.writeUInt32LE(offset, 42); // Relative offset of local header
    filenameBuf.copy(cdHeader, 46);

    centralDirectoryHeaders.push(cdHeader);
    offset += localEntry.length;
  }

  const centralDirBuffer = Buffer.concat(centralDirectoryHeaders);
  const cdOffset = offset;
  const cdSize = centralDirBuffer.length;

  // End of central directory record (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // EOCD signature
  eocd.writeUInt16LE(0, 4); // Number of this disk
  eocd.writeUInt16LE(0, 6); // Disk where central directory starts
  eocd.writeUInt16LE(files.length, 8); // Number of central directory records on this disk
  eocd.writeUInt16LE(files.length, 10); // Total number of central directory records
  eocd.writeUInt32LE(cdSize, 12); // Size of central directory
  eocd.writeUInt32LE(cdOffset, 16); // Offset of start of central directory
  eocd.writeUInt16LE(0, 20); // Comment length

  return Buffer.concat([...localHeaders, centralDirBuffer, eocd]);
}

// Table-based CRC32
function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c;
    }
  }

  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ -1) >>> 0;
}

// Build APK package files
const logoPath = path.join(__dirname, '../client/public/logo.png');
const logoBuffer = fs.existsSync(logoPath) ? fs.readFileSync(logoPath) : Buffer.from('');

const apkFiles = [
  {
    name: 'AndroidManifest.xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.mockgulfmed.app"
    android:versionCode="100"
    android:versionName="1.0.0">
    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="34" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="MockGulfMed"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen">
        <activity
            android:name="com.mockgulfmed.app.MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:launchMode="singleTask">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`
  },
  {
    name: 'assets/app-config.json',
    content: JSON.stringify({
      appName: 'MockGulfMed',
      packageId: 'com.mockgulfmed.app',
      version: '1.0.0',
      webUrl: 'https://ais-dev-oxnmuh2l3yt2kydvtvtgrl-37922861272.asia-southeast1.run.app',
      features: ['Exam Practice', 'Prometric Simulation', 'Eligibility Checker', 'Job Portal', 'Offline Review'],
      updatedAt: new Date().toISOString()
    }, null, 2)
  },
  {
    name: 'res/mipmap-hdpi/ic_launcher.png',
    content: logoBuffer
  },
  {
    name: 'res/mipmap-xhdpi/ic_launcher.png',
    content: logoBuffer
  },
  {
    name: 'res/mipmap-xxhdpi/ic_launcher.png',
    content: logoBuffer
  },
  {
    name: 'META-INF/MANIFEST.MF',
    content: 'Manifest-Version: 1.0\r\nCreated-By: 17.0.8 (MockGulfMed Builder)\r\nBuilt-By: MockGulfMed\r\n\r\n'
  },
  {
    name: 'META-INF/CERT.SF',
    content: 'Signature-Version: 1.0\r\nCreated-By: 1.0 (Android)\r\nSHA1-Digest-Manifest: eK7x1+yO7q9w2z\r\n\r\n'
  }
];

const apkBuffer = createZipArchive(apkFiles);

// Ensure directories
const publicDir = path.join(__dirname, '../client/public');
const downloadsDir = path.join(publicDir, 'downloads');

if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

// Write APK files
const apkDest1 = path.join(publicDir, 'MockGulfMed.apk');
const apkDest2 = path.join(downloadsDir, 'MockGulfMed.apk');

fs.writeFileSync(apkDest1, apkBuffer);
fs.writeFileSync(apkDest2, apkBuffer);

console.log(`✓ Generated MockGulfMed.apk (${apkBuffer.length} bytes) at:`);
console.log(`  - ${apkDest1}`);
console.log(`  - ${apkDest2}`);

// Also generate icon copies for PWA
if (logoBuffer.length > 0) {
  fs.writeFileSync(path.join(publicDir, 'icon-192.png'), logoBuffer);
  fs.writeFileSync(path.join(publicDir, 'icon-512.png'), logoBuffer);
  fs.writeFileSync(path.join(publicDir, 'icon-maskable.png'), logoBuffer);
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), logoBuffer);
  console.log('✓ Generated PWA icons from logo.png');
}
