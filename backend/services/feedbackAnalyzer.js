const { OpenAI } = require('openai');
const { getDatabase } = require('../database');
const { detectPatterns } = require('./patternDetector');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// System prompt for GPT analysis
const SYSTEM_PROMPT = `You're an AI assistant trained to learn from resale analysis feedback. Classify and summarize the following user feedback to help improve the product.

Analyze the feedback and provide a JSON response with these fields:
- sentiment: "positive", "negative", or "neutral"
- category: One of ["value_accuracy", "authenticity_concern", "platform_suggestion", "ui_feedback", "technical_issue", "feature_request", "general_praise", "other"]
- suggestion_type: One of ["complaint", "suggestion", "praise", "question", "bug_report"]
- summary: A brief 1-2 sentence summary of the feedback

Focus on actionable insights that can help improve the accuracy and usefulness of the resale analysis.`;

async function analyzeFeedback(feedbackData) {
  try {
    const { 
      feedback_text, 
      thumbs_up, 
      user_description, 
      scan_data 
    } = feedbackData;

    // Prepare the input for GPT
    const input = {
      feedback_text: feedback_text || 'No text feedback provided',
      thumbs_up: thumbs_up,
      user_description: user_description || '',
      analysis: {
        item_name: scan_data.item_name,
        real_score: scan_data.real_score,
        authenticity_score: scan_data.authenticity_score,
        platforms: [scan_data.recommended_platform, scan_data.recommended_live_platform].filter(Boolean),
        estimated_value: scan_data.price_range,
        trending_score: scan_data.trending_score,
        style_tier: scan_data.style_tier
      }
    };

    // Call GPT for analysis
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: JSON.stringify(input, null, 2)
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 200
    });

    const analysis = JSON.parse(response.choices[0].message.content);
    
    // Validate the response has required fields
    if (!analysis.sentiment || !analysis.category || !analysis.suggestion_type || !analysis.summary) {
      throw new Error('GPT response missing required fields');
    }

    return {
      success: true,
      analysis: analysis,
      gpt_response: response.choices[0].message.content
    };

  } catch (error) {
    console.error('Error analyzing feedback with GPT:', error);
    return {
      success: false,
      error: error.message,
      analysis: {
        sentiment: 'neutral',
        category: 'other',
        suggestion_type: 'other',
        summary: 'Unable to analyze feedback'
      }
    };
  }
}

async function analyzeUnprocessedFeedback() {
  const db = getDatabase();
  
  try {
    // Get unprocessed feedback (not yet analyzed)
    const unprocessedFeedback = db.prepare(`
      SELECT f.* 
      FROM feedback f
      LEFT JOIN feedback_analysis fa ON f.id = fa.feedback_id
      WHERE fa.id IS NULL
      ORDER BY f.created_at DESC
      LIMIT 50
    `).all();

    console.log(`Found ${unprocessedFeedback.length} unprocessed feedback entries`);

    const results = [];
    
    for (const feedback of unprocessedFeedback) {
      console.log(`Analyzing feedback ID: ${feedback.id}`);
      
      // Parse scan_data
      const scanData = JSON.parse(feedback.scan_data);
      
      // Analyze with GPT
      const analysisResult = await analyzeFeedback({
        feedback_text: feedback.feedback_text,
        thumbs_up: feedback.helped_decision === 1,
        user_description: feedback.user_description,
        scan_data: scanData
      });

      if (analysisResult.success) {
        // Store the analysis
        const stmt = db.prepare(`
          INSERT INTO feedback_analysis (
            feedback_id,
            sentiment,
            category,
            suggestion_type,
            summary,
            gpt_response
          ) VALUES (?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
          feedback.id,
          analysisResult.analysis.sentiment,
          analysisResult.analysis.category,
          analysisResult.analysis.suggestion_type,
          analysisResult.analysis.summary,
          analysisResult.gpt_response
        );

        results.push({
          feedback_id: feedback.id,
          success: true,
          analysis: analysisResult.analysis
        });
        
        // Detect patterns in the feedback
        await detectPatterns({
          feedback_text: feedback.feedback_text,
          category: analysisResult.analysis.category,
          sentiment: analysisResult.analysis.sentiment,
          scan_data: scanData,
          analysis: analysisResult.analysis
        });
      } else {
        results.push({
          feedback_id: feedback.id,
          success: false,
          error: analysisResult.error
        });
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return {
      success: true,
      processed: results.length,
      results: results
    };

  } catch (error) {
    console.error('Error processing feedback batch:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  analyzeFeedback,
  analyzeUnprocessedFeedback
};