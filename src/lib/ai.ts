import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

/**
 * Generate a ~200-word summary of a blog post using Google Gemini.
 * Summary is generated ONCE at post creation and stored in DB
 * to avoid repeated API calls (cost optimization).
 */
export async function generatePostSummary(
  title: string,
  body: string
): Promise<string> {
  try {
    // Strip HTML tags from body for cleaner input
    const cleanBody = body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Truncate to ~3000 chars to reduce token usage (cost optimization)
    const truncatedBody = cleanBody.length > 3000
      ? cleanBody.substring(0, 3000) + '...'
      : cleanBody;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are a blog summarization assistant. Read the following blog post and generate a concise, engaging summary of approximately 200 words. The summary should capture the key points and be readable as a standalone preview.

Title: ${title}

Content: ${truncatedBody}

Write only the summary text, no headers or labels. Keep it around 200 words.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text().trim();

    return summary;
  } catch (error) {
    console.error('Error generating summary:', error);
    // Fallback: extract first 200 words from body
    const cleanBody = body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = cleanBody.split(' ').slice(0, 200).join(' ');
    return words + (cleanBody.split(' ').length > 200 ? '...' : '');
  }
}
