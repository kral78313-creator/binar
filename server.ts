import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required for translation.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

/**
 * Executes a generateContent call with retries and fallback models
 */
async function generateContentWithRetry(
  ai: GoogleGenAI,
  params: {
    model: string;
    contents: any;
    config?: any;
  },
  retries = 3,
  delayMs = 1000
): Promise<any> {
  let lastError: any = null;
  const modelsToTry = [params.model, 'gemini-3.1-flash-lite'];

  for (const currentModel of modelsToTry) {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        console.log(`Attempting generateContent using model ${currentModel}, attempt ${attempt + 1}...`);
        const response = await ai.models.generateContent({
          ...params,
          model: currentModel,
        });
        return response;
      } catch (error: any) {
        lastError = error;
        console.warn(`Attempt ${attempt + 1} with model ${currentModel} failed:`, error.message || error);

        // If it's a client side 4xx error (other than rate limits), don't retry on the same model.
        // Try fallback directly.
        const errorCode = error.status || (error.error && error.error.code) || 0;
        if (errorCode >= 400 && errorCode < 500 && errorCode !== 429) {
          break;
        }

        if (attempt < retries - 1) {
          const sleepTime = delayMs * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, sleepTime));
        }
      }
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '20mb' }));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/translate', async (req, res) => {
    try {
      const { text, targetLanguage, format } = req.body;
      if (!text || !targetLanguage) {
        return res.status(400).json({ error: 'Missing text or targetLanguage' });
      }

      const ai = getGenAI();

      let systemInstruction = `You are a professional, accurate document translator. Translate the given document to the target language: ${targetLanguage}.
CRITICAL REQUIREMENTS:
1. Preserve all structural formatting, code, punctuation, whitespace, and layout syntax exactly.
2. For HTML, preserve all elements, attributes, CSS, styles, and tags (e.g. keep <div class="x">, <p>, <a> intact), and only translate the inner human-readable text contents.
3. For Markdown, preserve all asterisks, hashes, links, blockquotes, code fences, and tables. Do not alter markup syntax.
4. For JSON, parse the content as JSON and only translate the string values of the properties (nested objects/arrays included). DO NOT translate key names or key paths. Ensure the output is valid JSON.
5. For CSV or spreadsheets, translate the cell contents without altering separators (commas, semicolons) or quotes.
6. Do not wrap the output in markdown code blocks (such as \`\`\`html or \`\`\`json) unless the original text already has them. Return the raw translated document content directly without any preambles or postscripts.`;

      const response = await generateContentWithRetry(ai, {
        model: 'gemini-3.5-flash',
        contents: text,
        config: {
          systemInstruction,
          temperature: 0.1,
        }
      });

      const translatedText = response.text || '';
      res.json({ translatedText });
    } catch (error: any) {
      console.error('Translation error:', error);
      res.status(500).json({ error: error.message || 'An error occurred during translation' });
    }
  });

  app.post('/api/summarize-pdf', async (req, res) => {
    try {
      const { text, question } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Missing text content for summarization' });
      }

      const ai = getGenAI();

      let systemInstruction = `You are an expert AI PDF Summarizer. Your goal is to provide extremely clear, structured, and easy-to-read summaries of PDF documents.
Always structure your summary using markdown with:
- A brief overarching executive summary (1-2 sentences)
- Key Takeaways & Main Points (bulleted list)
- Important Figures, Data, or Highlights (if applicable)
- Actionable Conclusions or next steps (if applicable)

Write the summary in the primary language detected in the document text unless specified otherwise. Keep the formatting clean and professional. Do not use verbose greetings or preambles, jump straight to the summary.`;

      if (question) {
        systemInstruction = `You are an expert AI assistant helping a user query a PDF document.
Answer the user's question accurately based ON the provided PDF document text.
If the answer cannot be found in the document, state that clearly but provide any helpful context if possible.
Keep the explanation clear, professional, and well-structured using markdown.`;
      }

      const prompt = question 
        ? `Document text:\n${text}\n\nQuestion: ${question}`
        : `Please summarize the following document text:\n${text}`;

      const response = await generateContentWithRetry(ai, {
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.2,
        }
      });

      const resultText = response.text || '';
      res.json({ result: resultText });
    } catch (error: any) {
      console.error('PDF Summarization/QA error:', error);
      res.status(500).json({ error: error.message || 'An error occurred during PDF summarization' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Server start error:", err);
});
