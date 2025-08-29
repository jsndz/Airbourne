const express = require('express');

const router = express.Router();

const userController = require('../../controllers/user-controller');
const { AuthRequestValidators } = require('../../middlewares');

router.post(
    '/signup',
    AuthRequestValidators.validateAuthUser,
    userController.create
    );
router.post
(
    '/signin',
    AuthRequestValidators.validateAuthUser,
    userController.signin
    );

router.get(
    '/isAuthenticated',
    userController.isAuthenticated
)

router.get(
    '/dummy',
    (req,res) => {
        return res.status(200).json({message:'OK'})
    }
)

router.get(
    '/isAdmin',
    AuthRequestValidators.validateIsAdminRequest,
    userController.isAdmin
)


module.exports = router;