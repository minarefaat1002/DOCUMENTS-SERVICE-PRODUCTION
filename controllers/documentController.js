const { models } = require("../models/models");
const PermissionEnum = require("../types/enums/permission-enum");
const { conf, transporter, BUCKET_NAME, s3 } = require("../conf");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const yjs = require("yjs");

const createDocument = async (req, res) => {
  const Document = models.Document;
  const Permission = models.Permission;
  try {
    const userId = req.user.userId;
    const title = req.body.title;

    const document = await Document.create({
      userId: userId,
      title: title,
    });

    const permission = await Permission.create({
      userId: userId,
      documentId: document.id,
      permissionType: PermissionEnum.OWNER,
    });
    const ydoc = new yjs.Doc();
    const ytext = ydoc.getText("quill");
    ytext.insert(0, "");
    const yDocState = yjs.encodeStateAsUpdate(ydoc);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `${document.id}`,
      Body: Buffer.from(yDocState),
    });

    await s3.send(command);

    res.status(201).json({ message: "Document Created successfully" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Something went wrong, please try again" });
  }
};

const getUserDocuments = async (req, res) => {
  const Permission = models.Permission;
  const User = models.User;
  const Document = models.Document;

  try {
    const userId = req.user.userId;
    const permissions = await Permission.findAll({
      where: { userId: userId },
      include: [
        { model: Document }, // load all documents
        {
          model: User,
          attributes: ["email"], // Only these columns from User
        },
      ],
    });

    // Extract just the documents
    const documents = permissions.map((perm) =>
      Object.assign(perm.Document["dataValues"], perm.User["dataValues"])
    );

    // // Extract just the document data
    return res.status(200).json({
      documents,
    });
  } catch (e) {
    res.status(400).json({
      message: "something went wrong, please try again.",
    });
  }
};

const createPermission = async (req, res) => {
  const Document = models.Document;
  const Permission = models.Permission;
  const User = models.User;
  try {
    const { documentId } = req.params;
    const document = await Document.findByPk(documentId);
    if (!document) return res.sendStatus(400);
    const userId = req.user.userId;
    if (userId != document.userId) return res.status(403);
    const { email, permission } = req.body;
    const sharedUser = await User.findOne({
      where: {
        email: email,
      },
    });
    if (!sharedUser) return res.sendStatus(400);
    await Permission.destroy({
      where: {
        userId: sharedUser.id,
        documentId: documentId,
      },
    });
    const p = await Permission.create({
      documentId: documentId,
      userId: sharedUser.id,
      permissionType: permission,
    });
    const mail = {
      from: "minarefaat1002@gmail.com",
      to: sharedUser.email,
      subject: `${req.user.email} shared a document with you!`,
      text: `Click the following link to view and edit the document : ${conf.secret.FRONTEND_URL}/documents/${documentId}`,
    };
    await transporter.transporter.sendMail(mail);
    return res.status(201).json(p);
  } catch (e) {
    console.log(e);
  }
};

const deletePermission = async (req, res) => {
  const Document = models.Document;
  const Permission = models.Permission;
  const { documentId, userId } = req.params;
  const document = await Document.findOne({
    where: {
      id: documentId,
      UserId: req.user.userId,
    },
  });

  if (!document) return res.sendStatus(400);
  if (userId != document.userId) return res.status(403);

  const p = await Permission.destroy({
    where: {
      documentId,
      userId,
    },
  });

  if (!p) return res.sendStatus(400);
  return res.sendStatus(200);
};

module.exports = {
  createDocument,
  getUserDocuments,
  createPermission,
  deletePermission,
};
