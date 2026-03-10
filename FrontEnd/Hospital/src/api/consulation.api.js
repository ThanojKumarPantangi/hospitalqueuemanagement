import api from "./axios";

export const startConsulationApi=(data)=>{
    return api.post("/api/consultations/start",data)
}

export const getConsulationApi=(tokenId)=>{
    return api.get(`/api/consultations/${tokenId}`)
}

export const endConsulationApi=(data)=>{
    return api.post("/api/consultations/end",data)
}

export const turnCredentialsApi=()=>{
    return api.get("/api/turn-credentials")
}