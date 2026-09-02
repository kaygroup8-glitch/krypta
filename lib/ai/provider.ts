import Groq from "groq-sdk";

const groq = new Groq();

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const status = (error as { status?: number })?.status;
    if (status === 429 && retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 700));
      return withRetry(fn, retries - 1);
    }
    throw error;
  }
}

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
  return withRetry(async () => {
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: schemaName, schema, strict: true },
      },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Insufficient verified data: empty model response.");
    }
    return JSON.parse(content) as T;
  });
}
