import React, { useState, useRef, useEffect, Component } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';
import { 
  CreditCard, 
  Code, 
  ShoppingBag, 
  Copy, 
  Check, 
  Wallet, 
  Building2, 
  Smartphone,
  Monitor,
  LayoutDashboard,
  Image as ImageIcon,
  Terminal,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe,
  CheckCircle2,
  Menu,
  X,
  Upload,
  AlertCircle,
  Lock,
  LogOut,
  Trash2,
  Play,
  User as UserIcon,
  ChevronRight,
  Mail,
  Calendar,
  Shield,
  Share2,
  PlusCircle,
  PlayCircle,
  FileText,
  ExternalLink,
  Bitcoin,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, loginWithGoogle, logout } from './firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, where, serverTimestamp, onSnapshot, increment, updateDoc } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    tenantId: string;
    providerInfo: {
      providerId: string;
      displayName: string;
      email: string;
      photoUrl: string;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || '',
      email: auth.currentUser?.email || '',
      emailVerified: auth.currentUser?.emailVerified || false,
      isAnonymous: auth.currentUser?.isAnonymous || false,
      tenantId: auth.currentUser?.tenantId || '',
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName || '',
        email: provider.email || '',
        photoUrl: provider.photoURL || ''
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  state = { hasError: false, error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      let errorMsg = this.state.error?.message || 'An unknown error occurred';
      try {
        const parsed = JSON.parse(errorMsg);
        if (parsed.error) errorMsg = parsed.error;
      } catch (e) {}

      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6 text-zinc-900">
          <div className="max-w-md w-full bg-red-500/10 border border-red-500/20 rounded-3xl p-8 text-center">
            <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-red-400 mb-2">Something went wrong</h1>
            <p className="text-zinc-500 text-sm mb-6">{errorMsg}</p>
            <button onClick={() => window.location.reload()} className="bg-red-500/20 text-red-400 px-6 py-2 rounded-xl text-sm font-medium hover:bg-red-500/30">
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

interface PaymentPayload {
  merchantId: string;
  merchantName: string;
  itemName: string;
  amount: number;
  currency: string;
  coverImage: string;
  methods: {
    upi?: string;
    bank?: { account: string; ifsc: string };
    crypto?: { address: string; network: string };
    stripe?: { key: string; priceId: string };
    paypal?: { clientId: string };
  };
  createdAt?: any;
  status?: 'active' | 'paused';
  expiresAt?: number | null;
  views?: number;
}

const isHttpUrl = (value: string) => /^https?:\/\/\S+$/i.test(value.trim());

const staticPageContent: Record<string, { title: string; content: string }> = {
  dashboard: {
    title: "Dashboard Overview",
    content: "Welcome to your slaypay.xyz dashboard. Here you can monitor your transaction volume, manage your active products, and view real-time payment analytics."
  },
  create: {
    title: "Create Product",
    content: "Generate a new payment link by providing product details and your preferred payment methods."
  },
  playground: {
    title: "Playground",
    content: "Experience your products in a live environment. Preview your hosted storefront and test how your checkout links behave when embedded into external websites."
  },
  docs: {
    title: "Integration & API",
    content: "Comprehensive documentation for integrating slaypay.xyz into your existing workflows using our lightweight JS SDK and REST APIs."
  },
  contact: {
    title: "Contact Us",
    content: `Need help with your payment links, merchant account setup, or link verification process? We are here to help.

Support Email: support@slaypay.xyz
Response Time: Within 1 business day

When contacting support, include:
- Your registered email address
- Product/link ID (if applicable)
- A short description of the issue
- Screenshot or error message (if available)

Business Hours:
Monday to Friday, 9:00 AM to 6:00 PM IST

For urgent production-impacting issues, mention "URGENT" in the email subject line.`
  },
  terms: {
    title: "Terms and Conditions",
    content: `Effective Date: March 19, 2026

1. Service Scope
slaypay.xyz provides tools to publish and share payment instruction links. We are not a payment processor, bank, wallet provider, money transmitter, or escrow service. Funds are transferred directly between payer and merchant through third-party rails selected by the merchant.

2. Merchant Responsibility
Merchants are solely responsible for:
- Accuracy of payment details and amounts
- Delivery of goods/services
- Tax, invoicing, and legal compliance in their jurisdiction
- Customer support, refund, and dispute handling

3. User Conduct
You agree not to use the platform for unlawful, fraudulent, misleading, harmful, or prohibited activities. We may suspend or remove access for abuse, policy violations, or legal risk.

4. No Transaction Liability
Because payments happen outside our platform, we do not control or guarantee payment completion, reversals, chargebacks, settlement timelines, or payer/merchant disputes.

5. Data and Account Security
You are responsible for keeping your account access secure and for all actions performed through your account.

6. Availability
We aim for reliable service but do not guarantee uninterrupted availability. Features may change, be updated, or be discontinued.

7. Limitation of Liability
To the maximum extent permitted by law, slaypay.xyz is not liable for indirect, incidental, special, consequential, or punitive damages, or for loss of revenue/profits/data arising from use of the service.

8. Termination
We may suspend or terminate access for violations, abuse, legal obligations, or operational risk.

9. Governing Law
These terms are governed by applicable local laws based on the merchant’s operating jurisdiction unless otherwise required by law.

10. Contact
For legal or compliance concerns, contact: support@slaypay.xyz`
  },
  privacy: {
    title: "Privacy Policy",
    content: `Effective Date: March 19, 2026

slaypay.xyz values your privacy. This policy explains what we collect, why we collect it, and how it is handled.

1. Information We Collect
- Account data: name, email, authentication provider details
- Merchant content: product names, payment instructions, pricing, media assets
- Technical data: device/browser metadata, logs, diagnostics, and security events

2. How We Use Data
- To operate and secure the platform
- To provide support and resolve issues
- To prevent abuse, fraud, and policy violations
- To improve product performance and reliability

3. Payment Data Scope
Payments are executed outside our platform via merchant-provided methods. We do not process card transactions directly unless explicitly integrated with a third-party processor by the merchant.

4. Data Sharing
We do not sell personal data. Data may be shared only with infrastructure/service providers required to run the product, or when legally required.

5. Data Retention
We retain data for as long as needed to provide services, comply with legal obligations, and resolve disputes.

6. Security
We apply reasonable administrative and technical safeguards, but no system is completely risk-free.

7. Your Rights
You may request access, correction, or deletion of personal data, subject to legal and operational limits.

8. Children
The platform is not intended for children under 18.

9. Contact
Privacy requests and concerns: support@slaypay.xyz`
  }
};

const getTabTitle = (tab: string) => {
  const titleMap: Record<string, string> = {
    dashboard: 'Dashboard',
    create: 'Create Product',
    playground: 'Playground',
    docs: 'Integration & API',
    contact: 'Contact',
    terms: 'Terms & Conditions',
    privacy: 'Privacy Policy',
    profile: 'Profile Settings',
    security: 'Security',
    pay: 'Payment Link'
  };
  return titleMap[tab] || (tab.charAt(0).toUpperCase() + tab.slice(1));
};

const BrandLogo = ({ className = "h-20 w-auto" }: { className?: string }) => (
  <svg 
    viewBox="0 0 500 160" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    fill="none"
  >
    <g transform="translate(250, 0)">
      {/* Centering logic: Content width is ~440px. Midpoint at 220px. 
          Shift by -220px to center it in the 500px viewBox. */}
      <g transform="translate(-220, 0)">
        {/* LOGO ICON */}
        <path d="M40 40L20 120" stroke="#1A1A2E" strokeWidth="16" strokeLinecap="round"/>
        <path d="M80 40L60 120" stroke="#00C48C" strokeWidth="16" strokeLinecap="round"/>

        {/* WORDMARK */}
        <text
          x="110"
          y="108"
          fontFamily="'Trebuchet MS', 'Arial Black', sans-serif"
          fontSize="100"
          fontWeight="700"
          letterSpacing="-2"
        >
          <tspan fill="#1A1A2E">slay</tspan>
          <tspan fill="#00C48C">pay</tspan>
        </text>
        {/* Tagline */}
        <text
          x="110"
          y="142"
          fontFamily="'Trebuchet MS', sans-serif"
          fontSize="18.5"
          fill="#BBBBBB"
          letterSpacing="2.5"
        >
          No gateway. Payments that slay.
        </text>
      </g>
    </g>
  </svg>
);

function MainApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { productId: hostedProductId } = useParams();
  
  // Derive activeTab from location.pathname
  const activeTab = hostedProductId ? 'pay' : (location.pathname.substring(1) || 'dashboard');
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 768;
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowInstallGuide(true);
    }
  };
  
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Hosted Payment Page logic
  const [hostedProduct, setHostedProduct] = useState<PaymentPayload | null>(null);
  const [hostedLoading, setHostedLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'pay' && hostedProductId) {
      const fetchHostedProduct = async () => {
        setHostedLoading(true);
        try {
          const docRef = doc(db, 'products', hostedProductId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as PaymentPayload;
            const createdAt = data.createdAt?.seconds * 1000;
            if (createdAt && Date.now() - createdAt > 5 * 60 * 1000) {
              setError("This payment link has expired. Please reload the page to request a new one.");
              setHostedLoading(false);
              return;
            }
            setHostedProduct(data);
            await updateDoc(docRef, { views: increment(1) });
          }
        } catch (err) {
          console.error("Error fetching hosted product:", err);
        } finally {
          setHostedLoading(false);
        }
      };
      fetchHostedProduct();
    }
  }, [activeTab, hostedProductId]);

  useEffect(() => {
    if (user && location.pathname === '/') {
      navigate('/dashboard');
    }
  }, [user, location.pathname, navigate]);

  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Page Content State
  const [pageContent, setPageContent] = useState<{title: string, content: string} | null>(null);

  useEffect(() => {
    setPageContent(staticPageContent[activeTab] ?? null);
  }, [activeTab]);

  // Products State
  const [products, setProducts] = useState<{id: string, data: PaymentPayload}[]>([]);

  // Form State
  const [merchantName, setMerchantName] = useState('');
  const [itemName, setItemName] = useState('');
  const [amount, setAmount] = useState('120');
  const [currency, setCurrency] = useState('INR');
  
  const [upiId, setUpiId] = useState('');
  const [bankAcc, setBankAcc] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [stripeKey, setStripeKey] = useState('');
  const [stripePriceId, setStripePriceId] = useState('');
  const [paypalClientId, setPaypalClientId] = useState('');
  const [autoExpire24h, setAutoExpire24h] = useState(false);
  
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [resultProductId, setResultProductId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Demo Store State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutData, setCheckoutData] = useState<PaymentPayload | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'name'>('newest');

  // Test Embed State
  const [testProductId, setTestProductId] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Auto-logout after 2 hours of inactivity
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        signOut(auth);
        window.location.reload();
      }, 2 * 60 * 60 * 1000); // 2 hours
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    resetTimer();

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setMerchantName(currentUser.displayName || 'My Store');
        // Ensure user doc exists
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: currentUser.uid,
              email: currentUser.email,
              merchantName: currentUser.displayName || 'My Store',
              createdAt: serverTimestamp()
            });
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`);
        }
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAuthReady && user) {
      const q = query(collection(db, 'products'), where('merchantId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const prods: {id: string, data: PaymentPayload}[] = [];
        snapshot.forEach((doc) => {
          prods.push({ id: doc.id, data: doc.data() as PaymentPayload });
        });
        setProducts(prods);
        if (prods.length > 0 && !testProductId) {
          setTestProductId(prods[0].id);
        }
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'products');
      });
      return () => unsubscribe();
    } else {
      setProducts([]);
    }
  }, [isAuthReady, user]);

  // Clear result when form changes
  useEffect(() => {
    setResultProductId(null);
  }, [merchantName, itemName, amount, currency, upiId, bankAcc, bankIfsc, cryptoAddress, coverImage]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file.');
        return;
      }
      if (file.size > 500 * 1024) {
        setError('Image is too large. Please upload an image smaller than 500KB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setCoverImage(event.target?.result as string);
        setResultProductId(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateProduct = async () => {
    if (!user) {
      setError('Please sign in to create a product.');
      return;
    }
    if (!coverImage) {
      setError('Please upload a product image.');
      return;
    }
    if (!upiId && !bankAcc && !cryptoAddress && !stripeKey && !paypalClientId) {
      setError('Please provide at least one payment method.');
      return;
    }
    if (!itemName || !amount) {
      setError('Please provide product name and amount.');
      return;
    }
    if (stripeKey && !isHttpUrl(stripeKey)) {
      setError('Please enter a valid Stripe Checkout URL (https://...).');
      return;
    }
    if (paypalClientId && !isHttpUrl(paypalClientId)) {
      setError('Please enter a valid PayPal Checkout URL (https://...).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: PaymentPayload = {
        merchantId: user.uid,
        merchantName: merchantName,
        itemName: itemName,
        amount: parseFloat(amount),
        currency,
        coverImage,
        methods: {},
        createdAt: serverTimestamp(),
        status: 'active',
        expiresAt: autoExpire24h ? Date.now() + (24 * 60 * 60 * 1000) : null
      };

      if (upiId) payload.methods.upi = upiId;
      if (bankAcc) payload.methods.bank = { account: bankAcc, ifsc: bankIfsc };
      if (cryptoAddress) payload.methods.crypto = { address: cryptoAddress, network: 'ETH/ERC20' };
      if (stripeKey) payload.methods.stripe = { key: stripeKey, priceId: stripePriceId };
      if (paypalClientId) payload.methods.paypal = { clientId: paypalClientId };

      const newDocRef = doc(collection(db, 'products'));
      await setDoc(newDocRef, payload);

      setResultProductId(newDocRef.id);
      
      // Reset form
      setItemName('');
      setAmount('120');
      setCurrency('INR');
      setCoverImage(null);
      setAutoExpire24h(false);
      
      // Success feedback
      setNotification({ message: 'Product created successfully! You can now find it in your dashboard.', type: 'success' });
      navigate('/dashboard');
      
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, 'products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteDoc(doc(db, 'products', id));
        if (resultProductId === id) setResultProductId(null);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
      }
    }
  };

  const handleImageClick = async (product: PaymentPayload) => {
    setCheckoutData(product);
    setIsCheckoutOpen(true);
  };

  const getExpiryMs = (expiresAt: unknown): number | null => {
    if (!expiresAt) return null;
    if (typeof expiresAt === 'number') return expiresAt;
    if (typeof expiresAt === 'string') {
      const parsed = Date.parse(expiresAt);
      return Number.isNaN(parsed) ? null : parsed;
    }
    if (typeof (expiresAt as any)?.toMillis === 'function') {
      return (expiresAt as any).toMillis();
    }
    return null;
  };

  const isProductActive = (product: PaymentPayload | null | undefined) => (product?.status ?? 'active') === 'active';
  const isProductExpired = (product: PaymentPayload | null | undefined) => {
    const expiryMs = getExpiryMs(product?.expiresAt);
    return Boolean(expiryMs && Date.now() > expiryMs);
  };

  const handleToggleStatus = async (id: string, currentStatus: 'active' | 'paused') => {
    try {
      const nextStatus = currentStatus === 'active' ? 'paused' : 'active';
      await setDoc(doc(db, 'products', id), { status: nextStatus }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `products/${id}`);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getStripeCheckoutUrl = (product: any) => {
    const candidate = product?.methods?.stripe?.key || product?.stripe?.checkoutUrl || product?.stripe?.key;
    return typeof candidate === 'string' && isHttpUrl(candidate) ? candidate : null;
  };

  const getPaypalCheckoutUrl = (product: any) => {
    const candidate = product?.methods?.paypal?.clientId || product?.paypal?.checkoutUrl || product?.paypal?.clientId;
    return typeof candidate === 'string' && isHttpUrl(candidate) ? candidate : null;
  };

  const getShareUrl = (productId: string) => `${window.location.origin}/pay/${productId}`;
  const getShareText = (product: PaymentPayload, productId: string) =>
    `Pay for ${product.itemName}\nAmount: ${product.currency} ${product.amount}\n${getShareUrl(productId)}`;

  const handleShareNative = async (product: PaymentPayload, productId: string) => {
    const shareUrl = getShareUrl(productId);
    const shareText = getShareText(product, productId);
    if (navigator.share) {
      try {
        await navigator.share({ title: product.itemName, text: shareText, url: shareUrl });
        return;
      } catch {}
    }
    navigator.clipboard.writeText(shareUrl);
    setCopiedField(`share-${productId}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleGoogleAuth = async () => {
    setAuthError(null);
    setIsAuthLoading(true);
    try {
      await loginWithGoogle();
      setIsAuthModalOpen(false);
    } catch (err: any) {
      console.error('Google sign-in failed:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setAuthError('Google sign-in is not enabled in the Firebase Console. Please enable it in the Authentication > Sign-in method tab.');
      } else {
        setAuthError(err.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const PageHeader = () => {
    if (!pageContent || ['contact', 'terms', 'privacy'].includes(activeTab)) return null;
    return (
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 md:mb-8 p-4 md:p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl md:rounded-3xl"
      >
        <h2 className="text-lg md:text-xl font-bold text-zinc-900 mb-1 md:mb-2">{pageContent.title}</h2>
        <p className="text-zinc-600 text-xs md:text-sm leading-relaxed">{pageContent.content}</p>
      </motion.div>
    );
  };

  const NavItem = ({ icon: Icon, label, tab }: { icon: any, label: string, tab: string }) => (
    <button
      onClick={() => {
        navigate('/' + tab);
        if (window.innerWidth < 768) {
          setIsSidebarOpen(false);
        }
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        activeTab === tab 
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
          : 'text-zinc-500 hover:bg-black/5 hover:text-zinc-800 border border-transparent'
      }`}
    >
      <Icon size={18} />
      <span className="font-medium text-sm">{label}</span>
    </button>
  );

  if (!isAuthReady) {
    return <div className="min-h-screen bg-white flex items-center justify-center text-zinc-900">Loading...</div>;
  }

  if (!user && !['contact', 'terms', 'privacy', 'pay', 'docs'].includes(activeTab)) {
    return (
      <div className="min-h-screen bg-white text-zinc-900 selection:bg-emerald-500/30 font-sans overflow-y-auto flex flex-col">
        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 border-b border-black/5 bg-white/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 sm:h-24 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <BrandLogo className="h-12 sm:h-20 w-auto" />
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <button 
                onClick={handleInstallApp} 
                className="flex items-center gap-2 text-sm font-bold text-emerald-500 hover:text-emerald-600 transition-colors"
              >
                <Download size={16} /> <span className="hidden sm:inline">Install App</span>
              </button>
              <button 
                onClick={() => setIsAuthModalOpen(true)} 
                className="px-4 sm:px-6 py-2 bg-black text-white rounded-full text-xs sm:text-sm font-bold hover:bg-zinc-800 transition-all whitespace-nowrap"
              >
                Sign In / Sign Up
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="pt-32 pb-16 px-6 relative flex-1">
          {/* Background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto text-center relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 border border-black/10 text-xs font-medium text-zinc-600 mb-8">
                <Zap size={14} className="text-emerald-400" />
                <span>Now supporting UPI & Crypto</span>
              </div>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-6 leading-[1.1]">
                Payments, <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400">reimagined.</span>
              </h1>
              <p className="text-lg md:text-xl text-zinc-500 max-w-2xl mx-auto mb-10 leading-relaxed">
                The ultimate hosted checkout for creators and indie hackers. Accept UPI, Bank Transfers, and Crypto with zero platform fees.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button onClick={() => setIsAuthModalOpen(true)} className="w-full sm:w-auto px-8 py-4 bg-black text-white rounded-full font-bold text-sm hover:bg-zinc-800 transition-all flex items-center justify-center gap-2">
                  Sign In / Sign Up <ArrowRight size={16} />
                </button>
                <button onClick={handleInstallApp} className="w-full sm:w-auto px-8 py-4 bg-emerald-500 text-white rounded-full font-bold text-sm hover:bg-emerald-600 transition-all flex items-center justify-center gap-2">
                  <Download size={16} /> Install App
                </button>
                <button onClick={() => navigate('/docs')} className="w-full sm:w-auto px-8 py-4 bg-black/5 text-zinc-900 border border-black/10 rounded-full font-bold text-sm hover:bg-black/10 transition-all flex items-center justify-center gap-2">
                  <Code size={16} /> View Documentation
                </button>
              </div>
            </motion.div>

            {/* Features Grid */}
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="mt-32 grid md:grid-cols-3 gap-6 text-left">
              <div className="p-8 rounded-3xl bg-gradient-to-b from-white/5 to-transparent border border-black/10 hover:border-black/20 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-6 border border-emerald-500/20">
                  <Globe size={24} className="text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">Global Reach</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">Accept payments from anywhere in the world. Support for local payment methods like UPI alongside global crypto networks.</p>
              </div>
              <div className="p-8 rounded-3xl bg-gradient-to-b from-white/5 to-transparent border border-black/10 hover:border-black/20 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/20 flex items-center justify-center mb-6 border border-teal-500/20">
                  <ShieldCheck size={24} className="text-teal-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">Self-Custodial</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">Funds go directly to your accounts. We never hold your money, meaning zero payout delays and zero platform risk.</p>
              </div>
              <div className="p-8 rounded-3xl bg-gradient-to-b from-white/5 to-transparent border border-black/10 hover:border-black/20 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-6 border border-emerald-500/20">
                  <Code size={24} className="text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">Drop-in Embed</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">Integrate our beautiful checkout modal into any website with just two lines of code. Works with React, Webflow, and more.</p>
              </div>
            </motion.div>
          </div>
        </main>

        <footer className="border-t border-black/5 py-12 px-6 bg-zinc-50">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <BrandLogo className="h-20 w-auto" />
            </div>
            <div className="flex flex-wrap justify-center gap-8 text-sm font-medium text-zinc-500">
              <Link to="/contact" className="hover:text-emerald-400 transition-colors">Contact</Link>
              <Link to="/terms" className="hover:text-emerald-400 transition-colors">Terms & Conditions</Link>
              <Link to="/privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link>
            </div>
            <p className="text-xs text-zinc-400">© 2026 slaypay.xyz. All rights reserved.</p>
          </div>
        </footer>

        <AnimatePresence>
          {showInstallGuide && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowInstallGuide(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl overflow-hidden"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-black tracking-tight">Install App</h3>
                  <button onClick={() => setShowInstallGuide(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Smartphone size={20} className="text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-bold text-sm mb-1">iOS (Safari)</p>
                      <p className="text-xs text-zinc-500">Tap the <span className="font-bold text-zinc-900">Share</span> icon below and select <span className="font-bold text-zinc-900">"Add to Home Screen"</span>.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Globe size={20} className="text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-bold text-sm mb-1">Android (Chrome)</p>
                      <p className="text-xs text-zinc-500">Tap the <span className="font-bold text-zinc-900">Menu</span> (three dots) and select <span className="font-bold text-zinc-900">"Install App"</span> or <span className="font-bold text-zinc-900">"Add to Home Screen"</span>.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Monitor size={20} className="text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-bold text-sm mb-1">Desktop</p>
                      <p className="text-xs text-zinc-500">Look for the <span className="font-bold text-zinc-900">Install</span> icon in your browser's address bar.</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setShowInstallGuide(false)}
                  className="w-full mt-8 py-4 bg-black text-white rounded-2xl font-bold text-sm hover:bg-zinc-800 transition-all"
                >
                  Got it
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isAuthModalOpen && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAuthModalOpen(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.98 }}
                className="relative z-[121] w-full max-w-md bg-white border border-black/10 rounded-3xl shadow-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-zinc-900">Sign In / Sign Up</h3>
                  <button onClick={() => setIsAuthModalOpen(false)} className="text-zinc-500 hover:text-zinc-900">
                    <X size={18} />
                  </button>
                </div>
                <p className="text-sm text-zinc-500 mb-5">
                  Sign in or create an account using Google:
                </p>

                {authError && (
                  <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                    <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600 leading-relaxed font-medium">{authError}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    onClick={handleGoogleAuth}
                    disabled={isAuthLoading}
                    className="w-full py-3 px-4 bg-white border border-black/10 rounded-xl text-sm font-bold text-zinc-800 hover:bg-zinc-50 transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isAuthLoading ? (
                      <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span className="w-5 h-5 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-[12px] font-black text-zinc-700">G</span>
                        Continue with Google
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-zinc-800 font-sans flex overflow-hidden selection:bg-emerald-500/30">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <>
            {/* Mobile Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden"
            />
            <motion.aside 
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="w-[280px] border-r border-black/10 bg-zinc-50 flex flex-col z-40 fixed md:relative h-full left-0 top-0"
            >
              <div className="p-6 flex items-center justify-center relative">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                  <BrandLogo className="h-16 md:h-20 w-auto" />
                </div>
                <button className="md:hidden absolute right-6 p-2 text-zinc-500 hover:text-zinc-900" onClick={() => setIsSidebarOpen(false)}>
                  <X size={24} />
                </button>
              </div>

              <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
                {user && (
                  <>
                    <NavItem icon={LayoutDashboard} label="Dashboard" tab="dashboard" />
                    <NavItem icon={ImageIcon} label="Create Product" tab="create" />
                    <NavItem icon={Play} label="Playground" tab="playground" />
                    <NavItem icon={Code} label="Integration & API" tab="docs" />
                  </>
                )}
                
                <div className="pt-6 pb-2 px-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Company</div>
                <NavItem icon={Globe} label="Contact" tab="contact" />
                <NavItem icon={ShieldCheck} label="Terms & Conditions" tab="terms" />
                <NavItem icon={Lock} label="Privacy Policy" tab="privacy" />

                <div className="pt-6 px-4">
                  <button
                    onClick={handleInstallApp}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
                  >
                    <Download size={18} />
                    <span>Install App</span>
                  </button>
                </div>
              </nav>

            <div className="p-4">
              {user ? (
                <div className="bg-white border border-black/5 rounded-2xl p-4 mb-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/20">
                      {user.displayName?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm text-zinc-900 font-bold truncate">{user.displayName}</p>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider truncate">Personal Account</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1 mb-4">
                    <div 
                      onClick={() => {
                        navigate('/profile');
                        if (window.innerWidth < 768) setIsSidebarOpen(false);
                      }}
                      className={`flex items-center justify-between p-2 rounded-lg hover:bg-zinc-50 transition-colors cursor-pointer group ${activeTab === 'profile' ? 'bg-zinc-50' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <UserIcon size={14} className={activeTab === 'profile' ? 'text-brand-600' : 'text-zinc-400 group-hover:text-zinc-600'} />
                        <span className={`text-xs font-medium ${activeTab === 'profile' ? 'text-zinc-900 font-bold' : 'text-zinc-600'}`}>Profile Settings</span>
                      </div>
                      <ChevronRight size={12} className="text-zinc-300" />
                    </div>
                    <div 
                      onClick={() => {
                        navigate('/security');
                        if (window.innerWidth < 768) setIsSidebarOpen(false);
                      }}
                      className={`flex items-center justify-between p-2 rounded-lg hover:bg-zinc-50 transition-colors cursor-pointer group ${activeTab === 'security' ? 'bg-zinc-50' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={14} className={activeTab === 'security' ? 'text-brand-600' : 'text-zinc-400 group-hover:text-zinc-600'} />
                        <span className={`text-xs font-medium ${activeTab === 'security' ? 'text-zinc-900 font-bold' : 'text-zinc-600'}`}>Security</span>
                      </div>
                      <ChevronRight size={12} className="text-zinc-300" />
                    </div>
                  </div>

                  <button onClick={logout} className="w-full py-2.5 bg-zinc-50 hover:bg-red-50 hover:text-red-600 rounded-xl text-xs font-bold text-zinc-500 flex items-center justify-center gap-2 transition-all border border-black/[0.03]">
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-black/5 rounded-2xl p-4 mb-4">
                  <p className="text-xs text-zinc-500 mb-3 text-center">Sign in to access your dashboard</p>
                  <button 
                    onClick={() => setIsAuthModalOpen(true)} 
                    className="w-full py-2.5 bg-black text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors"
                  >
                    Sign In / Sign Up
                  </button>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>

        <AnimatePresence>
          {isAuthModalOpen && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAuthModalOpen(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.98 }}
                className="relative z-[121] w-full max-w-md bg-white border border-black/10 rounded-3xl shadow-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-zinc-900">Sign In / Sign Up</h3>
                  <button onClick={() => setIsAuthModalOpen(false)} className="text-zinc-500 hover:text-zinc-900">
                    <X size={18} />
                  </button>
                </div>
                <p className="text-sm text-zinc-500 mb-5">
                  Sign in or create an account using Google:
                </p>

                {authError && (
                  <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                    <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600 leading-relaxed font-medium">{authError}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    onClick={handleGoogleAuth}
                    disabled={isAuthLoading}
                    className="w-full py-3 px-4 bg-white border border-black/10 rounded-xl text-sm font-bold text-zinc-800 hover:bg-zinc-50 transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isAuthLoading ? (
                      <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span className="w-5 h-5 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-[12px] font-black text-zinc-700">G</span>
                        Continue with Google
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative">
        {notification && (
          <div className={`fixed bottom-4 right-4 p-4 rounded-xl shadow-lg z-50 ${notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
            {notification.message}
            <button onClick={() => setNotification(null)} className="ml-4 text-white font-bold">X</button>
          </div>
        )}
        <header className="h-16 md:h-20 border-b border-black/10 flex items-center justify-between px-4 md:px-6 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center">
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-zinc-500 hover:text-zinc-900">
                <Menu size={24} />
              </button>
            )}
          </div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            {!isSidebarOpen && <BrandLogo className="h-10 md:h-14 w-auto" />}
          </div>
          <div className="flex items-center gap-2">
            {!isSidebarOpen && !user && (
              <button 
                onClick={handleInstallApp} 
                className="flex items-center gap-2 text-sm font-bold text-emerald-500 hover:text-emerald-600 transition-colors mr-2"
              >
                <Download size={18} /> <span className="hidden sm:inline">Install App</span>
              </button>
            )}
            <div className="w-8 md:w-10"></div>
          </div>
        </header>

        <div className="p-6 md:p-10 max-w-6xl mx-auto w-full">
          <PageHeader />
          
          {/* DASHBOARD TAB */}
          {activeTab === 'pay' && (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
              {hostedLoading ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-zinc-500 font-medium">Loading payment page...</p>
                </div>
              ) : hostedProduct && !isProductActive(hostedProduct) ? (
                <div className="text-center max-w-xl">
                  <h2 className="text-2xl font-black text-zinc-900 mb-2">Payment Link Is Not Active</h2>
                  <p className="text-zinc-500">This payment link has been paused by the merchant. Please contact the merchant for an active link.</p>
                </div>
              ) : hostedProduct && isProductExpired(hostedProduct) ? (
                <div className="text-center max-w-xl">
                  <h2 className="text-2xl font-black text-zinc-900 mb-2">Payment Link Expired</h2>
                  <p className="text-zinc-500">This payment link has expired. Please request a new link from the merchant.</p>
                </div>
              ) : hostedProduct ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl shadow-black/5 overflow-hidden border border-black/[0.03] flex flex-col md:flex-row"
                >
                  {/* Left Side: Product Info */}
                  <div className="flex-1 p-8 md:p-12 border-b md:border-b-0 md:border-r border-zinc-100">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 rounded-2xl bg-brand-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
                        <ShieldCheck size={20} />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-zinc-400">slaypay.xyz</span>
                    </div>

                    {hostedProduct.coverImage && (
                      <div className="aspect-[16/9] md:aspect-[21/9] w-full max-w-md md:max-w-none mx-auto rounded-2xl md:rounded-[2rem] overflow-hidden mb-8 shadow-xl shadow-black/5">
                        <img 
                          src={hostedProduct.coverImage} 
                          alt={hostedProduct.itemName}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    <h1 className="text-4xl font-black text-zinc-900 mb-4 tracking-tight leading-tight">
                      {hostedProduct.itemName}
                    </h1>
                    <p className="text-zinc-500 text-lg mb-8 leading-relaxed">
                      Payment instructions are delivered over secure HTTPS, and payment is completed in your selected external app.
                    </p>

                    <div className="flex items-center gap-4 p-6 bg-zinc-50 rounded-[2rem] border border-black/[0.02]">
                      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-black/[0.03]">
                        <Building2 size={24} className="text-zinc-400" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-black text-zinc-400 mb-1">Merchant</p>
                        <p className="font-bold text-zinc-900">{hostedProduct.merchantName}</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Payment Methods */}
                  <div className="flex-1 p-8 md:p-12 bg-zinc-50/50">
                    <div className="mb-10 text-center md:text-left">
                      <p className="text-[10px] uppercase tracking-widest font-black text-zinc-400 mb-2">Amount to Pay</p>
                      <div className="flex items-baseline justify-center md:justify-start gap-2">
                        <span className="text-5xl font-black text-zinc-900 tracking-tighter">
                          {hostedProduct.currency === 'INR' ? '₹' : hostedProduct.currency === 'USD' ? '$' : hostedProduct.currency === 'EUR' ? '€' : hostedProduct.currency}
                          {hostedProduct.amount}
                        </span>
                        <span className="text-zinc-400 font-bold uppercase tracking-widest text-xs">{hostedProduct.currency}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* {console.log("Hosted Product Data:", hostedProduct)} */}
                      {hostedProduct.methods.upi && (
                        <div className="group bg-white p-6 rounded-[2rem] border border-black/[0.03] shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all cursor-pointer">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                <Smartphone size={24} className="text-emerald-600 group-hover:text-white" />
                              </div>
                              <div>
                                <h4 className="font-bold text-zinc-900">UPI Payment</h4>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Instant & Secure</p>
                              </div>
                            </div>
                            <ChevronRight size={20} className="text-zinc-300 group-hover:text-emerald-500 transition-colors" />
                          </div>
                          <div className="flex justify-center mb-4">
                            <div className="bg-white p-3 rounded-2xl border border-zinc-100 shadow-sm">
                              <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${hostedProduct.methods.upi}&pn=${encodeURIComponent(hostedProduct.merchantName)}&am=${hostedProduct.amount}&cu=${hostedProduct.currency}`)}`}
                                alt="UPI QR Code"
                                className="w-40 h-40"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          </div>
                          <div className="bg-zinc-50 p-4 rounded-2xl border border-black/[0.02] flex items-center justify-between">
                            <code className="text-xs font-bold text-zinc-600">{hostedProduct.methods.upi}</code>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(hostedProduct.methods.upi || '');
                                setCopiedField('upi');
                                setTimeout(() => setCopiedField(null), 2000);
                              }}
                              className="p-2 hover:bg-white rounded-lg transition-colors text-zinc-400 hover:text-emerald-500"
                            >
                              {copiedField === 'upi' ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                          </div>
                          <a
                            href={`upi://pay?pa=${hostedProduct.methods.upi}&pn=${encodeURIComponent(hostedProduct.merchantName)}&am=${hostedProduct.amount}&cu=${hostedProduct.currency}`}
                            className="mt-4 w-full premium-button premium-button-brand py-3 text-sm flex items-center justify-center"
                          >
                            Open UPI App
                          </a>
                        </div>
                      )}

                      {hostedProduct.methods.bank && (
                        <div className="group bg-white p-6 rounded-[2rem] border border-black/[0.03] shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all cursor-pointer">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                <Building2 size={24} className="text-blue-600 group-hover:text-white" />
                              </div>
                              <div>
                                <h4 className="font-bold text-zinc-900">Bank Transfer</h4>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">NEFT / IMPS / RTGS</p>
                              </div>
                            </div>
                            <ChevronRight size={20} className="text-zinc-300 group-hover:text-blue-500 transition-colors" />
                          </div>
                          <div className="space-y-2">
                            <div className="bg-zinc-50 p-3 rounded-xl border border-black/[0.02] flex items-center justify-between">
                              <span className="text-[10px] font-black text-zinc-400 uppercase">Account</span>
                              <code className="text-xs font-bold text-zinc-600">{hostedProduct.methods.bank.account}</code>
                            </div>
                            <div className="bg-zinc-50 p-3 rounded-xl border border-black/[0.02] flex items-center justify-between">
                              <span className="text-[10px] font-black text-zinc-400 uppercase">IFSC</span>
                              <code className="text-xs font-bold text-zinc-600">{hostedProduct.methods.bank.ifsc}</code>
                            </div>
                          </div>
                        </div>
                      )}

                      {hostedProduct.methods.crypto && (
                        <div className="group bg-white p-6 rounded-[2rem] border border-black/[0.03] shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all cursor-pointer">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center border border-orange-100 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                <Bitcoin size={24} className="text-orange-600 group-hover:text-white" />
                              </div>
                              <div>
                                <h4 className="font-bold text-zinc-900">Crypto Wallet</h4>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">BTC / ETH / USDT</p>
                              </div>
                            </div>
                            <ChevronRight size={20} className="text-zinc-300 group-hover:text-orange-500 transition-colors" />
                          </div>
                          <div className="bg-zinc-50 p-4 rounded-2xl border border-black/[0.02] flex items-center justify-between">
                            <code className="text-[10px] font-bold text-zinc-600 break-all">{hostedProduct.methods.crypto.address}</code>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(hostedProduct.methods.crypto?.address || '');
                                setCopiedField('crypto');
                                setTimeout(() => setCopiedField(null), 2000);
                              }}
                              className="p-2 hover:bg-white rounded-lg transition-colors text-zinc-400 hover:text-orange-500"
                            >
                              {copiedField === 'crypto' ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                          </div>
                        </div>
                      )}

                      {getStripeCheckoutUrl(hostedProduct) && (
                        <div className="group bg-white p-6 rounded-[2rem] border border-black/[0.03] shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center border border-violet-100 group-hover:bg-violet-500 transition-colors">
                                <CreditCard size={24} className="text-violet-600 group-hover:text-white" />
                              </div>
                              <div>
                                <h4 className="font-bold text-zinc-900">Card Payment</h4>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Powered by Stripe</p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <a
                              href={getStripeCheckoutUrl(hostedProduct)!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full premium-button premium-button-brand py-3 text-sm flex items-center justify-center"
                            >
                              Pay with Card (Stripe)
                            </a>
                            <a
                              href={getStripeCheckoutUrl(hostedProduct)!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-3 bg-black text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all text-sm flex items-center justify-center"
                            >
                              Pay with Apple Pay / Google Pay
                            </a>
                          </div>
                        </div>
                      )}

                      {getPaypalCheckoutUrl(hostedProduct) && (
                        <div className="group bg-white p-6 rounded-[2rem] border border-black/[0.03] shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100 group-hover:bg-blue-500 transition-colors">
                                <Wallet size={24} className="text-blue-600 group-hover:text-white" />
                              </div>
                              <div>
                                <h4 className="font-bold text-zinc-900">PayPal</h4>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">PayPal Checkout</p>
                              </div>
                            </div>
                          </div>
                          <a
                            href={getPaypalCheckoutUrl(hostedProduct)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-3 bg-[#0070ba] text-white rounded-2xl font-bold hover:bg-[#005ea6] transition-all text-sm flex items-center justify-center"
                          >
                            PayPal Checkout
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="mt-12 text-center">
                      <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 mb-4">
                        <ShieldCheck size={14} className="text-brand-500" /> Secure Encryption
                      </p>
                      <p className="text-[10px] text-zinc-300 font-bold uppercase tracking-widest">
                        Powered by slaypay.xyz
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="text-center">
                  <h2 className="text-2xl font-black text-zinc-900 mb-2">Product Not Found</h2>
                  <p className="text-zinc-500">The payment link you followed might be invalid or expired.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'dashboard' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10 pb-20">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-display font-bold text-zinc-900">Your Products</h2>
                  <p className="text-zinc-500 mt-1">Manage your active payment links and embed codes.</p>
                </div>
                <div className="flex items-center gap-4">
                  <select 
                    value={sortOrder} 
                    onChange={(e) => setSortOrder(e.target.value as any)} 
                    className="text-sm border border-zinc-200 rounded-lg p-2 bg-white"
                  >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="name">Name</option>
                  </select>
                  <button onClick={() => navigate('/create')} className="premium-button premium-button-brand flex items-center gap-2 self-start md:self-auto">
                    <ImageIcon size={18} /> New Product
                  </button>
                </div>
              </div>

              {products.length === 0 ? (
                <div className="premium-card p-20 text-center">
                  <div className="w-20 h-20 bg-zinc-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-black/[0.03]">
                    <ShoppingBag size={32} className="text-zinc-300" />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-zinc-900 mb-3">Ready to start selling?</h3>
                  <p className="text-zinc-500 mb-10 max-w-md mx-auto">Create your first product to get your unique checkout link and embed code. It only takes 30 seconds.</p>
                  <button onClick={() => navigate('/create')} className="premium-button premium-button-primary">
                    Create Your First Product
                  </button>
                </div>
              ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                          {[...products].sort((a, b) => {
                            if (sortOrder === 'newest') return (b.data.createdAt?.seconds || 0) - (a.data.createdAt?.seconds || 0);
                            if (sortOrder === 'oldest') return (a.data.createdAt?.seconds || 0) - (b.data.createdAt?.seconds || 0);
                            if (sortOrder === 'name') return a.data.itemName.localeCompare(b.data.itemName);
                            return 0;
                          }).map((product) => {
                            const currentStatus = (product.data.status ?? 'active') as 'active' | 'paused';
                            const expired = isProductExpired(product.data);
                            return (
                            <motion.div 
                              layout
                              key={product.id} 
                              className="group flex flex-col bg-white border border-black/[0.05] rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
                            >
                              <div className="aspect-[16/10] relative overflow-hidden bg-zinc-100">
                                <img 
                                  src={product.data.coverImage} 
                                  alt={product.data.itemName} 
                                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute top-3 right-3 flex gap-2">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(product.id);
                                    }}
                                    className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm border border-black/5 flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                              <div className="p-5 flex-1 flex flex-col">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                  <h3 className="font-display font-bold text-zinc-900 text-lg leading-tight truncate">{product.data.itemName}</h3>
                                  <div className={`px-2 py-1 text-[10px] font-bold uppercase rounded-lg border ${
                                    expired
                                      ? 'bg-red-50 text-red-600 border-red-100'
                                      : currentStatus === 'active'
                                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                      : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                                  }`}>
                                    {expired ? 'Expired' : currentStatus === 'active' ? 'Active' : 'Paused'}
                                  </div>
                                </div>
                                <div className="mt-auto flex items-center justify-between pt-4 border-t border-zinc-100">
                                  <p className="text-sm font-bold text-zinc-900">{product.data.currency} {product.data.amount}</p>
                                  <p className="text-[11px] font-mono text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-md">{product.data.views || 0} views</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-4">
                                  <button 
                                    onClick={() => handleToggleStatus(product.id, currentStatus)}
                                    className={`py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                      currentStatus === 'active'
                                        ? 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100'
                                        : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                                    }`}
                                  >
                                    {currentStatus === 'active' ? 'Pause' : 'Activate'}
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setCheckoutData(product.data);
                                      setIsCheckoutOpen(true);
                                    }}
                                    className="py-2.5 rounded-xl border border-black/[0.05] text-xs font-bold hover:bg-black/[0.02] transition-all flex items-center justify-center gap-2"
                                  >
                                    Preview
                                  </button>
                                  <button 
                                    onClick={() => {
                                      const shareUrl = getShareUrl(product.id);
                                      navigator.clipboard.writeText(shareUrl);
                                      setCopiedField(`copy-${product.id}`);
                                      setTimeout(() => setCopiedField(null), 2000);
                                    }}
                                    className="py-2.5 rounded-xl border border-black/[0.05] text-xs font-bold hover:bg-black/[0.02] transition-all flex items-center justify-center gap-2"
                                  >
                                    {copiedField === `copy-${product.id}` ? (
                                      <><Check size={14} className="text-emerald-500" /> Copied</>
                                    ) : (
                                      <><Copy size={14} /> Copy</>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleShareNative(product.data, product.id)}
                                    className="py-2.5 rounded-xl border border-black/[0.05] text-xs font-bold hover:bg-black/[0.02] transition-all flex items-center justify-center gap-2"
                                  >
                                    <Share2 size={14} />
                                    Share
                                  </button>
                                  <button 
                                    onClick={() => copyToClipboard(`<script src="${window.location.origin}/embed.js" async></script>\n<div data-nopaymentgateway-id="${product.id}"></div>`, product.id)}
                                    className="col-span-2 py-2.5 rounded-xl border border-black/[0.05] text-xs font-bold hover:bg-black/[0.02] transition-all flex items-center justify-center gap-2"
                                  >
                                    {copiedField === product.id ? <Check size={12} className="text-brand-500" /> : <Copy size={12} />}
                                    {copiedField === product.id ? 'Copied!' : 'Embed'}
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )})}
                        </div>
              )}
            </motion.div>
          )}

          {/* CREATE TAB */}
          {activeTab === 'create' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
              <div className="premium-card p-10">
              
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center border border-brand-100">
                    <ShoppingBag size={24} className="text-brand-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-display font-bold text-zinc-900">Create New Product</h2>
                    <p className="text-sm text-zinc-500">Define your product details and payment routing.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-8">
                    <div className="space-y-6">
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                        Product Image
                      </h3>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative aspect-[21/9] max-h-32 md:max-h-none rounded-2xl md:rounded-[2rem] border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-4 ${coverImage ? 'border-brand-500 bg-brand-50/30' : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-300'}`}
                      >
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleImageUpload} 
                          className="hidden" 
                          accept="image/*"
                        />
                        {coverImage ? (
                          <>
                            <img src={coverImage} alt="Cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                              <div className="px-4 py-2 bg-white rounded-xl text-xs font-bold text-zinc-900 flex items-center gap-2">
                                <Upload size={14} /> Change Image
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-black/[0.03] flex items-center justify-center text-zinc-400">
                              <Upload size={24} />
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-bold text-zinc-900">Click to upload product image</p>
                              <p className="text-xs text-zinc-500 mt-1">PNG, JPG up to 500KB</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                        Basic Information
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-500 ml-1">Merchant / Store Name</label>
                          <input
                            type="text"
                            value={merchantName}
                            onChange={(e) => setMerchantName(e.target.value)}
                            placeholder="e.g. slaypay.xyz Store"
                            className="w-full px-5 py-4 bg-zinc-50 border border-black/[0.03] rounded-2xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all font-medium"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-500 ml-1">Product Name</label>
                          <input
                            type="text"
                            value={itemName}
                            onChange={(e) => setItemName(e.target.value)}
                            placeholder="e.g. Premium SaaS Subscription"
                            className="w-full px-5 py-4 bg-zinc-50 border border-black/[0.03] rounded-2xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all font-medium"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 ml-1">Amount</label>
                            <input
                              type="number"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              placeholder="0.00"
                              className="w-full px-5 py-4 bg-zinc-50 border border-black/[0.03] rounded-2xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all font-medium"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 ml-1">Currency</label>
                            <select
                              value={currency}
                              onChange={(e) => setCurrency(e.target.value)}
                              className="w-full px-5 py-4 bg-zinc-50 border border-black/[0.03] rounded-2xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all font-medium appearance-none"
                            >
                              <option value="USD">USD ($)</option>
                              <option value="EUR">EUR (€)</option>
                              <option value="INR">INR (₹)</option>
                              <option value="GBP">GBP (£)</option>
                              <option value="CAD">CAD ($)</option>
                              <option value="AUD">AUD ($)</option>
                              <option value="JPY">JPY (¥)</option>
                              <option value="SGD">SGD ($)</option>
                              <option value="AED">AED (د.إ)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-6">
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                        Payment Routing
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="p-6 rounded-3xl bg-zinc-50 border border-black/[0.03] space-y-4">
                          <div className="flex items-center gap-3">
                            <Building2 size={18} className="text-brand-500" />
                            <span className="text-sm font-bold text-zinc-800">Bank Transfer (Global)</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                              type="text"
                              placeholder="Account Number"
                              value={bankAcc}
                              onChange={(e) => setBankAcc(e.target.value)}
                              className="w-full px-4 py-3 bg-white border border-black/[0.05] rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all text-sm"
                            />
                            <input
                              type="text"
                              placeholder="IFSC / SWIFT Code"
                              value={bankIfsc}
                              onChange={(e) => setBankIfsc(e.target.value)}
                              className="w-full px-4 py-3 bg-white border border-black/[0.05] rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all text-sm"
                            />
                          </div>
                        </div>

                        <div className="p-6 rounded-3xl bg-zinc-50 border border-black/[0.03] space-y-4">
                          <div className="flex items-center gap-3">
                            <Smartphone size={18} className="text-brand-500" />
                            <span className="text-sm font-bold text-zinc-800">UPI (India)</span>
                          </div>
                          <input
                            type="text"
                            placeholder="merchant@upi"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-black/[0.05] rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all text-sm"
                          />
                        </div>

                        <div className="p-6 rounded-3xl bg-zinc-50 border border-black/[0.03] space-y-4">
                          <div className="flex items-center gap-3">
                            <Bitcoin size={18} className="text-brand-500" />
                            <span className="text-sm font-bold text-zinc-800">Crypto Wallet (Global)</span>
                          </div>
                          <input
                            type="text"
                            placeholder="Wallet Address"
                            value={cryptoAddress}
                            onChange={(e) => setCryptoAddress(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-black/[0.05] rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all text-sm"
                          />
                        </div>

                        <div className="p-6 rounded-3xl bg-zinc-50 border border-black/[0.03] space-y-4">
                          <div className="flex items-center gap-3">
                            <CreditCard size={18} className="text-brand-500" />
                            <span className="text-sm font-bold text-zinc-800">Stripe (Global)</span>
                          </div>
                          <input
                            type="text"
                            placeholder="Stripe Checkout / Payment Link URL"
                            value={stripeKey}
                            onChange={(e) => setStripeKey(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-black/[0.05] rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all text-sm mb-2"
                          />
                          <p className="text-[11px] text-zinc-500">
                            Example: <span className="font-mono">https://buy.stripe.com/...</span> (do not paste Stripe public key)
                          </p>
                          <input
                            type="text"
                            placeholder="Optional: Stripe Price ID (reference only)"
                            value={stripePriceId}
                            onChange={(e) => setStripePriceId(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-black/[0.05] rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all text-sm"
                          />
                        </div>

                        <div className="p-6 rounded-3xl bg-zinc-50 border border-black/[0.03] space-y-4">
                          <div className="flex items-center gap-3">
                            <Wallet size={18} className="text-brand-500" />
                            <span className="text-sm font-bold text-zinc-800">PayPal (Global)</span>
                          </div>
                          <input
                            type="text"
                            placeholder="PayPal Checkout URL"
                            value={paypalClientId}
                            onChange={(e) => setPaypalClientId(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-black/[0.05] rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all text-sm"
                          />
                          <p className="text-[11px] text-zinc-500">
                            Example: <span className="font-mono">https://www.paypal.com/checkoutnow?token=...</span>
                          </p>
                        </div>

                        <div className="p-6 rounded-3xl bg-zinc-50 border border-black/[0.03] space-y-3">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={autoExpire24h}
                              onChange={(e) => setAutoExpire24h(e.target.checked)}
                              className="w-4 h-4 accent-brand-600"
                            />
                            <span className="text-sm font-bold text-zinc-800">Auto Expiry (24 hours)</span>
                          </label>
                          <p className="text-[11px] text-zinc-500">
                            When enabled, this payment link automatically expires 24 hours after creation.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-12 pt-8 border-t border-black/[0.03]">
                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-medium">
                      <AlertCircle size={18} />
                      {error}
                    </div>
                  )}
                  <button 
                    onClick={handleCreateProduct}
                    disabled={loading}
                    className="w-full premium-button premium-button-brand py-5 text-base"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Generating Code...
                      </div>
                    ) : 'Generate Payment Link & Embed Code'}
                  </button>
                </div>

                {resultProductId && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    className="mt-10 p-8 bg-brand-50 rounded-3xl border border-brand-100 space-y-6"
                  >
                    <div className="flex items-center gap-3 text-brand-700 font-bold">
                      <CheckCircle2 size={20} />
                      Product Created Successfully!
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-brand-600/60 ml-1">Embed Code</label>
                        <div className="relative group">
                          <pre className="bg-white border border-brand-200 p-4 rounded-2xl text-[11px] font-mono text-zinc-700 overflow-x-auto">
                            {`<script src="${window.location.origin}/embed.js" async></script>\n<div data-nopaymentgateway-id="${resultProductId}"></div>`}
                          </pre>
                          <button 
                            onClick={() => copyToClipboard(`<script src="${window.location.origin}/embed.js" async></script>\n<div data-nopaymentgateway-id="${resultProductId}"></div>`, 'embed')}
                            className="absolute right-3 top-3 p-2 bg-brand-50 text-brand-600 rounded-xl hover:bg-brand-100 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                          >
                            {copiedField === 'embed' ? <Check size={16} /> : <Copy size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={() => navigate('/dashboard')}
                        className="flex-1 py-4 bg-white border border-brand-200 text-brand-700 rounded-2xl text-sm font-bold hover:bg-brand-50 transition-all"
                      >
                        Back to Dashboard
                      </button>
                      <button 
                        onClick={() => {
                          setTestProductId(resultProductId);
                          navigate('/playground');
                        }}
                        className="flex-1 py-4 bg-brand-600 text-white rounded-2xl text-sm font-bold hover:bg-brand-700 transition-all flex items-center justify-center gap-2"
                      >
                        <Play size={16} /> Test in Playground
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
                  {/* PLAYGROUND TAB */}
          {activeTab === 'playground' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
              
              {products.length === 0 ? (
                <div className="premium-card p-12 text-center max-w-2xl mx-auto">
                  <Play size={48} className="text-zinc-300 mx-auto mb-6" />
                  <h3 className="text-2xl font-display font-bold text-zinc-900 mb-3">No Products to Test</h3>
                  <p className="text-zinc-500 mb-8">Create your first product to see it in action here. You can preview both the hosted storefront and the embedded checkout experience.</p>
                  <button onClick={() => navigate('/create')} className="premium-button premium-button-brand">
                    Create Your First Product
                  </button>
                </div>
              ) : (
                <div className="grid lg:grid-cols-2 gap-10">
                  {/* Storefront Preview */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-display font-bold text-zinc-900">Hosted Storefront</h3>
                      <div className="px-3 py-1 bg-brand-50 text-brand-700 text-[10px] font-bold uppercase tracking-wider rounded-full border border-brand-100">
                        Live Preview
                      </div>
                    </div>
                    
                    <div className="premium-card overflow-hidden bg-zinc-50 border-black/[0.05]">
                      <div className="bg-zinc-100/50 border-b border-black/[0.05] px-4 py-3 flex items-center gap-2">
                        <div className="flex gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-zinc-300"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-zinc-300"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-zinc-300"></div>
                        </div>
                        <div className="mx-auto bg-white border border-black/[0.05] rounded-full px-4 py-1 text-[10px] text-zinc-400 font-mono flex items-center gap-2">
                          <Lock size={10} /> slaypay.xyz/s/{user?.displayName?.toLowerCase().replace(/\s+/g, '') || 'store'}
                        </div>
                      </div>

                      <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-6 max-h-[600px] overflow-y-auto">
                        {products.map((product) => (
                          <div key={product.id} className="group cursor-pointer" onClick={() => handleImageClick(product.data)}>
                            <div className="relative overflow-hidden rounded-2xl mb-4 bg-white aspect-[16/10] shadow-sm border border-black/[0.03]">
                              <img 
                                src={product.data.coverImage} 
                                alt={product.data.itemName} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-brand-600 shadow-xl scale-100 md:scale-90 md:group-hover:scale-100 transition-transform">
                                  <ShoppingBag size={18} />
                                </div>
                              </div>
                            </div>
                            <h4 className="text-sm font-bold text-zinc-900 mb-1 group-hover:text-brand-600 transition-colors">{product.data.itemName}</h4>
                            <p className="text-xs font-bold text-brand-600">
                              {product.data.currency === 'USD' ? '$' : product.data.currency === 'EUR' ? '€' : product.data.currency === 'INR' ? '₹' : ''}{product.data.amount}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Embed Tester */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-display font-bold text-zinc-900">Live Embed Tester</h3>
                      <div className="px-3 py-1 bg-zinc-100 text-zinc-500 text-[10px] font-bold uppercase tracking-wider rounded-full border border-black/[0.05]">
                        Interactive
                      </div>
                    </div>

                    <div className="premium-card p-8 space-y-8">
                      <div className="space-y-4">
                        <label className="text-xs font-bold text-zinc-500 ml-1">Select Product to Test</label>
                        <select 
                          value={testProductId} 
                          onChange={(e) => setTestProductId(e.target.value)}
                          className="w-full px-5 py-4 bg-zinc-50 border border-black/[0.03] rounded-2xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all font-medium appearance-none"
                        >
                          <option value="">Choose a product...</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.data.itemName}</option>
                          ))}
                        </select>
                      </div>

                      <div className="p-8 rounded-3xl bg-zinc-50 border border-black/[0.03] text-center space-y-6">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-black/[0.03]">
                          <Code size={24} className="text-brand-500" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-zinc-900 mb-2">Test the Overlay</h4>
                          <p className="text-sm text-zinc-500">Click the button below to trigger the slaypay.xyz checkout overlay just as it would appear on your website.</p>
                        </div>
                        <button 
                          disabled={!testProductId}
                          onClick={() => {
                            const product = products.find(p => p.id === testProductId);
                            if (product) handleImageClick(product.data);
                          }}
                          className={`w-full py-4 rounded-2xl font-bold transition-all ${
                            !testProductId 
                              ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed' 
                              : 'bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-600/20'
                          }`}
                        >
                          Launch Checkout Overlay
                        </button>
                      </div>

                      <div className="pt-6 border-t border-black/[0.03] space-y-4">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                          <CheckCircle2 size={14} className="text-brand-500" />
                          Features Tested
                        </div>
                        <ul className="grid grid-cols-2 gap-3">
                          {['Responsive UI', 'Payment Routing', 'Dynamic Pricing', 'Success Callback'].map((f) => (
                            <li key={f} className="flex items-center gap-2 text-xs text-zinc-500">
                              <div className="w-1 h-1 rounded-full bg-brand-500" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && user && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-8">
              <div className="premium-card p-10">
                <div className="flex items-center gap-6 mb-10">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-4xl font-bold shadow-2xl shadow-emerald-500/20">
                    {user.displayName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h2 className="text-3xl font-display font-bold text-zinc-900 mb-2">{user.displayName}</h2>
                    <p className="text-zinc-500 font-medium">Account identity and verification details.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Full Name</label>
                      <div className="flex items-center gap-3 p-4 bg-zinc-50 border border-black/[0.03] rounded-2xl">
                        <UserIcon size={18} className="text-zinc-400" />
                        <span className="text-zinc-900 font-medium">{user.displayName}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Email Address</label>
                      <div className="flex items-center gap-3 p-4 bg-zinc-50 border border-black/[0.03] rounded-2xl">
                        <Mail size={18} className="text-zinc-400" />
                        <span className="text-zinc-900 font-medium">{user.email}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Email Verification</label>
                      <div className="flex items-center gap-3 p-4 bg-zinc-50 border border-black/[0.03] rounded-2xl">
                        <Shield size={18} className="text-zinc-400" />
                        <span className={`font-medium ${user.emailVerified ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {user.emailVerified ? 'Verified' : 'Not Verified'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">User ID</label>
                      <div className="flex items-center gap-3 p-4 bg-zinc-50 border border-black/[0.03] rounded-2xl">
                        <code className="text-zinc-700 text-xs font-mono break-all flex-1">{user.uid}</code>
                        <button
                          onClick={() => copyToClipboard(user.uid, 'uid')}
                          className="text-brand-600 hover:text-brand-700"
                          title="Copy User ID"
                        >
                          {copiedField === 'uid' ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Sign-in Provider</label>
                      <div className="flex items-center gap-3 p-4 bg-zinc-50 border border-black/[0.03] rounded-2xl">
                        <span className="text-zinc-900 font-medium">
                          {user.providerData.length > 0 ? user.providerData.map((p) => p.providerId).join(', ') : 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-10 border-t border-zinc-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-4 p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                        <Calendar size={20} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-emerald-900">Account Created</p>
                        <p className="text-xs text-emerald-600 font-medium">
                          {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleString() : 'Unavailable'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-6 bg-zinc-50 rounded-3xl border border-black/[0.03]">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                        <ShieldCheck size={20} className="text-zinc-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900">Last Sign-in</p>
                        <p className="text-xs text-zinc-600 font-medium">
                          {user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : 'Unavailable'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && user && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-8">
              <div className="premium-card p-10">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center border border-brand-100">
                    <Shield size={24} className="text-brand-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-display font-bold text-zinc-900">Security Settings</h2>
                    <p className="text-sm text-zinc-500">Current account security status and recommended actions.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-6 bg-zinc-50 border border-black/[0.03] rounded-3xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                        <ShieldCheck size={20} className="text-zinc-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900">Authentication Provider</p>
                        <p className="text-xs text-zinc-500">
                          {user.providerData.length > 0 ? user.providerData.map((p) => p.providerId).join(', ') : 'Unknown'}
                        </p>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-emerald-500/20 text-emerald-700 text-[10px] font-bold uppercase rounded-full">
                      Active
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-6 bg-zinc-50 border border-black/[0.03] rounded-3xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                        <Mail size={20} className="text-zinc-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900">Account Recovery Contact</p>
                        <p className="text-xs text-zinc-500">{user.email || 'Unavailable'}</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 text-[10px] font-bold uppercase rounded-full ${
                      user.emailVerified ? 'bg-emerald-500/20 text-emerald-700' : 'bg-amber-500/20 text-amber-700'
                    }`}>
                      {user.emailVerified ? 'Verified' : 'Verification Pending'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-6 bg-zinc-50 border border-black/[0.03] rounded-3xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                        <Calendar size={20} className="text-zinc-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900">Recent Account Activity</p>
                        <p className="text-xs text-zinc-500">
                          Last sign-in: {user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : 'Unavailable'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => logout()}
                      className="px-4 py-2 bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold hover:bg-zinc-300 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>

                <div className="mt-10 pt-10 border-t border-zinc-100">
                  <a
                    href="https://myaccount.google.com/security"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-600 text-sm font-bold hover:underline inline-flex items-center gap-2"
                  >
                    Manage Provider Security <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </motion.div>
          )}

          {/* DOCS TAB */}
          {activeTab === 'docs' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-8">
              <div className="premium-card p-10">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center border border-brand-100">
                    <Terminal size={24} className="text-brand-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-display font-bold text-zinc-900">Integration Guide</h2>
                    <p className="text-sm text-zinc-500">How to add slaypay.xyz to your website.</p>
                  </div>
                </div>
                
                <div className="space-y-12">
                  <section className="relative pl-10">
                    <div className="absolute left-0 top-0 w-8 h-8 bg-brand-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                    <h3 className="text-lg font-bold text-zinc-900 mb-3">Create a Product</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">Use the <span className="text-brand-600 font-bold cursor-pointer hover:underline" onClick={() => navigate('/create')}>Create</span> tab to define your product details and set your payment routing. slaypay.xyz will securely host this data on the decentralized protocol.</p>
                  </section>

                  <section className="relative pl-10">
                    <div className="absolute left-0 top-0 w-8 h-8 bg-brand-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                    <h3 className="text-lg font-bold text-zinc-900 mb-3">Copy the Embed Code</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">Once saved, copy the provided HTML snippet. It contains a lightweight 2KB script and a div tag with your unique product ID. This script handles all the complex logic for you.</p>
                  </section>

                  <section className="relative pl-10">
                    <div className="absolute left-0 top-0 w-8 h-8 bg-brand-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                    <h3 className="text-lg font-bold text-zinc-900 mb-3">Paste into your Website</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">Paste the snippet into your Shopify, WordPress, Webflow, or custom React app. The script will automatically fetch the product data and render an interactive checkout button that launches our secure overlay.</p>
                  </section>
                </div>
              </div>
            </motion.div>
          )}

          {['contact', 'terms', 'privacy'].includes(activeTab) && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-8">
              <div className="premium-card p-10">
                {pageContent ? (
                  <>
                    <h2 className="text-3xl font-display font-bold text-zinc-900 mb-8">{pageContent.title}</h2>
                    <div className="text-zinc-600 leading-relaxed whitespace-pre-wrap font-medium">
                      {pageContent.content}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-4">
                    <div className="w-10 h-10 border-2 border-brand-100 border-t-brand-600 rounded-full animate-spin" />
                    <p className="text-sm font-bold uppercase tracking-widest">Loading Content...</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* CUSTOMER CHECKOUT MODAL (Simulated) */}
      <AnimatePresence>
        {isCheckoutOpen && checkoutData && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute inset-0 bg-zinc-900/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md relative z-[101] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-white/20"
            >
              {/* Header */}
              <div className="bg-zinc-50/50 px-8 py-6 border-b border-zinc-100 flex items-center justify-between sticky top-0 backdrop-blur-md">
                <div>
                  <p className="text-[10px] font-bold text-brand-600 uppercase tracking-[0.2em] mb-1">Secure Checkout</p>
                  <h3 className="text-xl font-display font-bold text-zinc-900">{checkoutData.merchantName}</h3>
                </div>
                <button onClick={() => setIsCheckoutOpen(false)} className="w-10 h-10 bg-white border border-zinc-200 rounded-2xl flex items-center justify-center text-zinc-500 hover:bg-zinc-50 transition-all shadow-sm">
                  <X size={18} />
                </button>
              </div>

              {/* Order Summary */}
              <div className="px-8 py-8 border-b border-zinc-100 bg-white">
                <div className="flex justify-between items-end mb-2">
                  <div className="space-y-1">
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Item Name</p>
                    <p className="text-zinc-900 font-bold text-lg">{checkoutData.itemName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Total Amount</p>
                    <p className="text-3xl font-display font-bold text-zinc-900">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: checkoutData.currency }).format(checkoutData.amount)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="px-8 py-8 overflow-y-auto flex-1 bg-zinc-50/30">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-6">Select Payment Method</p>
                
                <div className="space-y-6">
                  {checkoutData.methods.upi && (
                    <div className="bg-white border border-black/[0.03] rounded-[2rem] p-6 shadow-sm">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                          <Smartphone size={20} className="text-emerald-600" />
                        </div>
                        <h4 className="font-bold text-zinc-900">Pay via UPI</h4>
                      </div>
                      
                      <div className="flex justify-center mb-6">
                        <div className="bg-white p-4 rounded-3xl border border-zinc-100 shadow-xl">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${checkoutData.methods.upi}&pn=${encodeURIComponent(checkoutData.merchantName)}&am=${checkoutData.amount}&cu=${checkoutData.currency}`)}`} 
                            alt="UPI QR Code" 
                            className="w-40 h-40"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-zinc-50 rounded-2xl p-4 border border-black/[0.03] mb-4">
                        <code className="text-sm font-mono text-zinc-700 font-bold">{checkoutData.methods.upi}</code>
                        <button 
                          onClick={() => copyToClipboard(checkoutData.methods.upi!, 'upi')}
                          className="text-brand-600 hover:text-brand-700 text-sm font-bold flex items-center gap-1"
                        >
                          {copiedField === 'upi' ? <Check size={14}/> : <Copy size={14}/>} Copy
                        </button>
                      </div>
                      <a 
                        href={`upi://pay?pa=${checkoutData.methods.upi}&pn=${encodeURIComponent(checkoutData.merchantName)}&am=${checkoutData.amount}&cu=${checkoutData.currency}`}
                        className="w-full premium-button premium-button-brand py-4 text-sm flex items-center justify-center"
                      >
                        Open UPI App
                      </a>
                    </div>
                  )}

                  {checkoutData.methods.bank && (
                    <div className="bg-white border border-black/[0.03] rounded-[2rem] p-6 shadow-sm">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 rounded-2xl bg-zinc-50 flex items-center justify-center border border-zinc-100">
                          <Building2 size={20} className="text-zinc-600" />
                        </div>
                        <h4 className="font-bold text-zinc-900">Bank Transfer</h4>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="p-4 bg-zinc-50 rounded-2xl border border-black/[0.03]">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Account Number</p>
                          <div className="flex items-center justify-between">
                            <code className="text-sm font-mono text-zinc-700 font-bold">{checkoutData.methods.bank.account}</code>
                            <button 
                              onClick={() => copyToClipboard(checkoutData.methods.bank!.account, 'bankAcc')}
                              className="text-brand-600 hover:text-brand-700"
                            >
                              {copiedField === 'bankAcc' ? <Check size={14}/> : <Copy size={14}/>}
                            </button>
                          </div>
                        </div>
                        
                        <div className="p-4 bg-zinc-50 rounded-2xl border border-black/[0.03]">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">IFSC / SWIFT Code</p>
                          <div className="flex items-center justify-between">
                            <code className="text-sm font-mono text-zinc-700 font-bold">{checkoutData.methods.bank.ifsc}</code>
                            <button 
                              onClick={() => copyToClipboard(checkoutData.methods.bank!.ifsc, 'bankIfsc')}
                              className="text-brand-600 hover:text-brand-700"
                            >
                              {copiedField === 'bankIfsc' ? <Check size={14}/> : <Copy size={14}/>}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {getStripeCheckoutUrl(checkoutData) && (
                    <div className="bg-white border border-black/[0.03] rounded-[2rem] p-6 shadow-sm">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 rounded-2xl bg-brand-50 flex items-center justify-center border border-brand-100">
                          <CreditCard size={20} className="text-brand-600" />
                        </div>
                        <h4 className="font-bold text-zinc-900">Pay via Stripe</h4>
                      </div>
                      <div className="space-y-2">
                        <a
                          href={getStripeCheckoutUrl(checkoutData)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full premium-button premium-button-brand py-4 text-sm flex items-center justify-center"
                        >
                          Pay with Card (Stripe)
                        </a>
                        <a
                          href={getStripeCheckoutUrl(checkoutData)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all text-sm flex items-center justify-center"
                        >
                          Pay with Apple Pay / Google Pay
                        </a>
                      </div>
                    </div>
                  )}

                  {getPaypalCheckoutUrl(checkoutData) && (
                    <div className="bg-white border border-black/[0.03] rounded-[2rem] p-6 shadow-sm">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100">
                          <Wallet size={20} className="text-blue-600" />
                        </div>
                        <h4 className="font-bold text-zinc-900">Pay via PayPal</h4>
                      </div>
                      <a
                        href={getPaypalCheckoutUrl(checkoutData)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-4 bg-[#0070ba] text-white rounded-2xl font-bold hover:bg-[#005ea6] transition-all shadow-lg shadow-blue-600/20 text-sm flex items-center justify-center"
                      >
                        PayPal Checkout
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-zinc-50 px-8 py-6 text-center border-t border-zinc-100">
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                  <ShieldCheck size={14} className="text-brand-500" /> Secure Encryption by slaypay.xyz
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/pay/:productId" element={<MainApp />} />
          <Route path="/*" element={<MainApp />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
