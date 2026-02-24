import type {
  ErrorResponse,
  GetFactResponse,
  GetMeResponse,
  UpdateMovieRequest,
  UpdateMovieResponse,
} from "@/types/api";

export class ApiClientError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function asErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const maybe = payload as ErrorResponse;
  if (typeof maybe.error !== "string") return null;
  return maybe.error;
}

function assertObject(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object") {
    throw new ApiClientError("Invalid API response", 500);
  }
  return payload as Record<string, unknown>;
}

function assertString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new ApiClientError(`Invalid API response field: ${field}`, 500);
  }
  return value;
}

function parseGetMe(payload: unknown): GetMeResponse {
  const obj = assertObject(payload);
  const me = assertObject(obj.me);
  const factsRaw = Array.isArray(obj.recentFacts) ? obj.recentFacts : [];

  return {
    me: {
      id: assertString(me.id, "me.id"),
      name: typeof me.name === "string" ? me.name : null,
      email: assertString(me.email, "me.email"),
      image: typeof me.image === "string" ? me.image : null,
      favoriteMovie: typeof me.favoriteMovie === "string" ? me.favoriteMovie : null,
    },
    recentFacts: factsRaw.map((item, index) => {
      const fact = assertObject(item);
      return {
        id: assertString(fact.id, `recentFacts[${index}].id`),
        movie: assertString(fact.movie, `recentFacts[${index}].movie`),
        text: assertString(fact.text, `recentFacts[${index}].text`),
        createdAt: assertString(fact.createdAt, `recentFacts[${index}].createdAt`),
      };
    }),
  };
}

function parseUpdateMovie(payload: unknown): UpdateMovieResponse {
  const obj = assertObject(payload);
  return {
    favoriteMovie: assertString(obj.favoriteMovie, "favoriteMovie"),
  };
}

function parseGetFact(payload: unknown): GetFactResponse {
  const obj = assertObject(payload);
  const factObj = assertObject(obj.fact);

  return {
    fact: {
      id: assertString(factObj.id, "fact.id"),
      movie: assertString(factObj.movie, "fact.movie"),
      text: assertString(factObj.text, "fact.text"),
      createdAt: assertString(factObj.createdAt, "fact.createdAt"),
    },
    cached: Boolean(obj.cached),
  };
}

async function request<T>(
  input: string,
  init: RequestInit | undefined,
  parser: (payload: unknown) => T,
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = await readJson(response);

  if (!response.ok) {
    const message = asErrorMessage(payload) ?? `Request failed with status ${response.status}`;
    throw new ApiClientError(message, response.status);
  }

  return parser(payload);
}

export const apiClient = {
  getMe() {
    return request("/api/me", { method: "GET" }, parseGetMe);
  },

  updateMovie(body: UpdateMovieRequest) {
    return request(
      "/api/me/movie",
      {
        method: "PUT",
        body: JSON.stringify(body),
      },
      parseUpdateMovie,
    );
  },

  getFact(options?: { forceNew?: boolean }) {
    const params = new URLSearchParams();
    if (options?.forceNew) params.set("forceNew", "1");

    return request(`/api/fact${params.toString() ? `?${params.toString()}` : ""}`, { method: "GET" }, parseGetFact);
  },
};
