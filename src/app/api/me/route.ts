import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { GetMeResponse } from "@/types/api";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      favoriteMovie: true,
      facts: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          movie: true,
          text: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user || !user.email) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const response: GetMeResponse = {
    me: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      favoriteMovie: user.favoriteMovie,
    },
    recentFacts: user.facts.map((fact) => ({
      id: fact.id,
      movie: fact.movie,
      text: fact.text,
      createdAt: fact.createdAt.toISOString(),
    })),
  };

  return NextResponse.json(response);
}
