
import { useEffect, useMemo, useState } from "react";
import Head from "next/head";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000/api";

const formatCurrency = (value) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(value);

const DistributorNode = ({ distributor, onSelect }) => {
  return (
    <li className="border-l border-gray-300 pl-4">
      <button
        className="w-full text-left"
        onClick={() => onSelect(distributor.id)}
      >
        <div className="rounded border border-blue-200 bg-blue-50 p-3 transition hover:border-blue-400 hover:bg-blue-100">
          <h4 className="font-semibold text-blue-900">{distributor.name}</h4>
          <p className="text-sm text-blue-700">
            Nivel {distributor.metrics.level} · Ventas personales: {formatCurrency(distributor.metrics.personalSales)}
          </p>
          <p className="text-sm text-blue-700">
            Equipo: {formatCurrency(distributor.metrics.teamSales)} · Comisión estimada: {formatCurrency(distributor.metrics.commission)}
          </p>
        </div>
      </button>
      {distributor.downline.length > 0 && (
        <ul className="ml-4 mt-2 space-y-2 border-l border-dashed border-gray-200 pl-4">
          {distributor.downline.map((child) => (
            <DistributorNode key={child.id} distributor={child} onSelect={onSelect} />
          ))}
        </ul>
      )}
    </li>
  );
};

const DistributorSelect = ({ distributors, value, onChange }) => {
  return (
    <select
      className="w-full rounded border border-gray-300 px-3 py-2"
      value={value ?? ""}
      onChange={(event) =>
        onChange(event.target.value ? Number(event.target.value) : null)
      }
    >
      <option value="">Sin patrocinador (nivel raíz)</option>
      {distributors.map((distributor) => (
        <option key={distributor.id} value={distributor.id}>
          {distributor.name}
        </option>
      ))}
    </select>
  );
};

const flattenDistributors = (network) => {
  const all = [];

  const traverse = (distributor) => {
    all.push(distributor);
    distributor.downline.forEach(traverse);
  };

  network.forEach(traverse);

  return all;
};

export default function Home() {
  const [network, setNetwork] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDistributorId, setSelectedDistributorId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    sponsorId: null,
    city: "",
  });

  const [saleData, setSaleData] = useState({ amount: "", product: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchNetwork = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/distributors`);

      if (!response.ok) {
        throw new Error("No se pudo cargar la red de distribuidores");
      }

      const data = await response.json();
      setNetwork(data.distributors ?? []);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNetwork();
  }, []);

  const allDistributors = useMemo(() => flattenDistributors(network), [network]);

  const selectedDistributor = useMemo(
    () =>
      allDistributors.find((distributor) => distributor.id === selectedDistributorId) ??
      null,
    [allDistributors, selectedDistributorId]
  );

  useEffect(() => {
    if (!selectedDistributorId && allDistributors.length > 0) {
      setSelectedDistributorId(allDistributors[0].id);
    }
  }, [allDistributors, selectedDistributorId]);

  const handleCreateDistributor = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/distributors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message ?? "No se pudo crear el distribuidor");
      }

      const distributor = await response.json();
      setFormData({ name: "", email: "", phone: "", sponsorId: null, city: "" });
      setSaleData({ amount: "", product: "" });
      await fetchNetwork();
      setSelectedDistributorId(distributor.id);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSale = async (event) => {
    event.preventDefault();

    if (!selectedDistributor) {
      setError("Selecciona un distribuidor para registrar la venta");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE}/distributors/${selectedDistributor.id}/sales`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: Number(saleData.amount),
            product: saleData.product,
          }),
        }
      );

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message ?? "No se pudo registrar la venta");
      }

      const { distributor } = await response.json();
      setSaleData({ amount: "", product: "" });
      await fetchNetwork();
      setSelectedDistributorId(distributor.id);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Red de ventas de cinta adhesiva</title>
      </Head>
      <main className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-6xl space-y-10">
          <header className="flex flex-col gap-4 text-center md:flex-row md:items-end md:justify-between md:text-left">
            <div>
              <h1 className="text-4xl font-bold text-slate-900">
                Red Multinivel de Cinta Adhesiva
              </h1>
              <p className="mt-2 max-w-xl text-slate-600">
                Gestiona distribuidores, visualiza la estructura de tu equipo y estima las comisiones de ventas.
              </p>
            </div>
            <div className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
              Datos de demostración
            </div>
          </header>

          {error && (
            <div className="rounded border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2">
              <section className="space-y-6">
                <div className="rounded-lg bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-800">Mapa de la red</h2>
                  {network.length === 0 ? (
                    <p className="mt-4 text-sm text-slate-500">
                      Aún no hay distribuidores registrados.
                    </p>
                  ) : (
                    <ul className="mt-4 space-y-4">
                      {network.map((distributor) => (
                        <DistributorNode
                          key={distributor.id}
                          distributor={distributor}
                          onSelect={setSelectedDistributorId}
                        />
                      ))}
                    </ul>
                  )}
                </div>

                <div className="rounded-lg bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-800">Registrar nuevo distribuidor</h2>
                  <form className="mt-4 space-y-4" onSubmit={handleCreateDistributor}>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Nombre
                      </label>
                      <input
                        className="w-full rounded border border-gray-300 px-3 py-2"
                        value={formData.name}
                        onChange={(event) =>
                          setFormData((state) => ({ ...state, name: event.target.value }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Correo electrónico
                      </label>
                      <input
                        type="email"
                        className="w-full rounded border border-gray-300 px-3 py-2"
                        value={formData.email}
                        onChange={(event) =>
                          setFormData((state) => ({ ...state, email: event.target.value }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Teléfono
                      </label>
                      <input
                        className="w-full rounded border border-gray-300 px-3 py-2"
                        value={formData.phone}
                        onChange={(event) =>
                          setFormData((state) => ({ ...state, phone: event.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Ciudad
                      </label>
                      <input
                        className="w-full rounded border border-gray-300 px-3 py-2"
                        value={formData.city}
                        onChange={(event) =>
                          setFormData((state) => ({ ...state, city: event.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Patrocinador
                      </label>
                      <DistributorSelect
                        distributors={allDistributors}
                        value={formData.sponsorId}
                        onChange={(sponsorId) =>
                          setFormData((state) => ({ ...state, sponsorId }))
                        }
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full rounded bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Guardando..." : "Agregar distribuidor"}
                    </button>
                  </form>
                </div>
              </section>

              <section className="space-y-6">
                <div className="rounded-lg bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-800">Resumen del distribuidor</h2>
                  {selectedDistributor ? (
                    <article className="mt-4 space-y-4">
                      <div>
                        <h3 className="text-2xl font-semibold text-slate-900">
                          {selectedDistributor.name}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {selectedDistributor.email}
                          {selectedDistributor.city && ` · ${selectedDistributor.city}`}
                        </p>
                      </div>
                      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="rounded border border-slate-200 bg-slate-50 p-4">
                          <dt className="text-xs uppercase tracking-wide text-slate-500">
                            Ventas personales
                          </dt>
                          <dd className="text-lg font-semibold text-slate-900">
                            {formatCurrency(selectedDistributor.metrics.personalSales)}
                          </dd>
                        </div>
                        <div className="rounded border border-slate-200 bg-slate-50 p-4">
                          <dt className="text-xs uppercase tracking-wide text-slate-500">
                            Ventas de equipo
                          </dt>
                          <dd className="text-lg font-semibold text-slate-900">
                            {formatCurrency(selectedDistributor.metrics.teamSales)}
                          </dd>
                        </div>
                        <div className="rounded border border-slate-200 bg-slate-50 p-4">
                          <dt className="text-xs uppercase tracking-wide text-slate-500">
                            Comisión estimada
                          </dt>
                          <dd className="text-lg font-semibold text-emerald-600">
                            {formatCurrency(selectedDistributor.metrics.commission)}
                          </dd>
                        </div>
                        <div className="rounded border border-slate-200 bg-slate-50 p-4">
                          <dt className="text-xs uppercase tracking-wide text-slate-500">
                            Nivel dentro de la red
                          </dt>
                          <dd className="text-lg font-semibold text-slate-900">
                            {selectedDistributor.metrics.level}
                          </dd>
                        </div>
                      </dl>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700">Miembros del equipo</h4>
                        {selectedDistributor.downline.length === 0 ? (
                          <p className="mt-2 text-sm text-slate-500">
                            Aún no tiene personas en su red.
                          </p>
                        ) : (
                          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                            {selectedDistributor.downline.map((member) => (
                              <li key={member.id}>
                                {member.name} · Ventas {formatCurrency(member.metrics.personalSales)}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </article>
                  ) : (
                    <p className="mt-4 text-sm text-slate-500">
                      Selecciona un distribuidor para ver el resumen de su desempeño.
                    </p>
                  )}
                </div>

                <div className="rounded-lg bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-800">Registrar venta</h2>
                  <form className="mt-4 space-y-4" onSubmit={handleRegisterSale}>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Distribuidor
                      </label>
                      <DistributorSelect
                        distributors={allDistributors}
                        value={selectedDistributorId}
                        onChange={setSelectedDistributorId}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Monto de la venta (MXN)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full rounded border border-gray-300 px-3 py-2"
                        value={saleData.amount}
                        onChange={(event) =>
                          setSaleData((state) => ({ ...state, amount: event.target.value }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Producto
                      </label>
                      <input
                        className="w-full rounded border border-gray-300 px-3 py-2"
                        value={saleData.product}
                        onChange={(event) =>
                          setSaleData((state) => ({ ...state, product: event.target.value }))
                        }
                        placeholder="Ej. Cinta reforzada premium"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full rounded bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Registrando..." : "Registrar venta"}
                    </button>
                  </form>
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
