// Core domain types for IM-Telligence frontend.

export type Role = "super-admin" | "school-admin" | "teacher";

export type UserStatus = "active" | "pending" | "suspended" | "rejected";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  schoolId?: string;
  status: UserStatus;
  createdAt: string;
  lastLoginAt?: string;
}

export interface School {
  id: string;
  name: string;
  country: string;
  city: string;
  teacherCount: number;
  adminCount: number;
  createdAt: string;
}

export type LessonStatus = "not-started" | "in-progress" | "completed" | "late";

export interface Lesson {
  id: string;
  title: string;
  grade: number;
  subject: string;
  slides: Slide[];
  schoolId: string;
  assignedTeacherIds: string[];
  dueDate: string;
  createdBy: string; // super admin id
}

export interface Slide {
  id: string;
  index: number;
  title: string;
  body: string;
}

export type WatchdogStatus = "on-track" | "late" | "not-opened" | "completed" | "needs-attention";

export interface ProgressEntry {
  id: string;
  teacherId: string;
  lessonId: string;
  status: LessonStatus;
  percentComplete: number;
  lastOpenedAt?: string;
  watchdog: WatchdogStatus;
  watchdogMessage?: string;
}

export type ReportStatus = "pending" | "processing" | "ready" | "failed";

export interface Report {
  id: string;
  title: string;
  scope: "global" | "school";
  schoolId?: string;
  requestedBy: string;
  requestedAt: string;
  status: ReportStatus;
  readyAt?: string;
}

export type SecurityEventType =
  | "normal-login"
  | "foreign-device"
  | "new-ip"
  | "suspicious-location"
  | "blocked-second-device";

export interface SecurityLog {
  id: string;
  userId: string;
  userName: string;
  role: Role;
  schoolId?: string;
  ip: string;
  location: { lat: number; lng: number; label: string };
  device: string;
  event: SecurityEventType;
  status: "ok" | "warning" | "blocked";
  timestamp: string;
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  cached?: boolean;
  sourceRef?: string; // e.g. "Grade 8 Lesson 2, Slide 4"
  timestamp: string;
}

export interface Session {
  userId: string;
  role: Role;
  schoolId?: string;
  name: string;
  email: string;
}
