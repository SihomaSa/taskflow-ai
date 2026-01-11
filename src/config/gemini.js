import { GoogleGenerativeAI } from "@google/generative-ai";

// Obtener API key desde variables de entorno
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error('⚠️ API Key de Gemini no encontrada. Verifica tu archivo .env');
}

// Inicializar Gemini
const genAI = new GoogleGenerativeAI(API_KEY);

// Exportar modelo
export const getGeminiModel = () => {
  return genAI.getGenerativeModel({ model: "gemini-pro" });
};