const FACT_MAX_LENGTH = 500;
const OPENAI_MODELS = ["gpt-4o-mini", "gpt-4.1-mini"];
const MAX_MODEL_ATTEMPTS = 2;
const OPENAI_FACT_REJECT = "I can't verify a specific fact for this movie.";

type GenerateMovieFactOptions = {
  priorFacts?: string[];
  recentMovies?: string[];
};

function extractFact(content: unknown): string {
  if (typeof content !== "string") return "";
  return content.trim().replace(/^\"|\"$/g, "").slice(0, FACT_MAX_LENGTH);
}

function normalizeItems(items: string[] | undefined, max: number): string[] {
  if (!items) return [];

  return Array.from(
    new Set(
      items
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => item.slice(0, 180)),
    ),
  ).slice(0, max);
}

function hasStrongMovieMatch(fact: string, movie: string): boolean {
  const normalizedFact = fact.toLowerCase();
  const normalizedMovie = movie.toLowerCase().trim();

  if (normalizedFact.includes(normalizedMovie)) return true;

  const movieTokens = normalizedMovie.split(/[^a-z0-9]+/).filter((token) => token.length >= 4);
  if (movieTokens.length === 0) return false;

  return movieTokens.some((token) => normalizedFact.includes(token));
}

function hasConcreteDetail(fact: string): boolean {
  const patterns = [
    /\b(18|19|20)\d{2}\b/,
    /\$\s?\d/,
    /\b\d+\s?(minutes?|hours?)\b/i,
    /\b(oscar|academy awards?|golden globe|bafta|cannes|grammy)\b/i,
    /\b(directed by|starring|filmed in|based on)\b/i,
  ];

  return patterns.some((pattern) => pattern.test(fact));
}

function isLikelyGenericFact(fact: string): boolean {
  const genericPatterns = [
    /fan community/i,
    /often cited/i,
    /pop culture memes?/i,
    /first-time viewers?/i,
    /most searched/i,
    /debat(es|ing) about/i,
    /keeps uncovering/i,
    /widely discussed/i,
  ];

  return genericPatterns.some((pattern) => pattern.test(fact));
}

function buildPrompt(movie: string, options: GenerateMovieFactOptions): string {
  const priorFacts = normalizeItems(options.priorFacts, 8);
  const recentMovies = normalizeItems(options.recentMovies, 6);

  const priorFactsBlock =
    priorFacts.length > 0 ? priorFacts.map((fact, index) => `${index + 1}. ${fact}`).join("\n") : "None";
  const recentMoviesBlock = recentMovies.length > 0 ? recentMovies.join(", ") : "None";

  return [
    `Target movie: ${movie}`,
    "Task: Return exactly one accurate, movie-specific fact as a single sentence in plain text.",
    "Hard rules:",
    "1) Include at least one concrete detail (release year, cast, director, award, budget, box office, runtime, adaptation source, production detail).",
    "2) Do not use generic statements that could apply to many movies.",
    "3) Do not repeat facts listed in Previous facts.",
    "4) If unsure, reply exactly: I can't verify a specific fact for this movie.",
    "",
    "Previous facts:",
    priorFactsBlock,
    "",
    "Recent movies viewed by the same user (for context only, do not mix facts across movies):",
    recentMoviesBlock,
  ].join("\n");
}

async function extractApiError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: { message?: string } };
    return payload.error?.message?.trim() || `OpenAI request failed (${response.status})`;
  } catch {
    return `OpenAI request failed (${response.status})`;
  }
}

export async function generateMovieFact(movie: string, options: GenerateMovieFactOptions = {}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing. Cannot generate movie facts.");
  }

  const prompt = buildPrompt(movie, options);
  let lastError = "";
  let bestCandidate = "";

  for (const model of OPENAI_MODELS) {
    for (let attempt = 1; attempt <= MAX_MODEL_ATTEMPTS; attempt += 1) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          max_tokens: 120,
          messages: [
            {
              role: "system",
              content:
                "You are a precise movie researcher. Return only one sentence, keep it factual, and never invent uncertain details.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        lastError = await extractApiError(response);
        continue;
      }

      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: unknown } }>;
      };

      const fact = extractFact(payload.choices?.[0]?.message?.content);
      if (!fact) {
        lastError = "OpenAI returned an empty fact.";
        continue;
      }

      if (fact === OPENAI_FACT_REJECT) {
        lastError = `Could not verify a specific fact for "${movie}" right now.`;
        continue;
      }

      const factWithMovie = hasStrongMovieMatch(fact, movie) ? fact : `${movie}: ${fact}`;

      if (isLikelyGenericFact(factWithMovie) || !hasConcreteDetail(factWithMovie)) {
        if (!bestCandidate) {
          bestCandidate = factWithMovie;
        }
        lastError = "OpenAI returned a generic or non-specific fact.";
        continue;
      }

      return factWithMovie;
    }
  }

  if (bestCandidate) {
    return bestCandidate;
  }

  throw new Error(lastError || `Could not generate a specific fact for "${movie}". Please try again.`);
}
