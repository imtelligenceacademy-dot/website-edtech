import type { AIMessage } from "@/types";

// Seed conversation shown when the teacher opens the AI assistant for the first time.
export const mockAIThread: AIMessage[] = [
  {
    id: "m_01",
    role: "assistant",
    content:
      "Hi! I'm the IM-Telligence assistant. I can answer questions about your assigned lessons, suggest classroom activities, or explain a slide in more detail. What would you like to know?",
    timestamp: "2026-06-22T07:30:00Z",
  },
];

// Canned responses keyed loosely by topic. The Chatbot component does a naive substring
// match against the latest user message. TODO: replace with real LLM call.
export const mockAIResponses: { match: string; reply: AIMessage }[] = [
  {
    match: "robot",
    reply: {
      id: "r_robot",
      role: "assistant",
      content:
        "A robot is a programmable machine that can sense its environment, make decisions, and take action. For Grade 5, focus on three parts: sensors (input), controller (brain), and actuators (output). Try the Volt mascot activity in slide 4 — students love naming their own robot.",
      sourceRef: "Grade 5 Lesson 1, Slide 4",
      timestamp: new Date().toISOString(),
    },
  },
  {
    match: "loop",
    reply: {
      id: "r_loop",
      role: "assistant",
      content:
        "A loop repeats a block of instructions. For Grade 4, introduce loops with a counted example: 'walk forward 4 times' before introducing while-loops. The Maze Runner mini-project on slide 5 gives students a concrete reason to repeat.",
      sourceRef: "Grade 4 Lesson 2, Slide 3",
      cached: true,
      timestamp: new Date().toISOString(),
    },
  },
  {
    match: "ai",
    reply: {
      id: "r_ai",
      role: "assistant",
      content:
        "Artificial Intelligence is the ability of a machine to perform tasks that normally require human intelligence — like recognising patterns or understanding language. For Grade 6, anchor the lesson in pattern recognition: show photos of cats and dogs and let students 'train' the rule.",
      sourceRef: "Grade 6 Lesson 3, Slide 1",
      timestamp: new Date().toISOString(),
    },
  },
];

export const fallbackAIReply: AIMessage = {
  id: "r_fallback",
  role: "assistant",
  content:
    "I don't have a specific reference for that yet, but here's a general suggestion: break the concept into a definition, one real-world example, and a 5-minute classroom activity. If you share the slide number, I can be more specific.",
  timestamp: new Date().toISOString(),
};
