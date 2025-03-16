const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Report = require('../models/Report');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Report Model', () => {
  it('should create and save a report successfully', async () => {
    const reportData = {
      appointmentId: new mongoose.Types.ObjectId(),
      doctor: new mongoose.Types.ObjectId(),
      report: 'Test report content',
      medicalInfo: {
        symptoms: ['Headache', 'Fever'],
        diagnosis: 'Common cold',
        recommendations: ['Rest', 'Fluids'],
        medications: ['Paracetamol'],
        followUpNeeded: false
      },
      followUpQuestions: 'Follow up questions'
    };

    const report = new Report(reportData);
    const savedReport = await report.save();

    expect(savedReport._id).toBeDefined();
    expect(savedReport.appointmentId).toBe(reportData.appointmentId);
    expect(savedReport.doctor).toBe(reportData.doctor);
    expect(savedReport.report).toBe(reportData.report);
    expect(savedReport.medicalInfo.symptoms).toEqual(reportData.medicalInfo.symptoms);
    expect(savedReport.medicalInfo.diagnosis).toBe(reportData.medicalInfo.diagnosis);
    expect(savedReport.medicalInfo.recommendations).toEqual(reportData.medicalInfo.recommendations);
    expect(savedReport.medicalInfo.medications).toEqual(reportData.medicalInfo.medications);
    expect(savedReport.medicalInfo.followUpNeeded).toBe(reportData.medicalInfo.followUpNeeded);
    expect(savedReport.followUpQuestions).toBe(reportData.followUpQuestions);
  });

  it('should fail to create a report without required fields', async () => {
    const report = new Report({});

    let err;
    try {
      await report.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.appointmentId).toBeDefined();
    expect(err.errors.doctor).toBeDefined();
    expect(err.errors.report).toBeDefined();
  });
});
