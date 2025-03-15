import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateMedicalReport = async (transcript: string) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a medical AI assistant that generates structured consultation reports." },
        { role: "user", content: `Summarize this consultation: ${transcript}` },
      ],
    });

    return response.choices[0].message?.content || "Error generating report";
  } catch (error) {
    console.error("AI Report Error:", error);
    return "Failed to generate report.";
  }
};

// Function to extract key medical information from a transcript
export const extractMedicalInfo = async (transcript: string) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: "Extract key medical information from the consultation transcript in JSON format with the following fields: symptoms, diagnosis, recommendations, medications, followUpNeeded" 
        },
        { role: "user", content: transcript },
      ],
    });

    const content = response.choices[0].message?.content || "{}";
    
    try {
      // Attempt to parse the response as JSON
      return JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      return {
        symptoms: [],
        diagnosis: "Unable to determine",
        recommendations: [],
        medications: [],
        followUpNeeded: false
      };
    }
  } catch (error) {
    console.error("AI Information Extraction Error:", error);
    return {
      symptoms: [],
      diagnosis: "Error processing transcript",
      recommendations: [],
      medications: [],
      followUpNeeded: false
    };
  }
};

// Function to generate follow-up questions based on consultation
export const generateFollowUpQuestions = async (transcript: string) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: "You are a medical assistant. Generate 3-5 important follow-up questions based on this consultation transcript." 
        },
        { role: "user", content: transcript },
      ],
    });

    return response.choices[0].message?.content || "No follow-up questions available.";
  } catch (error) {
    console.error("AI Follow-up Questions Error:", error);
    return "Failed to generate follow-up questions.";
  }
}; 