"use client";
import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="w-full rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white border border-white/15 hover:bg-white/15 transition"
    >
      Sign out
    </button>
  );
}