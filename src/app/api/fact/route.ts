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
    const payload: GetFactResponse = {
      fact: {
        id: latest.id,
        movie: latest.movie,
        text: latest.text,
        createdAt: latest.createdAt.toISOString(),
      },
      cached: true,
    };
    return NextResponse.json(payload);
  }

  try {
    const recentFactContext = await prisma.fact.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        movie: true,
        text: true,
      },
    });

    const priorFactsForMovie = recentFactContext
      .filter((fact) => fact.movie === user.favoriteMovie)
      .map((fact) => fact.text)
      .slice(0, 8);

    const recentMovies = Array.from(
      new Set(recentFactContext.map((fact) => fact.movie).filter((movie) => movie !== user.favoriteMovie)),
    ).slice(0, 6);

    const blockedFacts = new Set(priorFactsForMovie.map(normalizeFactText));
    let text = "";

    for (let attempt = 0; attempt < MAX_REGEN_ATTEMPTS; attempt += 1) {
      text = await generateMovieFact(user.favoriteMovie, {
        priorFacts: Array.from(blockedFacts),
        recentMovies,
      });

      const normalized = normalizeFactText(text);
      if (!blockedFacts.has(normalized)) {
        break;
      }

      blockedFacts.add(normalized);
      text = "";
    }

    if (!text && latest) {
      const payload: GetFactResponse = {
        fact: {
          id: latest.id,
          movie: latest.movie,
          text: latest.text,
          createdAt: latest.createdAt.toISOString(),
        },
        cached: true,
      };
      return NextResponse.json(payload);
    }

    const created = await prisma.fact.create({
      data: {
        userId: user.id,
        movie: user.favoriteMovie,
        text,
      },
      select: {
        id: true,
        movie: true,
        text: true,
        createdAt: true,
      },
    });

    const payload: GetFactResponse = {
      fact: {
        id: created.id,
        movie: created.movie,
        text: created.text,
        createdAt: created.createdAt.toISOString(),
      },
      cached: false,
    };

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fact generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
