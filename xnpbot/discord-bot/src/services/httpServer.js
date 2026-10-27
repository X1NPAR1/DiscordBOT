const express = require('express');

function authGuard(req, res, next) {
  if (req.headers['x-api-secret'] !== process.env.API_SECRET && req.body?.apiSecret !== process.env.API_SECRET) {
    return res.status(401).json({ success: false, message: 'Api secret hatalı' });
  }
  return next();
}

function createHttpServer(client, config) {
  const app = express();
  app.use(express.json());

  app.post('/api/log', authGuard, async (req, res) => {
    // TODO: logChannels configine göre kanal bulup embed gönder
    res.json({ success: true });
  });

  app.post('/api/status', authGuard, async (req, res) => {
    // TODO: status embed güncellemesi için payload işle
    res.json({ success: true });
  });

  app.post('/api/grantPermission', authGuard, async (req, res) => {
    // TODO: permission grant akışı
    res.json({ success: true });
  });

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`HTTP API ${port} portunda hazır`));
  return app;
}

module.exports = { createHttpServer };
