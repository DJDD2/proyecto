const express = require("express");
const { protect, adminOnly } = require("../middlewares/authMiddleware");
const { exportTasksReport, exportUsersReport } = require("../controllers/reportController");
const router = express.Router();
router.get("/export/tasks", protect, adminOnly, exportTasksReport); //export all tasks as excel/pdf
router.get("/export/users", protect, adminOnly, exportUsersReport); //export

module.exports=router;