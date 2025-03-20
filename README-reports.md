# Medical Reports Integration Guide

This guide provides instructions on how to integrate the medical reports functionality into your application.

## Overview

The medical reports feature allows doctors to generate AI-powered medical reports from consultation transcripts. The system extracts medical information, generates follow-up questions, and provides a comprehensive report that can be viewed by both doctors and patients.

## Components

The following components have been created:

1. **Backend**:
   - `backend/models/Report.js`: MongoDB schema for storing reports
   - `backend/routes/reports.js`: API routes for creating and retrieving reports
   - `backend/utils/ai.js`: Utility functions for generating reports using AI

2. **Frontend**:
   - `frontend/components/ReportViewer.tsx`: Component for displaying reports
   - `frontend/pages/appointments/[id]/reports.tsx`: Page for viewing reports associated with an appointment

## Integration Steps

### Backend Integration

1. **Register the reports route in server.js**:
   ```javascript
   import reportRoutes from './routes/reports';
   // ...
   app.use("/api/reports", reportRoutes);
   ```

2. **Set up environment variables**:
   Add the following to your `.env` file:
   ```
   OPENAI_API_KEY=your_openai_api_key
   ```

3. **Test the API**:
   Use the provided test script to verify that the API is working correctly:
   ```
   node backend/tests/reports.test.js
   ```

### Frontend Integration

1. **Add a link to the reports page from the appointments page**:
   ```jsx
   import Link from 'next/link';
   // ...
   <Link href={`/appointments/${appointment._id}/reports`}>
     <Button colorScheme="blue" size="sm">View Reports</Button>
   </Link>
   ```

2. **Update the navigation menu**:
   Add a link to the reports in your navigation menu or sidebar.

3. **Add the reports page to protected routes**:
   ```javascript
   // In _app.tsx or your auth protection logic
   const protectedRoutes = [
     // ... existing routes
     "/appointments/[id]/reports"
   ];
   ```

## API Documentation

For detailed API documentation, refer to `backend/docs/reports-api.md`.

## User Flow

1. Doctor conducts a video consultation with a patient
2. After the consultation, the doctor can generate a report from the transcript
3. The system processes the transcript using AI to extract medical information
4. The report is saved to the database and can be viewed by both doctor and patient
5. The doctor can review the report and follow-up questions

## Troubleshooting

- **Error: "Failed to fetch reports"**: Check that the backend server is running and the reports route is properly registered
- **Error: "No token, authorization denied"**: Ensure that the user is authenticated and the token is being sent with the request
- **Empty reports list**: Verify that reports have been created for the appointment

## Next Steps

- Implement report editing functionality
- Add PDF export for reports
- Implement email notifications for new reports 