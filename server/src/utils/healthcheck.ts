/* eslint-disable no-process-exit */
import http from 'http';

const port = Number(process.env.IMMICH_PORT) || 3001;
const options = {
  host: 'localhost',
  timeout: 2000,
  path: '/api/server-info/ping',
  port,
};

const request = http.request(options, (res: any) => {
  // TODO: assert on response body
  // I need to look at what it looks like first

  // 2024-05-19 20:47:35 URL: http://localhost:3001/api/server-info/ping 200 OK

  if (res.statusMessage === 'OK') {
    console.log('Response contains "OK"');
  } else {
    console.log('Response does not contain "OK"');
  }

  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on('error', () => {
  process.exit(1);
});

request.end();
