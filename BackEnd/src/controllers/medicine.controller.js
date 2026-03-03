import * as medicineService from "../services/medicines/medicine.service.js";
import * as templateService from "../services/medicines/template.service.js";

/* ---------------- Create Medicine ---------------- */

export const createMedicine = async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Medicine data is required" });
    }

    const medicine = await medicineService.createMedicine(req.body);

    return res.status(201).json({
      success: true,
      data: medicine,
    });
  } catch (error) {
    console.error("Create Medicine Error:", error);
    return res.status(500).json({ message: "Failed to create medicine" });
  }
};

/* ---------------- Search ---------------- */

export const searchMedicines = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const medicines = await medicineService.searchMedicines(q);

    return res.status(200).json({
      success: true,
      count: medicines.length,
      data: medicines,
    });
  } catch (error) {
    console.error("Search Medicines Error:", error);
    return res.status(500).json({ message: "Failed to search medicines" });
  }
};

/* ---------------- Get By ID ---------------- */

export const getMedicineById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Medicine ID is required" });
    }

    const medicine = await medicineService.getMedicineById(id);

    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    return res.status(200).json({
      success: true,
      data: medicine,
    });
  } catch (error) {
    console.error("Get Medicine Error:", error);
    return res.status(500).json({ message: "Failed to fetch medicine" });
  }
};

/* ---------------- Update Medicine ---------------- */

export const updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Medicine ID is required",
      });
    }

    const medicine = await medicineService.updateMedicine(id, req.body);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: medicine,
    });
  } catch (error) {
    console.error("Update Medicine Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update medicine",
    });
  }
};

/* ---------------- Delete Medicine ---------------- */

export const deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Medicine ID is required",
      });
    }

    const medicine = await medicineService.deleteMedicine(id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Medicine deleted successfully",
    });
  } catch (error) {
    console.error("Delete Medicine Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete medicine",
    });
  }
};

/* ---------------- Get All Medicines ---------------- */

export const getAllMedicines = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      isActive,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const result = await medicineService.getAllMedicines({
      page: Number(page),
      limit: Number(limit),
      search,
      isActive,
      sortBy,
      order,
    });

    return res.status(200).json({
      success: true,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      data: result.medicines,
    });
  } catch (error) {
    console.error("Get All Medicines Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch medicines",
    });
  }
};


/* ---------------- Create Template ---------------- */

export const createTemplate = async (req, res) => {
  try {
    const doctorId = req.user?.id;

    if (!doctorId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Template data is required",
      });
    }

    const template = await templateService.createTemplate(
      doctorId,
      req.body
    );

    if (!template) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID",
      });
    }

    return res.status(201).json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error("Create Template Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create template",
    });
  }
};

/* ---------------- Get Templates ---------------- */

export const getTemplates = async (req, res) => {
  try {
    const doctorId = req.user?.id;

    if (!doctorId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const templates = await templateService.getDoctorTemplates(doctorId);

    if (!templates) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID",
      });
    }

    return res.status(200).json({
      success: true,
      count: templates.length,
      data: templates,
    });
  } catch (error) {
    console.error("Get Templates Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch templates",
    });
  }
};

/* ---------------- Delete Template ---------------- */

export const deleteTemplate = async (req, res) => {
  try {
    const doctorId = req.user?.id;
    const templateId = req.params.id;

    if (!doctorId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!templateId) {
      return res.status(400).json({
        success: false,
        message: "Template ID is required",
      });
    }

    const template = await templateService.deleteTemplate(
      doctorId,
      templateId
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found or already deleted",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Template deleted successfully",
    });
  } catch (error) {
    console.error("Delete Template Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete template",
    });
  }
};

/* ---------------- Update Template ---------------- */

export const updateTemplate = async (req, res) => {
  try {
    const doctorId = req.user?.id;
    const templateId = req.params.id;

    if (!doctorId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!templateId) {
      return res.status(400).json({
        success: false,
        message: "Template ID is required",
      });
    }

    const template = await templateService.updateTemplate(
      doctorId,
      templateId,
      req.body
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error("Update Template Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update template",
    });
  }
};

/* ---------------- Match Template Medicine ---------------- */

export const matchTemplateMedicine = async (req, res) => {
  try {
    const doctorId = req.user?.id;

    if (!doctorId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { medicineId, form, strength } = req.query;

    if (!medicineId || !form || !strength) {
      return res.status(400).json({
        success: false,
        message: "medicineId, form and strength are required",
      });
    }

    const match = await templateService.matchTemplateMedicine(
      doctorId,
      medicineId,
      form,
      strength
    );

    if (!match) {
      return res.status(200).json({
        success: true,
        found: false,
      });
    }

    return res.status(200).json({
      success: true,
      found: true,
      data: match,
    });
  } catch (error) {
    console.error("Match Template Medicine Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to match template medicine",
    });
  }
};