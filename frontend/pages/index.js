
import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>PATAPISTA</title>
      </Head>
      <main className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-4xl font-bold">Bienvenido a PATAPISTA</h1>
        <p className="mt-4 text-gray-600">Plataforma de rastreo de mascotas extraviadas.</p>
      </main>
    </>
  );
}
