import Twilio from "twilio";

const twilioClient = Twilio(process.env.TWILIO_API_KEY, process.env.TWILIO_API_SECRET, { accountSid: process.env.TWILIO_ACCOUNT_SID });

export const generateVideoToken = (identity: string, room: string) => {
  const AccessToken = Twilio.jwt.AccessToken;
  const VideoGrant = AccessToken.VideoGrant;

  const token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID!, 
    process.env.TWILIO_API_KEY!, 
    process.env.TWILIO_API_SECRET!
  );
  
  token.identity = identity;
  token.addGrant(new VideoGrant({ room }));

  return token.toJwt();
};