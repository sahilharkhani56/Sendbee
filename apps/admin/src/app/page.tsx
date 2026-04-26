export default function AdminHome() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-admin-700">Super Admin Panel</h1>
      <p className="mt-2 text-gray-600">WhatsApp CRM Platform Administration</p>
      <div className="mt-8 flex gap-4">
        <a
          href="/login"
          className="rounded-lg bg-admin-600 px-6 py-3 text-white hover:bg-admin-700"
        >
          Admin Login
        </a>
      </div>
    </main>
  );
}
