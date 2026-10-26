import express from "express";
import { authMiddleware } from "../middlewares/authmiddleware.js";
import { validate } from "../middlewares/validatte.middleware.js";
import {
  getConnectionOverview,
  searchConnections,
  sendConnectionRequest,
  acceptConnectionRequest,
  declineConnectionRequest,
  cancelConnectionRequest,
  removeConnection,
} from "../controllers/connection.controller.js";
import {
  sendRequestValidator,
  requestIdValidator,
  friendIdValidator,
  searchConnectionValidator,
} from "../validators/connection.validator.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getConnectionOverview);
router.get("/search", searchConnectionValidator, validate, searchConnections);
router.post("/request", sendRequestValidator, validate, sendConnectionRequest);
router.post("/request/:requestId/accept", requestIdValidator, validate, acceptConnectionRequest);
router.post("/request/:requestId/decline", requestIdValidator, validate, declineConnectionRequest);
router.post("/request/:requestId/cancel", requestIdValidator, validate, cancelConnectionRequest);
router.delete("/:friendId", friendIdValidator, validate, removeConnection);

export default router;
