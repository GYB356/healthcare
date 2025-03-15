# Roofing Tracker

A comprehensive application for roofing contractors and customers to manage projects, appointments, and video consultations.

## Features

- User authentication (contractors, customers, admins)
- Appointment scheduling and management
- Live video consultations using Twilio Video
- Project tracking and management
- Responsive design for desktop and mobile

## Tech Stack

- **Frontend**: React, Next.js, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Video**: Twilio Video
- **Authentication**: JWT

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Twilio account with Video API access

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/roofing-tracker.git
cd roofing-tracker
```

### 2. Install dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/roofing-tracker
JWT_SECRET=your_jwt_secret_key_here

# Twilio credentials
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_API_KEY=your_twilio_api_key
TWILIO_API_SECRET=your_twilio_api_secret
```

### 4. Start the application

```bash
# Start the backend server
npm run server

# In a separate terminal, start the frontend
cd frontend
npm run dev
```

## Using Video Consultations

1. Log in as either a contractor or customer
2. Navigate to the Appointments page
3. Click on an appointment scheduled for today
4. Click the "Start Video Consultation" button
5. Allow camera and microphone access when prompted
6. Wait for the other participant to join the call

## Twilio Setup

1. Create a Twilio account at [twilio.com](https://www.twilio.com)
2. Navigate to the Programmable Video section
3. Create a new API Key and Secret
4. Add these credentials to your `.env` file

## License

MIT 