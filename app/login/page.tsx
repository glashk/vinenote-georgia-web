import type { Metadata } from "next";
import { Suspense } from "react";
import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: "Sign In - VineNote Georgia",
  description: "Sign in to your VineNote Georgia account.",
  openGraph: {
    title: "Sign In - VineNote Georgia",
    description: "Sign in to your VineNote Georgia account.",
    url: "https://vinenote.ge/login",
  },
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f4f0] flex justify-center items-center">
          <div className="w-10 h-10 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
