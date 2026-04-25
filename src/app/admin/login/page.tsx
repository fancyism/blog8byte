import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { AdminLoginForm } from "~/components/admin/AdminLoginForm";

export default async function AdminLoginPage() {
  const session = await auth();

  // If already logged in and admin, redirect to dashboard
  if (session?.user?.role === "admin") {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sage/10 via-background to-background"></div>
      
      <div className="z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Blog<span className="text-terracotta">8byte</span>
          </h1>
        </div>
        <AdminLoginForm />
      </div>
    </div>
  );
}
