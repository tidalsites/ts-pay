import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import Stripe from "stripe";
import cors from "cors";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

app.use(cors({ origin: process.env.CLIENT_URI }));

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2022-08-01",
});

app.get("/invoice/:num", async (req: Request, res: Response) => {
  try {
    // Get all invoices
    const invoices = await stripe.invoices.list();
    // Filter invoices by number
    const target = invoices.data.find((invoice) => {
      return invoice.number === req.params.num;
    });

    if (!target) {
      return res.status(404).json({ error: "Unable to find invoice" });
    }

    // Get ID of invoice
    const invoice_id = target.id || "";

    const invoice = await stripe.invoices.retrieve(invoice_id);

    const data = {
      url: invoice.hosted_invoice_url,
      amount_due: invoice.amount_remaining * 0.01,
    };
    return res.status(200).json(data);
  } catch (e) {
    return res.status(404).json("Invalid invoice");
  }
});

app.post("/invoice", async (req: Request, res: Response) => {
  if (!req.body.invoice) {
    return res.status(400).json({ error: "Invalid Data" });
  }

  try {
    await stripe.invoices.pay(req.body.invoice);
    return res.status(201).json({});
  } catch (e) {
    return res.status(404).json("Invalid invoice");
  }
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
});
