const fs = require('fs');
const crypto = require('crypto');

const path = require('path');

// Replace 'path/to/keystore.jks' with the actual path to your keystore file
const keystorePath = path.join(
  "C:", "Users", "ALLAN", "SHC-App", "secret", "@demonturtwig__smart-homecare-app.jks"
);

// Replace with your actual keystore password and alias
const keystorePassword = '519d261a7d13d3b7cbc1799e867b3fe0';
const keyAlias = 'f236d6004a9131ec25cabbc3a4b4bdc2';

// Read the keystore file
const keystoreData = fs.readFileSync(keystorePath);

// Create a SHA1 hash of the keystore data
const hash = crypto.createHash('sha1').update(keystoreData).digest('base64');

console.log('Kakao Key Hash:', hash);
