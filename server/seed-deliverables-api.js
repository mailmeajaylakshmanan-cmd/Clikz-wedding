const http = require('http');

const deliverablesList = [
  "1-Pendrive", "1-Wedding Highlights", "1-Wedding Reel", "1-Mini Album",
  "140 Pages Premium Wedding Album", "2-Calendar", "2-70 Pages Album", "2-Photo Frames",
  "3-Calendars", "4-Photo Frames", "5-Photo Frames", "60 Pages Candid Album",
  "60 Pages Album", "Calendar", "Candid Wedding Highlights", "Cinematic Wedding Highlights",
  "Full Function Video", "Full Function Video + Pendrive", "Full Wedding Video with Pendrive",
  "Live QR Scanner Gallery", "Unlimited Prints", "Unlimited Prints on Selfie Mirror Booth", "Wedding Reel"
];

async function seed() {
  try {
    // 1. Login to get cookie
    const loginData = JSON.stringify({ email: 'ASWINHARI', password: 'Aswin@321315' });
    const loginOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };

    let cookie = '';
    await new Promise((resolve, reject) => {
      const req = http.request(loginOptions, (res) => {
        cookie = res.headers['set-cookie'] ? res.headers['set-cookie'][0] : '';
        res.on('data', () => {});
        res.on('end', resolve);
      });
      req.on('error', reject);
      req.write(loginData);
      req.end();
    });

    console.log('Got cookie:', cookie ? 'Yes' : 'No');

    // 2. Add each deliverable
    for (const name of deliverablesList) {
      const data = JSON.stringify({ name, description: '' });
      const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/deliverables',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          'Cookie': cookie
        }
      };

      await new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            console.log(`[${res.statusCode}] Added: ${name}`);
            resolve();
          });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
      });
    }

    console.log('Seeding complete!');
  } catch (err) {
    console.error('Error:', err);
  }
}

seed();
