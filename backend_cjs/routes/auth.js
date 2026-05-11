const { Router } = require('express')
const { register, login } = require('../controllers/authController')
const router = Router();
router.post('/register', register); // Admin can create users; or open for first user
router.post('/login', login);
module.exports = router;
