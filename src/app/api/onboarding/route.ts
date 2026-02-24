import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeMovieInput, validateMovieInput } from "@/lib/movie";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const favoriteMovie = normalizeMovieInput(body?.favoriteMovie);
  const validationError = validateMovieInput(favoriteMovie);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  await prisma.user.update({
    where: { email: session.user.email },
    data: { favoriteMovie },
  });

  return NextResponse.json({ ok: true });
}
