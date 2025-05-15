const express = require('express');
const { protect, adminOnly } = require('../middlewares/authMiddleware');
const {getDashboardData,getUserDashboardData,getTasks,getTaskById,createTask,updateTask,deleteTask,updateTaskChecklist,updateTaskStatus} = require('../controllers/taskController');
const router = express.Router();

//task management routes
router.get("/dashboard-data ", protect, getDashboardData); //get all tasks
router.get("/user-dashboard-data", protect, getUserDashboardData); //get all tasks
router.get("/", protect, getTasks); //get all tasks
router.get("/:id", protect, getTaskById); //get task by id
router.post("/", protect, createTask); //create task
router.put("/:id", protect, updateTask); //update task by id
router.delete("/:id", protect, deleteTask); //delete task by id
router.get("/:id/status", protect, updateTaskStatus); //update task status by id
router.get("/:id/todo", protect, updateTaskChecklist); //update task status by id

module.exports = router;