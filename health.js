/**
 * Vercel Serverless Function: /api/health
 */

module.exports = function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({
    status: 'healthy',
    platform: 'Vercel Serverless',
    studio: 'Foresight Associates',
    location: 'Vadodara, Gujarat, India',
    timestamp: new Date().toISOString()
  });
};

