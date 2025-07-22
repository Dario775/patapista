
import { Router } from "express";
const router = Router();

// Placeholder routes
router.get("/pets", (_, res) => res.json([{ id: 1, name: "Firulais" }]));

export default router;
