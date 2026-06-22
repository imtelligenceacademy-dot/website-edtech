import type { School } from "@/types";

export const mockSchools: School[] = [
  {
    id: "sch_01",
    name: "Antonine International School",
    country: "Lebanon",
    city: "Beirut",
    teacherCount: 24,
    adminCount: 2,
    createdAt: "2024-09-01",
  },
  {
    id: "sch_02",
    name: "Cedars Academy",
    country: "Lebanon",
    city: "Tripoli",
    teacherCount: 18,
    adminCount: 1,
    createdAt: "2024-10-12",
  },
  {
    id: "sch_03",
    name: "Mediterranean STEM School",
    country: "Lebanon",
    city: "Jounieh",
    teacherCount: 31,
    adminCount: 2,
    createdAt: "2025-01-20",
  },
  {
    id: "sch_04",
    name: "Phoenicia International",
    country: "Lebanon",
    city: "Byblos",
    teacherCount: 12,
    adminCount: 1,
    createdAt: "2025-03-05",
  },
];
