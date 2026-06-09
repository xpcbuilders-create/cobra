import { Router } from "express";
import { upload } from "../middleware/upload.js";

const router = Router();

router.post(
  "/",
  upload.single("image"),
  async (req: any, res) => {
    try {
      res.json({
        success: true,
        imageUrl: req.file.path,
      });
    } catch (error) {
      res.status(500).json({
        error: "Upload failed",
      });
    }
  }
);

export default router;