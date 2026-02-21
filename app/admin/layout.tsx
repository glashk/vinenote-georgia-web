import AdminLayoutClient from "./AdminLayoutClient";

export const metadata = {
  title: "Admin - VineNote Georgia",
  description: "VineNote admin moderation console",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
