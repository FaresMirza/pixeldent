const express = require("express");
const UserController = require("../controllers/UserController");

const router = express.Router();

router.put("/postUser",UserController.registerUser)
router.put("/postAdmin", UserController.registerAdmin)




module.exports = router;