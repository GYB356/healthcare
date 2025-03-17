import notificationsRouter from './routes/notifications';

// ... existing middleware setup ...

// Add notifications routes
app.use('/api/notifications', notificationsRouter);

// ... rest of the server code ... 