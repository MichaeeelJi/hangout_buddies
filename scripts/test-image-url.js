
import https from 'https';

const url = "https://core-normal.traeapi.us/api/ide/v1/text_to_image?prompt=group%20of%20friends%20having%20a%20bonfire%20at%20sunset%20on%20a%20beach%2C%20warm%20lighting%2C%20cozy%20atmosphere&image_size=landscape_16_9";

console.log('Fetching URL:', url);

https.get(url, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  
  // Consume response to free up memory
  res.resume();
}).on('error', (e) => {
  console.error('Error:', e);
});
