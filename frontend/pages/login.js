
export default function Login() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <form className="p-8 bg-white rounded shadow-md">
        <h2 className="mb-4 text-2xl font-semibold">Iniciar sesión</h2>
        <input className="w-full p-2 mb-4 border" placeholder="Email" />
        <input className="w-full p-2 mb-4 border" placeholder="Contraseña" type="password" />
        <button className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded">Entrar</button>
      </form>
    </div>
  );
}
