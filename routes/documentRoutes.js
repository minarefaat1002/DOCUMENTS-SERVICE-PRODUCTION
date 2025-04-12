const express = require("express");
const authenticateJWT = require("../middleware/authMiddleware");
const {
  createDocument,
  getUserDocuments,
  createPermission,
  deletePermission,
} = require("../controllers/documentController");
const {
  handleValidationErrors,
} = require("../middleware/validationMiddleware");
const { documentSchema } = require("../middleware/documentMiddleware");

const { shareSchema } = require("../middleware/shareMiddleware");

const documentRoutes = express.Router();

documentRoutes.post(
  "/create-document",
  authenticateJWT,
  documentSchema,
  handleValidationErrors,
  createDocument
);

documentRoutes.get(
  "/my-documents",
  authenticateJWT,
  handleValidationErrors,
  getUserDocuments
);

documentRoutes.post(
  "/:documentId/share",
  authenticateJWT,
  shareSchema,
  handleValidationErrors,
  createPermission
);

documentRoutes.delete(
  "/:documentId/share/:userId",
  authenticateJWT,
  deletePermission
);


module.exports = documentRoutes;
