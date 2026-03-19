import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { BookOpen, FileSearch, FileText, Search, Quote, Sparkles, Tags, Users } from "lucide-react";
import {
  addInteractiveReceivedSharedDocument,
  addInteractiveSharedDocumentRequest,
  deleteInteractiveProjectDocument,
  deleteInteractiveReceivedSharedDocument,
  deleteInteractiveSharedDocumentRequest,
  getInteractiveSharedDocumentRequests,
  getInteractiveReceivedSharedDocuments,
  getInteractiveProjectDocuments,
  getInteractiveStudentWorkspace,
  INTERACTIVE_WORKSPACE_EVENT,
  replaceInteractiveReceivedSharedDocuments,
  replaceInteractiveSharedDocumentRequests,
  upsertInteractiveSharedDocumentRequest,
} from "@/lib/interactiveMilestones";
import { useDemoAuth } from "@/lib/demoAuth";

const SHARED_DOCUMENT_ALERTS_KEY = "studyond-shared-document-alerts";
const SHARED_DOCUMENT_REQUESTS_SYNC_URL = "/api/demo-shared-document-requests";
const RECEIVED_SHARED_DOCUMENTS_SYNC_URL = "/api/demo-received-shared-documents";

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (size >= 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${size} B`;
}

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase();
}

function tokenizeSearchValue(value: string) {
  return normalizeSearchValue(value)
    .split(/[\s,.;:!?/\\()[\]"-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

function extractDocumentOrdinal(name: string) {
  const match = name.match(/_doc_(\d+)\.pdf$/i);
  return match ? Number(match[1]) : null;
}

function getBaseDocumentTitle(document: { display_title?: string | null; name: string }, projectTitle?: string | null) {
  return document.display_title?.trim() || projectTitle?.trim() || document.name;
}

function withResolvedDisplayTitles<T extends {
  name: string;
  project_id: string;
  display_title?: string | null;
  projectTitle?: string | null;
}>(documents: T[]) {
  const titleCounts = new Map<string, number>();

  documents.forEach((document) => {
    const baseTitle = getBaseDocumentTitle(document, document.projectTitle);
    const key = `${document.project_id}:${baseTitle}`;
    titleCounts.set(key, (titleCounts.get(key) || 0) + 1);
  });

  return documents.map((document) => {
    const baseTitle = getBaseDocumentTitle(document, document.projectTitle);
    const key = `${document.project_id}:${baseTitle}`;
    const duplicateCount = titleCounts.get(key) || 0;
    const ordinal = extractDocumentOrdinal(document.name);

    return {
      ...document,
      displayTitle:
        duplicateCount > 1 && ordinal
          ? `${baseTitle} ${ordinal}`
          : baseTitle,
    };
  });
}

function extractDocumentPreview(dataUrl: string, type?: string | null) {
  const normalizedType = (type || "").toLowerCase();
  const canReadAsText =
    normalizedType.startsWith("text/") ||
    normalizedType.includes("json") ||
    normalizedType.includes("csv") ||
    normalizedType.includes("markdown") ||
    normalizedType.includes("xml");

  if (!canReadAsText || !dataUrl.includes(",")) {
    return "";
  }

  try {
    const [, encodedContent] = dataUrl.split(",", 2);
    const decoded = atob(encodedContent);
    return decoded.replace(/\s+/g, " ").trim().slice(0, 1400);
  } catch {
    return "";
  }
}

function getStoredAlertIds() {
  if (typeof window === "undefined") {
    return new Set<string>();
  }

  try {
    const raw = window.localStorage.getItem(SHARED_DOCUMENT_ALERTS_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set<string>();
  }
}

function storeAlertIds(alertIds: Set<string>) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SHARED_DOCUMENT_ALERTS_KEY, JSON.stringify(Array.from(alertIds)));
}

export default function StudentSharedDocuments() {
  const { session } = useDemoAuth();
  const currentStudentId = session?.studentId;
  const [assistantQuery, setAssistantQuery] = useState("");
  const [requestKeywords, setRequestKeywords] = useState("");
  const [requestSearchParams, setRequestSearchParams] = useState<{
    keywords: string;
  } | null>(null);
  const [activeSearchRequestId, setActiveSearchRequestId] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState(() => getInteractiveStudentWorkspace(currentStudentId));
  const { student, students, projects, peerConnections } = workspace;
  const [allDocuments, setAllDocuments] = useState(() => getInteractiveProjectDocuments());
  const [sharedRequests, setSharedRequests] = useState(() => getInteractiveSharedDocumentRequests());
  const [receivedDocuments, setReceivedDocuments] = useState(() =>
    getInteractiveReceivedSharedDocuments(currentStudentId),
  );
  const [documentMatchesByRequest, setDocumentMatchesByRequest] = useState<Record<string, Array<{
    documentId: string;
    reason: string;
    confidence: "high" | "medium" | "low";
  }>>>({});
  const [isMatchingDocuments, setIsMatchingDocuments] = useState(false);
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);
  const [assistantResult, setAssistantResult] = useState<{
    answer: string;
    ownMatches: Array<{ documentId: string; reason: string }>;
    peerMatches: Array<{ documentId: string; reason: string }>;
    requestMatches: Array<{ requestId: string; reason: string }>;
    webLeads: Array<{ label: string; url: string; source: string }>;
  } | null>(null);

  const syncSharedRequestsFromServer = async () => {
    try {
      const response = await fetch(SHARED_DOCUMENT_REQUESTS_SYNC_URL, {
        method: "GET",
      });
      if (!response.ok) {
        return;
      }

      const payload = await response.json();
      const nextRequests = Array.isArray(payload?.requests) ? payload.requests : [];
      const localSerialized = JSON.stringify(getInteractiveSharedDocumentRequests());
      const remoteSerialized = JSON.stringify(nextRequests);

      if (localSerialized !== remoteSerialized) {
        replaceInteractiveSharedDocumentRequests(nextRequests);
        setSharedRequests(nextRequests);
      }
    } catch {
      return;
    }
  };

  const syncReceivedDocumentsFromServer = async () => {
    try {
      const response = await fetch(RECEIVED_SHARED_DOCUMENTS_SYNC_URL, {
        method: "GET",
      });
      if (!response.ok) {
        return;
      }

      const payload = await response.json();
      const nextDocuments = Array.isArray(payload?.documents) ? payload.documents : [];
      const localSerialized = JSON.stringify(getInteractiveReceivedSharedDocuments());
      const remoteSerialized = JSON.stringify(nextDocuments);

      if (localSerialized !== remoteSerialized) {
        replaceInteractiveReceivedSharedDocuments(nextDocuments);
        setReceivedDocuments(getInteractiveReceivedSharedDocuments(currentStudentId));
      }
    } catch {
      return;
    }
  };

  const persistSharedRequestsToServer = async (requests: ReturnType<typeof getInteractiveSharedDocumentRequests>) => {
    try {
      await fetch(SHARED_DOCUMENT_REQUESTS_SYNC_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requests }),
      });
    } catch {
      return;
    }
  };

  const persistReceivedDocumentsToServer = async (
    documents: ReturnType<typeof getInteractiveReceivedSharedDocuments>,
  ) => {
    try {
      await fetch(RECEIVED_SHARED_DOCUMENTS_SYNC_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ documents }),
      });
    } catch {
      return;
    }
  };

  useEffect(() => {
    const syncWorkspace = () => {
      setWorkspace(getInteractiveStudentWorkspace(currentStudentId));
      setAllDocuments(getInteractiveProjectDocuments());
      setSharedRequests(getInteractiveSharedDocumentRequests());
      setReceivedDocuments(getInteractiveReceivedSharedDocuments(currentStudentId));
    };

    const syncAllSources = () => {
      syncWorkspace();
      void syncSharedRequestsFromServer();
      void syncReceivedDocumentsFromServer();
    };

    syncAllSources();

    window.addEventListener(INTERACTIVE_WORKSPACE_EVENT, syncWorkspace);
    window.addEventListener("storage", syncWorkspace);
    window.addEventListener("focus", syncAllSources);
    const pollId = window.setInterval(() => {
      void syncSharedRequestsFromServer();
      void syncReceivedDocumentsFromServer();
    }, 1500);

    return () => {
      window.removeEventListener(INTERACTIVE_WORKSPACE_EVENT, syncWorkspace);
      window.removeEventListener("storage", syncWorkspace);
      window.removeEventListener("focus", syncAllSources);
      window.clearInterval(pollId);
    };
  }, [currentStudentId]);

  const peerIds = new Set(
    peerConnections.map((connection: any) =>
      connection.student_a_id === student?.id ? connection.student_b_id : connection.student_a_id,
    ),
  );

  const sharedLibraryDocuments = useMemo(() => {
    const documents = allDocuments
      .map((document) => {
        const project = projects.find((item: any) => item.id === document.project_id);
        const owner = students.find((item: any) => item.id === project?.student_id);
        const ownerName = owner ? `${owner.first_name} ${owner.last_name}` : "Unknown student";

        return {
          ...document,
          projectTitle: project?.title || "Untitled project",
          ownerName,
          ownerId: owner?.id || null,
        };
      })
      .filter((document) => document.ownerId && peerIds.has(document.ownerId))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return withResolvedDisplayTitles(documents);
  }, [allDocuments, peerIds, projects, students]);

  const requestDocumentSuggestions = useMemo(() => {
    if (!requestSearchParams) {
      return [];
    }

    const requestTokens = Array.from(
      new Set([
        ...requestSearchParams.keywords
          .split(",")
          .flatMap((item) => tokenizeSearchValue(item)),
      ]),
    );

    if (requestTokens.length === 0) {
      return [];
    }

    const documents = allDocuments
      .map((document) => {
        const project = projects.find((item: any) => item.id === document.project_id);
        const owner = students.find((item: any) => item.id === project?.student_id);
        const ownerName = owner ? `${owner.first_name} ${owner.last_name}` : "Unknown student";
        const visibility =
          owner?.id === student?.id ? "mine" : peerIds.has(owner?.id) ? "peer" : "student";
        const searchableText = normalizeSearchValue(
          [
            document.name,
            project?.title || "",
            ownerName,
            document.type,
          ].join(" "),
        );
        const matchedTokens = requestTokens.filter((token) => searchableText.includes(token));

        return {
          ...document,
          ownerName,
          projectTitle: project?.title || "Untitled project",
          ownerId: owner?.id || null,
          visibility,
          matchScore: matchedTokens.length,
          matchedTokens,
        };
      })
      .filter((document) => document.matchScore > 0 && document.ownerId !== student?.id)
      .sort((a, b) => {
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;

        const visibilityOrder = { peer: 0, student: 1, mine: 2 };
        const visibilityDiff = visibilityOrder[a.visibility] - visibilityOrder[b.visibility];
        if (visibilityDiff !== 0) return visibilityDiff;

        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
      .slice(0, 6);

    return withResolvedDisplayTitles(documents);
  }, [
    allDocuments,
    peerIds,
    projects,
    requestSearchParams,
    student?.id,
    students,
  ]);

  useEffect(() => {
    if (!requestSearchParams) return;

    if (requestKeywords !== requestSearchParams.keywords) {
      setRequestSearchParams(null);
      setActiveSearchRequestId(null);
    }
  }, [requestKeywords, requestSearchParams]);

  const documentRequests = useMemo(() => {
    return sharedRequests
      .map((request) => {
        const owner = students.find((item: any) => item.id === request.student_id);
        const ownerName = owner ? `${owner.first_name} ${owner.last_name}` : "Unknown student";
        const visibility =
          request.student_id === student?.id ? "mine" : peerIds.has(request.student_id) ? "peer" : "student";

        return {
          ...request,
          ownerName,
          visibility,
        };
      })
      .sort((a, b) => {
        const visibilityOrder = { peer: 0, student: 1, mine: 2 };
        const visibilityDiff = visibilityOrder[a.visibility] - visibilityOrder[b.visibility];
        if (visibilityDiff !== 0) return visibilityDiff;

        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [peerIds, sharedRequests, student?.id, students]);

  const currentStudentDocuments = useMemo(() => {
    const documents = allDocuments
      .filter((document) => {
        const project = projects.find((item: any) => item.id === document.project_id);
        return project?.student_id === student?.id;
      })
      .map((document) => {
        const project = projects.find((item: any) => item.id === document.project_id);
        return {
          ...document,
          projectTitle: project?.title || "Untitled project",
          textPreview: extractDocumentPreview(document.dataUrl, document.type),
        };
      });

    return withResolvedDisplayTitles(documents);
  }, [allDocuments, projects, student?.id]);

  const receivedStudentDocuments = useMemo(() => {
    return withResolvedDisplayTitles(
      receivedDocuments.map((document) => ({
        ...document,
        projectTitle: document.project_title,
      })),
    );
  }, [receivedDocuments]);

  const myDocuments = useMemo(() => {
    return [
      ...receivedStudentDocuments.map((document) => ({
        ...document,
        ownerLabel: document.owner_name,
        origin: "received" as const,
        badgeLabel: "Shared with me",
        badgeClassName: "bg-blue-100 text-blue-800",
        dateLabel: document.granted_at,
      })),
      ...currentStudentDocuments.map((document) => ({
        ...document,
        ownerLabel: student ? `${student.first_name} ${student.last_name}` : "My document",
        origin: "mine" as const,
        badgeLabel: "My doc",
        badgeClassName: "bg-emerald-100 text-emerald-800",
        dateLabel: document.created_at,
      })),
    ].sort(
      (left, right) =>
        new Date(right.dateLabel).getTime() - new Date(left.dateLabel).getTime(),
    );
  }, [currentStudentDocuments, receivedStudentDocuments, student]);

  const peerDocuments = useMemo(() => {
    const documents = allDocuments
      .filter((document) => {
        const project = projects.find((item: any) => item.id === document.project_id);
        return project?.student_id && project.student_id !== student?.id;
      })
      .map((document) => {
        const project = projects.find((item: any) => item.id === document.project_id);
        const owner = students.find((item: any) => item.id === project?.student_id);
        return {
          ...document,
          ownerName: owner ? `${owner.first_name} ${owner.last_name}` : "Unknown student",
          projectTitle: project?.title || "Untitled project",
          textPreview: extractDocumentPreview(document.dataUrl, document.type),
        };
      });

    return withResolvedDisplayTitles(documents);
  }, [allDocuments, projects, student?.id, students]);

  const explicitlyRequestedDocumentsByRequestId = useMemo(() => {
    return documentRequests.reduce<Record<string, Array<{
      documentId: string;
      reason: string;
      confidence: "high";
    }>>>((accumulator, request) => {
      const explicitMatches = (request.matched_documents || [])
        .filter((item) => currentStudentDocuments.some((document) => document.id === item.document_id))
        .map((item) => ({
          documentId: item.document_id,
          reason: `This document was explicitly selected in the request by ${request.ownerName}.`,
          confidence: "high" as const,
        }));

      if (explicitMatches.length > 0) {
        accumulator[request.id] = explicitMatches;
      }

      return accumulator;
    }, {});
  }, [currentStudentDocuments, documentRequests]);

  const targetedDocumentRequests = useMemo(() => {
    return documentRequests.filter(
      (request) =>
        request.student_id !== student?.id &&
        (explicitlyRequestedDocumentsByRequestId[request.id]?.length || 0) > 0,
    );
  }, [documentRequests, explicitlyRequestedDocumentsByRequestId, student?.id]);

  const handleSearchRequestDocuments = () => {
    if (!student?.id || !requestKeywords.trim()) return;

    const requestId = activeSearchRequestId || `shared-doc-request-${Date.now()}`;
    const existingRequest = sharedRequests.find((item) => item.id === requestId);
    const nextRequest = {
      id: requestId,
      student_id: student.id,
      title: requestKeywords.trim(),
      theme: null,
      keywords: requestKeywords
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      description: null,
      created_at: existingRequest?.created_at || new Date().toISOString(),
      matched_documents: existingRequest?.matched_documents || [],
    };

    if (existingRequest) {
      upsertInteractiveSharedDocumentRequest(nextRequest);
    } else {
      addInteractiveSharedDocumentRequest(nextRequest);
    }

    setRequestSearchParams({
      keywords: requestKeywords,
    });
    setActiveSearchRequestId(requestId);
    const nextRequests = getInteractiveSharedDocumentRequests();
    setSharedRequests(nextRequests);
    void persistSharedRequestsToServer(nextRequests);
  };

  const handleSelectSuggestedDocument = (document: (typeof requestDocumentSuggestions)[number]) => {
    if (!student?.id || !requestSearchParams) return;

    const requestId = activeSearchRequestId || `shared-doc-request-${Date.now()}`;
    const existingRequest = sharedRequests.find((item) => item.id === requestId);
    const nextMatchedDocuments = existingRequest?.matched_documents || [];
    if (nextMatchedDocuments.some((item) => item.document_id === document.id)) {
      return;
    }

    const nextRequest = {
      id: requestId,
      student_id: student.id,
      title: requestSearchParams.keywords.trim(),
      theme: null,
      keywords: requestSearchParams.keywords
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      description: null,
      created_at: existingRequest?.created_at || new Date().toISOString(),
      matched_documents: [
        ...nextMatchedDocuments,
        {
          document_id: document.id,
          owner_name: document.ownerName,
          project_title: document.projectTitle,
        },
      ],
    };

    if (existingRequest) {
      upsertInteractiveSharedDocumentRequest(nextRequest);
    } else {
      addInteractiveSharedDocumentRequest(nextRequest);
    }

    setActiveSearchRequestId(requestId);
    const nextRequests = getInteractiveSharedDocumentRequests();
    setSharedRequests(nextRequests);
    void persistSharedRequestsToServer(nextRequests);
  };

  const handleDeleteRequest = (requestId: string) => {
    deleteInteractiveSharedDocumentRequest(requestId);
    if (activeSearchRequestId === requestId) {
      setActiveSearchRequestId(null);
    }
    const nextRequests = getInteractiveSharedDocumentRequests();
    setSharedRequests(nextRequests);
    void persistSharedRequestsToServer(nextRequests);
  };

  const handleDeclineRequest = (requestId: string) => {
    deleteInteractiveSharedDocumentRequest(requestId);
    const nextRequests = getInteractiveSharedDocumentRequests();
    setSharedRequests(nextRequests);
    void persistSharedRequestsToServer(nextRequests);
    toast("Request declined", {
      description: "The request was removed from the shared list.",
    });
  };

  const handleAcceptRequestDocument = (
    request: (typeof documentRequests)[number],
    document: (typeof currentStudentDocuments)[number],
  ) => {
    if (!student?.id) return;

    addInteractiveReceivedSharedDocument({
      id: `received-doc-${request.id}-${document.id}`,
      request_id: request.id,
      recipient_student_id: request.student_id,
      source_document_id: document.id,
      source_owner_student_id: student.id,
      owner_name: student ? `${student.first_name} ${student.last_name}` : "Unknown student",
      project_title: document.projectTitle,
      name: document.name,
      display_title: document.displayTitle,
      type: document.type,
      size: document.size,
      dataUrl: document.dataUrl,
      created_at: document.created_at,
      granted_at: new Date().toISOString(),
    });

    const nextReceivedDocuments = getInteractiveReceivedSharedDocuments();
    setReceivedDocuments(getInteractiveReceivedSharedDocuments(currentStudentId));
    void persistReceivedDocumentsToServer(nextReceivedDocuments);

    deleteInteractiveSharedDocumentRequest(request.id);
    const nextRequests = getInteractiveSharedDocumentRequests();
    setSharedRequests(nextRequests);
    void persistSharedRequestsToServer(nextRequests);

    toast("Document shared", {
      description: `"${document.displayTitle}" is now available to ${request.ownerName}.`,
    });
  };

  const handleDeleteMyDocument = (document: (typeof myDocuments)[number]) => {
    if (document.origin === "received") {
      deleteInteractiveReceivedSharedDocument(document.id);
      const nextReceivedDocuments = getInteractiveReceivedSharedDocuments();
      setReceivedDocuments(getInteractiveReceivedSharedDocuments(currentStudentId));
      void persistReceivedDocumentsToServer(nextReceivedDocuments);
    } else {
      deleteInteractiveProjectDocument(document.id);
      setAllDocuments(getInteractiveProjectDocuments());
      setWorkspace(getInteractiveStudentWorkspace(currentStudentId));
    }

    toast("Document removed", {
      description: `"${document.displayTitle}" was removed from My documents.`,
    });
  };

  const selectedDocumentIdsForActiveRequest = new Set(
    (sharedRequests.find((item) => item.id === activeSearchRequestId)?.matched_documents || []).map(
      (item) => item.document_id,
    ),
  );

  const runDocumentMatching = async (notifyOnNewMatches = false) => {
    if (currentStudentDocuments.length === 0) {
      setDocumentMatchesByRequest(explicitlyRequestedDocumentsByRequestId);
      return;
    }

    try {
      setIsMatchingDocuments(false);
      setDocumentMatchesByRequest(explicitlyRequestedDocumentsByRequestId);
    } catch {
      setDocumentMatchesByRequest(explicitlyRequestedDocumentsByRequestId);
    } finally {
      setIsMatchingDocuments(false);
    }
  };

  const handleFindDocumentMatches = async () => {
    await runDocumentMatching(false);
  };

  useEffect(() => {
    if (currentStudentDocuments.length === 0) return;
    if (targetedDocumentRequests.length === 0) {
      setDocumentMatchesByRequest({});
      return;
    }

    void runDocumentMatching(true);
  }, [currentStudentDocuments, explicitlyRequestedDocumentsByRequestId, targetedDocumentRequests]);

  const handleAssistantSearch = async () => {
    const normalizedQuery = assistantQuery.trim();
    if (!normalizedQuery) return;

    try {
      setIsAssistantLoading(true);
      const response = await fetch("/api/document-discovery-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: normalizedQuery,
          ownDocuments: currentStudentDocuments.map((document) => ({
            id: document.id,
            name: document.displayTitle,
            type: document.type,
            ownerName: student ? `${student.first_name} ${student.last_name}` : "You",
            ownerType: "self",
            projectTitle: document.projectTitle,
            textPreview: document.textPreview || document.displayTitle,
          })),
          peerDocuments: peerDocuments.map((document) => ({
            id: document.id,
            name: document.displayTitle,
            type: document.type,
            ownerName: document.ownerName,
            ownerType: "peer",
            projectTitle: document.projectTitle,
            textPreview: document.textPreview || document.displayTitle,
          })),
          requests: documentRequests.map((request) => ({
            id: request.id,
            title: request.title,
            theme: request.theme,
            keywords: request.keywords,
            description: request.description,
            ownerName: request.ownerName,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Document discovery assistant failed with status ${response.status}`);
      }

      const data = (await response.json()) as {
        answer?: string;
        ownMatches?: Array<{ documentId?: string; reason?: string }>;
        peerMatches?: Array<{ documentId?: string; reason?: string }>;
        requestMatches?: Array<{ requestId?: string; reason?: string }>;
        webLeads?: Array<{ label?: string; url?: string; source?: string }>;
      };

      setAssistantResult({
        answer: data.answer?.trim() || "I found a few places to look based on your question.",
        ownMatches: Array.isArray(data.ownMatches)
          ? data.ownMatches.filter((item): item is { documentId: string; reason: string } => Boolean(item.documentId && item.reason))
          : [],
        peerMatches: Array.isArray(data.peerMatches)
          ? data.peerMatches.filter((item): item is { documentId: string; reason: string } => Boolean(item.documentId && item.reason))
          : [],
        requestMatches: Array.isArray(data.requestMatches)
          ? data.requestMatches.filter((item): item is { requestId: string; reason: string } => Boolean(item.requestId && item.reason))
          : [],
        webLeads: Array.isArray(data.webLeads)
          ? data.webLeads
              .filter((item): item is { label: string; url: string; source: string } => Boolean(item.label && item.url && item.source))
          : [],
      });
    } catch {
      setAssistantResult({
        answer: "I could not complete the AI search right now. Try a more specific query with a theme, keyword, or document type.",
        ownMatches: [],
        peerMatches: [],
        requestMatches: [],
        webLeads: [],
      });
    } finally {
      setIsAssistantLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="ds-title-lg tracking-tight">Shared Documents</h1>
          <p className="ds-body text-muted-foreground mt-1">
            Explore documents shared across student projects to find inspiration, structure, and useful examples.
          </p>
        </div>

        <Button asChild variant="outline">
          <Link to="/student/project">Share from My Project</Link>
        </Button>
      </div>

      <Card className="border border-ai/30 shadow-none">
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="ds-title-cards">Shared library</p>
              <p className="ds-small text-muted-foreground mt-1">
                Documents from students you are connected with as peers.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="ds-badge">
              <Users className="mr-1 h-3.5 w-3.5" />
              {sharedLibraryDocuments.length} peer docs
            </Badge>
          </div>

          {sharedLibraryDocuments.length === 0 ? (
            <p className="ds-body text-muted-foreground">
              No peer documents available yet. Accept a peer request or become peers first.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sharedLibraryDocuments.map((document) => (
                <Card
                  key={`shared-library-${document.id}`}
                  className="border shadow-none transition-shadow duration-300 hover:shadow-md"
                >
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="ds-label truncate">{document.displayTitle}</p>
                        <p className="ds-caption mt-1 text-muted-foreground">
                          {document.ownerName}
                        </p>
                      </div>
                      <Badge className="border-0 bg-blue-100 text-blue-800">
                        Peer doc
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="ds-badge">
                        <BookOpen className="mr-1 h-3.5 w-3.5" />
                        {document.projectTitle}
                      </Badge>
                      <Badge variant="secondary" className="ds-badge">
                        {formatFileSize(document.size)}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <p className="ds-caption text-muted-foreground">
                        {new Date(document.created_at).toLocaleDateString("en-US")}
                      </p>
                      <a
                        href={document.dataUrl}
                        download={document.name}
                        className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:underline"
                      >
                        <FileText className="h-4 w-4" />
                        Open document
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border border-ai/30 bg-ai/5 shadow-none">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-ai p-2">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="ds-title-cards text-ai">AI Document Search</h2>
              <p className="ds-small text-muted-foreground mt-1">
                Ask for help finding relevant material in your own files, in peer documents, and through web search leads.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ai-solid" />
              <Input
                value={assistantQuery}
                onChange={(event) => setAssistantQuery(event.target.value)}
                placeholder="Search a thesis example, template, review structure, dataset, or method..."
                className="h-12 border-ai bg-background pl-10 pr-32"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleAssistantSearch();
                  }
                }}
              />
              <Button
                onClick={handleAssistantSearch}
                disabled={!assistantQuery.trim() || isAssistantLoading}
                className="absolute right-1.5 top-1/2 h-9 -translate-y-1/2 bg-ai hover:opacity-90"
              >
                {isAssistantLoading ? "Searching..." : "AI Search"}
              </Button>
            </div>

          </div>

          {assistantResult && (
            <div className="space-y-4 rounded-xl border border-ai/20 bg-background p-4">
              <p className="ds-body text-foreground">{assistantResult.answer}</p>

              {assistantResult.webLeads.length > 0 && (
                <div className="space-y-2">
                  <p className="ds-label text-ai">Web search leads</p>
                  {assistantResult.webLeads.map((lead, index) => (
                    <div key={`lead-${index}`} className="rounded-lg border border-ai/15 bg-ai/5 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="ds-label">{lead.label}</p>
                          <p className="ds-caption mt-1 text-muted-foreground">{lead.source}</p>
                        </div>
                        <a
                          href={lead.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-medium text-ai-solid hover:underline"
                        >
                          Open site
                        </a>
                      </div>
                      <p className="ds-caption mt-2 text-muted-foreground">{lead.url}</p>
                    </div>
                  ))}
                </div>
              )}

              {assistantResult.webLeads.length === 0 ? (
                <p className="ds-small text-muted-foreground">
                  No public web lead found yet. Try a more specific query.
                </p>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <Card className="border shadow-none">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-secondary p-2">
                <Quote className="h-4 w-4 text-foreground" />
              </div>
              <div>
                <h2 className="ds-title-cards">Ask for a document</h2>
                <p className="ds-small text-muted-foreground mt-1">
                  Search for relevant peer documents, then add the ones you want into your request list.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="ds-label">Keywords</label>
              <Input
                value={requestKeywords}
                onChange={(event) => setRequestKeywords(event.target.value)}
                placeholder="Comma separated keywords"
              />
              <p className="ds-small text-muted-foreground">
                Suggested documents are based only on these keywords.
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSearchRequestDocuments} disabled={!requestKeywords.trim()}>
                Search
              </Button>
            </div>

            {requestDocumentSuggestions.length > 0 ? (
              <div className="space-y-3 rounded-xl border bg-secondary/20 p-4">
                <div>
                  <p className="ds-label">Suggested documents</p>
                  <p className="ds-small text-muted-foreground mt-1">
                    Based on the keywords in your request.
                  </p>
                </div>

                <div className="space-y-3">
                  {requestDocumentSuggestions.map((document) => (
                    <div
                      key={`request-suggestion-${document.id}`}
                      className="rounded-lg border bg-background p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="ds-label truncate">{document.displayTitle}</p>
                          <p className="ds-caption mt-1 text-muted-foreground">
                            {document.ownerName}
                          </p>
                        </div>
                        <Badge
                          className={`border-0 ${
                            document.visibility === "peer"
                              ? "bg-blue-100 text-blue-800"
                              : document.visibility === "mine"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-secondary text-foreground"
                          }`}
                        >
                          {document.visibility === "peer"
                            ? "Peer"
                            : document.visibility === "mine"
                              ? "My doc"
                              : "Student"}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {document.matchedTokens.slice(0, 4).map((token) => (
                          <Badge key={`${document.id}-${token}`} variant="secondary" className="ds-badge">
                            {token}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <p className="ds-caption text-muted-foreground">
                          {formatFileSize(document.size)}
                        </p>
                        <Button
                          type="button"
                          variant={selectedDocumentIdsForActiveRequest.has(document.id) ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => handleSelectSuggestedDocument(document)}
                          disabled={selectedDocumentIdsForActiveRequest.has(document.id)}
                        >
                          <FileText className="h-4 w-4" />
                          {selectedDocumentIdsForActiveRequest.has(document.id) ? "Added" : "Select"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border shadow-none">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-secondary p-2">
                <Tags className="h-4 w-4 text-foreground" />
              </div>
              <div>
                <h2 className="ds-title-cards">Students looking for documents</h2>
                <p className="ds-small text-muted-foreground mt-1">
                  These requests help students signal exactly what kind of document they need.
                </p>
              </div>
            </div>

            {documentRequests.length === 0 ? (
              <p className="ds-body text-muted-foreground">
                No document requests yet.
              </p>
            ) : (
              <div className="space-y-3">
                {documentRequests.map((request) => (
                  <div key={request.id} className="rounded-xl border bg-background p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="ds-label">{request.title}</p>
                        <p className="ds-caption mt-1 text-muted-foreground">
                          Posted by {request.ownerName}
                        </p>
                      </div>
                      <Badge
                        className={`border-0 ${
                          request.visibility === "peer"
                            ? "bg-blue-100 text-blue-800"
                            : request.visibility === "mine"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-secondary text-foreground"
                        }`}
                      >
                        {request.visibility === "peer"
                          ? "Peer request"
                          : request.visibility === "mine"
                            ? "My request"
                            : "Student request"}
                      </Badge>
                    </div>

                    {request.visibility === "mine" ? (
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRequest(request.id)}
                        >
                          Remove request
                        </Button>
                      </div>
                    ) : null}

                    {request.theme && (
                      <p className="ds-small text-muted-foreground">
                        Theme: <span className="text-foreground">{request.theme}</span>
                      </p>
                    )}

                    {request.description && (
                      <p className="ds-body text-muted-foreground">{request.description}</p>
                    )}

                    {request.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {request.keywords.map((keyword) => (
                          <Badge key={`${request.id}-${keyword}`} variant="secondary" className="ds-badge">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {request.matched_documents && request.matched_documents.length > 0 ? (
                      <div className="space-y-2">
                        <p className="ds-small text-muted-foreground">Selected documents</p>
                        {request.matched_documents.map((document) => (
                          <div
                            key={`${request.id}-${document.document_id}`}
                            className="rounded-lg border bg-secondary/20 p-3"
                          >
                            <p className="ds-label">{document.project_title}</p>
                            <p className="ds-caption mt-1 text-muted-foreground">
                              {document.owner_name}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border shadow-none">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-secondary p-2">
              <FileSearch className="h-4 w-4 text-foreground" />
            </div>
            <div className="flex items-start gap-3">
              <div>
                <h2 className="ds-title-cards">Documents you could share</h2>
                <p className="ds-small text-muted-foreground mt-1">
                  Help your peers finding documents.
                </p>
              </div>
            </div>
          </div>

          {currentStudentDocuments.length === 0 ? (
            <p className="ds-body text-muted-foreground">
              Upload project files first in <Link to="/student/project" className="underline">My Project</Link> to get AI sharing suggestions.
            </p>
          ) : targetedDocumentRequests.length === 0 ? (
            <p className="ds-body text-muted-foreground">
              No document requests are targeting your files yet.
            </p>
          ) : (
            <div className="space-y-4">
              {targetedDocumentRequests.map((request) => {
                  const matches = documentMatchesByRequest[request.id] || [];

                  return (
                    <div key={`share-match-${request.id}`} className="rounded-xl border bg-background p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="ds-label">{request.title}</p>
                          <p className="ds-caption mt-1 text-muted-foreground">
                            Requested by {request.ownerName}
                          </p>
                        </div>
                        <Badge variant="secondary" className="ds-badge">
                          {matches.length} suggested docs
                        </Badge>
                      </div>

                      {request.theme && (
                        <p className="ds-small text-muted-foreground">
                          Theme: <span className="text-foreground">{request.theme}</span>
                        </p>
                      )}

                      {matches.length === 0 ? (
                        <p className="ds-body text-muted-foreground">
                          {isMatchingDocuments
                            ? "Claude is checking your files against this request..."
                            : "No strong document match found yet from your current files."}
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {matches.map((match) => {
                            const document = currentStudentDocuments.find((item) => item.id === match.documentId);
                            if (!document) return null;

                            return (
                              <div key={`${request.id}-${match.documentId}`} className="rounded-lg border bg-secondary/20 p-3 space-y-2">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="ds-label">{document.displayTitle}</p>
                                    <p className="ds-caption mt-1 text-muted-foreground">
                                      {document.projectTitle}
                                    </p>
                                  </div>
                                  <Badge
                                    className={`border-0 ${
                                      match.confidence === "high"
                                        ? "bg-emerald-100 text-emerald-800"
                                        : match.confidence === "low"
                                          ? "bg-amber-100 text-amber-800"
                                          : "bg-blue-100 text-blue-800"
                                    }`}
                                  >
                                    {match.confidence} confidence
                                  </Badge>
                                </div>
                                <p className="ds-body text-muted-foreground">{match.reason}</p>
                                <div className="flex flex-wrap items-center gap-2">
                                  <a
                                    href={document.dataUrl}
                                    download={document.name}
                                    className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:underline"
                                  >
                                    <FileText className="h-4 w-4" />
                                    Open my document
                                  </a>
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => handleAcceptRequestDocument(request, document)}
                                  >
                                    Accept
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeclineRequest(request.id)}
                        >
                          Decline request
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {myDocuments.length === 0 ? (
        <Card className="border shadow-none">
          <CardContent className="pt-6 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="ds-body text-muted-foreground">
              No documents available yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div>
            <h2 className="ds-title-sm tracking-tight">My documents</h2>
            <p className="ds-body text-muted-foreground mt-1">
              Documents attached to your own projects.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {myDocuments.map((document) => (
            <Card
              key={`${document.origin}-${document.id}`}
              className="border shadow-none transition-shadow duration-300 hover:shadow-md"
            >
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="ds-label truncate">{document.displayTitle}</p>
                    <p className="ds-caption mt-1 text-muted-foreground">
                      {document.ownerLabel}
                    </p>
                  </div>
                  <Badge className={`border-0 ${document.badgeClassName}`}>
                    {document.badgeLabel}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="ds-badge">
                    {document.type || "Unknown type"}
                  </Badge>
                  <Badge variant="secondary" className="ds-badge">
                    {formatFileSize(document.size)}
                  </Badge>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <p className="ds-caption text-muted-foreground">
                    {new Date(document.dateLabel).toLocaleDateString("en-US")}
                  </p>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteMyDocument(document)}
                    >
                      Remove
                    </Button>
                    <a
                      href={document.dataUrl}
                      download={document.name}
                      className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:underline"
                    >
                      <FileText className="h-4 w-4" />
                      Open document
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
