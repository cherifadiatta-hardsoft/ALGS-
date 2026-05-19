/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  MapPin, 
  Bike, 
  User, 
  Send, 
  Phone, 
  Navigation, 
  CircleAlert,
  CheckCircle2,
  Share2,
  Clock,
  Smartphone,
  X,
  Compass,
  Map as MapIcon,
  Languages,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from './lib/firebase';
import { 
  collection, 
  addDoc, 
  doc, 
  onSnapshot, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { TrackingMap } from './components/TrackingMap';
import { translations, Language } from './translations';

const TrackingView = ({ deliveryId, language }: { deliveryId: string; language: Language }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDriver, setIsDriver] = useState(false);
  const [eta, setEta] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const t = translations[language];

  useEffect(() => {
    if (!deliveryId) return;

    const unsub = onSnapshot(doc(db, 'deliveries', deliveryId), (docSnap) => {
      if (docSnap.exists()) {
        setData(docSnap.data());
        setLoading(false);
      } else {
        setError(t.deliveryNotFound);
        setLoading(false);
      }
    }, (err) => {
      setError(t.errorConnection + ' : ' + err.message);
      setLoading(false);
    });

    return () => unsub();
  }, [deliveryId]);

  useEffect(() => {
    if (!isDriver || !deliveryId) return;

    let watchId: number;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          updateDoc(doc(db, 'deliveries', deliveryId), {
            driverLocation: { lat: latitude, lng: longitude },
            updatedAt: serverTimestamp()
          });
        },
        (err) => console.error(err),
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isDriver, deliveryId]);

  const openInNativeMaps = (lat: number, lng: number) => {
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    if (isAndroid) {
      // Force ouverture Google Maps App sur Android
      window.location.href = `geo:${lat},${lng}?q=${lat},${lng}`;
    } else if (isiOS) {
      // Sur iPhone, on utilise Google Maps Search API qui propose souvent d'ouvrir l'app
      window.location.href = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    } else {
      // Desktop ou autre
      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
    }
  };

  if (loading) return (
    <div className="w-full max-w-md bg-white rounded-3xl p-12 text-center shadow-xl border border-slate-100 italic font-medium text-slate-400">
      <Clock className="animate-spin mx-auto mb-4 text-emerald-500" size={32} />
      {t.loadingTracking}
    </div>
  );
  
  if (error) return (
    <div className="w-full max-w-md bg-white rounded-3xl p-12 text-center shadow-xl border border-slate-100">
      <CircleAlert className="mx-auto mb-4 text-red-500" size={32} />
      <p className="text-red-500 font-bold">{error}</p>
      <button onClick={() => window.location.hash = '#/'} className="mt-4 text-xs font-black uppercase tracking-widest text-slate-400 underline">{t.back}</button>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md bg-white rounded-3xl shadow-xl p-6 border border-slate-100"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-black text-slate-900">{t.trackingTitle}</h2>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">ID: {deliveryId.slice(0, 8)}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
            data.status === 'en_route' ? 'bg-emerald-100 text-emerald-600' : 
            data.status === 'pending' ? 'bg-orange-100 text-orange-600' :
            'bg-slate-100 text-slate-500'
          }`}>
            {data.status === 'en_route' ? t.statusEnRoute : 
             data.status === 'pending' ? t.statusPending :
             data.status}
          </div>
          {eta && (
            <div className="flex items-center gap-1.5 text-orange-600 font-black text-[10px] uppercase tracking-wider bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100">
              <Clock size={10} />
              {t.etaArrival} : {eta}
            </div>
          )}
        </div>
      </div>

      <TrackingMap 
        clientLocation={data.clientLocation} 
        driverLocation={data.driverLocation}
        showDriver={true}
        onEtaUpdate={setEta}
        isDriverView={isDriver}
      />

      <div className="mt-6 space-y-4">
        <button 
          onClick={() => openInNativeMaps(data.clientLocation.lat, data.clientLocation.lng)}
          className="flex gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-sm transition-all group w-full"
        >
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
            <MapPin size={20} />
          </div>
          <div className="text-left flex-1">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.1em]">{t.destination}</p>
            <p className="text-sm font-bold text-slate-800 leading-tight mt-1">{data.addressDetails || t.sharedByGps}</p>
          </div>
          <div className="flex items-center text-emerald-400 group-hover:text-emerald-600 transition-colors">
             <Smartphone size={16} />
          </div>
        </button>

        <button 
          onClick={() => openInNativeMaps(data.clientLocation.lat, data.clientLocation.lng)}
          className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
        >
          <MapIcon size={16} />
          {t.openInGoogleMaps}
        </button>

        {eta && (
          <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                <Bike size={20} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.1em]">{t.etaEstimated}</p>
                <p className="text-base font-black text-orange-600 leading-tight mt-0.5">{eta}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-black uppercase text-slate-300">{t.etaBasedOnTraffic}</p>
            </div>
          </div>
        )}

        {!isDriver ? (
          <button 
            onClick={() => setShowConfirmation(true)}
            className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Bike size={16} className="relative z-10 transition-transform group-hover:-rotate-12" />
            <span className="relative z-10">{t.iAmDriver}</span>
          </button>
        ) : (
          <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex items-center gap-3 shadow-inner">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg shadow-orange-200">
              <Compass size={16} className="animate-spin-slow" />
            </div>
            <p className="text-xs font-bold text-orange-900 leading-tight">
              {t.trackingActive}
            </p>
          </div>
        )}

        <AnimatePresence>
          {showConfirmation && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white w-full max-w-xs rounded-3xl p-8 shadow-2xl border border-slate-100 text-center"
              >
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mx-auto mb-6">
                  <Navigation size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">{t.activateTrackingTitle}</h3>
                <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                  {t.activateTrackingDesc}
                </p>
                <div className="space-y-3">
                  <button 
                    onClick={() => {
                      setIsDriver(true);
                      setShowConfirmation(false);
                      // Update status to en_route
                      updateDoc(doc(db, 'deliveries', deliveryId), {
                        status: 'en_route',
                        updatedAt: serverTimestamp()
                      }).catch(err => console.error("Error updating status:", err));
                    }}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                  >
                    {t.startTrip}
                  </button>
                  <button 
                    onClick={() => setShowConfirmation(false)}
                    className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-slate-400"
                  >
                    {t.later}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button 
        onClick={() => window.location.hash = '#/'}
        className="mt-6 w-full py-3 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-slate-500 transition-colors"
      >
        {t.exitTracking}
      </button>
    </motion.div>
  );
};

export default function App() {
  const [language, setLanguage] = useState<Language>('fr');
  const t = translations[language];

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'fr' ? 'en' : 'fr');
  };

  // 'client' = Le client partage sa position, 'driver' = Le livreur demande la position
  const [activeTab, setActiveTab] = useState<'client' | 'driver'>('client'); 
  
  const [clientPhone, setClientPhone] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [addressDetails, setAddressDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showPreShareConfirm, setShowPreShareConfirm] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [capturedLocation, setCapturedLocation] = useState<{lat: number, lng: number} | null>(null);
  
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'searching' | 'stabilizing' | 'found'>('idle');
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  
  // Tracking Data State
  const [deliveryData, setDeliveryData] = useState<any>(null);
  const [isTrackingMode, setIsTrackingMode] = useState(false);
  const [isDriverView, setIsDriverView] = useState(false);
  
  // Routing State
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/');
  
  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'other'>('other');

  // Registration of Service Worker and PWA Logic
  useEffect(() => {
    // Check if already installed/standalone
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
    }

    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS) setPlatform('ios');

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('Service Worker enregistré successfully:', registration.scope);
            
            // Check for updates periodically or on registration
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New content is available, show toast
                    setShowUpdateToast(true);
                  }
                };
              }
            };
          }
        ).catch(err => console.log('SW registration failed:', err));
      });

      // Reload page when new SW takes control
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Hash control
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#/');
      window.scrollTo(0, 0); // Reset scroll on navigation
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initial check

    // If iOS and not standalone, show the banner manually after a delay
    if (isIOS && !window.matchMedia('(display-mode: standalone)').matches && !(window.navigator as any).standalone) {
      const timer = setTimeout(() => {
        setShowInstallBanner(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response: ${outcome}`);
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    }
  };

  // Nettoyage et formatage du numéro pour WhatsApp (Full International)
  const formatPhoneForWa = (phone: string) => {
    let cleaned = phone.replace(/\D/g, ''); // Garde uniquement les chiffres
    if (cleaned.length === 9 && cleaned.startsWith('7')) {
      return '221' + cleaned;
    }
    return cleaned;
  };

  // Formatage visuel pendant la saisie (ex: +221 77 000 00 00)
  const formatPhoneDisplay = (value: string) => {
    let cleaned = value.replace(/\D/g, '');
    if (cleaned.startsWith('221')) cleaned = cleaned.slice(3);
    
    if (cleaned.length === 0) return '';
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 5) return `${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
    if (cleaned.length <= 7) return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`;
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7, 9)}`;
  };

  const resetForm = () => {
    setClientPhone('');
    setDriverPhone('');
    setAddressDetails('');
    setError('');
    setSuccess(false);
    setWhatsappUrl('');
    setCapturedLocation(null);
    setGpsAccuracy(null);
    setGpsStatus('idle');
  };

  // FLUX 1 : Le client localise et envoie au livreur
  const shareLocation = async () => {
    setError('');
    setSuccess(false);
    
    if (!clientPhone || !driverPhone) {
      setError(t.errorPhoneRequired);
      return;
    }

    if (!navigator.geolocation) {
      setError(t.errorGeoNotSupported);
      return;
    }

    setLoading(true);
    setGpsStatus('searching');
    setGpsAccuracy(null);
    
    // Configuration GPS stricte pour précision SIM/Matérielle maximale
    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 30000, 
      maximumAge: 0
    };

    let watchId: number;
    let stabilizedPos: GeolocationPosition | null = null;
    let attempts = 0;
    let finished = false;

    const stopAndProceed = async (pos: GeolocationPosition) => {
      if (finished) return;
      finished = true;
      
      if (watchId) navigator.geolocation.clearWatch(watchId);
      
      setGpsStatus('stabilizing');
      try {
        const { latitude, longitude } = pos.coords;
        setCapturedLocation({ lat: latitude, lng: longitude });
        setGpsStatus('found');
        
        // On attend un court instant pour que l'utilisateur voit la carte
        setTimeout(async () => {
          // Sauvegarde dans Firestore pour le tracking temps réel
          const deliveryRef = await addDoc(collection(db, 'deliveries'), {
            clientPhone: clientPhone,
            driverPhone: driverPhone,
            clientLocation: { lat: latitude, lng: longitude },
            addressDetails: addressDetails,
            status: 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });

          const formattedDriver = formatPhoneForWa(driverPhone);
          const formattedClientForMessage = formatPhoneForWa(clientPhone);
          const trackingLink = `${window.location.origin}/#/track/${deliveryRef.id}`;
          
          const message = t.whatsappMessage(trackingLink, addressDetails, formattedClientForMessage);

          const waUrl = `https://wa.me/${formattedDriver}?text=${encodeURIComponent(message)}`;
          setWhatsappUrl(waUrl);
          
          // Tentative d'ouverture directe
          setGpsStatus('idle');
          window.location.href = waUrl; 
          
          setSuccess(true);
          setShowSuccessToast(true);
          setTimeout(() => setShowSuccessToast(false), 5000);
        }, 1500);
      } catch (err: any) {
        setLoading(false);
        setGpsStatus('idle');
        setError(t.errorConnection + " : " + err.message);
      }
    };

    // On utilise watchPosition pour "homing" sur la meilleure précision (SIM + GPS)
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        attempts++;
        const accuracy = Math.round(position.coords.accuracy);
        setGpsAccuracy(accuracy);
        stabilizedPos = position;

        // Si la précision est excellente (< 20m) ou après 4 tentatives, on valide
        if (accuracy < 20 || attempts > 4) {
          stopAndProceed(position);
        }
      },
      (err) => {
        if (stabilizedPos) {
          stopAndProceed(stabilizedPos);
        } else {
          setLoading(false);
          setGpsStatus('idle');
          if (err.code === 1) {
            setError(t.errorGpsPermission);
          } else if (err.code === 3) {
            setError(t.errorGpsTimeout);
          } else {
            setError(t.errorGpsGeneral);
          }
          console.error("Erreur GPS :", err);
          if (watchId) navigator.geolocation.clearWatch(watchId);
        }
      },
      geoOptions
    );

    // Sécurité : au bout de 12 secondes, on prend ce qu'on a de mieux
    setTimeout(() => {
      if (loading && stabilizedPos && gpsStatus !== 'idle') {
        stopAndProceed(stabilizedPos);
      }
    }, 12000);
  };

  // FLUX 2 : Le livreur demande la position au client
  const handleDriverRequest = () => {
    setError('');
    setSuccess(false);
    
    if (!clientPhone) {
      setError(t.errorClientPhoneRequired);
      return;
    }

    const formattedClient = formatPhoneForWa(clientPhone);
    // Lien de l'appli en production où le client pourra cliquer
    const appUrl = window.location.origin; 
    
    const message = t.driverRequestMessage(appUrl);

    const waUrl = `https://wa.me/${formattedClient}?text=${encodeURIComponent(message)}`;
    setWhatsappUrl(waUrl);
    window.open(waUrl, '_blank');
    setSuccess(true);
  };

  // Partager SA position au client (Action Livreur)
  const shareDriverLocation = () => {
    setLoading(true);
    setError('');
    setSuccess(false);
    setGpsStatus('searching');
    
    if (!clientPhone) {
      setError(t.errorClientPhoneRequired);
      setLoading(false);
      return;
    }

    if (!navigator.geolocation) {
      setError(t.errorGeoNotSupported);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const formattedClient = formatPhoneForWa(clientPhone);
        
        // On crée aussi une "livraison" pour le tracking livreur -> client
        try {
          const deliveryRef = await addDoc(collection(db, 'deliveries'), {
            clientPhone: clientPhone,
            driverLocation: { lat: latitude, lng: longitude },
            // On peut mettre la position du livreur en destination si c'est juste un partage
            clientLocation: { lat: latitude, lng: longitude }, 
            status: 'en_route',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });

          const trackingLink = `${window.location.origin}/#/track/${deliveryRef.id}`;
          const message = t.driverShareMessage(trackingLink);
          const waUrl = `https://wa.me/${formattedClient}?text=${encodeURIComponent(message)}`;
          
          setWhatsappUrl(waUrl);
          window.open(waUrl, '_blank');
          
          setLoading(false);
          setGpsStatus('idle');
          setSuccess(true);
          setShowSuccessToast(true);
          setTimeout(() => setShowSuccessToast(false), 5000);
        } catch (err: any) {
          setLoading(false);
          setGpsStatus('idle');
          setError(t.errorConnection);
        }
      },
      (err) => {
        setLoading(false);
        setGpsStatus('idle');
        if (err.code === 1) setError(t.errorGpsPermission);
        else if (err.code === 3) setError(t.errorGpsTimeout);
        else setError(t.errorGpsGeneral);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const renderTracking = () => {
    const deliveryId = currentHash.split('/track/')[1];
    
    if (!deliveryId) {
      return (
        <div className="w-full max-w-md bg-white rounded-3xl p-8 text-center">
          <CircleAlert className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-xl font-black mb-2">{t.missingDeliveryId}</h2>
          <button onClick={() => window.location.hash = '#/'} className="text-emerald-500 font-bold">{t.back}</button>
        </div>
      );
    }

    return <TrackingView deliveryId={deliveryId} language={language} />;
  };

  const renderHome = () => (
    <motion.div 
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/60 p-6 border border-slate-100 flex flex-col"
    >
      {/* Tabs Selection */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8 relative">
        <button 
          onClick={() => { setActiveTab('client'); setError(''); setSuccess(false); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-xl transition-all z-10 ${activeTab === 'client' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <User size={14} />
          {t.clientSpace}
        </button>
        <button 
          onClick={() => { setActiveTab('driver'); setError(''); setSuccess(false); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-xl transition-all z-10 ${activeTab === 'driver' ? 'bg-white text-[#FF7A00] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Bike size={16} />
          {t.driverSpace}
        </button>
      </div>

      {/* Notifications */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-2 mb-6"
          >
            <div className="bg-red-50 text-red-600 text-xs px-4 py-3 rounded-xl font-medium border border-red-100 flex items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-2.5">
                <CircleAlert size={18} className="shrink-0 text-red-500" />
                {error}
              </div>
              <button 
                onClick={() => setError('')}
                className="p-1 hover:bg-red-100 rounded-full transition-colors"
                aria-label="Fermer"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
        {success && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-2 mb-6"
          >
            <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-2xl p-4 shadow-md overflow-hidden relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
                  <span className="font-bold text-sm">{t.successMessage}</span>
                </div>
                <button 
                  onClick={resetForm}
                  className="text-[10px] font-black uppercase text-emerald-600 hover:text-emerald-800"
                >
                  {t.reset}
                </button>
              </div>
              
              {whatsappUrl && (
                <div className="space-y-3 pt-2 border-t border-emerald-100">
                  <p className="text-[10px] text-emerald-700 font-medium leading-relaxed">
                    {t.waFallbackDesc}
                  </p>
                  <a 
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-200 active:scale-[0.98] transition-all"
                  >
                    <Send size={14} />
                    {t.openWhatsApp}
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'client' ? (
            <motion.div 
              key="client-form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-5"
            >
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Phone size={12} /> {t.myWhatsApp}
                </label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold border-r border-slate-200 pr-3">+221</span>
                  <input 
                    type="tel" 
                    placeholder="77 000 00 00" 
                    value={clientPhone} 
                    onChange={(e) => setClientPhone(formatPhoneDisplay(e.target.value))} 
                    className="w-full bg-emerald-50/30 border border-slate-200 rounded-2xl py-3.5 pl-16 pr-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#10B981]/10 focus:border-[#10B981] transition-all font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Bike size={12} /> {t.driverNumber}
                </label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold border-r border-slate-200 pr-3">+221</span>
                  <input 
                    type="tel" 
                    placeholder="76 000 00 00" 
                    value={driverPhone} 
                    onChange={(e) => setDriverPhone(formatPhoneDisplay(e.target.value))} 
                    className="w-full bg-orange-50/30 border border-slate-200 rounded-2xl py-3.5 pl-16 pr-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#10B981]/10 focus:border-[#10B981] transition-all font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <MapPin size={12} /> {t.addressDetails}
                </label>
                <textarea 
                  placeholder={t.landmarkSmartPlaceholder} 
                  rows={2} 
                  value={addressDetails} 
                  onChange={(e) => setAddressDetails(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#10B981]/10 focus:border-[#10B981] resize-none transition-all placeholder:text-slate-300"
                />
              </div>

              <AnimatePresence>
                {gpsStatus !== 'idle' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 shadow-sm relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-200 relative">
                          {gpsStatus === 'found' ? <CheckCircle2 size={16} /> : <Compass size={18} className="animate-spin-slow" />}
                          {gpsStatus !== 'found' && (
                            <div className="absolute inset-0 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-black text-emerald-900 uppercase tracking-wide">
                            {gpsStatus === 'searching' ? t.findingPosition : 
                             gpsStatus === 'stabilizing' ? t.stabilizingGps : 
                             gpsStatus === 'found' ? t.positionFound : t.searchingGps}
                          </p>
                          {gpsAccuracy !== null && (
                            <p className="text-[10px] font-bold text-emerald-600">
                              {t.accuracy}: {gpsAccuracy}{t.meters}
                            </p>
                          )}
                        </div>
                      </div>
                      {gpsAccuracy !== null && (
                        <div className="text-right">
                          <div className="h-1.5 w-16 bg-emerald-200 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.max(10, 100 - (gpsAccuracy * 2))}%` }}
                              className="h-full bg-emerald-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {capturedLocation && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl overflow-hidden border border-emerald-200 shadow-inner h-24 bg-slate-100 relative group"
                      >
                         <TrackingMap 
                            clientLocation={capturedLocation} 
                            driverLocation={capturedLocation}
                            showDriver={false}
                            isDriverView={false}
                            onEtaUpdate={() => {}}
                          />
                          <div className="absolute inset-0 bg-emerald-900/10 pointer-events-none" />
                      </motion.div>
                    )}
                    
                    {gpsStatus === 'found' && (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center mt-3 text-[10px] font-black text-emerald-600 uppercase tracking-widest animate-pulse"
                      >
                        {t.openingWhatsApp}
                      </motion.p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div 
              key="driver-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
                <div className="flex gap-3">
                  <Clock className="text-orange-500 shrink-0 mt-0.5" size={16} />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-orange-950">{t.driverTip}</p>
                    <p className="text-[11px] text-orange-800 leading-relaxed font-medium">
                      {t.driverTipText}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <User size={12} /> {t.clientWhatsApp}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold border-r border-slate-200 pr-3">+221</span>
                  <input 
                    type="tel" 
                    placeholder="77 000 00 00" 
                    value={clientPhone} 
                    onChange={(e) => setClientPhone(formatPhoneDisplay(e.target.value))} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-16 pr-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDriverRequest}
                  disabled={loading}
                  className="py-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-800 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
                >
                  <MessageSquare size={18} className="text-slate-400" />
                  {t.requestLocation}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={shareDriverLocation}
                  disabled={loading}
                  className="py-4 bg-slate-900 border-2 border-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white flex flex-col items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 disabled:opacity-50"
                >
                  <MapPin size={18} className="text-emerald-400" />
                  {t.shareLocation}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="pt-8">
        {success ? (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={resetForm}
            className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-[#FF7A00] border-2 border-orange-100 bg-orange-50/30 flex items-center justify-center gap-3 transition-all"
          >
            <Clock size={18} />
            {t.newOperation}
          </motion.button>
        ) : activeTab === 'client' ? (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (!clientPhone || !driverPhone) {
                setError(t.errorPhoneRequired);
                return;
              }
              setShowPreShareConfirm(true);
            }}
            disabled={loading || gpsStatus !== 'idle'}
            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white shadow-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200 group relative overflow-hidden`}
          >
             <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
             <div className="flex items-center gap-2 group-active:scale-95 transition-transform">
                <Send size={18} />
                {t.sendViaWhatsApp}
             </div>
          </motion.button>
        ) : null}
      </div>
    </motion.div>
  );

  const renderAbout = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/60 p-8 border border-slate-100"
    >
      <h2 className="text-2xl font-black text-slate-950 mb-6">{t.aboutTitle}</h2>
      <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
        <p>
          {t.aboutDesc1}
        </p>
        <p>
          {t.aboutDesc2}
        </p>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mt-6">
          <p className="text-[11px] font-black uppercase text-slate-400 mb-2 tracking-widest">{t.values}</p>
          <ul className="space-y-2 font-bold text-slate-800">
            <li className="flex items-center gap-2 italic">🚀 {t.value1}</li>
            <li className="flex items-center gap-2 italic">📍 {t.value2}</li>
            <li className="flex items-center gap-2 italic">🇸🇳 {t.value3}</li>
          </ul>
        </div>
      </div>
      <button 
        onClick={() => { window.location.hash = '#/'; }}
        className="mt-8 w-full py-4 text-xs font-black uppercase tracking-widest text-[#FF7A00] border-2 border-orange-50 rounded-2xl hover:bg-orange-50 transition-colors"
      >
        {t.backHome}
      </button>
    </motion.div>
  );

  const renderContact = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/60 p-8 border border-slate-100 text-center"
    >
      <div className="w-16 h-16 bg-orange-100 rounded-3xl flex items-center justify-center text-[#FF7A00] mx-auto mb-6">
        <Phone size={32} />
      </div>
      <h2 className="text-2xl font-black text-slate-950 mb-2">{t.contactTitle}</h2>
      <p className="text-sm text-slate-500 mb-8 px-4">{t.contactDesc}</p>
      
      <div className="space-y-3">
        <a 
          href="https://wa.me/221770000000" 
          className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100 group hover:border-emerald-300 transition-all"
        >
          <div className="flex flex-col items-start">
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{t.whatsAppSupport}</span>
            <span className="text-sm font-bold text-slate-800">+221 77 ... .. ..</span>
          </div>
          <Send size={18} className="text-emerald-500 group-hover:translate-x-1 transition-transform" />
        </a>
        
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
          <div className="flex flex-col items-start">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.email}</span>
            <span className="text-sm font-bold text-slate-800">contact@algs.sn</span>
          </div>
          <X size={18} className="text-slate-300" />
        </div>
      </div>

      <button 
        onClick={() => { window.location.hash = '#/'; }}
        className="mt-8 w-full py-4 text-xs font-black uppercase tracking-widest text-[#FF7A00] border-2 border-orange-50 rounded-2xl hover:bg-orange-50 transition-colors"
      >
        {t.backHome}
      </button>
    </motion.div>
  );

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center p-4 font-sans text-slate-800">
      
      <AnimatePresence>
        {showPreShareConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-xs rounded-3xl p-8 shadow-2xl border border-slate-100 text-center"
            >
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-6 relative">
                <Compass size={32} className="animate-spin-slow" />
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">{t.allowGpsTitle}</h3>
              <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                {t.allowGpsDesc}
              </p>
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    setShowPreShareConfirm(false);
                    shareLocation();
                  }}
                  className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
                >
                  <MapPin size={18} />
                  {t.confirmButton}
                </button>
                <button 
                  onClick={() => setShowPreShareConfirm(false)}
                  className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-slate-400"
                >
                  {t.cancel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-[340px] bg-emerald-600 text-white rounded-2xl p-4 shadow-2xl z-[60] flex items-center gap-3 border border-emerald-400"
          >
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-emerald-100 text-left">Succès</p>
              <p className="text-xs font-bold text-white">{t.successMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUpdateToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[340px] bg-slate-900 text-white rounded-2xl p-4 shadow-2xl z-[60] flex items-center justify-between gap-4 border border-white/10"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Clock size={16} />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-emerald-400 text-left">{t.updateAvailable}</p>
                <p className="text-xs font-bold">{t.updateAvailableDesc}</p>
              </div>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="bg-emerald-500 text-white px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
            >
              {t.refresh}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PWA Install Banner */}
      <AnimatePresence>
        {showInstallBanner && !isStandalone && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="w-full max-w-md bg-white border-b border-emerald-100 p-4 mb-4 shadow-xl shadow-emerald-900/5 flex flex-col gap-3 z-50 sticky top-0"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-200">
                  <Smartphone size={22} />
                </div>
                <div className="flex flex-col">
                  <p className="text-[11px] font-black uppercase text-emerald-600 tracking-wider text-left">{t.pwaInstallTitle}</p>
                  <p className="text-xs font-bold text-slate-700">{t.pwaInstallDesc}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowInstallBanner(false)}
                className="p-2 text-slate-300 hover:text-slate-500 rounded-full hover:bg-slate-50 transition-colors"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            {platform === 'ios' ? (
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                <p className="text-[10px] text-emerald-800 font-bold leading-tight">
                  {t.pwaInstallIOS}
                </p>
              </div>
            ) : (
              <button 
                onClick={handleInstallClick}
                className="w-full bg-emerald-500 text-white text-xs font-black uppercase tracking-widest py-3.5 rounded-xl active:scale-[0.98] transition-all shadow-lg shadow-emerald-200"
              >
                {t.pwaInstallBtn}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="w-full max-w-md py-8">
        <div className="flex items-center justify-between mb-2">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-start"
            onClick={() => { window.location.hash = '#/'; }}
            style={{ cursor: 'pointer' }}
          >
            <div className="flex items-center gap-2">
              <span className="text-4xl font-black tracking-tighter text-slate-950">
                AL<span className="text-[#FF7A00]">G</span>S
              </span>
            </div>
          </motion.div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={toggleLanguage}
            className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-2xl shadow-sm hover:bg-slate-50 transition-colors group"
          >
            <Languages size={16} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
              {language === 'fr' ? 'English' : 'Français'}
            </span>
          </motion.button>
        </div>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold"
        >
          {t.slogan}
        </motion.p>
      </div>

      {/* Main Content Router */}
      <AnimatePresence mode="wait">
        {currentHash.includes('#/track/') ? (
          <React.Fragment key="tracking">{renderTracking()}</React.Fragment>
        ) : currentHash === '#/about' ? (
          <React.Fragment key="about">{renderAbout()}</React.Fragment>
        ) : currentHash === '#/contact' ? (
          <React.Fragment key="contact">{renderContact()}</React.Fragment>
        ) : (
          <React.Fragment key="home">{renderHome()}</React.Fragment>
        )}
      </AnimatePresence>

      {/* Trust Badge */}
      <div className="mt-8 flex items-center gap-2 px-6 py-2 bg-slate-200/40 rounded-full">
        <Navigation size={12} className="text-slate-400" />
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.1em]">
          Dakar • Thiès • Saint-Louis • Mbour
        </span>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-md mt-auto py-6">
        <div className="flex flex-col items-center gap-1">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            ALGS © 2026 • {t.smartDelivery}
          </p>
          <div className="flex items-center gap-4 mt-2">
            <a 
              href="#/about" 
              className={`text-[9px] font-bold transition-colors uppercase ${currentHash === '#/about' ? 'text-slate-950 underline underline-offset-4' : 'text-slate-300 hover:text-slate-500'}`}
            >
              {t.about}
            </a>
            <span className="w-1 h-1 rounded-full bg-slate-200"></span>
            <a 
              href="#/contact" 
              className={`text-[9px] font-bold transition-colors uppercase ${currentHash === '#/contact' ? 'text-slate-950 underline underline-offset-4' : 'text-slate-300 hover:text-slate-500'}`}
            >
              {t.support}
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
