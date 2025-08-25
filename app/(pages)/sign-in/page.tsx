"use client"

import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-2xl font-semibold text-white">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to continue</p>
        <SignIn appearance={{ variables: { colorPrimary: "#f97316" } }} routing="path" path="/sign-in" signUpUrl="/sign-up" />
      </div>
    </div>
  )
}
