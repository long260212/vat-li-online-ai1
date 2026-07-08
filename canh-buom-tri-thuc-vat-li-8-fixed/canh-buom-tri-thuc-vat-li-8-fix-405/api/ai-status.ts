import { getConfiguredApiKey, setJsonHeaders } from "../api-utils/shared";

export default async function handler(req: any, res: any) {
  setJsonHeaders(res);
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  return res.status(200).json({
    success: true,
    isAvailable: !!getConfiguredApiKey()
  });
}
