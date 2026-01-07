import {
  sendMessageService,
  getMessagesService,
  markMessagesReadService,
  sendDepartmentAnnouncementService
} from "../services/message.service.js";

/* ============================
   ADMIN → SEND MESSAGE
============================ */
export const sendMessageController = async (req, res) => {
  try {
    const { toUserId, title, content, type, metadata } = req.body;

    if (!toUserId || !content) {
      return res.status(400).json({
        message: "toUserId and content are required",
      });
    }

    const message = await sendMessageService({
      toUserId,
      fromUserId: req.user.id,
      title,
      content,
      type,
      metadata,
    });

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ======================================
   ADMIN → SEND DEPARTMENT ANNOUNCEMENT
====================================== */
export const sendDepartmentAnnouncementController = async (req, res) => {
  try {
    const { departmentId, title, content } = req.body;

    if (!departmentId || !content) {
      return res.status(400).json({
        success: false,
        message: "departmentId and content are required",
      });
    }

    await sendDepartmentAnnouncementService({
      departmentId,
      fromUserId: req.user.id, // admin
      title,
      content,
    });

    return res.status(201).json({
      success: true,
      message: "Department announcement sent successfully",
    });
  } catch (error) {
    console.error("Department announcement error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send department announcement",
    });
  }
};

/* ============================
   USER → GET MESSAGE HISTORY
============================ */
export const getMessagesController = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const result = await getMessagesService({
      userId: req.user.id,
      page: Number(page),
      limit: Number(limit),
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ============================
   USER → MARK AS READ
============================ */
export const markMessagesReadController = async (req, res) => {
  try {
    const { messageIds } = req.body;

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({
        message: "messageIds must be a non-empty array",
      });
    }

    await markMessagesReadService({
      userId: req.user.id,
      messageIds,
    });

    res.json({
      success: true,
      message: "Messages marked as read",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
