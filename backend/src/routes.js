
import { Router } from "express";

const router = Router();

// In-memory data stores ----------------------------------------------------
let nextDistributorId = 6;
let nextSaleId = 6;

const distributors = new Map(
  [
    {
      id: 1,
      name: "Laura Adhesiva",
      email: "laura@adhesivos.mx",
      phone: "+52 55 5555 0101",
      sponsorId: null,
      city: "Ciudad de México",
    },
    {
      id: 2,
      name: "Carlos Pegatinas",
      email: "carlos@adhesivos.mx",
      phone: "+52 55 5555 0202",
      sponsorId: 1,
      city: "Guadalajara",
    },
    {
      id: 3,
      name: "Mariana Tape",
      email: "mariana@adhesivos.mx",
      phone: "+52 55 5555 0303",
      sponsorId: 1,
      city: "Monterrey",
    },
    {
      id: 4,
      name: "Sergio Rollos",
      email: "sergio@adhesivos.mx",
      phone: "+52 55 5555 0404",
      sponsorId: 2,
      city: "Querétaro",
    },
    {
      id: 5,
      name: "Daniela Sellos",
      email: "daniela@adhesivos.mx",
      phone: "+52 55 5555 0505",
      sponsorId: 3,
      city: "Puebla",
    },
  ].map((distributor) => [distributor.id, distributor])
);

const sales = new Map(
  [
    {
      id: 1,
      distributorId: 1,
      amount: 2800,
      product: "Cinta adhesiva industrial",
      date: "2024-04-01",
    },
    {
      id: 2,
      distributorId: 2,
      amount: 1500,
      product: "Pack de cintas resistentes",
      date: "2024-04-07",
    },
    {
      id: 3,
      distributorId: 3,
      amount: 950,
      product: "Cinta transparente premium",
      date: "2024-04-08",
    },
    {
      id: 4,
      distributorId: 4,
      amount: 600,
      product: "Cinta doble cara",
      date: "2024-04-10",
    },
    {
      id: 5,
      distributorId: 5,
      amount: 450,
      product: "Mini rollos promocionales",
      date: "2024-04-11",
    },
  ].map((sale) => [sale.id, sale])
);

// Utility helpers ----------------------------------------------------------
const getDirectReports = (sponsorId) =>
  Array.from(distributors.values()).filter(
    (distributor) => distributor.sponsorId === sponsorId
  );

const getSalesForDistributor = (id) =>
  Array.from(sales.values()).filter((sale) => sale.distributorId === id);

const personalSalesTotal = (id) =>
  getSalesForDistributor(id).reduce((total, sale) => total + sale.amount, 0);

const buildTeam = (rootId, level = 0) => {
  const distributor = distributors.get(rootId);

  if (!distributor) {
    return null;
  }

  const downline = getDirectReports(rootId)
    .map((child) => buildTeam(child.id, level + 1))
    .filter(Boolean);

  const teamSales = downline.reduce(
    (total, member) => total + member.metrics.teamSales + member.metrics.personalSales,
    0
  );

  const metrics = {
    level,
    personalSales: personalSalesTotal(rootId),
    teamSales,
  };

  metrics.commission = calculateCommission(metrics.personalSales, downline);

  return {
    ...distributor,
    metrics,
    downline,
  };
};

const calculateCommission = (personalSales, downline, level = 1) => {
  const PERSONAL_RATE = 0.1;
  const LEVEL_1_RATE = 0.05;
  const LEVEL_2_RATE = 0.02;
  const LEVEL_3_PLUS_RATE = 0.01;

  const personalCommission = personalSales * PERSONAL_RATE;

  const teamCommission = downline.reduce((total, member) => {
    const rate =
      level === 1
        ? LEVEL_1_RATE
        : level === 2
        ? LEVEL_2_RATE
        : LEVEL_3_PLUS_RATE;

    const directCommission = member.metrics.personalSales * rate;

    return (
      total +
      directCommission +
      calculateCommission(0, member.downline, level + 1)
    );
  }, 0);

  return personalCommission + teamCommission;
};

const buildNetwork = () =>
  Array.from(distributors.values())
    .filter((distributor) => distributor.sponsorId === null)
    .map((distributor) => buildTeam(distributor.id));

// Routes -------------------------------------------------------------------
router.get("/distributors", (_, res) => {
  res.json({
    updatedAt: new Date().toISOString(),
    distributors: buildNetwork(),
  });
});

router.get("/distributors/:id", (req, res) => {
  const id = Number(req.params.id);
  const distributor = buildTeam(id);

  if (!distributor) {
    return res.status(404).json({ message: "Distribuidor no encontrado" });
  }

  res.json(distributor);
});

router.get("/distributors/:id/sales", (req, res) => {
  const id = Number(req.params.id);

  if (!distributors.has(id)) {
    return res.status(404).json({ message: "Distribuidor no encontrado" });
  }

  res.json({
    distributorId: id,
    sales: getSalesForDistributor(id),
  });
});

router.post("/distributors", (req, res) => {
  const { name, email, phone, sponsorId, city } = req.body ?? {};

  if (!name || !email) {
    return res
      .status(400)
      .json({ message: "Nombre y correo electrónico son obligatorios" });
  }

  if (sponsorId && !distributors.has(Number(sponsorId))) {
    return res
      .status(400)
      .json({ message: "El patrocinador especificado no existe" });
  }

  const id = nextDistributorId++;
  const newDistributor = {
    id,
    name,
    email,
    phone: phone ?? "",
    sponsorId: sponsorId ? Number(sponsorId) : null,
    city: city ?? "",
  };

  distributors.set(id, newDistributor);

  res.status(201).json(buildTeam(id));
});

router.post("/distributors/:id/sales", (req, res) => {
  const distributorId = Number(req.params.id);
  const { amount, product, date } = req.body ?? {};

  if (!distributors.has(distributorId)) {
    return res.status(404).json({ message: "Distribuidor no encontrado" });
  }

  const parsedAmount = Number(amount);

  if (!parsedAmount || parsedAmount <= 0) {
    return res
      .status(400)
      .json({ message: "El monto de la venta debe ser un número positivo" });
  }

  const id = nextSaleId++;

  const sale = {
    id,
    distributorId,
    amount: parsedAmount,
    product: product ?? "Venta de cinta adhesiva",
    date: date ?? new Date().toISOString().slice(0, 10),
  };

  sales.set(id, sale);

  res.status(201).json({
    distributor: buildTeam(distributorId),
    sale,
  });
});

export default router;
