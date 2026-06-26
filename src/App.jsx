import React, { useState } from 'react';
import { CLINICAL_SERVICES, PIPELINE_STEPS, INITIAL_NURSES, ADMIN_CREDENTIALS, APP_METRICS } from './data/mockDatabase';

// Decorative icon map for the service catalogue (purely visual, keyed by existing service ids)
const SERVICE_ICONS = {
  med_mgmt: '💊',
  wound_care: '🩹',
  vitals_monitor: '🩺'
};

export default function App() {
  // Global Role Routing States: 'patient' | 'nurse_portal' | 'admin_desk'
  const [globalRole, setGlobalRole] = useState('patient');
  
  // Patient View Sub-Routing States
  const [patientSubView, setPatientSubView] = useState('catalog'); // 'catalog' | 'booking_form' | 'success'
  
  // Active Local Booking Inputs Form State
  const [activeBooking, setActiveBooking] = useState({
    service: CLINICAL_SERVICES[0],
    shiftType: '12-Hour Day Shift',
    shiftMultiplier: 1,
    durationDays: 1,
    patientNotes: ''
  });

  // Active Local Registration Inputs Form State
  const [patientForm, setPatientForm] = useState({
    name: '',
    guardianName: '',
    age: '',
    gender: 'Male',
    address: '',
    phone: '' // Unique Account Identifier
  });

  // --- MULTI-PATIENT DATABASE CORE STATES ---
  const [patientsDb, setPatientsDb] = useState([]); 
  const [bookingsDb, setBookingsDb] = useState([]); 
  const [currentPatient, setCurrentPatient] = useState(null); 
  const [showPatientProfileModal, setShowPatientProfileModal] = useState(false);

// --- NEW SUBSCRIPTION WORKFLOW STATES ---
  const [selectedTier, setSelectedTier] = useState(null); // 'Essential Care' | 'Chronic Management' | 'Intensive Support'
  const [subscriptionStartDate, setSubscriptionStartDate] = useState('');
  const [paymentProof, setPaymentProof] = useState({ transactionId: '', screenshot: null });
  
  // Nurse States
  const [nursesDb, setNursesDb] = useState(INITIAL_NURSES);
  const [currentNurse, setCurrentNurse] = useState(null); 
  const [nurseFormMode, setNurseFormMode] = useState('login'); 
  const [nurseLoginId, setNurseLoginId] = useState('');
  const [regSuccessMessage, setRegSuccessMessage] = useState('');
  
  const [regForm, setRegForm] = useState({
    name: '', degree: '', experience: '', specialisation: CLINICAL_SERVICES[0].title, location: '', certificateImage: null, profileImage: null
  });

  // Admin Desk States
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // Nurse Live Pipeline Milestone Progress
  const [currentTrackingIndex, setCurrentTrackingIndex] = useState(1);

  // --- BUSINESS LOGIC HANDLERS ---
  
  const handlePatientAuth = (e) => {
    e.preventDefault();
    if (!patientForm.phone.trim()) return;

    const existingProfile = patientsDb.find(p => p.phone.trim() === patientForm.phone.trim());

    if (existingProfile) {
      setCurrentPatient(existingProfile);
    } else {
      const newProfile = { ...patientForm };
      setPatientsDb([...patientsDb, newProfile]);
      setCurrentPatient(newProfile);
    }
    
    // Clear the edit state flag, swap view, and close any modal wrappers
    setActiveBooking(prev => ({ ...prev, patientNotes: '' }));
    setPatientSubView('booking_form');
    setShowPatientProfileModal(false);
  };

const handleCheckoutSubmission = () => {
    if (!currentPatient) return;

    const newBookingRecord = {
      id: `BOOK-${Date.now()}`,
      patientPhone: currentPatient.phone, 
      patientName: currentPatient.name,
      patientAge: currentPatient.age,
      patientGender: currentPatient.gender,
      patientAddress: currentPatient.address,
      service: activeBooking.service,
      shiftType: activeBooking.shiftType,
      shiftMultiplier: activeBooking.shiftMultiplier,
      durationDays: activeBooking.durationDays,
      patientNotes: activeBooking.patientNotes,
      status: 'requested', // 'requested' | 'active' | 'completed'
      assignedNurseId: null
    };

    // 🚀 THE FIX: Temporarily save that this transaction was a traditional clinical nurse booking
    setActiveBooking(prev => ({ ...prev, patientNotes: 'just_booked_nurse_shift' }));

    setBookingsDb([...bookingsDb, newBookingRecord]);
    setPatientSubView('success');
  };

  // Nurse accepts a targeted index care case file contract
  const handleNurseAcceptCase = (bookingId) => {
    if (!currentNurse) return;
    
    // 🚀 THE FIX: Find the step index for 'Active Care Delivery' dynamically
    const careDeliveryIndex = PIPELINE_STEPS.findIndex(p => p.name === "Active Care Delivery");
    
    // Fallback to step index 2 if name-matching fails, otherwise set the tracker step
    setCurrentTrackingIndex(careDeliveryIndex !== -1 ? careDeliveryIndex : 2);

    setBookingsDb(bookingsDb.map(b => 
      b.id === bookingId ? { ...b, status: 'active', assignedNurseId: currentNurse.id } : b
    ));
  };
  const handleAdvanceMilestone = (bookingId) => {
    setCurrentTrackingIndex(prev => prev + 1);
  };

  const handleDischargeCase = (bookingId) => {
    setBookingsDb(bookingsDb.map(b => 
      b.id === bookingId ? { ...b, status: 'completed' } : b
    ));
    setCurrentTrackingIndex(1); 
  };
// --- AUTOMATIC TESTIMONIAL CAROUSEL STATE ---
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  React.useEffect(() => {
    const testimonialCount = 4; // Total number of testimonial items
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonialCount);
    }, 4000); // Transitions to the next card smoothly every 4 seconds
    return () => clearInterval(timer);
  }, []);
  const handleNurseRegister = (e) => {
    e.preventDefault();
    const newId = `NURSE-00${nursesDb.length + 1}`;
    const profileUrl = regForm.profileImage ? URL.createObjectURL(regForm.profileImage) : "/nurse.png";
    const certificateUrl = regForm.certificateImage ? URL.createObjectURL(regForm.certificateImage) : "/certificate.png";

    const newNurseRecord = {
      id: newId,
      ...regForm,
      profileImageName: regForm.profileImage?.name || "priya_profile.jpg",
      certificateImageName: regForm.certificateImage?.name || "verified_document.jpg",
      profilePreview: profileUrl,
      certificatePreview: certificateUrl,
      status: 'pending'
    };
    setNursesDb([...nursesDb, newNurseRecord]);
    setRegSuccessMessage(`Registration submitted! Your Nurse ID is ${newId}. Status: PENDING admin verification.`);
    setNurseFormMode('login');
  };

 const handleNurseLogin = (e) => {
    e.preventDefault();
    const found = nursesDb.find(n => n.id.trim() === nurseLoginId.trim());
    
    if (found) {
      // 🚀 THE FIX: Intercept matching IDs if their operational status is rejected
      if (found.status === 'rejected') {
        alert("Access Denied: Your application files have been declined by administrative review.");
        return;
      }
      setCurrentNurse(found);
    } else {
      alert("Nurse ID not found.");
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminUsername === ADMIN_CREDENTIALS.username && adminPassword === ADMIN_CREDENTIALS.password) {
      setIsAdminLoggedIn(true);
    } else {
      alert("Invalid Admin Credentials.");
    }
  };

  const approveNurse = (id) => {
    setNursesDb(nursesDb.map(n => n.id === id ? { ...n, status: 'approved' } : n));
  };
  const rejectNurse = (id) => {
    setNursesDb(nursesDb.map(n => n.id === id ? { ...n, status: 'rejected' } : n));
  };
  const activeBookingForCurrentPatient = bookingsDb.find(b => currentPatient && b.patientPhone === currentPatient.phone && b.status !== 'completed');

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/50 via-white to-slate-50 font-sans text-slate-800 antialiased selection:bg-teal-500 selection:text-white">
      
      {/* GLOBAL MANAGEMENT ROLE BAR */}
      <div className="bg-slate-950 px-6 py-2.5 flex flex-wrap justify-between items-center gap-3 border-b border-slate-800">
        <span className="text-xs font-black tracking-widest text-slate-400 uppercase flex items-center gap-2 font-display">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
          Dev Role Environment:
        </span>
        <div className="flex gap-2">
          {['patient', 'nurse_portal', 'admin_desk'].map((role) => (
            <button
              key={role}
              onClick={() => setGlobalRole(role)}
              className={`text-[11px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wide transition-all ${
                globalRole === role ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md shadow-teal-900/40' : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {role.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* CORE FRAMEWORK WORKSPACE */}
      <main className="">
        
        {/* ========================================================================= */}
        {/* ROLE VIEW A: PATIENT INTERFACE                                            */}
        {/* ========================================================================= */}
        {globalRole === 'patient' && (
          <div className="animate-fadeIn">
            
            {/* BRAND HEALTH INFRASTRUCTURE BANNER */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950 text-white text-[11px] px-6 py-2 flex flex-wrap justify-between items-center gap-2 border-b border-teal-900/40">
              <div className="flex gap-4 items-center">
                <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Care Desk Active
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-teal-300">
                <span className="text-slate-400 font-normal">Call Toll-Free:</span> 
                <a href="tel:1800-CARE-NOW" className="hover:underline">1800-CARE-NOW</a>
              </div>
            </div>

            {/* STICKY PATIENT HEADER CONTROLS */}
            <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-3.5 flex justify-between items-center shadow-[0_1px_12px_-4px_rgba(15,23,42,0.08)]">
              <div onClick={() => setPatientSubView('catalog')} className="cursor-pointer flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-md shadow-teal-500/30 group-hover:scale-105 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight font-display leading-none">Care Sphere</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-teal-600 mt-0.5">Compassionate • Professional • Trusted</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-4">
                <button 
                  onClick={() => {
                    setPatientSubView('catalog');
                    // 🚀 Smooth scroll transition target
                    setTimeout(() => {
                      document.getElementById('core-services')?.scrollIntoView({ behavior: 'smooth' });
                    }, 50);
                  }} 
                  className={`hidden sm:inline text-xs font-bold transition-colors cursor-pointer ${patientSubView === 'catalog' ? 'text-teal-600' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Explore Services
                </button>
                <button 
                  onClick={() => { 
                    // 🚀 CLEAR SUBSCRIPTION CONTEXT: Ensures we fall back to normal shift booking
                    setSelectedTier(null);

                    if (!currentPatient) {
                      setPatientForm({ name: '', guardianName: '', age: '', gender: 'Male', address: '', phone: '' });
                      setActiveBooking(prev => ({ ...prev, patientNotes: 'editing_profile' }));
                    } else {
                      setActiveBooking(prev => ({ ...prev, patientNotes: '' }));
                    }
                    setPatientSubView('booking_form'); 
                  }} 
                  className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold text-xs px-3.5 sm:px-5 py-2.5 rounded-xl transition-all shadow-md shadow-teal-600/25 cursor-pointer"
                >
                  Request Nurse Now
                </button>

                {/* PATIENT PROFILE ACCOUNT ICON HUB */}
                <button
                  type="button"
                  onClick={() => setShowPatientProfileModal(true)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-teal-50 border border-slate-200 flex items-center justify-center transition-all cursor-pointer text-slate-600 hover:text-teal-600 relative group"
                  title="View Patient Profile"
                >
                  {currentPatient ? (
                    <span className="text-xs font-black uppercase text-teal-700 bg-teal-100 w-full h-full rounded-full flex items-center justify-center border border-teal-300">
                      {currentPatient.name ? currentPatient.name.charAt(0) : "P"}
                    </span>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                  )}
                  {currentPatient && activeBookingForCurrentPatient && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full animate-bounce"></span>
                  )}
                </button>
              </div>
            </nav>

            {/* SUB ROUTING INSIDE PATIENT HUB */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
              
              {/* SUB VIEW 1: CATALOG CARD HUB */}
              {patientSubView === 'catalog' && (
                <div className="space-y-16">
                  <section className="relative text-center max-w-3xl mx-auto space-y-5 pt-6 pb-4 overflow-hidden">
                    {/* DECORATIVE AMBIENT SHAPES */}
                    <div className="absolute -top-24 -left-28 w-72 h-72 bg-teal-200/40 rounded-full blur-3xl -z-10 animate-float-slow"></div>
                    <div className="absolute -top-10 -right-24 w-72 h-72 bg-cyan-200/40 rounded-full blur-3xl -z-10 animate-float-slower"></div>

                    <span className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 font-bold text-xs uppercase tracking-widest px-3.5 py-1.5 rounded-full border border-teal-100">
                      <span>🏠</span> Hospital Quality to Your Living Room
                    </span>
                    <h1 className="text-4xl sm:text-6xl font-extrabold font-display tracking-tight text-slate-900 leading-[1.1]">
                      Expert Nursing Care Delivered <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">Directly To Your Doorstep</span>
                    </h1>
                    <p className="text-base sm:text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
                      Quality healthcare structured for patients of all age profiles, managed in the complete comfort of home.
                    </p>

                    {/* STAT COUNTERS CONTAINER */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 max-w-2xl mx-auto">
                      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all text-center">
                        <div className="text-2xl font-black text-slate-900 font-display">{APP_METRICS.patientsServed}</div>
                        <div className="text-[11px] font-medium text-slate-400 mt-0.5">Patients Served</div>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all text-center">
                        <div className="text-2xl font-black text-slate-900 font-display">{APP_METRICS.satisfactionRate}</div>
                        <div className="text-[11px] font-medium text-slate-400 mt-0.5">Satisfaction Rate</div>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all text-center">
                        <div className="text-2xl font-black text-teal-600 font-display">{APP_METRICS.availability}</div>
                        <div className="text-[11px] font-medium text-slate-400 mt-0.5">Available Always</div>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all text-center">
                        <div className="text-2xl font-black text-slate-900 font-display">{APP_METRICS.experienceYears}</div>
                        <div className="text-[11px] font-medium text-slate-400 mt-0.5">Years Experience</div>
                      </div>
                    </div>
                  </section>

                  {/* HOW IT WORKS / CARE PIPELINE OVERVIEW */}
                  <section className="space-y-8">
                    <div className="text-center max-w-2xl mx-auto space-y-2">
                      <span className="text-xs font-black uppercase tracking-widest text-teal-600">How It Works</span>
                      <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 tracking-tight">Your Care Journey, Simplified</h2>
                      <p className="text-sm text-slate-500">From the first assessment to active care at home — here's how a dedicated nurse gets to you.</p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                      {PIPELINE_STEPS.map((p, idx) => (
                        <div key={p.step} className="relative bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-teal-500/25 font-display">
                            {p.step}
                          </div>
                          <h3 className="font-extrabold text-slate-900 text-sm mt-4">{p.name}</h3>
                          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{p.desc}</p>
                          {idx < PIPELINE_STEPS.length - 1 && (
                            <div className="hidden lg:block absolute top-10 -right-3 w-6 h-0.5 bg-gradient-to-r from-teal-200 to-transparent"></div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                  {/* ⭐ TESTIMONIALS CAROUSEL (CRISP FULL-CARD ACCENT OVERLAY) */}
                  <section className="space-y-6">
                    <div className="text-center sm:text-left">
                      <span className="text-xs font-black uppercase tracking-widest text-teal-600">Patient Stories</span>
                      <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 tracking-tight mt-1">What Our Families Say</h2>
                      <p className="text-sm text-slate-400 mt-1">Real experiences from homes where our verified nurses deliver everyday care.</p>
                    </div>

                    {/* DYNAMIC SCROLL CONTAINER ROW */}
                    <div className="flex gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth hide-scrollbar select-none">
                      {[
                        {
                          quote: "The vital sign monitoring protocol gave us immense peace of mind. Our assigned nurse was incredibly disciplined, tracking metrics every single hour.",
                          author: "Srivathsa Bhat",
                          relation: "Son of Patient",
                          rating: "⭐⭐⭐⭐•",
                          photo: "successful-businessman.png"
                        },
                        {
                          quote: "Exceptional experience with the post-op wound dressing care. Having hospital-grade clinical sanitation right in our living room made recovery twice as fast.",
                          author: "Meenakshi K.",
                          relation: "Spouse of Patient",
                          rating: "⭐⭐⭐⭐⭐",
                          photo: "woman-doing-close-up-photoshoot-studio.jpg"
                        },
                        {
                          quote: "We were confused about coordinating multiple daily insulin doses. The medication management nurse streamlined the schedule perfectly. Strongly recommended!",
                          author: "Ananth Rao",
                          relation: "Guardian",
                          rating: "⭐⭐⭐⭐⭐",
                          photo: "indian-man-portrait-temple.png"
                        },
                        {
                          quote: "A genuinely trustworthy community platform. The transparent invoice pricing breakdown and the fully verified credentials deck gave us absolute confidence.",
                          author: "Dr. Rajesh Kumar",
                          relation: "Family Physician",
                          rating: "⭐⭐⭐⭐⭐",
                          photo: "pexels-usman-yousaf-708951-6762866.jpg"
                        }
                      ].map((t, idx) => (
                        <div 
                          key={idx} 
                          className="w-[85vw] sm:w-[480px] shrink-0 snap-center bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col sm:flex-row justify-between hover:border-teal-400 transition-all group overflow-hidden"
                        >
                          {/* 📷 CRISP HIGH-RESOLUTION ACCENT PHOTO COLUMN */}
                          <div className="w-full sm:w-36 h-48 sm:h-auto shrink-0 relative bg-slate-100 border-b sm:border-b-0 sm:border-r border-slate-100">
                            <img 
                              src={t.photo} 
                              alt={`Verification portrait of ${t.author}`}
                              className="w-full h-full object-cover object-center"
                              style={{ imageRendering: 'auto' }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-slate-950/20 via-transparent to-transparent"></div>
                          </div>

                          {/* TEXT PLATFORM FEED CANVAS */}
                          <div className="p-5 sm:p-6 flex flex-col justify-between flex-1 space-y-4">
                            <div className="space-y-2">
                              <div className="text-teal-500 font-serif text-3xl leading-none select-none">“</div>
                              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed italic">
                                {t.quote}
                              </p>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex items-end justify-between">
                              <div>
                                <h4 className="font-extrabold text-slate-900 text-xs font-display">{t.author}</h4>
                                <p className="text-[10px] font-medium text-slate-400 mt-0.5">{t.relation}</p>
                              </div>
                              <div className="text-[10px] tracking-wider select-none bg-slate-50 px-2 py-1 rounded-md border border-slate-100 font-mono text-amber-500 font-bold">
                                {t.rating}
                              </div>
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>

                    {/* INTERACTION HINT NAVIGATION FOOTER */}
                    <div className="flex justify-center sm:justify-start gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest items-center select-none animate-pulse">
                      <span>Swipe or Scroll Horizontally</span>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
                      </svg>
                    </div>
                  </section>
                  {/* ⭐ NEW: SUBSCRIPTION PLANS CARD GRID */}
                  <section className="space-y-8 pt-10 border-t border-slate-100">
                    {/* 📊 PREMIUM SATISFACTION RATE & PATIENT COLLAGE DISPLAY */}
                    <div className="max-w-5xl mx-auto bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-xl flex flex-col md:flex-row items-stretch my-10 animate-fadeIn">
                      
                      {/* Left: The High-Impact Metric Text Context */}
                      <div className="p-8 md:p-12 flex flex-col justify-center space-y-4 md:w-5/12 shrink-0 bg-linear-to-br from-slate-900/50 to-teal-950/30">
                        <div className="inline-flex items-center gap-2 bg-teal-500/10 text-teal-400 font-bold text-xs uppercase tracking-widest px-3 py-1 rounded-full border border-teal-500/20 w-fit font-display">
                          🛡️ Verified Trust Score
                        </div>
                        <h3 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400 font-display tracking-tight leading-none">
                          98%
                        </h3>
                        <p className="text-lg font-extrabold text-white font-display tracking-tight leading-snug">
                          Patient & Family Satisfaction Rate
                        </p>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          NABL standard clinical protocols combined with dedicated companion care deliver undeniable peace of mind directly to your living room framework.
                        </p>
                      </div>

                      {/* Right: The Collage Graphic Asset Layout */}
                      <div className="md:w-7/12 min-h-[260px] md:min-h-auto relative bg-slate-800">
                        <img 
                          src="untitled-design.png" 
                          alt="Diverse smiling senior patients giving thumbs up showcasing a 98% healthcare platform satisfaction score" 
                          className="w-full h-full object-cover object-center absolute inset-0"
                          loading="eager"
                        />
                        {/* Smooth ambient overlay transition to match the dark web framework look */}
                        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-slate-950/40 via-transparent to-transparent"></div>
                      </div>

                    </div>
                    <div className="text-center max-w-2xl mx-auto space-y-2">
                      <span className="text-xs font-black uppercase tracking-widest text-teal-600 font-display">Membership Plans</span>
                      <h2 className="text-2xl sm:text-4xl font-extrabold font-display text-slate-900 tracking-tight">Continuous Care Memberships</h2>
                      <p className="text-sm text-slate-500">Structured subscription layers designed to bring predictable, affordable, and high-quality healthcare to your family long-term.</p>
                    </div>

                    {/* THREE-CARD GRID LAYER */}
                    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
                      {[
                        {
                          name: "Essential Care",
                          price: "₹1,499",
                          period: "per month",
                          desc: "Perfect for senior citizens requiring routine health checkups and preventative monitoring.",
                          features: [
                            "2 Verified Nurse home visits per month",
                            "Priority booking for emergency vitals tracking",
                            "Free monthly digital health report logs",
                            "10% discount on additional service shifts"
                          ],
                          cta: "Choose Essential",
                          popular: false
                        },
                        {
                          name: "Chronic Management",
                          price: "₹3,999",
                          period: "per month",
                          desc: "Tailored for families managing ongoing illnesses like diabetes, hypertension, or post-stroke recovery.",
                          features: [
                            "6 Verified Nurse home visits per month",
                            "Dedicated care coordinator assigned to your file",
                            "Weekly medication schedule audit & setup",
                            "20% discount on intensive 24-hour care shifts",
                            "Direct doctor-to-nurse dashboard data streaming"
                          ],
                          cta: "Get Most Popular",
                          popular: true
                        },
                        {
                          name: "Intensive Support",
                          price: "₹8,499",
                          period: "per month",
                          desc: "Comprehensive coverage for high-dependency patients or individuals transitioning out of the ICU.",
                          features: [
                            "14 Verified Nurse home visits per month",
                            "24/7 dedicated medical helpdesk chat link",
                            "Advanced post-op wound care supplies included",
                            "Complimentary backup nurse allocation routing",
                            "Free monthly diagnostic blood collection"
                          ],
                          cta: "Contact Enterprise",
                          popular: false
                        }
                      ].map((plan, idx) => (
                        <div 
                          key={idx} 
                          className={`rounded-2xl p-6 flex flex-col justify-between transition-all relative ${
                            plan.popular 
                              ? 'bg-slate-900 text-white ring-4 ring-teal-500/30 border-t-4 border-t-teal-500 md:scale-105 shadow-xl shadow-slate-950/20' 
                              : 'bg-white border border-slate-200 text-slate-800 hover:border-teal-400 shadow-xs'
                          }`}
                        >
                          {plan.popular && (
                            <span className="absolute -top-3.5 right-6 bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full shadow-md font-display">
                              Most Popular
                            </span>
                          )}

                          <div className="space-y-6">
                            {/* Plan Header */}
                            <div>
                              <h3 className={`text-lg font-black font-display tracking-tight ${plan.popular ? 'text-teal-400' : 'text-slate-900'}`}>
                                {plan.name}
                              </h3>
                              <p className={`text-xs mt-1.5 leading-relaxed ${plan.popular ? 'text-slate-400' : 'text-slate-500'}`}>
                                {plan.desc}
                              </p>
                            </div>

                            {/* Plan Pricing */}
                            <div className="flex items-baseline gap-1.5 border-b border-slate-100 pb-5">
                              <span className="text-3xl sm:text-4xl font-black font-display tracking-tight">
                                {plan.price}
                              </span>
                              <span className={`text-xs font-medium ${plan.popular ? 'text-slate-400' : 'text-slate-400'}`}>
                                / {plan.period}
                              </span>
                            </div>

                            {/* Features Checklist Loop */}
                            <ul className="space-y-3 text-xs">
                              {plan.features.map((feature, fIdx) => (
                                <li key={fIdx} className="flex items-start gap-2.5 leading-relaxed">
                                  <svg 
                                    className={`w-4 h-4 shrink-0 mt-0.5 ${plan.popular ? 'text-teal-400' : 'text-teal-600'}`} 
                                    fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                  </svg>
                                  <span className={plan.popular ? 'text-slate-200' : 'text-slate-600'}>
                                    {feature}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* CTA Trigger */}
                          <div className="pt-8">
                            <button
                              type="button"
                              onClick={() => {
                                // Set subscription context parameters
                                setSelectedTier(plan.name);
                                setPatientSubView('booking_form');
                                
                                // Auto-populate phone marker if patient is already logged in
                                if (currentPatient) {
                                  setPatientForm({ ...currentPatient });
                                } else {
                                  setPatientForm({ name: '', guardianName: '', age: '', gender: 'Male', address: '', phone: '' });
                                }
                              }}
                              className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer active:scale-98 ${
                                plan.popular
                                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-black hover:brightness-110 shadow-teal-500/10'
                                  : 'bg-slate-900 hover:bg-slate-800 text-white'
                              }`}
                            >
                              {plan.cta}
                            </button>
                          </div>

                        </div>
                      ))}
                    </div>
                  </section>
                  {/* SERVICES GRID LAYOUT */}
                  <section id="core-services" className="space-y-6 scroll-mt-24">
                    <div className="text-center sm:text-left">
                      <span className="text-xs font-black uppercase tracking-widest text-teal-600">Clinical Services</span>
                      <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 tracking-tight mt-1">Our Core Clinical Services</h2>
                      <p className="text-sm text-slate-400 mt-1">Comprehensive professional treatment plans structured by NABL parameters.</p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {CLINICAL_SERVICES.map((service) => (
                        <div key={service.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between hover:border-teal-400 hover:shadow-xl hover:-translate-y-1 transition-all group">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="w-11 h-11 rounded-xl bg-teal-50 group-hover:bg-teal-100 flex items-center justify-center text-xl transition-colors">
                                {SERVICE_ICONS[service.id] || '🏥'}
                              </div>
                              <div className="flex flex-wrap gap-1.5 justify-end">
                                {service.tags.map((tag, i) => (
                                  <span key={i} className="text-[10px] font-bold tracking-wider uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">{tag}</span>
                                ))}
                              </div>
                            </div>
                            <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-teal-600 transition-colors font-display">{service.title}</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">{service.description}</p>
                          </div>
                          
                          <div className="pt-6 border-t border-slate-50 mt-5 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] block font-bold text-slate-400 uppercase tracking-wider">Est. Cost Shift</span>
                              <span className="text-lg font-black text-slate-900 font-display">₹{service.baseRatePerShift}</span>
                            </div>
                            <button 
                              type="button"
                              onClick={() => {
                                if (!currentPatient) {
                                  setPatientForm({ name: '', guardianName: '', age: '', gender: 'Male', address: '', phone: '' });
                                  setActiveBooking({
                                    service: service,
                                    shiftType: '12-Hour Day Shift',
                                    shiftMultiplier: 1,
                                    durationDays: 1,
                                    patientNotes: 'editing_profile' 
                                  });
                                } else {
                                  setActiveBooking({
                                    service: service,
                                    shiftType: '12-Hour Day Shift',
                                    shiftMultiplier: 1,
                                    durationDays: 1,
                                    patientNotes: '' 
                                  });
                                }
                                setPatientSubView('booking_form');
                              }}
                              className="bg-slate-900 group-hover:bg-gradient-to-r group-hover:from-teal-600 group-hover:to-cyan-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                            >
                              Book Plan
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {/* SUB VIEW 2: MULTI-STEP REGISTRATION & BOOKING */}
          {patientSubView === 'booking_form' && (
            <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden animate-fadeIn my-6">
              
              <div className="relative bg-gradient-to-r from-teal-600 to-cyan-700 text-white p-6 sm:p-8 overflow-hidden flex items-center gap-4">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                
                {/* 👈 FIXED: DYNAMIC INTERACTIVE BACK ARROW */}
                <button
                  type="button"
                  onClick={() => {
                    // 1. 🎯 THE CORE FIX: Snap cleanly back to your main service catalog grid layout view
                    setPatientSubView('catalog');
                    
                    // 2. Completely wipe subscription tier states so they start fresh on next click
                    if (selectedTier) {
                      setSelectedTier(null);
                    }
                    
                    // 3. Clear out administrative editing sub-states if necessary
                    if (activeBooking.patientNotes === 'editing_profile') {
                      setActiveBooking(prev => ({ ...prev, patientNotes: '' }));
                    }
                  }}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer group flex-shrink-0 z-10 border border-white/5"
                  aria-label="Navigate back to catalog"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    strokeWidth={2.5} 
                    stroke="currentColor" 
                    className="w-5 h-5 transform group-hover:-translate-x-0.5 transition-transform"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>

                <div className="flex-1 min-w-0 z-10">
                  <span className="inline-block text-[10px] uppercase font-bold tracking-widest bg-white/15 text-teal-50 px-2.5 py-1 rounded-md">
                    {selectedTier ? `Membership: ${selectedTier}` : (activeBooking.patientNotes === 'editing_profile' || !currentPatient ? "Step 1: Patient Profile" : "Step 2: Deployment Setup")}
                  </span>
                  <h2 className="text-2xl font-black font-display tracking-tight mt-1 truncate">
                    {selectedTier ? "Subscription Intake Profile" : (activeBooking.patientNotes === 'editing_profile' || !currentPatient ? "Patient Intake Registration" : "Configure Clinical Shift")}
                  </h2>
                </div>
              </div>

              {/* INTERACTIVE ROUTING CONTROLLER CONDITIONAL */}
              {(selectedTier || activeBooking.patientNotes === 'editing_profile' || !currentPatient) ? (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();

                    // 🔍 CLIENT-SIDE VERIFICATION CHECKS
                    const phoneRegex = /^[6-9]\d{9}$/; // Validates Indian mobile numbers starting with 6-9
                    if (!phoneRegex.test(patientForm.phone.trim())) {
                      alert("Validation Error: Please enter a valid 10-digit mobile number.");
                      return;
                    }

                    if (patientForm.name.trim().length < 2) {
                      alert("Validation Error: Patient name must be at least 2 characters long.");
                      return;
                    }

                    if (patientForm.guardianName.trim().length < 2) {
                      alert("Validation Error: Guardian name must be at least 2 characters long.");
                      return;
                    }

                    if (parseInt(patientForm.age) <= 0 || parseInt(patientForm.age) > 125) {
                      alert("Validation Error: Please enter a realistic age between 1 and 125.");
                      return;
                    }

                    if (patientForm.address.trim().length < 10) {
                      alert("Validation Error: Please provide a complete address layout (minimum 10 characters).");
                      return;
                    }

                    // Proceed if all client-side verification checks pass successfully
                    let savedProfile = patientsDb.find(p => p.phone.trim() === patientForm.phone.trim());
                    if (!savedProfile) {
                      savedProfile = { ...patientForm };
                      setPatientsDb([...patientsDb, savedProfile]);
                    }
                    setCurrentPatient(savedProfile);

                    if (!selectedTier) {
                      setActiveBooking(prev => ({ ...prev, patientNotes: '' }));
                    } else {
                      setActiveBooking({
                        service: CLINICAL_SERVICES[0],
                        shiftType: selectedTier, 
                        shiftMultiplier: 1,
                        durationDays: 1,
                        patientNotes: 'awaiting_payment' 
                      });
                      setSelectedTier(null);
                    }
                  }} 
                  className="p-6 sm:p-8 space-y-4 text-xs"
                >
                  
                  {/* MODIFICATION 1: CONDITIONAL SYSTEM SELECTION FIELD */}
                  {selectedTier ? (
                    <div className="space-y-1">
                      <label className="font-bold text-teal-600 uppercase tracking-wide">Select Subscription Tier Plan</label>
                      <select 
                        className="w-full p-3 border border-teal-200 rounded-xl bg-teal-50/50 text-slate-900 font-extrabold outline-none"
                        value={selectedTier}
                        onChange={(e) => setSelectedTier(e.target.value)}
                      >
                        <option value="Essential Care">Essential Care Tier Membership</option>
                        <option value="Chronic Management">Chronic Management Tier Membership</option>
                        <option value="Intensive Support">Intensive Support Tier Membership</option>
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="font-bold text-teal-600 uppercase tracking-wide">Step 0: Select Care Protocol Specialty</label>
                      <select 
                        className="w-full p-3 border border-teal-200 rounded-xl bg-teal-50/50 text-slate-900 font-extrabold outline-none focus:ring-2 focus:ring-teal-500/40"
                        value={activeBooking.service?.id}
                        onChange={(e) => {
                          const selected = CLINICAL_SERVICES.find(s => s.id === e.target.value);
                          setActiveBooking({ ...activeBooking, service: selected });
                        }}
                      >
                        {CLINICAL_SERVICES.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                      </select>
                    </div>
                  )}
                      {/* MODIFICATION 2: SMALL STARTING DATE CALENDAR SELECTOR */}
                      {selectedTier && (
                        <div className="space-y-1 animate-fadeIn">
                          <label className="font-bold text-slate-500 uppercase tracking-wide">Care Activation Commencement Date</label>
                          <input 
                            type="date" 
                            required
                            // 🚀 THE FIX: Calculate today's date structure inline to block historical selection
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/30"
                            value={subscriptionStartDate}
                            onChange={(e) => setSubscriptionStartDate(e.target.value)}
                          />
                        </div>
                      )}
                      {/* CONTACT PHONE FIELD */}
                      <div className="space-y-1">
                        <label className="font-bold text-slate-500 uppercase">Contact Phone Number</label>
                        <input 
                          type="tel" 
                          required 
                          maxLength={10}
                          pattern="[6-9][0-9]{9}"
                          placeholder="Enter 10-digit mobile number" 
                          className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 font-mono tracking-wide font-bold text-teal-600 focus:bg-white outline-none focus:ring-2 focus:ring-teal-500/30"
                          value={patientForm.phone}
                          onChange={(e) => {
                            // Sanitization: restrict character inputs to digits only
                            const val = e.target.value.replace(/\D/g, '');
                            const found = patientsDb.find(p => p.phone.trim() === val.trim());
                            if (found) { setPatientForm({ ...found }); } else { setPatientForm({ ...patientForm, phone: val }); }
                          }}
                        />
                      </div>

                      {/* PATIENT LEGAL NAME */}
                      <div className="space-y-1">
                        <label className="font-bold text-slate-400 uppercase">Patient Full Name</label>
                        <input 
                          type="text" 
                          required 
                          minLength={2}
                          placeholder="Enter patient's legal name" 
                          className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-teal-500/30 focus:bg-white" 
                          value={patientForm.name} 
                          onChange={(e) => setPatientForm({...patientForm, name: e.target.value})} 
                        />
                      </div>

                      {/* GUARDIAN LEGAL NAME */}
                      <div className="space-y-1">
                        <label className="font-bold text-slate-400 uppercase">Guardian Full Name</label>
                        <input 
                          type="text" 
                          required 
                          minLength={2}
                          placeholder="Enter guardian's legal name" 
                          className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-teal-500/30 focus:bg-white" 
                          value={patientForm.guardianName} 
                          onChange={(e) => setPatientForm({...patientForm, guardianName: e.target.value})} 
                        />
                      </div>

                      {/* MEDICAL HORIZON TIMELINE ADDRESS */}
                      <div className="space-y-1">
                        <label className="font-bold text-slate-400 uppercase">Address</label>
                        <input 
                          type="text" 
                          required 
                          minLength={10}
                          placeholder="Enter deployment address details" 
                          className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-teal-500/30 focus:bg-white" 
                          value={patientForm.address} 
                          onChange={(e) => setPatientForm({...patientForm, address: e.target.value})} 
                        />
                      </div>

                      {/* GRID STRUCTURE: AGE BOUNDS */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-400 uppercase">Age</label>
                          <input 
                            type="number" 
                            required 
                            min={1} 
                            max={120} 
                            placeholder="e.g. 65" 
                            className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-teal-500/30 focus:bg-white" 
                            value={patientForm.age} 
                            onChange={(e) => setPatientForm({...patientForm, age: e.target.value})} 
                          />
                        </div>
                        </div>

                      {/* MODIFICATION 3: DYNAMIC CTAS TO ROUTE SUBMIT ACTIONS */}
                      <button 
                        type="submit"
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-3 rounded-xl uppercase tracking-wide mt-2 transition-all cursor-pointer shadow-sm"
                      >
                        {selectedTier ? "Continue to Payment →" : "Continue to Shift Details →"}
                      </button>
                    </form>
                  ) : (
                    
                    // SUB STEP B: SUBSCRIPTION PAYMENT GATEWAY
                    activeBooking.patientNotes === 'awaiting_payment' ? (
                      
                      /* 🧾 UPDATED: OPTED SUBSCRIPTIONS REGISTRATION VIEW */
                      <div className="p-6 sm:p-8 space-y-5 text-xs animate-fadeIn">
                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-500 uppercase tracking-wider">Transaction ID / Reference UTR String</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="e.g. UPI24851309536"
                            className="w-full p-3 border border-slate-200 rounded-xl font-mono text-teal-600 font-bold bg-slate-50 outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/30"
                            value={paymentProof.transactionId}
                            onChange={(e) => setPaymentProof({ ...paymentProof, transactionId: e.target.value })}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-500 uppercase tracking-wider">Attach Payment Receipt Screenshot</label>
                          <input 
                            type="file" 
                            required 
                            className="w-full text-slate-500 font-medium text-[11px] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 file:cursor-pointer"
                            onChange={(e) => setPaymentProof({ ...paymentProof, screenshot: e.target.files[0] })}
                          />
                        </div>

                        <button 
                          type="button"
                          disabled={!paymentProof.transactionId.trim()}
                          onClick={() => {
                            // Synthesize membership details directly onto the current active user instance profile
                            const finalMembershipProfile = {
                              ...currentPatient,
                              activeSubscription: activeBooking.shiftType, // Fetch the selection saved inside core tracking shiftType matrix
                              subscriptionDate: subscriptionStartDate || new Date().toISOString().split('T')[0]
                            };

                            // Commit synchronized updates safely to database registries
                            setPatientsDb(patientsDb.map(p => p.phone === currentPatient.phone ? finalMembershipProfile : p));
                            setCurrentPatient(finalMembershipProfile);

                            // Pop routing tracker cleanly over to final success layout panel
                            setPatientSubView('success');
                          }}
                          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-slate-950 font-black py-3.5 rounded-xl uppercase tracking-wider disabled:cursor-not-allowed transition-all shadow-md shadow-emerald-500/20"
                        >
                          Complete Payment Authentication ✓
                        </button>
                      </div>
                    ) : (
                      
                      // ORIGINAL SUB STEP B: PREVIOUS STANDARD DEPLOYMENT SHIFT CONFIGURATION SETUP UNTOUCHED
                      <div className="p-6 sm:p-8 space-y-6 animate-fadeIn">
                        <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 flex justify-between items-center text-xs">
                          <div>
                            <p className="text-slate-400 font-medium">Patient Details Registered:</p>
                            <p className="font-bold text-slate-900">{currentPatient.name} ({currentPatient.gender}, Age: {currentPatient.age})</p>
                          </div>
                          <button onClick={() => setActiveBooking({...activeBooking, patientNotes: 'editing_profile'})} className="text-teal-600 font-bold hover:underline cursor-pointer">Edit Profile</button>
                        </div>

                        <div className="space-y-3">
                          <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Select Shift Routine Mode <span className="text-teal-600 lowercase font-normal">(Verified staff tracking)</span></label>
                          <div className="grid grid-cols-1 gap-2">
                            {[
                              { label: '12-Hour Day Shift', desc: 'Standard daytime clinical support & tracking', mult: 1 },
                              { label: '12-Hour Night Shift', desc: 'Overnight vitals management & continuous monitoring', mult: 1 },
                              { label: '24-Hour Intensive Care', desc: 'Critical post-op or high-dependency care (2x base rate)', mult: 2 }
                            ].map((s) => {
                              const isSelected = activeBooking.shiftType === s.label;
                              return (
                                <button
                                  key={s.label} type="button"
                                  onClick={() => setActiveBooking({ ...activeBooking, shiftType: s.label, shiftMultiplier: s.mult })}
                                  className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                                    isSelected ? 'border-teal-600 bg-teal-50/60 ring-1 ring-teal-600' : 'border-slate-200 hover:bg-slate-50'
                                  }`}
                                >
                                  <div>
                                    <p className="text-xs font-bold text-slate-800">{s.label}</p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">{s.desc}</p>
                                  </div>
                                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isSelected ? 'border-teal-600 bg-teal-600' : 'border-slate-300'}`}>
                                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-slate-400 tracking-wider block">Treatment Plan Horizon</label>
                          <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-xl border border-slate-100 w-fit">
                            <button type="button" disabled={activeBooking.durationDays <= 1} onClick={() => setActiveBooking({ ...activeBooking, durationDays: activeBooking.durationDays - 1 })} className="w-8 h-8 bg-white border border-slate-200 rounded-lg font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:border-teal-400">-</button>
                            <span className="text-xs font-black text-slate-800 w-12 text-center font-display">{activeBooking.durationDays} Days</span>
                            <button type="button" onClick={() => setActiveBooking({ ...activeBooking, durationDays: activeBooking.durationDays + 1 })} className="w-8 h-8 bg-white border border-slate-200 rounded-lg font-bold cursor-pointer hover:border-teal-400">+</button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Patient Diagnosis & Clinical Notes</label>
                          <textarea
                            value={activeBooking.patientNotes}
                            onChange={(e) => setActiveBooking({ ...activeBooking, patientNotes: e.target.value })}
                            placeholder="Detail critical illness logs, current physical mobility level, or primary doctor directions..."
                            className="w-full h-20 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/30 transition-all text-slate-700"
                          />
                        </div>

                        <div className="bg-slate-900 rounded-2xl p-5 flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Computed Invoice Total</span>
                            <span className="text-2xl font-black text-emerald-400 font-display">₹{activeBooking.service.baseRatePerShift * activeBooking.shiftMultiplier * activeBooking.durationDays}</span>
                          </div>
                          <button 
                            type="button" onClick={handleCheckoutSubmission}
                            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs px-6 py-3 rounded-xl uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-emerald-500/20"
                          >
                            Generate Care Plan →
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

             {/* SUB VIEW 3: ACCOUNT REQUEST COMPLETED BLOCK */}
              {patientSubView === 'success' && (
                <div className="max-w-md mx-auto bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center space-y-4 my-10 animate-fadeIn shadow-sm">
                  <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto shadow-md shadow-emerald-500/30">✓</div>
                  
                  {/* ⚡ FIXED CONDITION: Isolate active subscription view from regular nurse bookings */}
                  {activeBooking.patientNotes !== 'just_booked_nurse_shift' && currentPatient?.activeSubscription ? (
                    <>
                      <h2 className="font-black text-slate-900 text-xl tracking-tight font-display">✓ Subscription Successful</h2>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Intake profile for <strong className="text-slate-900">{currentPatient?.name}</strong> has been saved.
                        <span className="block mt-3 font-bold text-emerald-800 bg-emerald-100/60 border border-emerald-200 p-2.5 rounded-xl leading-relaxed font-display">
                          Subscription successful starting from {currentPatient?.subscriptionDate || "Immediate Processing"}.
                        </span>
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="font-black text-slate-900 text-xl tracking-tight font-display">Allocation Request Logged</h2>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Intake profile for <strong className="text-slate-900">{currentPatient?.name}</strong> has been saved.
                        <span className="block mt-2 font-semibold text-teal-700 bg-teal-50 p-2 rounded-lg border border-teal-100">
                          🔒 Clinical pipeline tracking data streams have been securely isolated to the assigned Nurse Portal side.
                        </span>
                      </p>
                    </>
                  )}

                  <button 
                    onClick={() => {
                      // Flawlessly wipe dynamic context structures to reprime pristine operational flows
                      setSelectedTier(null);
                      setSubscriptionStartDate('');
                      setPaymentProof({ transactionId: '', screenshot: null });
                      
                      // Clear the temporary success route identifier block cleanly
                      setActiveBooking({
                        service: CLINICAL_SERVICES[0],
                        shiftType: '12-Hour Day Shift',
                        shiftMultiplier: 1,
                        durationDays: 1,
                        patientNotes: ''
                      });

                      setPatientSubView('catalog');
                    }} 
                    className="text-xs font-black bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-all cursor-pointer font-display shadow-2xs"
                  >
                    Return to Service Catalog
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        {/* ========================================================================= */}
        {/* ROLE VIEW B: NURSE PORTAL INTERFACE                                      */}
        {/* ========================================================================= */}
        {globalRole === 'nurse_portal' && (
          <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
            {!currentNurse ? (
              <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex border-b border-slate-200 pb-2 justify-around">
                  <button onClick={() => setNurseFormMode('login')} className={`text-xs font-black pb-2 px-4 cursor-pointer transition-colors ${nurseFormMode === 'login' ? 'border-b-2 border-teal-600 text-teal-600' : 'text-slate-400'}`}>NURSE SIGN IN</button>
                  <button onClick={() => setNurseFormMode('register')} className={`text-xs font-black pb-2 px-4 cursor-pointer transition-colors ${nurseFormMode === 'register' ? 'border-b-2 border-teal-600 text-teal-600' : 'text-slate-400'}`}>APPLY AS CLINICIAN</button>
                </div>

                {regSuccessMessage && <div className="bg-teal-50 border border-teal-200 p-3 rounded-xl text-center text-xs font-bold text-teal-800">{regSuccessMessage}</div>}

                {nurseFormMode === 'login' ? (
                  <form onSubmit={handleNurseLogin} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 block">Enter Unique Nurse ID Code</label>
                      <input type="text" placeholder="e.g. NURSE-001" className="w-full p-2.5 text-xs border border-slate-200 bg-slate-50 rounded-xl font-mono outline-none focus:ring-2 focus:ring-teal-500/30 focus:bg-white" value={nurseLoginId} onChange={(e)=>setNurseLoginId(e.target.value)} required />
                    </div>
                    <button type="submit" className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer shadow-md shadow-teal-600/20">Enter Clinician Desk</button>
                  </form>
                ) : (
                  <form onSubmit={handleNurseRegister} className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Full Name</label>
                        <input type="text" required className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-teal-500/30 focus:bg-white" value={regForm.name} onChange={(e)=>setRegForm({...regForm, name: e.target.value})} placeholder="Sister Kamala" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Degree/Credential</label>
                        <input type="text" required className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-teal-500/30 focus:bg-white" value={regForm.degree} onChange={(e)=>setRegForm({...regForm, degree: e.target.value})} placeholder="GNC General Nursing" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Years Experience</label>
                        <input type="text" required className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-teal-500/30 focus:bg-white" value={regForm.experience} onChange={(e)=>setRegForm({...regForm, experience: e.target.value})} placeholder="4 Years" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Specialisation</label>
                        <select className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-teal-500/30 focus:bg-white" value={regForm.specialisation} onChange={(e)=>setRegForm({...regForm, specialisation: e.target.value})}>
                          {CLINICAL_SERVICES.map(s => <option key={s.id} value={s.title}>{s.title}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Locality Operation Zone</label>
                      <input type="text" required className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-teal-500/30 focus:bg-white" value={regForm.location} onChange={(e)=>setRegForm({...regForm, location: e.target.value})} placeholder="Malleshwaram, Bangalore" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">NCI/NABL Certificate File</label>
                        <input type="file" required className="w-full text-[10px] text-slate-400" onChange={(e)=>setRegForm({...regForm, certificateImage: e.target.files[0]})} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Professional Photo</label>
                        <input type="file" required className="w-full text-[10px] text-slate-400" onChange={(e)=>setRegForm({...regForm, profileImage: e.target.files[0]})} />
                      </div>
                    </div>
                    <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl tracking-wide mt-2 transition-all cursor-pointer">Submit Application</button>
                  </form>
                )}
              </div>
            ) : (
              // ACTIVE LOGGED-IN CLINICIAN DESK CONSOLE
              <div className="space-y-6 animate-fadeIn">
                
                {/* RESTORED: CLINICIAN ACCOUNT PROFILE HUB CARD */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-4">
                    
                    {/* AVATAR WRAPPER WITH LOCAL EMBEDDED CHECKMARK OVERLAY */}
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-white font-black text-lg flex items-center justify-center uppercase shadow-md shadow-teal-500/25 font-display">
                        {currentNurse.name ? currentNurse.name.charAt(0) : "N"}
                      </div>
                      {currentNurse.status === 'approved' && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-600 rounded-full border-2 border-white flex items-center justify-center text-white shadow-xs">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-2.5 h-2.5">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* IDENTITY NAMESPACE HEADER AND SUBTITLE MARKS */}
                    <div>
                      <span className="text-xs font-bold text-teal-600 block uppercase tracking-wider font-mono">ID: {currentNurse.id}</span>
                      <h2 className="text-xl font-black text-slate-900 mt-0.5 font-display">
                        {currentNurse.name}
                      </h2>
                      {currentNurse.status === 'approved' && (
                        <p className="text-[11px] font-black uppercase tracking-wider text-emerald-600 mt-0.5 font-display">
                          Fully Verified Clinician
                        </p>
                      )}
                      <p className="text-xs text-slate-500 font-medium mt-1">{currentNurse.degree} • Focus Specialisation: <strong className="text-teal-600">{currentNurse.specialisation}</strong></p>
                    </div>
                  </div>
                  
                  <div className="text-right flex flex-col items-end gap-1.5">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Status</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-3 py-0.5 rounded-full inline-block mt-0.5">● Approved</span>
                    </div>
                    <button onClick={()=>setCurrentNurse(null)} className="text-xs font-bold bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-lg text-slate-600 transition-colors cursor-pointer">Secure Signout</button>
                  </div>
                </div>

                {/* DOUBLE CHECK ENTRY RIGHTS PROFILES */}
                {currentNurse.status === 'pending' ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-2">
                    <h3 className="text-amber-900 font-extrabold text-base font-display">Dashboard Restricted</h3>
                    <p className="text-xs text-amber-700 max-w-md mx-auto leading-relaxed">Your files are waiting in the validation pool. Approve via the Admin switch panel above.</p>
                  </div>
                ) : currentNurse.status === 'rejected' ? (
                  /* 🚀 THE FIX: INSTANT LOCKOUT IF REJECTED BY ADMIN */
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3 animate-fadeIn">
                    <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm mx-auto shadow-sm">✕</div>
                    <h3 className="text-red-900 font-extrabold text-base font-display">Credential Verification Failed</h3>
                    <p className="text-xs text-red-700 max-w-md mx-auto leading-relaxed">
                      This account profile has been flagged as <strong className="text-red-900">Declined</strong> following an administrative documentation credentials audit. Access to the clinical service delivery tracking logs is permanently restricted.
                    </p>
                  </div>
                ) : (
                    
                  // MULTI PATIENTS CASE STREAM LAYOUTS MONITOR
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest bg-teal-100 text-teal-800 px-2 py-0.5 rounded">Clinician Console</span>
                      <h3 className="font-extrabold text-lg text-slate-900 mt-1 font-display">Specialized Deployment Queue</h3>
                    </div>

                    <div className="space-y-6">
                      
                      {/* 🔔 MAP ALL OPEN OFFERS MATCHING FOCUS SPECIALTY THAT ARE NOT LOCALLY HIDDEN */}
                      {bookingsDb.filter(b => b.status === 'requested' && b.service?.title === currentNurse.specialisation && !(currentNurse.dismissedCases || []).includes(b.id)).length > 0 ? (
                        bookingsDb.filter(b => b.status === 'requested' && b.service?.title === currentNurse.specialisation && !(currentNurse.dismissedCases || []).includes(b.id)).map((order) => (
                          <div key={order.id} className="border border-amber-200 bg-amber-50/40 rounded-2xl p-5 space-y-4 animate-fadeIn">
                            <div className="flex justify-between items-start border-b border-amber-200/60 pb-3">
                              <div>
                                <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">New Case Request</span>
                                <h4 className="font-black text-slate-900 text-base mt-1.5 font-display">{order.service?.title}</h4>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-slate-400 block uppercase font-bold">Est. Net Payout</span>
                                <span className="text-lg font-black text-slate-950 font-display">₹{Math.floor((order.service?.baseRatePerShift * order.shiftMultiplier * order.durationDays) * 0.8)}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs bg-white p-3 rounded-xl border border-slate-100">
                              <div><span className="text-slate-400 font-medium">Patient:</span> <strong className="text-slate-800">{order.patientName}</strong></div>
                              <div><span className="text-slate-400 font-medium">Age / Gender:</span> <strong className="text-slate-800">{order.patientAge} Yrs ({order.patientGender})</strong></div>
                              <div><span className="text-slate-400 font-medium">Shift Routine:</span> <strong className="text-slate-800">{order.shiftType}</strong></div>
                              <div><span className="text-slate-400 font-medium">Horizon Timeline:</span> <strong className="text-teal-600">{order.durationDays} Days Deployment</strong></div>
                              <div className="col-span-2"><span className="text-slate-400 font-medium">Address Location:</span> <strong className="text-slate-700">{order.patientAddress}</strong></div>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Patient Intake Diagnosis Notes:</span>
                              <div className="bg-slate-900 text-slate-200 font-mono text-[11px] p-3 rounded-xl leading-relaxed italic border border-slate-800">
                                "{order.patientNotes || "No clinical brief filed. Review via physical intake diagnostics during visit 01."}"
                              </div>
                            </div>

                            <div className="flex gap-3 pt-1">
                              <button 
                                type="button"
                                onClick={() => {
                                  // Lock the dismissal locally to this specific nurse's state context
                                  setCurrentNurse(prev => ({
                                    ...prev,
                                    dismissedCases: [...(prev.dismissedCases || []), order.id]
                                  }));
                                }}
                                className="w-1/3 bg-white border border-slate-200 text-slate-500 font-bold py-2 rounded-xl text-xs hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                              >
                                Decline Case
                              </button>
                              <button 
                                type="button" onClick={() => handleNurseAcceptCase(order.id)}
                                className="w-2/3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-black py-2 rounded-xl text-xs uppercase tracking-wider shadow-md shadow-teal-600/20 cursor-pointer"
                              >
                                Accept Shift Deployment ✓
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        /* Hide open block if an active tracker deployment is already running on this profile */
                        bookingsDb.filter(b => b.status === 'active' && b.assignedNurseId === currentNurse.id).length === 0 && (
                          <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 text-xs font-medium">
                            No pending patient deployment requests available matching your specialization criteria (`{currentNurse.specialisation}`).
                          </div>
                        )
                      )}

                      {/* ⚡ ACTIVE TRACKING MONITOR BLOCK INDEPENDENTLY ISOLATED TO THIS SPECIFIC NURSE ID */}
                      {bookingsDb.filter(b => b.status === 'active' && b.assignedNurseId === currentNurse.id).map((activeCase) => (
                        <div key={activeCase.id} className="space-y-6 border-t border-slate-100 pt-4 animate-fadeIn">
                          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs space-y-1">
                            <div className="flex justify-between">
                              <span className="text-blue-700 font-bold uppercase tracking-wider">● Deployment Live (My Assignment Account)</span>
                              <span className="font-mono text-[10px] text-slate-400">Ref: {activeCase.id}</span>
                            </div>
                            <p className="font-bold text-slate-800 text-sm mt-1">{activeCase.patientName} — Contact: {activeCase.patientPhone}</p>
                            <p className="text-slate-500 text-[11px]">Routine Matrix: {activeCase.service?.title} ({activeCase.shiftType}) for {activeCase.durationDays} Days</p>
                            <p className="text-[11px] text-slate-400 italic mt-1">Locality Delivery Point: {activeCase.patientAddress}</p>
                          </div>

                          {/* TIMELINE PROGRESSION GRID SLIDER */}
                          <div className="relative pl-8 space-y-4 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[3px] before:bg-slate-100">
                            {PIPELINE_STEPS.map((p, idx) => {
                              const isActive = idx === currentTrackingIndex;
                              const isCompleted = idx < currentTrackingIndex;
                              return (
                                <div key={p.step} className="relative">
                                  <div className={`absolute -left-[32px] w-6 h-6 rounded-full font-bold text-[10px] flex items-center justify-center border-2 transition-all ${
                                    isActive ? 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100' : isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-400'
                                  }`}>
                                    {isCompleted ? "✓" : p.step}
                                  </div>
                                  <div className={`p-3.5 rounded-xl border transition-all ${isActive ? 'bg-blue-50/50 border-blue-200 shadow-xs' : 'border-transparent opacity-70'}`}>
                                    <h4 className={`text-xs font-black ${isActive ? 'text-blue-700' : isCompleted ? 'text-slate-800 line-through' : 'text-slate-400'}`}>{p.name}</h4>
                                    <p className="text-[11px] mt-0.5 text-slate-400 leading-relaxed">{p.desc}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* 🎯 FIXED DISCHARGE BUTTON (NO JUMPING HEIGHT LAYOUTS) */}
                          <div className="pt-2 border-t border-slate-100 flex justify-end">
                            <button 
                              type="button" 
                              onClick={() => handleDischargeCase(activeCase.id)}
                              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs px-6 py-3 rounded-xl uppercase tracking-wider transition-all active:scale-97 cursor-pointer"
                            >
                              Finalize & Complete Case Discharge
                            </button>
                          </div>
                        </div>
                      ))}

                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* ROLE VIEW C: CENTRAL ADMINISTRATIVE AUDIT DESK                            */}
        {/* ========================================================================= */}
        {globalRole === 'admin_desk' && (
          <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
            {!isAdminLoggedIn ? (
              <form onSubmit={handleAdminLogin} className="max-w-md mx-auto bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
                <div>
                  <h2 className="font-extrabold text-slate-900 text-base font-display">Central Verification Desk</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">Enter supervisor verification credentials.</p>
                </div>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-400 block mb-1">Username</label>
                    <input type="text" className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-teal-500/30 focus:bg-white" value={adminUsername} onChange={(e)=>setAdminUsername(e.target.value)} placeholder="admin123" required />
                  </div>
                  <div>
                    <label className="font-bold text-slate-400 block mb-1">Password</label>
                    <input type="password" className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-teal-500/30 focus:bg-white" value={adminPassword} onChange={(e)=>setAdminPassword(e.target.value)} placeholder="••••••••" required />
                  </div>
                </div>
                <button type="submit" className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer shadow-md shadow-teal-600/20">Authenticate Operations</button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight font-display">Credentials Audit Deck</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Review active registration files waiting in validation streams.</p>
                  </div>
                  <button onClick={()=>{setIsAdminLoggedIn(false); setAdminPassword('');}} className="text-xs font-bold bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-slate-600 transition-colors cursor-pointer">Lock Terminal</button>
                </div>

                <div className="space-y-3">
                  {nursesDb.map(n => (
                    <div key={n.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-sm animate-fadeIn">
                      
                      {/* CARD IDENTITY HEADER */}
                      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 text-xs">
                        <div className="flex items-start gap-3.5">
                          
                          {/* AVATAR CONTAINER WITH CHECK OVERLAY */}
                          <div className="relative shrink-0">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-white font-black text-lg flex items-center justify-center uppercase shadow-md shadow-teal-500/25 font-display">
                              {n.name ? n.name.charAt(0) : "N"}
                            </div>
                            {n.status === 'approved' && (
                              <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-600 rounded-full border-2 border-white flex items-center justify-center text-white shadow-xs">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-2.5 h-2.5">
                                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* DETAILS SECTION */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{n.id}</span>
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${n.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{n.status}</span>
                            </div>
                            
                            <h4 className="text-base font-extrabold text-slate-900 font-display tracking-tight leading-none">
                              {n.name} <span className="font-normal text-slate-400 text-xs">({n.degree})</span>
                            </h4>
                            {n.status === 'approved' && (
                              <p className="text-[11px] font-black uppercase tracking-wider text-emerald-600 font-display">
                                Fully Verified Clinician
                              </p>
                            )}
                            <p className="text-slate-500 font-medium pt-0.5">Exp: <span className="text-slate-800 font-bold">{n.experience}</span> | Focus: <span className="text-teal-600 font-bold">{n.specialisation}</span> | Zone: <span className="text-slate-800 font-bold">{n.location}</span></p>
                          </div>
                        </div>

                        {/* WORKFLOW CONTROLS ACTIONS */}
                        <div className="sm:text-right shrink-0">
                          {n.status === 'pending' ? (
                            <div className="flex sm:flex-col gap-2 justify-end">
                              {/* ❌ REJECT / DISAPPROVE BUTTON */}
                              <button 
                                type="button"
                                onClick={() => rejectNurse(n.id)} 
                                className="bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap"
                              >
                                Decline Application
                              </button>
                              
                              {/* ✅ APPROVE BUTTON */}
                              <button 
                                type="button"
                                onClick={() => approveNurse(n.id)} 
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap"
                              >
                                Approve & Commission
                              </button>
                            </div>
                          ) : n.status === 'rejected' ? (
                            /* 🔴 DISAPPROVED STATE DISPLAY */
                            <div className="flex items-center gap-1.5 bg-red-50 text-red-800 font-bold text-xs px-3 py-2 rounded-xl border border-red-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                              <span>Application Declined</span>
                            </div>
                          ) : (
                            /* 🟢 VERIFIED / APPROVED STATE DISPLAY */
                            <div className="flex items-center gap-1 bg-emerald-50 text-emerald-800 font-bold text-xs px-3 py-2 rounded-xl border border-emerald-100">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-emerald-600">
                                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                              </svg>
                              <span>Fully Verified</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* DOCUMENTATION VIEW ATTACHMENTS DRAWER */}
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Submitted Clinical Credentials Documentation:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          
                          {/* Profile Photograph Box */}
                          <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-2 shadow-2xs">
                            <p className="text-xs font-bold text-slate-800">📷 Profile Photograph</p>
                            {n.profilePreview ? (
                              <div className="w-full h-48 rounded-lg overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center">
                                <img 
                                  src={n.profilePreview} 
                                  alt="Nurse Profile Avatar" 
                                  className="w-full h-full object-contain bg-slate-100" 
                                  onError={(e) => {
                                    e.target.onerror = null; 
                                    // 🚀 THE FIX: Dynamically adds '/Nurse-Booking-App/' path prefix automatically
                                    e.target.src = `${import.meta.env.BASE_URL}nurse.png`;
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="w-full h-48 rounded-lg border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-[11px] text-slate-400 italic">No Profile Image Loaded</div>
                            )}
                          </div>

                          {/* License & Registration Certification Box */}
                          <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-2 shadow-2xs">
                            <p className="text-xs font-bold text-slate-800">📄 License & Registration Certification</p>
                            {n.certificatePreview ? (
                              <div className="w-full h-48 rounded-lg overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center">
                                <img 
                                  src={n.certificatePreview} 
                                  alt="Medical Certificate Document" 
                                  className="w-full h-full object-contain p-1 bg-slate-100/50" 
                                  onError={(e) => {
                                    e.target.onerror = null; 
                                    // 🚀 THE FIX: Dynamically adds '/Nurse-Booking-App/' path prefix automatically
                                    e.target.src = `${import.meta.env.BASE_URL}certificate.png`;
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="w-full h-48 rounded-lg border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-[11px] text-slate-400 italic">No Certificate Loaded</div>
                            )}
                          </div>

                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </main>
      {/* ========================================================================= */}
      {/* OVERLAY PANEL MODAL: THE INDEPENDENT PATIENT INTERACTIVE PROFILE HUB      */}
      {/* ========================================================================= */}
      {showPatientProfileModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl overflow-hidden animate-scaleUp">
            
            <div className="bg-gradient-to-r from-slate-900 to-teal-950 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-sm tracking-wide uppercase text-slate-400 font-display">Patient Dashboard</h3>
                <p className="text-xs font-bold text-teal-400">{currentPatient ? "Verified Account File" : "Account Authentication"}</p>
              </div>
              <button onClick={() => setShowPatientProfileModal(false)} className="text-slate-400 hover:text-white text-xs bg-slate-800 w-6 h-6 rounded-full flex items-center justify-center font-bold cursor-pointer transition-colors">✕</button>
            </div>

            {!currentPatient ? (
              // INBOUND PORTAL SWITCH ROUTER FOR COLD USERS
              <form onSubmit={handlePatientAuth} className="p-6 space-y-4 text-xs">
                <p className="text-slate-400 font-medium leading-relaxed">Enter your contact phone marker to load an existing patient account file or initialize a fresh profile track.</p>
                
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase">Contact Phone Number</label>
                  <input 
                    type="tel" required placeholder="e.g. 9591308536" 
                    className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded-xl font-mono text-teal-600 font-bold outline-none focus:ring-2 focus:ring-teal-500/30 focus:bg-white" 
                    value={patientForm.phone} 
                    onChange={(e)=>{
                      const val = e.target.value;
                      const match = patientsDb.find(p => p.phone.trim() === val.trim());
                      if (match) { setPatientForm({ ...match }); } else { setPatientForm({ ...patientForm, phone: val }); }
                    }} 
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase">Patient Full Name</label>
                  <input type="text" required placeholder="Enter patient's legal name" className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/30 focus:bg-white" value={patientForm.name} onChange={(e)=>setPatientForm({...patientForm, name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase">Guardian Full Name</label>
                  <input type="text" required placeholder="Enter guardian's legal name" className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/30 focus:bg-white" value={patientForm.guardianName} onChange={(e)=>setPatientForm({...patientForm, guardianName: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase">Address</label>
                  <input type="text" required placeholder="Enter address" className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/30 focus:bg-white" value={patientForm.address} onChange={(e)=>setPatientForm({...patientForm, address: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500 uppercase">Age</label>
                    <input type="number" required placeholder="21" className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/30 focus:bg-white" value={patientForm.age} onChange={(e)=>setPatientForm({...patientForm, age: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500 uppercase">Gender</label>
                    <select className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-teal-500/30 focus:bg-white" value={patientForm.gender} onChange={(e)=>setPatientForm({...patientForm, gender: e.target.value})}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold py-3 rounded-xl tracking-wide uppercase mt-2 shadow-md shadow-teal-600/20 cursor-pointer transition-all">
                  Save Profile & Connect
                </button>
              </form>
            ) : (
              
              // ACTIVE ACCOUNT DASHBOARD LOG FOR VALID SESSIONS
              <div className="p-6 space-y-5 text-xs">
                {/* ⭐ FIX 1: DYNAMIC PROFILE SUBSCRIPTION CHIP */}
                <div className="flex items-center gap-3.5 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-white font-black text-lg flex items-center justify-center uppercase shadow-md shadow-teal-500/25 font-display">
                    {currentPatient.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 leading-tight font-display">{currentPatient.name}</h4>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">{currentPatient.gender} • Age: {currentPatient.age}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">📞 {currentPatient.phone}</p>
                    
                    {/* Prints whenever activeSubscription string exists on current user profile object */}
                    {currentPatient.activeSubscription && (
                      <div className="mt-1.5 inline-flex items-center gap-1 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-500/30 text-teal-800 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md animate-fadeIn">
                        💎 Tier: {currentPatient.activeSubscription}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-black text-slate-400 text-[10px] uppercase tracking-wider">Registered Care Engagements</h4>
                  
                  {activeBookingForCurrentPatient ? (
                    <div className="border border-teal-200 bg-teal-50/40 rounded-xl p-4 space-y-2 relative overflow-hidden">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-slate-900 text-[13px]">{activeBookingForCurrentPatient.service?.title}</span>
                        
                        {activeBookingForCurrentPatient.status === 'requested' && (
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-black tracking-wide uppercase px-2 py-0.5 rounded-md animate-pulse">⏱️ Requested</span>
                        )}
                        {activeBookingForCurrentPatient.status === 'active' && (
                          <span className="bg-teal-600 text-white text-[9px] font-black tracking-wide uppercase px-2 py-0.5 rounded-md">⚡ Active</span>
                        )}
                      </div>
                      
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                        Shift: <strong className="text-slate-800">{activeBookingForCurrentPatient.shiftType}</strong> for <strong className="text-slate-900">{activeBookingForCurrentPatient.durationDays} Days</strong>.
                      </p>

                      {activeBookingForCurrentPatient.status === 'active' && (
                        <div className="mt-2.5 p-2.5 bg-teal-50/80 border border-teal-100 rounded-xl text-[11px] animate-fadeIn">
                          <p className="text-teal-800 font-bold">🛡️ Assigned Clinical Nurse:</p>
                          <div className="mt-1 flex items-start gap-2.5">
                            <div className="relative mt-0.5">
                              <div className="w-7 h-7 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center uppercase">
                                {nursesDb.find(n => n.id === activeBookingForCurrentPatient.assignedNurseId)?.name?.charAt(0) || "N"}
                              </div>
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-600 rounded-full border border-white flex items-center justify-center text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-1.5 h-1.5">
                                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>

                            <div>
                              <p className="text-slate-800 font-extrabold leading-tight">
                                {nursesDb.find(n => n.id === activeBookingForCurrentPatient.assignedNurseId)?.name || "Assigned Care Professional"}
                                <span className="text-slate-400 font-mono text-[10px] font-normal ml-1">({activeBookingForCurrentPatient.assignedNurseId})</span>
                              </p>
                              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mt-0.5">Fully Verified Clinician</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center text-[11px]">
                        <span className="text-slate-400 font-medium">Est. Invoice Value:</span>
                        <span className="font-black text-slate-900 font-display">₹{activeBookingForCurrentPatient.service?.baseRatePerShift * activeBookingForCurrentPatient.shiftMultiplier * activeBookingForCurrentPatient.durationDays}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-slate-200 rounded-xl p-4 text-center text-slate-400">
                      <p className="font-medium">No operational treatment schedules active.</p>
                    </div>
                  )}
                </div>

                {/* SECURE LOGOUT ACCOUNT SWITCHER DRAWER PANEL */}
                <div className="pt-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setCurrentPatient(null);
                      setSelectedTier(null); // Safely clear chosen tier hooks on exit
                      setSubscriptionStartDate('');
                      setPatientForm({ name: '', guardianName: '', age: '', gender: 'Male', address: '', phone: '' });
                      setPatientSubView('catalog');
                      setShowPatientProfileModal(false);
                    }}
                    className="w-full bg-slate-900 text-white hover:bg-slate-800 font-extrabold py-2.5 rounded-xl text-center border border-slate-800 shadow-sm transition-all uppercase tracking-wider text-[11px] cursor-pointer"
                  >
                    Secure Logout & Close Profile
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* GLOBAL FOOTER COMPONENT                                                   */}
      {/* ========================================================================= */}
      <footer className="mt-20 border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          
          {/* Brand & Rights */}
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-black text-[10px] shadow-xs">
              H
            </div>
            <p className="font-medium">
              &copy; {new Date().getFullYear()} <span className="font-extrabold text-slate-900 font-display">Care Sphere</span>. All rights reserved.
            </p>
          </div>

          {/* Quick Links / Disclaimers */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 font-medium">
            <a href="#explore" onClick={(e) => { e.preventDefault(); setPatientSubView('catalog'); }} className="hover:text-teal-600 transition-colors">Browse medical service catalog</a>
            <span className="text-slate-200 hidden sm:inline">|</span>
            <p className="cursor-default">Hospital Quality to Your Living Room</p>
          </div>

        </div>
      </footer>
    </div>
  );
}
