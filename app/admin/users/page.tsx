import { Suspense } from "react";
import UsersClient from "./UsersClient";

export default function UsersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-vineyard-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <UsersClient />
    </Suspense>
  );
}
