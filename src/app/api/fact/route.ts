import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateMovieFact } from "@/lib/facts";
import type { GetFactResponse } from "@/types/api";

const FACT_CACHE_TTL_MS = 30_000;
const MAX_REGEN_ATTEMPTS = 6;

function normalizeFactText(value: string): string {
  return value.trim().toLowerCase();
}

type FactRow = {
  id: string;
  movie: string;
  text: string;
  createdAt: Date;
};

function toFactResponse(fact: FactRow, cached: boolean): GetFactResponse {
  return {
    fact: {
      id: fact.id,
      movie: fact.movie,
      text: fact.text,
      createdAt: fact.createdAt.toISOString(),
    },
    cached,
  };
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      favoriteMovie: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!user.favoriteMovie) {
    return NextResponse.json({ error: "Set your favorite movie first" }, { status: 400 });
  }

  const forceNew = req.nextUrl.searchParams.get("forceNew") === "1";

  const latest = await prisma.fact.findFirst({
    where: {
      userId: user.id,
      movie: user.favoriteMovie,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      movie: true,
      text: true,
      createdAt: true,
    },
  });

  if (!forceNew && latest && Date.now() - latest.createdAt.getTime() < FACT_CACHE_TTL_MS) {
    return NextResponse.json(toFactResponse(latest, true));
  }

  try {
    const recentFacts = await prisma.fact.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        movie: true,
        text: true,
      },
    });

    const previousFactsForMovie = recentFacts
      .filter((fact) => fact.movie === user.favoriteMovie)
      .map((fact) => fact.text)
      .slice(0, 8);

    const recentMovies = Array.from(
      new Set(recentFacts.map((fact) => fact.movie).filter((movie) => movie !== user.favoriteMovie)),
    ).slice(0, 6);

    const seenFacts = new Set(previousFactsForMovie.map(normalizeFactText));
    let generatedText = "";

    for (let attempt = 0; attempt < MAX_REGEN_ATTEMPTS; attempt += 1) {
      generatedText = await generateMovieFact(user.favoriteMovie, {
        priorFacts: Array.from(seenFacts),
        recentMovies,
      });

      const normalized = normalizeFactText(generatedText);
      if (!seenFacts.has(normalized)) {
        break;
      }

      seenFacts.add(normalized);
      generatedText = "";
    }

    if (!generatedText && latest) {
      return NextResponse.json(toFactResponse(latest, true));
    }

    const created = await prisma.fact.create({
      data: {
        userId: user.id,
        movie: user.favoriteMovie,
        text: generatedText,
      },
      select: {
        id: true,
        movie: true,
        text: true,
        createdAt: true,
      },
    });

    return NextResponse.json(toFactResponse(created, false));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fact generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
