import { Router } from "express";
import { User } from "../models/User.js";

export function profileRoutes(requireAuth: any) {
  const r = Router();

  r.get("/", requireAuth, async (req: any, res) => {
    const user = await User.findById(req.auth.userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.json({
      name: user.name,
      email: user.email,
    });
  });

  r.put("/", requireAuth, async (req: any, res) => {
    const user = await User.findById(req.auth.userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    user.name = req.body.name || user.name;

    await user.save();

    res.json({
      success: true,
      user,
    });
  });

  return r;
}