const net = require('net');

function findAvailablePort(startPort = 3000) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    server.listen(startPort, (err) => {
      if (err) {
        // Port is not available, try the next one
        server.close();
        findAvailablePort(startPort + 1).then(resolve).catch(reject);
      } else {
        // Port is available
        const port = server.address().port;
        server.close(() => {
          resolve(port);
        });
      }
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // Port is in use, try the next one
        findAvailablePort(startPort + 1).then(resolve).catch(reject);
      } else {
        reject(err);
      }
    });
  });
}

// Find an available port starting from 3000
findAvailablePort(3000)
  .then((port) => {
    console.log(port);
  })
  .catch((err) => {
    console.error('Error finding available port:', err);
    process.exit(1);
  });