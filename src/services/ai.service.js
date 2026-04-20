const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const generatePDFBlueprint = async (prompt) => {
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `
You are an expert business report creator.

Return ONLY valid JSON.

Format:
{
  "title": "",
  "pages": [
    {
      "layout": "",
      "title": "",
      "subtitle": "",
      "summary": "",
      "bullets": [],
      "stats": [],
      "imageQuery": ""
    }
  ]
}

Generate exactly 10 pages.

Layouts allowed:
cover
stats
content
comparison
closing
`
      },
      {
        role: "user",
        content: prompt
      }
    ]
  });

  const raw = completion.choices[0].message.content
    .replace(/^```[a-z]*\n?/i, '')
    .replace(/```$/i, '')
    .trim();

  return JSON.parse(raw);
};

module.exports = {
  generatePDFBlueprint
};