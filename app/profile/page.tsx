import type { Metadata } from "next";
import ProfileClient from "./ProfileClient";

export const metadata: Metadata = {
  title: "Profile - VineNote Georgia",
  description: "Your VineNote Georgia profile.",
};

export default function ProfilePage() {
  return <ProfileClient />;
}
