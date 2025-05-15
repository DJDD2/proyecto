const express = require("express");

const { protect, adminOnly } = require("../middlewares/authMiddleware");
const { getUsers, getUserById, deleteUser } = require("../controllers/userController");
//user management routes 
const router = express.Router();

router.get("/", protect , adminOnly ,getUsers); //get all user admin only
router.get("/:id", protect , getUserById); //get user by id admin only
router.delete("/:id", protect , adminOnly , deleteUser); //update user by id admin only

module.exports = router;