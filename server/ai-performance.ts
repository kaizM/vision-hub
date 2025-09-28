import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
// This is using OpenAI's API, which points to OpenAI's API servers and requires your own API key.
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface EmployeePerformanceData {
  employeeId: string;
  employeeName: string;
  tasksCompleted: number;
  tasksAssigned: number;
  helpRequests: number;
  missedTasks: number;
  avgCompletionTime?: number;
  recentTasks: Array<{
    title: string;
    status: 'done' | 'help' | 'missed' | 'pending';
    assignedAt: Date;
    completedAt?: Date;
  }>;
}

interface PerformanceInsight {
  employeeId: string;
  employeeName: string;
  overallScore: number; // 1-10 scale
  strengths: string[];
  concerns: string[];
  recommendations: string[];
  confidence: number;
}

/**
 * AI-powered employee performance analysis using GPT-5
 * Analyzes task completion patterns, help requests, and overall productivity
 */
export async function analyzeEmployeePerformance(
  performanceData: EmployeePerformanceData[]
): Promise<PerformanceInsight[]> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OpenAI API key not configured, skipping AI performance analysis");
      return [];
    }

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are an expert retail operations manager analyzing employee performance data from a convenience store. 

Analyze each employee's performance and provide insights based on:
- Task completion rate (completed/assigned)
- Help request frequency (indicates training needs or task difficulty)
- Missed task frequency (indicates reliability issues)
- Average completion time (indicates efficiency)

Provide objective, constructive analysis focused on:
1. Overall performance score (1-10, where 8-10=excellent, 6-7=good, 4-5=needs improvement, 1-3=requires immediate attention)
2. Key strengths to recognize
3. Areas of concern that need addressing
4. Specific recommendations for improvement

Respond with JSON in this exact format:
{
  "insights": [
    {
      "employeeId": "string",
      "employeeName": "string", 
      "overallScore": number,
      "strengths": ["string"],
      "concerns": ["string"],
      "recommendations": ["string"],
      "confidence": number
    }
  ]
}`
        },
        {
          role: "user",
          content: `Analyze the following employee performance data from our convenience store operations:

${JSON.stringify(performanceData, null, 2)}

Focus on identifying who's excelling, who needs support, and actionable recommendations for improving overall team performance.`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.insights || [];

  } catch (error) {
    console.error("Error analyzing employee performance:", error);
    return [];
  }
}

/**
 * Identify employees who are consistently not completing tasks
 */
export async function identifyUnderperformingEmployees(
  performanceData: EmployeePerformanceData[]
): Promise<{
  employeeId: string;
  employeeName: string;
  issues: string[];
  severity: 'low' | 'medium' | 'high';
}[]> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return [];
    }

    const response = await openai.chat.completions.create({
      model: "gpt-5", 
      messages: [
        {
          role: "system",
          content: `You are analyzing employee performance to identify those who need immediate managerial attention.

Focus on employees with:
- High missed task rates (>20% = high concern, >10% = medium concern)
- Excessive help requests (indicates training gaps)
- Poor completion rates (<70% = high concern, <85% = medium concern)
- Declining performance trends

Classify severity:
- HIGH: Immediate intervention needed (termination risk)
- MEDIUM: Coaching/training required 
- LOW: Minor performance gaps

Respond with JSON:
{
  "underperformers": [
    {
      "employeeId": "string",
      "employeeName": "string",
      "issues": ["specific issue descriptions"],
      "severity": "low|medium|high"
    }
  ]
}`
        },
        {
          role: "user", 
          content: `Identify underperforming employees from this data:

${JSON.stringify(performanceData, null, 2)}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.underperformers || [];

  } catch (error) {
    console.error("Error identifying underperforming employees:", error);
    return [];
  }
}

/**
 * Generate AI insights about team performance trends
 */
export async function generateTeamInsights(
  performanceData: EmployeePerformanceData[]
): Promise<{
  overallTeamScore: number;
  trends: string[];
  recommendations: string[];
}> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        overallTeamScore: 7,
        trends: ["AI analysis unavailable - OpenAI API key not configured"],
        recommendations: ["Configure OpenAI integration for AI-powered insights"]
      };
    }

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are analyzing overall team performance for a convenience store to provide management insights.

Analyze the team data and provide:
1. Overall team performance score (1-10)
2. Key performance trends you observe
3. Strategic recommendations for improving team productivity

Focus on operational insights like:
- Task completion patterns
- Training needs across the team
- Scheduling optimization opportunities
- Performance consistency

Respond with JSON:
{
  "overallTeamScore": number,
  "trends": ["string"],
  "recommendations": ["string"]
}`
        },
        {
          role: "user",
          content: `Analyze this team performance data:

${JSON.stringify(performanceData, null, 2)}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      overallTeamScore: result.overallTeamScore || 7,
      trends: result.trends || [],
      recommendations: result.recommendations || []
    };

  } catch (error) {
    console.error("Error generating team insights:", error);
    return {
      overallTeamScore: 7,
      trends: ["Error generating AI insights"],
      recommendations: ["Check system logs for AI analysis errors"]
    };
  }
}