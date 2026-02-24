import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Sidebar from "@/app/_components/sidebar";
import DashboardClient from "@/app/_components/dashboard-client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/");
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

  if (!user) {
    redirect("/");
  }

  if (!user.favoriteMovie) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <Sidebar
            name={user.name ?? "Friend"}
            email={user.email ?? session.user.email}
            image={user.image ?? undefined}
          />

          <main className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
              <h1 className="text-3xl font-semibold">Welcome, {user.name ?? "Friend"}.</h1>
            </div>

            <DashboardClient
              initialMovie={user.favoriteMovie}
              initialFacts={user.facts.map((fact) => ({
                id: fact.id,
                movie: fact.movie,
                text: fact.text,
                createdAt: fact.createdAt.toISOString(),
              }))}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
