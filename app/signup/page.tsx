import type { Metadata } from "next";
import { Suspense } from "react";
import SignupClient from "./SignupClient";

export const metadata: Metadata = {
  title: "Sign Up - Memarne",
  description: "Create your Memarne account.",
  openGraph: {
    title: "Sign Up - Memarne",
    description: "Create your Memarne account.",
    url: "https://vinenote.app/signup",
  },
};

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f4f0] flex justify-center items-center">
          <div className="w-10 h-10 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SignupClient />
    </Suspense>
  );
}
