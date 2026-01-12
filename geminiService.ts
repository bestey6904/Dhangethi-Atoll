
import { GoogleGenAI, Type } from "@google/genai";
import { Booking, Room } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getSmartSummary = async (bookings: Booking[], rooms: Room[]) => {
  if (!process.env.API_KEY) return "AI Summary unavailable (API Key not set).";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a hotel management assistant at Dhangethi Atoll. 
      Analyze the current status and provide a professional 2-sentence summary.
      Highlight if any upcoming guest check-ins are missing speedboat transfer bookings or if there are multiple transfers today.
      Rooms: ${JSON.stringify(rooms.map(r => ({ name: r.name, status: r.status })))}
      Bookings: ${JSON.stringify(bookings.map(b => ({ 
        guest: b.guestName, 
        start: b.startDate, 
        hasTransfer: b.hasTransfer, 
        transferTime: b.transferDetails?.time,
        transferStatus: b.transferDetails?.status
      })))}`,
      config: {
        temperature: 0.7,
      }
    });
    return response.text || "No summary available.";
  } catch (error) {
    console.error("Gemini summary error:", error);
    return "Failed to fetch smart summary.";
  }
};
