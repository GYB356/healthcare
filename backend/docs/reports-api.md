# Reports API Documentation

The Reports API allows you to generate and retrieve AI-powered medical reports from consultation transcripts.

## Endpoints

### Generate a Report

Generates a new medical report from a consultation transcript and saves it to the database.

**URL**: `/api/reports`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "appointmentId": "string (required)",
  "transcript": "string (required)"
}
```

**Response**:
```json
{
  "message": "Report saved",
  "report": {
    "_id": "string",
    "appointmentId": "string",
    "doctor": "string",
    "report": "string",
    "medicalInfo": {
      "symptoms": ["string"],
      "diagnosis": "string",
      "recommendations": ["string"],
      "medications": ["string"],
      "followUpNeeded": boolean
    },
    "followUpQuestions": "string",
    "createdAt": "date"
  }
}
```

### Get Reports for an Appointment

Retrieves all reports associated with a specific appointment.

**URL**: `/api/reports/:appointmentId`

**Method**: `GET`

**Authentication**: Required

**URL Parameters**:
- `appointmentId`: ID of the appointment

**Response**:
```json
[
  {
    "_id": "string",
    "appointmentId": "string",
    "doctor": "string",
    "report": "string",
    "medicalInfo": {
      "symptoms": ["string"],
      "diagnosis": "string",
      "recommendations": ["string"],
      "medications": ["string"],
      "followUpNeeded": boolean
    },
    "followUpQuestions": "string",
    "createdAt": "date"
  }
]
```

### Get a Specific Report

Retrieves a specific report by its ID.

**URL**: `/api/reports/detail/:reportId`

**Method**: `GET`

**Authentication**: Required

**URL Parameters**:
- `reportId`: ID of the report

**Response**:
```json
{
  "_id": "string",
  "appointmentId": "string",
  "doctor": "string",
  "report": "string",
  "medicalInfo": {
    "symptoms": ["string"],
    "diagnosis": "string",
    "recommendations": ["string"],
    "medications": ["string"],
    "followUpNeeded": boolean
  },
  "followUpQuestions": "string",
  "createdAt": "date"
}
```

## Error Responses

**Status Code**: `400 Bad Request`
```json
{
  "message": "Appointment ID and transcript required"
}
```

**Status Code**: `401 Unauthorized`
```json
{
  "message": "No token, authorization denied"
}
```

**Status Code**: `404 Not Found`
```json
{
  "message": "Report not found"
}
```

**Status Code**: `500 Server Error`
```json
{
  "message": "Server error"
}
```

## Testing the API

You can use the provided test script to verify that the API is working correctly:

1. Make sure your server is running
2. Set the following environment variables:
   - `TEST_TOKEN`: A valid JWT token for authentication
   - `TEST_APPOINTMENT_ID`: A valid appointment ID (optional)
3. Run the test script:
   ```
   node tests/reports.test.js
   ```

## Integration with Frontend

The frontend can use the Reports API to generate and display medical reports after video consultations. The `ConsultationReport` component in `frontend/components/ConsultationReport.tsx` provides a user interface for interacting with this API. 