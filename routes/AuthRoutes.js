const express = require("express");
const UserController = require("../controllers/UserController");

const router = express.Router();

router.post("/postUser",UserController.registerUser)
router.post("/postAdmin", UserController.registerAdmin)
router.post("/login",UserController.loginUser)




module.exports = router;