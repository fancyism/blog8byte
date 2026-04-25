/**
 * Root Admin Layout.
 * Forces dark mode for the entire admin section.
 */
export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      {children}
    </div>
  );
}
