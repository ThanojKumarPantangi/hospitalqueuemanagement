import {
  sendMessageService,
  getMessagesService,
  markMessagesReadService,
  sendDepartmentAnnouncementService,
  sendGlobalWaitingPatientsMessageService,
  sendGlobalActiveDoctorsMessageService,
  sendMessageToAdminService,
  replyToThreadService,
  getAdminThreadsService,
  getThreadMessagesService,
  getUserThreadMessagesService,
  getUserThreadsService,
  closeTicketService,
  previewRecipientsService
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

/* ==========================================
   ADMIN → SEND GLOBAL WAITING PATIENTS MESSAGE
========================================== */
export const sendGlobalWaitingPatientsMessageController = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "content is required",
      });
    }

    const messages = await sendGlobalWaitingPatientsMessageService({
      fromUserId: req.user.id, // admin
      title,
      content,
    });

    return res.status(201).json({
      success: true,
      message: "Global waiting patients message sent successfully",
      recipientsCount: messages.length,
    });
  } catch (err) {
    console.error("Global waiting patients message error:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Failed to send global waiting patients message",
    });
  }
};


/* ==========================================
   ADMIN → SEND GLOBAL ACTIVE DOCTORS MESSAGE
========================================== */
export const sendGlobalActiveDoctorsMessageController = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "content is required",
      });
    }

    const messages = await sendGlobalActiveDoctorsMessageService({
      fromUserId: req.user.id, // admin
      title,
      content,
    });

    return res.status(201).json({
      success: true,
      message: "Global active doctors message sent successfully",
      recipientsCount: messages.length,
    });
  } catch (err) {
    console.error("Global active doctors message error:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Failed to send global active doctors message",
    });
  }
};

/* ==========================================
   PATIENT / DOCTOR → SEND MESSAGE TO ADMIN
========================================== */
export const sendMessageToAdminController = async (req, res) => {
  try {
    const { title, content, category = "GENERAL" } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "content is required",
      });
    }

    const message = await sendMessageToAdminService({
      fromUserId: req.user.id,
      fromRole: req.user.role,
      title,
      content,
      category,
    });

    res.status(201).json({
      success: true,
      message: "Message sent to admin",
      data: message,
    });
  } catch (err) {
    res.status(403).json({
      success: false,
      message: err.message,
    });
  }
};

/* ============================
   USER → THREAD LIST
============================ */
export const getUserThreadsController = async (req, res) => {
  try {
    const threads = await getUserThreadsService({
      userId: req.user.id,
    });

    res.json({
      success: true,
      threads,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ============================
   USER → THREAD MESSAGES
============================ */
export const getUserThreadMessagesController = async (req, res) => {
  try {
    const { threadId } = req.params;

    const messages = await getUserThreadMessagesService({
      userId: req.user.id,
      threadId,
    });

    res.json({
      success: true,
      messages,
    });
  } catch (err) {
    res.status(403).json({
      success: false,
      message: err.message,
    });
  }
};

/* ============================
   ADMIN → REPLY TO THREAD
============================ */
export const replyToThreadController = async (req, res) => {
  try {
    const { threadId, title, content, category } = req.body;

    if (!threadId || !content) {
      return res.status(400).json({
        success: false,
        message: "threadId and content are required",
      });
    }

    const reply = await replyToThreadService({
      threadId,
      fromUserId: req.user.id, // ADMIN
      title,
      content,
      category,
    });

    return res.status(201).json({
      success: true,
      message: "Reply sent successfully",
      data: reply,
    });
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: err.message,
    });
  }
};

/* ============================
   ADMIN → THREAD LIST
============================ */
export const getAdminThreadsController = async (req, res) => {
  try {
    const threads = await getAdminThreadsService();

    res.json({
      success: true,
      threads,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ============================
   ADMIN → THREAD MESSAGES
============================ */
export const getThreadMessagesController = async (req, res) => {
  try {
    const { threadId } = req.params;

    const messages = await getThreadMessagesService({
      threadId,
      adminId: req.user.id,
    });

    res.json({
      success: true,
      messages,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ============================
   CLOSE TICKET CONTROLLER
============================ */
export const closeTicketController = async (req, res) => {
  try {
    const { threadId } = req.params;
    const adminId = req.user.id;

    if (!threadId) {
      return res.status(400).json({
        success: false,
        message: "threadId is required",
      });
    }

    const result = await closeTicketService({
      threadId,
      adminId,
    });

    return res.status(200).json({
      success: true,
      message: "Ticket closed successfully",
      data: result,
    });
  } catch (err) {
    console.error("Close ticket failed:", err.message);

    // Known / expected errors
    if (
      err.message === "Only admin can close tickets" ||
      err.message === "Ticket already closed"
    ) {
      return res.status(403).json({
        success: false,
        message: err.message,
      });
    }

    if (err.message === "Ticket not found") {
      return res.status(404).json({
        success: false,
        message: err.message,
      });
    }

    // Fallback
    return res.status(500).json({
      success: false,
      message: "Failed to close ticket",
    });
  }
};

/* ============================
   ADMIN → PREVIEW RECIPIENTS
============================ */
export const previewRecipientsController = async (req, res) => {
  try {
    const { mode, departmentId } = req.query;

    if (!mode) {
      return res.status(400).json({
        success: false,
        message: "mode is required",
      });
    }

    const data = await previewRecipientsService({
      mode,
      departmentId,
    });

    return res.json({
      success: true,
      ...data,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
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
