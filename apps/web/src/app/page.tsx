export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-brand-700">WhatsApp CRM</h1>
      <p className="mt-2 text-gray-600">Multi-tenant platform for Indian SMBs</p>
      <div className="mt-8 flex gap-4">
        <a
          href="/login"
          className="rounded-lg bg-brand-600 px-6 py-3 text-white hover:bg-brand-700"
        >
          Login
        </a>
      </div>
    </main>
  );
}
