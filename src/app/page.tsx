import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SignOutButton from "@/app/_components/sign-out-button";
import GoogleSignInButton from "@/app/_components/google-sign-in-button";

const authErrorMessages: Record<string, string> = {
  google:
    "Google sign-in failed. Check your Google OAuth redirect URI and database connection, then try again.",
  OAuthCallback:
    "OAuth callback failed. This commonly happens when the callback URL or provider credentials are misconfigured.",
  Configuration: "Auth configuration is invalid. Check your NEXTAUTH and Google environment variables.",
  AccessDenied: "Sign-in was denied by the provider.",
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { error } = await searchParams;
  const errorMessage = error ? authErrorMessages[error] ?? `Authentication failed: ${error}` : null;

  return (
    <main className="min-h-screen bg-[#0b0b0f] text-white">
      <header className="border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-pink-500 to-orange-400 font-black">
              MM
            </div>
            <p className="text-sm font-semibold">Movie Memory</p>
          </div>

          {session && (
            <div className="flex items-center gap-3">
              <Link
                href="/auth/redirect"
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200"
              >
                Continue
              </Link>
              <SignOutButton />
            </div>
          )}
        </div>
      </header>

      <section className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(800px_400px_at_20%_20%,rgba(255,0,80,0.18),transparent_60%),radial-gradient(700px_380px_at_80%_20%,rgba(255,140,0,0.12),transparent_55%)]" />

        <div className="relative mx-auto max-w-6xl px-6 py-16">
          <div className="max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
            <h1 className="mt-3 text-4xl font-black tracking-tight">Movie Memory</h1>
            <p className="mt-4 text-white/70">
              Sign in with Google, save your favorite movie, and generate fun facts using OpenAI.
            </p>
            {errorMessage && (
              <div className="mt-4 rounded-xl border border-red-300/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {errorMessage}
              </div>
            )}

            <div className="mt-7 flex flex-wrap gap-3">
              {!session ? (
                <GoogleSignInButton />
              ) : (
                <Link
                  href="/auth/redirect"
                  className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-zinc-200"
                >
                  Go to app
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
