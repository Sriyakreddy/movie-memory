import Link from "next/link";
import SignOutButton from "@/app/_components/sign-out-button";

export default function Sidebar({
  name,
  email,
  image,
}: {
  name: string;
  email: string;
  image?: string;
}) {
  return (
    <aside className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500 to-amber-400 font-bold">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="avatar" className="h-full w-full object-cover" />
          ) : (
            "MM"
          )}
        </div>
        <div>
          <div className="font-semibold">{name}</div>
          <div className="text-xs text-white/60">{email}</div>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <Link
          href="/dashboard"
          className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold transition hover:bg-white/10"
        >
          Dashboard
        </Link>

        <Link
          href="/dashboard#favorite"
          className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold transition hover:bg-white/10"
        >
          Favorite
        </Link>

        <Link
          href="/dashboard#facts"
          className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold transition hover:bg-white/10"
        >
          Facts
        </Link>
      </div>

      <div className="mt-6">
        <SignOutButton />
      </div>
    </aside>
  );
}
