import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FcGoogle } from 'react-icons/fc';
import { Check, X, Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login: authLogin, register: authRegister, googleLogin: authGoogleLogin, isAuthenticated } = useAuth();
  const [isLogin, setIsLogin] = useState(false); // Default to Signup as per visual
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);

  // --- Password Strength Logic ---
  useEffect(() => {
    if (!formData.password) {
      setPasswordStrength(0);
      return;
    }
    let strength = 0;
    if (formData.password.length >= 8) strength += 1;
    if (/[A-Z]/.test(formData.password)) strength += 1;
    if (/[0-9]/.test(formData.password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(formData.password)) strength += 1;
    setPasswordStrength(strength);
  }, [formData.password]);

  // --- Validation ---
  const validate = () => {
    const newErrors = {};
    if (!isLogin && !formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!isLogin && formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const redirectTo = searchParams.get('redirect') || '/create-trip';

      if (isLogin) {
        await authLogin({ email: formData.email, password: formData.password });
        toast.success("Welcome back!");
        navigate(decodeURIComponent(redirectTo));
      } else {
        await authRegister({ name: formData.name, email: formData.email, password: formData.password });
        toast.success("Account created successfully!");
        navigate(decodeURIComponent(redirectTo));
      }
    } catch (error) {
      const msg = error.response?.data?.error || 'Authentication failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // --- Google Login (Popup mode for reliable localhost dev) ---
  const googleLogin = useGoogleLogin({
    flow: 'implicit',
    ux_mode: 'popup',
    onSuccess: async (tokenInfo) => {
      setLoading(true);
      try {
        await authGoogleLogin(tokenInfo.access_token);
        toast.success("Signed in with Google");
        const redirectTo = searchParams.get('redirect') || '/create-trip';
        navigate(decodeURIComponent(redirectTo));
      } catch (err) {
        toast.error(err.response?.data?.error || "Google sign in failed");
      } finally {
        setLoading(false);
      }
    },
    onError: (err) => {
      console.error('Google OAuth error:', err);
      toast.error("Google login failed. Check console for details.");
    }
  });

  return (
    <div className="min-h-screen w-full flex bg-background font-sans overflow-y-auto">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col p-4 sm:p-6 md:p-8 lg:p-12 relative min-h-screen">
        {/* Header / Back Button */}
        <div className="flex-none">
          <Button
            variant="ghost"
            className="gap-2 w-fit px-0 hover:bg-transparent"
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={16} /> Back to Home
          </Button>
        </div>

        {/* Centered Content */}
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          <div className="mb-4 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
              <img src="/logo_1.png" alt="Vegaa AI Logo" className="h-8 w-auto object-contain" />
              <span className="font-bold text-xl tracking-tight font-script">
                <span className="brand-vegaa">Vegaa</span><span className="brand-ai">AI</span>
              </span>
            </div>
            <h1 className="text-fluid-h2 tracking-tight mb-1 text-foreground">
              {isLogin ? "Welcome back" : "Sign up"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isLogin
                ? "Enter your details to access your account."
                : "Start turning your ideas into reality."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2">
            {!isLogin && (
              <div className="space-y-1">
                <Input
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`h-9 text-sm ${errors.name ? "border-destructive focus-visible:ring-destructive/20" : ""}`}
                />
                {errors.name && <p className="text-[10px] text-destructive pl-1">{errors.name}</p>}
              </div>
            )}

            <div className="space-y-1">
              <Input
                name="email"
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                className={`h-9 text-sm ${errors.email ? "border-destructive focus-visible:ring-destructive/20" : ""}`}
              />
              {errors.email && <p className="text-[10px] text-destructive pl-1">{errors.email}</p>}
            </div>

            <div className="space-y-1">
              <div className="relative">
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={isLogin ? "Password" : "Create Password"}
                  value={formData.password}
                  onChange={handleChange}
                  className={`h-9 text-sm ${errors.password ? "border-destructive focus-visible:ring-destructive/20 pr-10" : "pr-10"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && <p className="text-[10px] text-destructive pl-1">{errors.password}</p>}

              {!isLogin && formData.password && (
                <div className="flex gap-1 h-0.5 w-full overflow-hidden rounded-full bg-muted mt-1.5">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-full flex-1 transition-all duration-300 ${passwordStrength >= step
                          ? (passwordStrength <= 2 ? 'bg-orange-500' : 'bg-green-500')
                          : 'bg-transparent'
                        }`}
                    />
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" className="w-full h-9 text-sm font-medium mt-1" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
              {isLogin ? "Sign in" : "Get started"}
            </Button>
          </form>

          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full h-9 text-sm gap-2"
            onClick={() => googleLogin()}
            disabled={loading}
          >
            <FcGoogle size={18} />
            {isLogin ? "Sign in with Google" : "Sign up with Google"}
          </Button>

          <div className="mt-4 text-center text-xs">
            <span className="text-muted-foreground">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
                setFormData({ name: '', email: '', password: '' });
              }}
              className="font-medium text-primary hover:underline underline-offset-4"
            >
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-none pt-4 text-[10px] text-muted-foreground text-center lg:text-left border-t border-border/40 lg:border-none">
          © {new Date().getFullYear()} Vegaa AI. All rights reserved.
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:flex w-1/2 bg-muted relative overflow-hidden">
        <img
          src="https://images.pexels.com/photos/2161449/pexels-photo-2161449.jpeg?auto=compress&cs=tinysrgb&w=1600"
          alt="Scenic mountain landscape"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[20s] hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-16 text-white">
          <div className="max-w-lg space-y-6 mb-8 animate-slide-in-from-bottom-8">
            <blockquote className="text-3xl font-medium leading-normal drop-shadow-lg">
              "The world is a book and those who do not travel read only one page."
            </blockquote>
            <div className="flex items-center gap-4 pt-4 border-t border-white/20">
              <div>
                <div className="font-semibold text-lg">Saint Augustine</div>
                <div className="text-sm text-white/80">Philosopher</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
