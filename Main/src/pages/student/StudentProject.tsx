import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paperclip, Trash2, Upload } from "lucide-react";
import {
  addInteractiveProjectDocument,
  deleteInteractiveProjectDocument,
  DEMO_STUDENT,
  getInteractiveStudentWorkspace,
  INTERACTIVE_WORKSPACE_EVENT,
  type ProjectDocument,
} from "@/lib/interactiveMilestones";

const stateLabels: Record<string, string> = { proposed: "Proposed", applied: "Applied", withdrawn: "Withdrawn", rejected: "Rejected", agreed: "Agreed", in_progress: "In Progress", canceled: "Canceled", completed: "Completed" };
const stateColors: Record<string, string> = { proposed: "bg-muted text-muted-foreground", applied: "bg-blue-100 text-blue-800", agreed: "bg-green-100 text-green-800", in_progress: "bg-purple-100 text-purple-800", completed: "bg-emerald-100 text-emerald-800", rejected: "bg-red-100 text-red-800", withdrawn: "bg-muted text-muted-foreground", canceled: "bg-muted text-muted-foreground" };
const MAX_PROJECT_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export default function StudentProject() {
  const [workspace, setWorkspace] = useState(() => getInteractiveStudentWorkspace(DEMO_STUDENT));
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const { studentProjects, supervisors, experts, projectDocuments } = workspace;
  const getSupervisor = (id: string) => supervisors.find((s: any) => s.id === id);
  const getExpert = (id: string) => experts.find((e: any) => e.id === id);
  const getProjectDocuments = (projectId: string) =>
    projectDocuments.filter((document) => document.project_id === projectId);

  useEffect(() => {
    const syncWorkspace = () => setWorkspace(getInteractiveStudentWorkspace(DEMO_STUDENT));
    window.addEventListener(INTERACTIVE_WORKSPACE_EVENT, syncWorkspace);
    window.addEventListener("focus", syncWorkspace);
    return () => {
      window.removeEventListener(INTERACTIVE_WORKSPACE_EVENT, syncWorkspace);
      window.removeEventListener("focus", syncWorkspace);
    };
  }, []);

  const handleProjectFileChange = (projectId: string, file: File | null) => {
    if (!file) return;

    if (file.size > MAX_PROJECT_FILE_SIZE_BYTES) {
      setUploadError("Please choose a file smaller than 5 MB.");
      if (inputRefs.current[projectId]) {
        inputRefs.current[projectId]!.value = "";
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!dataUrl) {
        setUploadError("This file could not be added.");
        return;
      }

      const document: ProjectDocument = {
        id: `project-document-${Date.now()}`,
        project_id: projectId,
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl,
        created_at: new Date().toISOString(),
      };

      addInteractiveProjectDocument(document);
      setUploadError(null);
      setWorkspace(getInteractiveStudentWorkspace(DEMO_STUDENT));
      if (inputRefs.current[projectId]) {
        inputRefs.current[projectId]!.value = "";
      }
    };
    reader.onerror = () => {
      setUploadError("This file could not be added.");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div><h1 className="ds-title-lg tracking-tight">My Thesis Project</h1><p className="ds-body text-muted-foreground mt-1">Manage your projects and track your progress.</p></div>
      {studentProjects.length === 0 ? (
        <Card className="border shadow-none"><CardContent className="pt-6 text-center text-muted-foreground">No projects found. Explore available topics to get started.</CardContent></Card>
      ) : studentProjects.map((project: any) => (
        <Card key={project.id} className="border shadow-none">
          <CardHeader><div className="flex items-start justify-between"><CardTitle className="ds-title-sm">{project.title}</CardTitle><Badge className={`${stateColors[project.state]} border-0`}>{stateLabels[project.state]}</Badge></div></CardHeader>
          <CardContent className="space-y-4">
            {(project.description || project.motivation) && <p className="ds-body text-muted-foreground">{project.description || project.motivation}</p>}
            {project.supervisor_ids?.length > 0 && <div><p className="ds-label mb-2">Supervisors</p><div className="space-y-2">{project.supervisor_ids.map((id: string) => { const sup = getSupervisor(id); return sup ? <div key={id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary"><div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center ds-badge">{sup.first_name[0]}{sup.last_name[0]}</div><div><p className="ds-label">{sup.title} {sup.first_name} {sup.last_name}</p><p className="ds-caption text-muted-foreground">{sup.email}</p></div></div> : null; })}</div></div>}
            {project.expert_ids?.length > 0 && <div><p className="ds-label mb-2">Experts</p><div className="space-y-2">{project.expert_ids.map((id: string) => { const exp = getExpert(id); return exp ? <div key={id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary"><div className="h-8 w-8 rounded-full bg-foreground text-background flex items-center justify-center ds-badge">{exp.first_name[0]}{exp.last_name[0]}</div><div><p className="ds-label">{exp.first_name} {exp.last_name}</p><p className="ds-caption text-muted-foreground">{exp.title}</p></div></div> : null; })}</div></div>}
            <div className="space-y-3 rounded-xl border bg-secondary/30 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="ds-label">Project files</p>
                  <p className="ds-caption text-muted-foreground">Upload briefs, drafts, PDFs, or notes linked to this project.</p>
                </div>
                <div>
                  <Input
                    ref={(node) => {
                      inputRefs.current[project.id] = node;
                    }}
                    id={`project-upload-${project.id}`}
                    type="file"
                    className="hidden"
                    onChange={(event) => handleProjectFileChange(project.id, event.target.files?.[0] || null)}
                  />
                  <label htmlFor={`project-upload-${project.id}`}>
                    <Button type="button" variant="outline" size="sm" asChild>
                      <span>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload file
                      </span>
                    </Button>
                  </label>
                </div>
              </div>

              {uploadError && <p className="ds-caption text-red-600">{uploadError}</p>}

              {getProjectDocuments(project.id).length > 0 ? (
                <div className="space-y-2">
                  {getProjectDocuments(project.id).map((document) => (
                    <div key={document.id} className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2">
                      <a
                        href={document.dataUrl}
                        download={document.name}
                        className="flex min-w-0 items-center gap-2 text-sm text-foreground hover:underline"
                      >
                        <Paperclip className="h-4 w-4 shrink-0" />
                        <span className="truncate">{document.name}</span>
                      </a>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          deleteInteractiveProjectDocument(document.id);
                          setWorkspace(getInteractiveStudentWorkspace(DEMO_STUDENT));
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="ds-caption text-muted-foreground">No files uploaded for this project yet.</p>
              )}
            </div>
            <div className="flex gap-4 ds-caption text-muted-foreground pt-2 border-t"><span>Created {new Date(project.created_at).toLocaleDateString("en-US")}</span><span>Updated {new Date(project.updated_at).toLocaleDateString("en-US")}</span></div>
          </CardContent>
        </Card>
      ))}
    </div>
    
  );
}
