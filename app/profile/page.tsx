import type { Metadata } from "next";
import ProfileClient from "./ProfileClient";

export const metadata: Metadata = {
  title: "Profile - Memarne",
  description: "Your Memarne profile.",
};

export default function ProfilePage() {
  return <ProfileClient />;
}
