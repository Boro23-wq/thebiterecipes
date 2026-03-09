"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { saveOnboardingProfile } from "../actions/onboarding";

// ============================================
// TYPES
// ============================================

type OnboardingData = {
  dietary: string[];
  cuisines: string[];
  skillLevel: string;
  cookingTime: string;
};

type SectionHeaderProps = {
  emoji: string;
  title: string;
};

type StepButtonsProps = {
  step: number;
  canProceed: boolean;
  onNext: () => void;
  onBack: () => void;
  isPending: boolean;
  isLast?: boolean;
};

// ============================================
// CONSTANTS
// ============================================

const STEP_LABELS = [
  "Welcome",
  "Your diet",
  "Your taste",
  "Cooking level",
  "Kitchen time",
];

const DIETARY_OPTIONS = [
  { id: "vegan", label: "Vegan", emoji: "🌱" },
  { id: "vegetarian", label: "Vegetarian", emoji: "🍃" },
  { id: "gluten-free", label: "Gluten-Free", emoji: "🌾" },
  { id: "dairy-free", label: "Dairy-Free", emoji: "🥛" },
  { id: "nut-free", label: "Nut-Free", emoji: "🥜" },
  { id: "keto", label: "Keto", emoji: "🥩" },
];

const CUISINE_OPTIONS = [
  { id: "italian", label: "Italian", emoji: "🇮🇹" },
  { id: "mexican", label: "Mexican", emoji: "🇲🇽" },
  { id: "asian", label: "Asian", emoji: "🥢" },
  { id: "indian", label: "Indian", emoji: "🇮🇳" },
  { id: "mediterranean", label: "Mediterranean", emoji: "🫒" },
  { id: "american", label: "American", emoji: "🇺🇸" },
  { id: "middle-eastern", label: "Middle Eastern", emoji: "🧆" },
  { id: "french", label: "French", emoji: "🇫🇷" },
];

const SKILL_OPTIONS = [
  {
    id: "beginner",
    label: "Beginner",
    emoji: "🌱",
    desc: "Simple recipes, basic techniques",
  },
  {
    id: "intermediate",
    label: "Intermediate",
    emoji: "👨‍🍳",
    desc: "Comfortable in the kitchen",
  },
  {
    id: "advanced",
    label: "Advanced",
    emoji: "⭐",
    desc: "Bring on the challenge",
  },
];

const TIME_OPTIONS = [
  {
    id: "quick",
    label: "Quick Meals",
    emoji: "⚡",
    desc: "Under 30 minutes",
  },
  {
    id: "moderate",
    label: "Moderate",
    emoji: "🕐",
    desc: "30 – 60 minutes",
  },
  {
    id: "elaborate",
    label: "Elaborate",
    emoji: "🍷",
    desc: "60+ minutes, worth the wait",
  },
];

const TOTAL_STEPS = 5;

// ============================================
// MAIN COMPONENT
// ============================================

export default function OnboardingPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<number>(0);

  const [data, setData] = useState<OnboardingData>({
    dietary: [],
    cuisines: [],
    skillLevel: "",
    cookingTime: "",
  });

  const canProceed = () => {
    switch (step) {
      case 0:
        return true;
      case 1:
        return true;
      case 2:
        return data.cuisines.length > 0;
      case 3:
        return data.skillLevel !== "";
      case 4:
        return data.cookingTime !== "";
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
    else handleComplete();
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleComplete = () => {
    startTransition(async () => {
      await saveOnboardingProfile(data);
      router.push("/dashboard");
    });
  };

  const toggleMultiSelect = (key: "dietary" | "cuisines", value: string) => {
    setData((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-white">
      <SoftGradientBackground />

      <div className="w-full max-w-105 relative z-10">
        {step > 0 && (
          <p className="text-xs text-gray-400 mb-2 text-center">
            Step {step + 1} of {TOTAL_STEPS} • {STEP_LABELS[step]}
          </p>
        )}

        {step > 0 && (
          <div className="flex gap-1.5 mb-6">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className="h-1 flex-1 rounded-sm transition-all duration-500"
                style={{
                  background: i <= step ? "#FF6B35" : "rgba(0,0,0,0.06)",
                }}
              />
            ))}
          </div>
        )}

        <div
          className="rounded-sm p-8"
          style={{
            background: "rgba(255,255,255,0.75)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(0,0,0,0.05)",
            boxShadow:
              "0 10px 30px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -25 }}
              transition={{ duration: 0.35 }}
            >
              {step === 0 && (
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring" }}
                    className="text-5xl mb-4"
                  >
                    🍊
                  </motion.div>

                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Welcome to Bite!
                  </h1>

                  <p className="text-sm text-gray-400 mb-8 leading-relaxed">
                    Let’s personalize your recipe collection.
                  </p>

                  <button
                    onClick={handleNext}
                    className="w-full py-3.5 rounded-sm font-bold text-white text-base transition-all hover:brightness-110 cursor-pointer"
                    style={{
                      background: "linear-gradient(135deg, #FF6B35, #ff8c5a)",
                      boxShadow: "0 4px 20px rgba(255,107,53,0.25)",
                    }}
                  >
                    Let’s Get Started
                  </button>
                </div>
              )}

              {step === 1 && (
                <div>
                  <SectionHeader emoji="🥗" title="Any dietary needs?" />

                  <div className="grid grid-cols-2 gap-2.5 mb-6">
                    {DIETARY_OPTIONS.map((option) => {
                      const isSelected = data.dietary.includes(option.id);

                      return (
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          whileHover={{ scale: 1.03 }}
                          key={option.id}
                          onClick={() =>
                            toggleMultiSelect("dietary", option.id)
                          }
                          className="flex items-center gap-2.5 p-3.5 rounded-sm cursor-pointer"
                          style={{
                            border: isSelected
                              ? "1.5px solid #FF6B35"
                              : "1.5px solid rgba(0,0,0,0.08)",
                            background: isSelected
                              ? "rgba(255,107,53,0.06)"
                              : "rgba(0,0,0,0.01)",
                          }}
                        >
                          <span>{option.emoji}</span>
                          <span className="text-sm font-semibold">
                            {option.label}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>

                  <StepButtons
                    step={step}
                    canProceed={canProceed()}
                    onNext={handleNext}
                    onBack={handleBack}
                    isPending={false}
                  />
                </div>
              )}

              {step === 2 && (
                <div>
                  <SectionHeader
                    emoji="🌍"
                    title="What cuisines do you love?"
                  />

                  <div className="grid grid-cols-2 gap-2.5 mb-6">
                    {CUISINE_OPTIONS.map((option) => {
                      const isSelected = data.cuisines.includes(option.id);

                      return (
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          whileHover={{ scale: 1.03 }}
                          key={option.id}
                          onClick={() =>
                            toggleMultiSelect("cuisines", option.id)
                          }
                          className="flex items-center gap-2.5 p-3.5 rounded-sm cursor-pointer"
                          style={{
                            border: isSelected
                              ? "1.5px solid #FF6B35"
                              : "1.5px solid rgba(0,0,0,0.08)",
                            background: isSelected
                              ? "rgba(255,107,53,0.06)"
                              : "rgba(0,0,0,0.01)",
                          }}
                        >
                          <span>{option.emoji}</span>
                          <span className="text-sm font-semibold">
                            {option.label}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>

                  <StepButtons
                    step={step}
                    canProceed={canProceed()}
                    onNext={handleNext}
                    onBack={handleBack}
                    isPending={false}
                  />
                </div>
              )}

              {step === 3 && (
                <div>
                  <SectionHeader emoji="🔥" title="Your cooking level?" />

                  <div className="flex flex-col gap-2.5 mb-6">
                    {SKILL_OPTIONS.map((option) => {
                      const isSelected = data.skillLevel === option.id;

                      return (
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          whileHover={{ scale: 1.02 }}
                          key={option.id}
                          onClick={() =>
                            setData((prev) => ({
                              ...prev,
                              skillLevel: option.id,
                            }))
                          }
                          className="flex items-center gap-3 p-4 rounded-sm cursor-pointer"
                          style={{
                            border: isSelected
                              ? "1.5px solid #FF6B35"
                              : "1.5px solid rgba(0,0,0,0.08)",
                          }}
                        >
                          <span className="text-2xl">{option.emoji}</span>
                          <div>
                            <div className="text-left font-bold">
                              {option.label}
                            </div>
                            <div className="text-xs text-gray-400">
                              {option.desc}
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  <StepButtons
                    step={step}
                    canProceed={canProceed()}
                    onNext={handleNext}
                    onBack={handleBack}
                    isPending={false}
                  />
                </div>
              )}

              {step === 4 && (
                <div>
                  <SectionHeader emoji="⏰" title="How much time per meal?" />

                  <div className="flex flex-col gap-2.5 mb-6">
                    {TIME_OPTIONS.map((option) => {
                      const isSelected = data.cookingTime === option.id;

                      return (
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          whileHover={{ scale: 1.02 }}
                          key={option.id}
                          onClick={() =>
                            setData((prev) => ({
                              ...prev,
                              cookingTime: option.id,
                            }))
                          }
                          className="flex items-center gap-3 p-4 rounded-sm cursor-pointer"
                          style={{
                            border: isSelected
                              ? "1.5px solid #FF6B35"
                              : "1.5px solid rgba(0,0,0,0.08)",
                          }}
                        >
                          <span className="text-2xl">{option.emoji}</span>
                          <div>
                            <div className="text-left font-bold">
                              {option.label}
                            </div>
                            <div className="text-xs text-gray-400">
                              {option.desc}
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  <StepButtons
                    step={step}
                    canProceed={canProceed()}
                    onNext={handleNext}
                    onBack={handleBack}
                    isPending={isPending}
                    isLast
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ============================================
// SMALL COMPONENTS
// ============================================

function SectionHeader({ emoji, title }: SectionHeaderProps) {
  return (
    <div className="text-center mb-6">
      <div className="text-3xl mb-2">{emoji}</div>
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
    </div>
  );
}

function SoftGradientBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -left-40 w-100 h-100 bg-orange-200 rounded-full blur-[120px] opacity-30" />
      <div className="absolute top-1/3 -right-40 w-87.5 h-87.5 bg-amber-200 rounded-full blur-[120px] opacity-30" />
      <div className="absolute -bottom-30 left-1/3 w-75 h-75 bg-rose-200 rounded-full blur-[120px] opacity-30" />
    </div>
  );
}

// ============================================
// BUTTONS
// ============================================

function StepButtons({
  canProceed,
  onNext,
  onBack,
  isPending,
  isLast = false,
}: StepButtonsProps) {
  return (
    <div className="flex gap-3">
      <button
        onClick={onBack}
        className="flex-1 py-3 rounded-sm text-sm font-semibold text-gray-400 border cursor-pointer"
      >
        Back
      </button>

      <button
        onClick={onNext}
        disabled={!canProceed || isPending}
        className="flex-2 py-3 rounded-sm text-sm font-bold text-white disabled:opacity-40 cursor-pointer"
        style={{
          background: "linear-gradient(135deg, #FF6B35, #ff8c5a)",
        }}
      >
        {isPending
          ? "Cooking up your recipes..."
          : isLast
            ? "Finish & Get Recipes"
            : "Continue"}
      </button>
    </div>
  );
}
