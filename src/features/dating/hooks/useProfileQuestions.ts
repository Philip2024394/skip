import { useState, useCallback } from "react";
import type { QuestionTemplate } from "../data/profileQuestions";

export interface AskedQuestion {
  id: string;
  fromUserId: string;
  toProfileId: string;
  templateId: string;
  fieldLabel: string;
  question: string;
  coinCost: number;
  askedAt: number;
  answer?: string;
  answeredAt?: number;
  status: "pending" | "answered";
}

export interface ReceivedQuestion {
  id: string;
  fromName: string;
  fromAvatar?: string;
  templateId: string;
  fieldLabel: string;
  question: string;
  askedAt: number;
  status: "pending" | "answered";
  answer?: string;
}

const ASKED_KEY = "asked_questions_v1";
const RECEIVED_KEY = "received_questions_v1";

function loadAsked(): AskedQuestion[] {
  try { return JSON.parse(localStorage.getItem(ASKED_KEY) || "[]"); } catch { return []; }
}
function saveAsked(q: AskedQuestion[]) { localStorage.setItem(ASKED_KEY, JSON.stringify(q)); }

function loadReceived(): ReceivedQuestion[] {
  try { return JSON.parse(localStorage.getItem(RECEIVED_KEY) || "[]"); } catch { return []; }
}
function saveReceived(q: ReceivedQuestion[]) { localStorage.setItem(RECEIVED_KEY, JSON.stringify(q)); }

export function useProfileQuestions(userId?: string) {
  const [asked, setAsked] = useState<AskedQuestion[]>(loadAsked);
  const [received, setReceived] = useState<ReceivedQuestion[]>(loadReceived);

  const askQuestion = useCallback((template: QuestionTemplate, toProfileId: string): boolean => {
    if (!userId) return false;
    const all = loadAsked();
    if (all.some(q => q.fromUserId === userId && q.toProfileId === toProfileId && q.templateId === template.id)) {
      return false;
    }
    const newQ: AskedQuestion = {
      id: `aq_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      fromUserId: userId,
      toProfileId,
      templateId: template.id,
      fieldLabel: template.fieldLabel,
      question: template.question,
      coinCost: template.coinCost,
      askedAt: Date.now(),
      status: "pending",
    };
    const updated = [...all, newQ];
    saveAsked(updated);
    setAsked(updated);
    return true;
  }, [userId]);

  const isAsked = useCallback((profileId: string, templateId: string): "pending" | "answered" | null => {
    if (!userId) return null;
    const q = loadAsked().find(q => q.fromUserId === userId && q.toProfileId === profileId && q.templateId === templateId);
    return q?.status ?? null;
  }, [userId]);

  const getAnswer = useCallback((profileId: string, templateId: string): string | undefined => {
    if (!userId) return undefined;
    return loadAsked().find(q =>
      q.fromUserId === userId && q.toProfileId === profileId && q.templateId === templateId
    )?.answer;
  }, [userId]);

  // Blocking popup: pending questions received by the current user
  const pendingReceived = received.filter(q => q.status === "pending");

  const answerReceived = useCallback((questionId: string, answer: string) => {
    const all = loadReceived();
    const updated = all.map(q =>
      q.id === questionId ? { ...q, answer, answeredAt: Date.now(), status: "answered" as const } : q
    );
    saveReceived(updated);
    setReceived(updated);
    // Also update any matching asked question to "answered" with the answer
    const updatedAsked = loadAsked().map(q =>
      q.templateId === all.find(r => r.id === questionId)?.templateId
        ? { ...q, answer, answeredAt: Date.now(), status: "answered" as const }
        : q
    );
    saveAsked(updatedAsked);
    setAsked(updatedAsked);
  }, []);

  // Admin: inject a test question sent to the current user
  const injectReceivedQuestion = useCallback((template: QuestionTemplate, fromName: string, fromAvatar?: string) => {
    const all = loadReceived();
    const newQ: ReceivedQuestion = {
      id: `rq_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      fromName,
      fromAvatar,
      templateId: template.id,
      fieldLabel: template.fieldLabel,
      question: template.question,
      askedAt: Date.now(),
      status: "pending",
    };
    const updated = [...all, newQ];
    saveReceived(updated);
    setReceived(updated);
  }, []);

  return {
    asked,
    received,
    askQuestion,
    isAsked,
    getAnswer,
    pendingReceived,
    answerReceived,
    injectReceivedQuestion,
  };
}
