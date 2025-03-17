import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";
import projectRoutes from "./routes/project";
import taskRoutes from "./routes/task";
import notificationRoutes from "./routes/notification";
import { Pool } from 'pg';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: "http://localhost:3006" } });

app.use(cors({
  origin: "http://localhost:3006",
  credentials: true
}));
app.use(bodyParser.json());

// Rate limiting middleware
const timeEntryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many time entry requests from this IP, please try again later.'
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/notifications", notificationRoutes);

// Server time endpoint
app.get('/api/server-time', (req, res) => {
  res.json(Date.now());
});

// Time entries endpoint with improved error handling and versioning
app.post('/api/time-entries', timeEntryLimiter, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id, taskId, projectId, description, startTime, endTime, duration, billable, tags } = req.body;
    
    // Validate input
    if (!taskId || !projectId || !startTime) {
      throw new Error('Missing required fields');
    }
    
    // Check for concurrent modifications
    const existingEntry = await client.query(
      'SELECT version FROM time_entries WHERE id = $1',
      [id]
    );
    
    if (existingEntry.rows.length > 0) {
      throw new Error('Time entry already exists');
    }
    
    // Insert new time entry with version
    const result = await client.query(
      `INSERT INTO time_entries (
        id, task_id, project_id, description, start_time, 
        end_time, duration, billable, tags, version
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1)
      RETURNING *`,
      [id, taskId, projectId, description, startTime, endTime, duration, billable, tags]
    );
    
    await client.query('COMMIT');
    
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating time entry:', error);
    res.status(500).json({ error: 'Failed to create time entry' });
  } finally {
    client.release();
  }
});

// Update time entry with version control
app.put('/api/time-entries/:id', timeEntryLimiter, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { version, ...updates } = req.body;
    
    // Check version
    const currentEntry = await client.query(
      'SELECT version FROM time_entries WHERE id = $1',
      [id]
    );
    
    if (currentEntry.rows.length === 0) {
      throw new Error('Time entry not found');
    }
    
    if (currentEntry.rows[0].version !== version) {
      throw new Error('Concurrent modification detected');
    }
    
    // Update time entry
    const result = await client.query(
      `UPDATE time_entries 
       SET ${Object.keys(updates).map((key, i) => `${key} = $${i + 2}`).join(', ')},
           version = version + 1
       WHERE id = $1
       RETURNING *`,
      [id, ...Object.values(updates)]
    );
    
    await client.query('COMMIT');
    
    if (result.rows.length === 0) {
      throw new Error('Time entry not found');
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating time entry:', error);
    res.status(500).json({ error: 'Failed to update time entry' });
  } finally {
    client.release();
  }
});

mongoose
  .connect(process.env.MONGO_URI!, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
});

export const sendNotification = (message: string) => {
  io.emit("notification", message);
};

const PORT = process.env.PORT || 3005;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
