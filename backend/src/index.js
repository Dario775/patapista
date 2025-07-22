
import express from "express";
import cors from "cors";
import routes from "./routes.js";
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use("/api", routes);

app.get("/", (_, res) => res.json({ status: "PATAPISTA backend running" }));

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
