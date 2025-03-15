const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const auth = require('../middleware/auth');

// Twilio credentials
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioApiKey = process.env.TWILIO_API_KEY;
const twilioApiSecret = process.env.TWILIO_API_SECRET;

// Generate a Twilio Video token
router.post('/token', auth, async (req, res) => {
  try {
    const { roomName } = req.body;
    
    if (!roomName) {
      return res.status(400).json({ message: 'Room name is required' });
    }
    
    // Create an access token
    const AccessToken = twilio.jwt.AccessToken;
    const VideoGrant = AccessToken.VideoGrant;
    
    // Create a video grant for this specific room
    const videoGrant = new VideoGrant({
      room: roomName,
    });
    
    // Create an access token with the user's identity
    const token = new AccessToken(
      twilioAccountSid,
      twilioApiKey,
      twilioApiSecret,
      { identity: req.user.id }
    );
    
    // Add the video grant to the token
    token.addGrant(videoGrant);
    
    // Serialize the token to a JWT string
    res.json({ token: token.toJwt() });
  } catch (error) {
    console.error('Error generating video token:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 