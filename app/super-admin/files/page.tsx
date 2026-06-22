"use client";

import { useRef, useState } from "react";
import { UploadCloud, FileText, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/DashboardShell";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TR, TH, TD } from "@/components/ui/Table";
import { mockLessons } from "@/data/mockLessons";
import { mockSchools } from "@/data/mockSchools";

type MockFile = {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
  linkedLessonId?: string;
};

export default function FilesPage() {
  const [files, setFiles] = useState<MockFile[]>([
    { id: "f1", name: "robotics-grade5-lesson1.pptx", size: "4.2 MB", uploadedAt: "2026-06-18", linkedLessonId: "les_01" },
    { id: "f2", name: "coding-grade4-lesson2.pptx", size: "3.1 MB", uploadedAt: "2026-06-19", linkedLessonId: "les_02" },
  ]);
  const [dragOver, setDragOver] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleUpload(file?: File) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pptx")) {
      setUploadMessage("Choose a PPTX file.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setUploadMessage("The file exceeds the 20 MB limit.");
      return;
    }
    // TODO: real upload to backend / S3.
    const uploaded: MockFile = {
      id: `f${Date.now()}`,
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      uploadedAt: new Date().toISOString().slice(0, 10),
    };
    setFiles((prev) => [uploaded, ...prev]);
    setUploadMessage(`${file.name} added to the mock file library.`);
  }

  return (
    <>
      <PageHeader
        title="Files"
        subtitle="Upload PPT lessons and supporting material."
      />

      <Card className="mb-6">
        <CardHeader title="Upload" subtitle="PPTX up to 20 MB. Files are watermarked at view-time." />
        <CardBody>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleUpload(e.dataTransfer.files[0]);
            }}
            className={
              "rounded-xl border-2 border-dashed p-10 text-center transition-colors " +
              (dragOver ? "border-brand bg-brand-50" : "border-slate-300 bg-slate-50")
            }
          >
            <UploadCloud className="mx-auto text-slate-400" size={32} />
            <p className="mt-2 text-sm text-slate-700 font-medium">
              Drop a PPTX file here
            </p>
            <p className="text-xs text-slate-500">
              or click below to select from your computer
            </p>
            <div className="mt-4">
              <input
                ref={inputRef}
                type="file"
                accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                className="sr-only"
                onChange={(e) => {
                  handleUpload(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <Button type="button" onClick={() => inputRef.current?.click()}>
                <UploadCloud size={14} /> Choose file
              </Button>
            </div>
            {uploadMessage && (
              <p className="mt-3 text-xs text-slate-600" role="status">
                {uploadMessage}
              </p>
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Uploaded files" />
        <Table>
          <THead>
            <TR>
              <TH>File</TH>
              <TH>Size</TH>
              <TH>Uploaded</TH>
              <TH>Linked lessons</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <tbody>
            {files.map((f) => (
              <TR key={f.id}>
                <TD>
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-slate-400" />
                    <span className="font-medium text-slate-900">{f.name}</span>
                  </div>
                </TD>
                <TD>{f.size}</TD>
                <TD>{f.uploadedAt}</TD>
                <TD>
                  <Badge tone="brand">
                    {mockLessons.find((lesson) => lesson.id === f.linkedLessonId)?.title ?? "Unassigned"}
                  </Badge>
                </TD>
                <TD className="text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setFiles((prev) => prev.filter((x) => x.id !== f.id))}
                  >
                    <Trash2 size={12} />
                  </Button>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      </Card>

      <p className="mt-4 text-xs text-slate-500">
        {mockSchools.length} schools currently eligible for file assignments.
      </p>
    </>
  );
}
