import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiService } from '../services/api';
import { MedicalInfo } from '../../types';

interface ConsultationReportProps {
  appointmentId: string;
  transcript: string;
}

export default function ConsultationReport({ appointmentId, transcript }: ConsultationReportProps) {
  const { token } = useAuth();
  const [report, setReport] = useState<string | null>(null);
  const [medicalInfo, setMedicalInfo] = useState<MedicalInfo | null>(null);
  const [followUpQuestions, setFollowUpQuestions] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'summary' | 'details' | 'followUp'>('summary');

  const generateReport = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await ApiService.createReport(appointmentId, transcript);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to generate report');
      }
      
      setReport(response.data.report.report);
      setMedicalInfo(response.data.report.medicalInfo);
      setFollowUpQuestions(response.data.report.followUpQuestions);
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const extractMedicalInfo = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await ApiService.getReports(appointmentId);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch reports');
      }
      
      if (response.data.length > 0) {
        setReport(response.data[0].report);
        setMedicalInfo(response.data[0].medicalInfo);
        setFollowUpQuestions(response.data[0].followUpQuestions);
      } else {
        throw new Error('No reports found for this appointment');
      }
    } catch (err) {
      console.error('Error fetching medical info:', err);
      setError('Failed to fetch medical information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateFollowUpQuestions = async () => {
    try {
      setLoading(true);
      setError('');
      
      // If we already have a report with follow-up questions, use that
      if (report) {
        const response = await ApiService.getReports(appointmentId);
        
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to fetch reports');
        }
        
        if (response.data.length > 0 && response.data[0].followUpQuestions) {
          setFollowUpQuestions(response.data[0].followUpQuestions);
        } else {
          // If no existing report with follow-up questions, generate a new one
          await generateReport();
        }
      } else {
        // If no report exists, generate a new one
        await generateReport();
      }
    } catch (err) {
      console.error('Error generating follow-up questions:', err);
      setError('Failed to generate follow-up questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAll = async () => {
    await generateReport();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">Consultation Report</h2>
      
      {transcript ? (
        <>
          {!report && !medicalInfo && !followUpQuestions && (
            <div className="mb-6">
              <button
                onClick={handleGenerateAll}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md mr-2"
              >
                {loading ? 'Generating...' : 'Generate Full Report'}
              </button>
              <button
                onClick={generateReport}
                disabled={loading}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
              >
                {loading ? 'Generating...' : 'Generate Summary Only'}
              </button>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {(report || medicalInfo || followUpQuestions) && (
            <div>
              <div className="border-b border-gray-200 mb-4">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setActiveTab('summary')}
                    className={`py-2 px-4 text-center border-b-2 font-medium text-sm ${
                      activeTab === 'summary'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Summary
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('details');
                      if (!medicalInfo) extractMedicalInfo();
                    }}
                    className={`py-2 px-4 text-center border-b-2 font-medium text-sm ${
                      activeTab === 'details'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Medical Details
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('followUp');
                      if (!followUpQuestions) generateFollowUpQuestions();
                    }}
                    className={`py-2 px-4 text-center border-b-2 font-medium text-sm ${
                      activeTab === 'followUp'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Follow-up
                  </button>
                </nav>
              </div>
              
              <div className="mt-4">
                {activeTab === 'summary' && (
                  <div>
                    {report ? (
                      <div className="prose max-w-none">
                        <div className="whitespace-pre-line">{report}</div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <button
                          onClick={generateReport}
                          disabled={loading}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                        >
                          {loading ? 'Generating...' : 'Generate Summary'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                {activeTab === 'details' && (
                  <div>
                    {medicalInfo ? (
                      <div>
                        <div className="mb-4">
                          <h3 className="text-lg font-medium mb-2">Symptoms</h3>
                          <ul className="list-disc pl-5">
                            {medicalInfo.symptoms.map((symptom, index) => (
                              <li key={index} className="mb-1">{symptom}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="mb-4">
                          <h3 className="text-lg font-medium mb-2">Diagnosis</h3>
                          <p>{medicalInfo.diagnosis}</p>
                        </div>
                        
                        <div className="mb-4">
                          <h3 className="text-lg font-medium mb-2">Recommendations</h3>
                          <ul className="list-disc pl-5">
                            {medicalInfo.recommendations.map((rec, index) => (
                              <li key={index} className="mb-1">{rec}</li>
                            ))}
                          </ul>
                        </div>
                        
                        {medicalInfo.medications.length > 0 && (
                          <div className="mb-4">
                            <h3 className="text-lg font-medium mb-2">Medications</h3>
                            <ul className="list-disc pl-5">
                              {medicalInfo.medications.map((med, index) => (
                                <li key={index} className="mb-1">{med}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <div className="mb-4">
                          <h3 className="text-lg font-medium mb-2">Follow-up</h3>
                          <p>{medicalInfo.followUpNeeded ? 'Recommended' : 'Not required at this time'}</p>
                        </div>
                      </div>
                    ) : loading ? (
                      <div className="text-center py-8">
                        <p>Extracting medical information...</p>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <button
                          onClick={extractMedicalInfo}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                        >
                          Extract Medical Information
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                {activeTab === 'followUp' && (
                  <div>
                    {followUpQuestions ? (
                      <div className="prose max-w-none">
                        <div className="whitespace-pre-line">{followUpQuestions}</div>
                      </div>
                    ) : loading ? (
                      <div className="text-center py-8">
                        <p>Generating follow-up questions...</p>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <button
                          onClick={generateFollowUpQuestions}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                        >
                          Generate Follow-up Questions
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>No consultation transcript available. Complete a video call to generate a report.</p>
        </div>
      )}
    </div>
  );
}