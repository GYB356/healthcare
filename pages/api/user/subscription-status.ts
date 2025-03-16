import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import prisma from "../../../lib/prisma";
import Redis from "ioredis";

// Initialize Redis for caching
const redis = new Redis(process.env.REDIS_URL || "");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  const session = await getSession({ req });

  if (!session?.user?.email) return res.status(401).json({ error: "Unauthorized" });

  // Check cache first
  const cachedData = await redis.get(`subscription:${session.user.email}`);
  if (cachedData) return res.status(200).json(JSON.parse(cachedData));

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isSubscribed: true },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    // Cache the result for 1 hour
    await redis.set(`subscription:${session.user.email}`, JSON.stringify({ isSubscribed: user.isSubscribed }), "EX", 3600);

    return res.status(200).json({ isSubscribed: user.isSubscribed });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
