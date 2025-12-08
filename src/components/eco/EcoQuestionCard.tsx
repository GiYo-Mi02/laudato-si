"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EcoQuestion {
  id: string;
  type: "quiz" | "pledge";
  question: string;
  options?: string[];
  placeholder?: string;
}

interface EcoQuestionCardProps {
  question: EcoQuestion;
  onSubmit: (answer: string) => Promise<void>;
  disabled?: boolean;
}

export function EcoQuestionCard({ question, onSubmit, disabled }: EcoQuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [pledgeText, setPledgeText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async () => {
    const answer = question.type === "quiz" ? selectedAnswer : pledgeText;
    if (!answer.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(answer);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setSelectedAnswer("");
        setPledgeText("");
      }, 2000);
    } catch (error) {
      console.error("Failed to submit:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = question.type === "quiz" ? !!selectedAnswer : pledgeText.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-[0_8px_24px_rgba(0,0,0,0.08)] border border-[#D4A574]/20">
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center justify-center py-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="w-16 h-16 rounded-full bg-[#C8E86C] flex items-center justify-center mb-4"
              >
                <Check className="w-8 h-8 text-[#4A6B5C]" />
              </motion.div>
              <h3 className="font-display text-xl text-[#4A6B5C] text-center">
                Your contribution helped the plant grow!
              </h3>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h2 className="font-display text-2xl text-[#2C2C2C] mb-6 leading-tight">
                {question.question}
              </h2>

              {question.type === "quiz" && question.options && (
                <RadioGroup
                  value={selectedAnswer}
                  onValueChange={setSelectedAnswer}
                  className="space-y-3 mb-6"
                  disabled={disabled || isSubmitting}
                >
                  {question.options.map((option, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Label
                        htmlFor={`option-${index}`}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedAnswer === option
                            ? "border-[#4A6B5C] bg-[#4A6B5C]/5"
                            : "border-[#D4A574]/30 hover:border-[#D4A574]/60"
                        }`}
                      >
                        <RadioGroupItem
                          value={option}
                          id={`option-${index}`}
                          className="border-[#4A6B5C] text-[#4A6B5C]"
                        />
                        <span className="font-body text-[#2C2C2C]">{option}</span>
                      </Label>
                    </motion.div>
                  ))}
                </RadioGroup>
              )}

              {question.type === "pledge" && (
                <div className="mb-6">
                  <Textarea
                    value={pledgeText}
                    onChange={(e) => setPledgeText(e.target.value)}
                    placeholder={question.placeholder || "Write your eco-pledge here..."}
                    className="min-h-[120px] border-2 border-[#D4A574]/30 focus:border-[#4A6B5C] rounded-xl resize-none font-body"
                    disabled={disabled || isSubmitting}
                  />
                </div>
              )}

              <motion.div
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button
                  onClick={handleSubmit}
                  disabled={!isValid || disabled || isSubmitting}
                  className="w-full h-14 bg-[#4A6B5C] hover:bg-[#3A5B4C] text-white font-display text-lg rounded-xl shadow-lg transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Submit Contribution"
                  )}
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
