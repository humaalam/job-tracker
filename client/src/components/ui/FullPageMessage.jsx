// Centred message for whole-page states (loading, can't reach the server).
export default function FullPageMessage({ children }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center text-slate-600">
      {children}
    </div>
  );
}
