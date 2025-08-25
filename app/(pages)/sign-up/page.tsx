"use client"

import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-2xl font-semibold text-white">Create your account</h1>
        <p className="text-sm text-muted-foreground">Join Kingdom 3621</p>
        <SignUp appearance={{ variables: { colorPrimary: "#f97316" } }} routing="path" path="/sign-up" signInUrl="/sign-in" />
      </div>
    </div>
  )
}
