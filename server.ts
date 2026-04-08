import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { OpenAI } from "openai";
import dotenv from "dotenv";

dotenv.config();

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || "sk-53e648ad61794ca387b1d99ad1198bff", // Fallback for immediate use
  baseURL: "https://api.deepseek.com",
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Route for DeepSeek Search
  app.post("/api/deepseek/search", async (req, res) => {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }
    try {
      console.log(`DeepSeek Search Request for: ${query}`);
      const response = await deepseek.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          { 
            role: "system", 
            content: `Sei un esperto naturalista e geologo. Fornisci una diagnosi professionale e ordinata.
            
Usa SEMPRE questo formato Markdown pulito:

# [CLASSE] Oggetto diagnosticato

### 1. Identificazione
**Nome comune:** [Nome]
**Nome scientifico:** *[Nome Scientifico]*

### 2. Caratteristiche Visive
[Descrizione dettagliata in paragrafi ordinati]

### 3. Varianti e Stadi Vitali
[Descrizione delle varianti o "Nessuna variante nota"]

### 4. Stato di Salute
**Diagnosi:** [Sano / Attacco lieve / etc.]
[Dettagli sullo stato di salute]

### 5. Diagnosi Differenziale
[Con cosa si potrebbe confondere e come distinguerlo]

### 6. Cure e Trattamenti
*   **Biologiche:** [Consigli]
*   **Chimiche:** [Consigli]
*   **Meccaniche:** [Consigli]
*   **Culturali:** [Consigli]

REGOLE LOGICHE:
- Se non riconosci la specie -> indica almeno la classe tassonomica.
- Se salute sconosciuta -> indica "da verificare con test".
- Sicurezza: per elementi pericolosi aggiungi un box di avviso: > ⚠️ **ATTENZIONE:** [Pericolo]` 
          },
          { role: "user", content: `Fornisci una scheda tecnica dettagliata per l'elemento naturale: "${query}".` }
        ],
      });
      res.json({ text: response.choices[0].message.content });
    } catch (error: any) {
      if (error.status !== 402) {
        console.error("DeepSeek Search Error:", error.message);
      }
      res.status(200).json({ 
        text: null, 
        error: "DeepSeek unavailable",
        fallback: true 
      });
    }
  });

  // API Route for DeepSeek Enhancement (after Gemini vision)
  app.post("/api/deepseek/enhance", async (req, res) => {
    const { geminiResult } = req.body;
    if (!geminiResult) {
      return res.status(400).json({ error: "geminiResult is required" });
    }
    try {
      console.log(`DeepSeek Enhance Request received`);
      const response = await deepseek.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          { 
            role: "system", 
            content: `Sei un esperto naturalista. Trasforma i dati di identificazione in una scheda professionale e ordinata.

Usa SEMPRE questo formato Markdown pulito:

# [CLASSE] Oggetto diagnosticato

### 1. Identificazione
**Nome comune:** [Nome]
**Nome scientifico:** *[Nome Scientifico]*

### 2. Caratteristiche Visive
[Descrizione dettagliata in paragrafi]

### 3. Varianti e Stadi Vitali
[Descrizione]

### 4. Stato di Salute
**Diagnosi:** [Stato]
[Dettagli]

### 5. Diagnosi Differenziale
[Dettagli]

### 6. Cure e Trattamenti
*   **Biologiche:** [Consigli]
*   **Chimiche:** [Consigli]
*   **Meccaniche:** [Consigli]
*   **Culturali:** [Consigli]

REGOLE:
- Se salute sconosciuta -> "da verificare con test".
- Sicurezza: aggiungi un box di avviso > ⚠️ **ATTENZIONE:** se pericoloso.` 
          },
          { role: "user", content: `Ecco i dati dell'identificazione: ${geminiResult}. Elaborali seguendo rigorosamente lo schema.` }
        ],
      });
      res.json({ text: response.choices[0].message.content });
    } catch (error: any) {
      if (error.status !== 402) {
        console.error("DeepSeek Enhance Error:", error.message);
      }
      res.status(200).json({ 
        text: geminiResult, 
        error: "DeepSeek unavailable",
        fallback: true 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Global Server Error:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  });
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer();
