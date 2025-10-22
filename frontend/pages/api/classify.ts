import type { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const formData = new FormData();
    // @ts-ignore
    const file = req.body.get("file");
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/classify", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      res.status(200).json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error calling FastAPI classify endpoint" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
