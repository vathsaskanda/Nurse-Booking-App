// src/data/mockDatabase.js

export const APP_METRICS = {
  patientsServed: "500+", 
  satisfactionRate: "98%", 
  availability: "24/7", 
  experienceYears: "10+", 
  responseBenchmark: "Under 24 hours" 
};

export const CLINICAL_SERVICES = [
  { id: "med_mgmt", title: "Medication Management", baseRatePerShift: 900, description: "Administration and monitoring of medications.", tags: ["Chronic Illness"] },
  { id: "wound_care", title: "Wound Care & Dressing", baseRatePerShift: 1200, description: "Sterile dressing changes and wound assessment.", tags: ["Post-Op"] },
  { id: "vitals_monitor", title: "Vital Signs Monitoring", baseRatePerShift: 600, description: "Regular checks of blood pressure, pulse, and oxygen.", tags: ["Vitals"] }
];

export const PIPELINE_STEPS = [
  { step: "01", name: "Initial Assessment", desc: "A qualified nurse visits the home to assess medical needs." }, 
  { step: "02", name: "Personalised Care Plan", desc: "Custom care plan based on physician orders." }, 
  { step: "03", name: "Nurse Assignment", desc: "A dedicated nurse is matched and dispatched to your case." }, 
  { step: "04", name: "Active Care Delivery", desc: "Regular visits and ongoing monitoring ensure health milestones are met." } 
];

// NEW: System Users Store for Role Simulation
export const INITIAL_NURSES = [
  {
    id: "NURSE-001",
    name: "Sister Priya Sharma",
    degree: "B.Sc Nursing",
    experience: "5 Years",
    specialisation: "Wound Care & Dressing",
    location: "Koramangala, Bangalore",
    certificateImageName: "verified_document.jpg",
    profileImageName: "priya_profile.jpg",
    profilePreview: "/Gemini_Generated_Image_wu2wddwu2wddwu2w.png",
    certificatePreview: "/Gemini_Generated_Image_lsyagslsyagslsya.png",
    status: "approved" // Pre-approved for instant testing
  }
];

export const ADMIN_CREDENTIALS = {
  username: "admin123",
  password: "password123"
};