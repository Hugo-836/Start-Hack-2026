import { useEffect, useState } from "react";
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
      setError("No student account found for this email.");
      return;
    }

    login({
      email: normalizedEmail,
      studentId: matchedStudent.id,
    });
  };

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto flex min-h-[80vh] max-w-xl items-center justify-center">
        <div className="w-full space-y-6">
          <img src="/studyond.svg" alt="Studyond" className="h-10" />
          <div>
            <h1 className="ds-title-lg tracking-tight">Sign in</h1>
            <p className="ds-body mt-2 text-muted-foreground">
              Access your Studyond workspace with your student email and password.
            </p>
          </div>

          <Card className="border shadow-none">
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="student-email">Email</Label>
                <Input
                  id="student-email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError(null);
                  }}
                  placeholder="name@university.edu"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="student-password">Password</Label>
                <Input
                  id="student-password"
                  type="password"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="Enter your password"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleLogin();
                    }
                  }}
                />
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <Button onClick={handleLogin} disabled={loading || !email.trim()} className="w-full">
                {loading ? "Loading account access..." : "Sign in"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
