export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FEFEFE] relative overflow-hidden">
      {/* Ambient warm glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 -translate-y-1/3 w-175 h-175 rounded-full bg-[#FF6B35]/6 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-100 h-100 rounded-full bg-[#FF6B35]/4 blur-[100px] pointer-events-none" />
      {children}
    </div>
  );
}
