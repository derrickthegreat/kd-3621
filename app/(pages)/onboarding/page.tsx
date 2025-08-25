import { redirect } from "next/navigation";

export default function OnboardingRedirect() {
  // Deprecated: onboarding now handled inline via settings modal.
  redirect("/");
}
