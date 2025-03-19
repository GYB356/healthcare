# API Documentation

## Authentication

All API endpoints require authentication using NextAuth.js. Include the session token in your requests.

## Medical Records

### List Medical Records

```http
GET /api/medical-records
```

Query Parameters:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Records per page (default: 10)
- `search` (optional): Search in description or patient name
- `type` (optional): Filter by record type
- `startDate` (optional): Filter by date range start
- `endDate` (optional): Filter by date range end
- `patientId` (optional): Filter by patient

Response:
```json
{
  "data": [
    {
      "id": "string",
      "type": "CONSULTATION",
      "date": "2024-03-20T12:00:00Z",
      "description": "string",
      "patient": {
        "id": "string",
        "name": "string",
        "dateOfBirth": "2024-03-20T12:00:00Z",
        "gender": "string"
      },
      "doctor": {
        "id": "string",
        "name": "string",
        "specialization": "string"
      },
      "attachments": [
        {
          "id": "string",
          "name": "string",
          "type": "string",
          "url": "string"
        }
      ]
    }
  ],
  "pagination": {
    "total": 0,
    "pages": 0,
    "page": 1,
    "limit": 10
  }
}
```

### Create Medical Record

```http
POST /api/medical-records
```

Request Body (multipart/form-data):
- `patientId` (required): Patient ID
- `type` (required): Record type (CONSULTATION, DIAGNOSIS, etc.)
- `date` (required): Record date
- `description` (required): Record description
- `attachments` (optional): File attachments

Response: Created medical record object

### Get Medical Record

```http
GET /api/medical-records/{id}
```

Response: Medical record object

### Update Medical Record

```http
PATCH /api/medical-records/{id}
```

Request Body (multipart/form-data):
- `type` (optional): Record type
- `date` (optional): Record date
- `description` (optional): Record description
- `attachments` (optional): New file attachments
- `deletedAttachments` (optional): Array of attachment IDs to delete

Response: Updated medical record object

### Delete Medical Record

```http
DELETE /api/medical-records/{id}
```

Response:
```json
{
  "success": true
}
```

### Download Attachment

```http
GET /api/medical-records/{id}/attachments/{attachmentId}
```

Response:
```json
{
  "url": "string",
  "name": "string",
  "type": "string"
}
```

## Patients

### Search Patients

```http
GET /api/patients/search
```

Query Parameters:
- `q` (required): Search query
- `limit` (optional): Maximum number of results (default: 10)

Response:
```json
[
  {
    "id": "string",
    "name": "string",
    "email": "string",
    "dateOfBirth": "2024-03-20T12:00:00Z",
    "gender": "string",
    "phone": "string"
  }
]
```

## Error Responses

All endpoints may return the following error responses:

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Error message"
}
``` 