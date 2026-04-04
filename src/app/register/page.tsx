'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Eye, EyeOff, Loader2, Upload, Check, School, User, Mail, Lock, BookOpen, Sun, Moon, Monitor } from 'lucide-react';
import { TIER_TEMPLATE_OPTIONS } from '@/lib/constants/tiers';
import { CURRICULUM_INFO } from '@/types';
import type { Curriculum } from '@prisma/client';

const TOTAL_STEPS = 5;

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    schoolName: '',
    schoolEmail: '',
    slug: '',
    firstName: '',
    lastName: '',
    adminEmail: '',
    password: '',
    confirmPassword: '',
    brandColor: '#1a56db',
    logo: null as string | null,
    tierTemplate: '' as string,
    curriculum: 'NERDC' as Curriculum,
    usePerTierCurriculum: false,
    themeMode: 'SYSTEM' as string,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      if (name === 'schoolName') {
        return { ...prev, [name]: value, slug: value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep = (currentStep: number) => {
    if (currentStep === 1) {
      return formData.schoolName && formData.schoolEmail && formData.slug;
    }
    if (currentStep === 2) {
      return formData.firstName && formData.lastName && formData.adminEmail && formData.password && formData.confirmPassword;
    }
    if (currentStep === 3) {
      return formData.password === formData.confirmPassword;
    }
    if (currentStep === 4) {
      return formData.tierTemplate !== '';
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(step)) return;
    
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName: formData.schoolName,
          schoolEmail: formData.schoolEmail,
          slug: formData.slug,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.adminEmail,
          password: formData.password,
          brandColor: formData.brandColor,
          logo: formData.logo,
          tierTemplate: formData.tierTemplate,
          curriculum: formData.curriculum,
          usePerTierCurriculum: formData.usePerTierCurriculum,
          themeMode: formData.themeMode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const colorPresets = [
    '#1a56db', '#059669', '#7c3aed', '#dc2626', '#ea580c', 
    '#0891b2', '#4f46e5', '#be185d', '#854d0e', '#1f2937'
  ];

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-8">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
          <p className="text-gray-600 mb-6">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        
        <div className="relative z-10">
          <Logo size="xl" showText={true} className="text-white" />
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Set Up Your School
          </h1>
          <p className="text-blue-100 text-lg max-w-md">
            Create your school&apos;s account and start managing students, teachers, and exams in minutes.
          </p>
          
          <div className="space-y-4">
            {[
              'Free 14-day trial, no credit card',
              'Unlimited students & teachers',
              'AI-powered features included',
              '24/7 customer support'
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-blue-100">
                <Check className="h-5 w-5 text-green-400" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-blue-200 text-sm">
          © 2024 EduNext. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-lg">
          <div className="lg:hidden flex justify-center mb-6">
            <Logo size="lg" showText={true} />
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold transition-all text-sm ${
                  step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > s ? <Check className="h-4 w-4" /> : s}
                </div>
                {s < TOTAL_STEPS && (
                  <div className={`w-8 h-1 mx-1 rounded ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Step 1: School Info */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 text-center">School Information</h2>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">School Name</label>
                  <div className="relative">
                    <School className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="schoolName"
                      value={formData.schoolName}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Your School Name"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">School Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      name="schoolEmail"
                      value={formData.schoolEmail}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="admin@school.edu"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">School URL Slug</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">edunext.com/</span>
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleChange}
                      className="w-full pl-32 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="your-school"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Admin Info */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 text-center">Admin Account</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="John"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Admin Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      name="adminEmail"
                      value={formData.adminEmail}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="admin@your-school.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Min. 8 characters"
                      minLength={8}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Confirm password"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Branding */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 text-center">School Branding</h2>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">School Logo</label>
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                      {formData.logo ? (
                        <img src={formData.logo} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <Upload className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        <Upload className="h-4 w-4" />
                        <span className="text-sm font-medium">Upload Logo</span>
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      </label>
                      <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 2MB</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Brand Color</label>
                  <div className="flex flex-wrap gap-3">
                    {colorPresets.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, brandColor: color }))}
                        className={`w-10 h-10 rounded-full transition-transform hover:scale-110 ${
                          formData.brandColor === color ? 'ring-2 ring-offset-2 ring-blue-600' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">Choose a brand color for your school</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Theme Mode</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, themeMode: 'LIGHT' }))}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        formData.themeMode === 'LIGHT'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Sun className="h-6 w-6" />
                      <span className="text-sm font-medium">Light</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, themeMode: 'DARK' }))}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        formData.themeMode === 'DARK'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Moon className="h-6 w-6" />
                      <span className="text-sm font-medium">Dark</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, themeMode: 'SYSTEM' }))}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        formData.themeMode === 'SYSTEM'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Monitor className="h-6 w-6" />
                      <span className="text-sm font-medium">System</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">Choose your preferred theme</p>
                </div>
              </div>
            )}

            {/* Step 4: Tier Selection */}
            {step === 4 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 text-center">School Tiers</h2>
                <p className="text-sm text-gray-600 text-center">Select your school structure</p>
                
                <div className="space-y-3">
                  {TIER_TEMPLATE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, tierTemplate: option.value }))}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        formData.tierTemplate === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Curriculum */}
            {step === 5 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 text-center">Curriculum</h2>
                <p className="text-sm text-gray-600 text-center">Choose your curriculum</p>

                <div className="space-y-3">
                  {(['NERDC', 'CAMBRIDGE', 'AMERICAN', 'IB'] as Curriculum[]).map((curriculum) => (
                    <button
                      key={curriculum}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, curriculum }))}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        formData.curriculum === curriculum
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="font-medium">{CURRICULUM_INFO[curriculum].name}</div>
                          <div className="text-sm text-gray-500">{CURRICULUM_INFO[curriculum].description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="pt-4 border-t">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.usePerTierCurriculum}
                      onChange={(e) => setFormData(prev => ({ ...prev, usePerTierCurriculum: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-700">Different curriculum per tier</div>
                      <div className="text-xs text-gray-500">Select this if you offer multiple curricula (e.g., NERDC for Primary, Cambridge for SSS)</div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-4">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={!validateStep(step) || submitting}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : step < TOTAL_STEPS ? (
                  'Continue'
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>

          <p className="text-center text-gray-600 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
