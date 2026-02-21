import type { Metadata } from "next";
import SignupClient from "./SignupClient";

export const metadata: Metadata = {
  title: "Sign Up - VineNote Georgia",
  description: "Create your VineNote Georgia account.",
  openGraph: {
    title: "Sign Up - VineNote Georgia",
    description: "Create your VineNote Georgia account.",
    url: "https://vinenote.ge/signup",
  },
};

export default function SignupPage() {
  return <SignupClient />;
}
