
export default function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Red Adhesiva</h1>
          <p className="mt-2 text-sm text-slate-500">
            Accede a tu panel de distribuidor y gestiona tu red de ventas.
          </p>
        </div>
        <form className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Correo electrónico
            </label>
            <input
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="tu@correo.com"
              type="email"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Contraseña
            </label>
            <input
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="••••••••"
              type="password"
            />
          </div>
          <button className="w-full rounded bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700">
            Entrar
          </button>
          <p className="text-center text-xs text-slate-400">
            Demo sin autenticación real.
          </p>
        </form>
      </div>
    </div>
  );
}
