import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 flex items-center justify-center gap-3">
          <Image src="/branding/flow_icon.png" alt="Invicly Flow" width={52} height={52} />
          <div className="text-[23px] font-extrabold tracking-tight text-text">
            Invicly <span className="bg-brand-flow bg-clip-text text-transparent">Flow</span>
          </div>
        </div>
        {children}
        <p className="mt-6 text-center text-xs text-text-faint">Plan. Focus. Get Things Done.</p>
      </div>
    </div>
  );
}
