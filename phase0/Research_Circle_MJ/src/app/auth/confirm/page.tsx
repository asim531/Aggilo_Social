"use client";

import { Suspense } from "react";
import { AuthConfirmContent } from "./AuthConfirmContent";

export default function AuthConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <p className="text-stone-500">Signing you in…</p>
          </div>
        </div>
      }
    >
      <AuthConfirmContent />
    </Suspense>
  );
}
