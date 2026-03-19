import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useDemoAuth } from "@/lib/demoAuth";

type Student = Database["public"]["Tables"]["students"]["Row"];

export default function AuthPage() {
  const { session, login } = useDemoAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    void supabase
      .from("students")
      .select("*")
      .then(({ data, error: fetchError }) => {
        if (!isMounted) return;
        if (fetchError) {
          setError("Unable to load student accounts right now.");
          setLoading(false);
          return;
        }

        setStudents(data || []);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const suggestedEmails = useMemo(
    () => students.slice(0, 6).map((student) => student.email),
    [students],
  );

  if (session) {
    return <Navigate to="/student" replace />;
  }

  const handleLogin = () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Enter an email address.");
      return;
    }

    const matchedStudent = students.find(
      (student) => student.email.trim().toLowerCase() === normalizedEmail,
    );

    if (!matchedStudent) {
      setError("Use one of the student emails from the demo dataset.");
      return;
    }

    login({
      email: normalizedEmail,
      studentId: matchedStudent.id,
    });
  };

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto flex min-h-[80vh] max-w-5xl items-center justify-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <img src="/studyond.svg" alt="Studyond" className="h-10" />
            <div>
              <h1 className="ds-title-lg tracking-tight">Student Demo Login</h1>
              <p className="ds-body mt-2 text-muted-foreground">
                Enter a student email and any code to open an independent session in this window.
              </p>
            </div>

            <Card className="border shadow-none">
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="demo-email">Email</Label>
                  <Input
                    id="demo-email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setError(null);
                    }}
                    placeholder="student@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="demo-code">Code</Label>
                  <Input
                    id="demo-code"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    placeholder="Any code works"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleLogin();
                      }
                    }}
                  />
                </div>

                {error ? <p className="text-sm text-red-600">{error}</p> : null}

                <Button onClick={handleLogin} disabled={loading || !email.trim()}>
                  {loading ? "Loading students..." : "Enter demo"}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="border shadow-none">
            <CardContent className="space-y-4 pt-6">
              <div>
                <p className="ds-label">How to test two students</p>
                <p className="ds-small mt-1 text-muted-foreground">
                  Open a second browser window, log in with another student email, and both sessions will share document requests and other interactive data.
                </p>
              </div>

              <div className="space-y-2">
                <p className="ds-label">Demo student emails</p>
                {loading ? (
                  <p className="ds-small text-muted-foreground">Loading demo accounts...</p>
                ) : (
                  <div className="space-y-2">
                    {suggestedEmails.map((suggestedEmail) => (
                      <button
                        key={suggestedEmail}
                        type="button"
                        className="block w-full rounded-lg border bg-background px-3 py-2 text-left text-sm hover:bg-secondary/30"
                        onClick={() => {
                          setEmail(suggestedEmail);
                          setError(null);
                        }}
                      >
                        {suggestedEmail}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
