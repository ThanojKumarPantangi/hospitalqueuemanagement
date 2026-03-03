import api from "./axios";

export const createMedicineApi = async (data) => {
  return await api.post("/api/medicines", data);
};

export const searchMedicinesApi = async (query) => {
  return await api.get("/api/medicines/search", {
    params: { q: query },
  });
};

export const getMedicineByIdApi = async (id) => {
  return await api.get(`/api/medicines/${id}`);
};

export const updateMedicineApi = async (id, data) => {
  return await api.put(`/api/medicines/${id}`, data);
};

export const deleteMedicineApi = async (id) => {
  return await api.delete(`/api/medicines/${id}`);
};

export const getAllMedicineApi = ({
  page = 1,
  limit = 10,
  search = "",
  isActive,
  sortBy = "createdAt",
  order = "desc",
} = {}) => {
  return api.get("/api/medicines", {
    params: {
      page,
      limit,
      search,
      isActive,
      sortBy,
      order,
    },
  });
};


/* ---------------- Create Template ---------------- */
export const createTemplateApi = async (data) => {
  return await api.post("/api/templates", data);
};

/* ---------------- Get All Templates ---------------- */
export const getTemplatesApi = async () => {
  return await api.get("/api/templates");
};

/* ---------------- Update Template ---------------- */
export const updateTemplateApi = async (id, data) => {
  return await api.put(`/api/templates/${id}`, data);
};

/* ---------------- Delete Template ---------------- */
export const deleteTemplateApi = async (id) => {
  return await api.delete(`/api/templates/${id}`);
};

/* ---------------- Match Template Medicine ---------------- */
export const matchTemplateMedicineApi = async ({
  medicineId,
  form,
  strength,
}) => {
  return await api.get("/api/templates/match", {
    params: { medicineId, form, strength },
  });
};