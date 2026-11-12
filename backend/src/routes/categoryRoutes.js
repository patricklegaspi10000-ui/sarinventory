const express = require("express");
const auth = require("../middleware/auth");
const requireOwner = require("../middleware/requireOwner");
const { list, create, update, remove } = require("../controllers/categoryController");

const router = express.Router();

router.use(auth);

router.get("/", list);
router.post("/", requireOwner, create);
router.put("/:id", requireOwner, update);
router.delete("/:id", requireOwner, remove);

module.exports = router;