import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import * as adminCtrl from "../controllers/admin.controller";

const router = Router();

router.use(authenticate, authorize("ADMIN"));

router.get("/users", adminCtrl.listUsers);
router.post(
  "/users/instructor",
  adminCtrl.createInstructorValidation,
  validate,
  adminCtrl.createInstructor
);
router.patch("/users/:userId/approve", adminCtrl.approveStudent);
router.delete("/users/:userId", adminCtrl.deleteUser);

export default router;
