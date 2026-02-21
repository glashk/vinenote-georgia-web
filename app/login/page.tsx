import type { Metadata } from "next";
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
  return <LoginClient />;
}
