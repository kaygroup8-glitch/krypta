import Groq from "groq-sdk";

const groq = new Groq();

export async function generateStructured<T>({
  system,
  user,
  schemaName,
  schema,
}: {
  system: string;
  user: string;
  schemaName: string;
  schema: Record<string, unknown>;
}): Promise<T> {
  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: schemaName,
        schema,
        strict: true,
      },
    },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Insufficient verified data: empty model response.");
  }
  return JSON.parse(content) as T;
}
