import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, Loader2, KeyRound } from "lucide-react";

export type InstitutionMatch = { id: string; name: string; code_type: "student" | "teacher" } | null;

export type ExpectedCodeType = "student" | "teacher";

interface Props {
  expectedType: ExpectedCodeType;
  value: string;
  onChange: (code: string) => void;
  onMatch: (match: InstitutionMatch) => void;
  label?: string;
  required?: boolean;
}

export default function InstitutionCodeInput({ expectedType, value, onChange, onMatch, label, required }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error" | "wrong-type">("idle");
  const [instName, setInstName] = useState<string>("");

  useEffect(() => {
    const code = value.trim().toUpperCase();
    if (!code) {
      setStatus("idle");
      setInstName("");
      onMatch(null);
      return;
    }
    setStatus("loading");
    const t = setTimeout(async () => {
      const { data, error } = await (supabase as any).rpc("validate_institution_code", { _code: code });
      if (error || !data || data.length === 0) {
        setStatus("error");
        setInstName("");
        onMatch(null);
        return;
      }
      const row = data[0];
      if (row.code_type !== expectedType) {
        setStatus("wrong-type");
        setInstName(row.name);
        onMatch(null);
        return;
      }
      setStatus("ok");
      setInstName(row.name);
      onMatch({ id: row.id, name: row.name, code_type: row.code_type });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, expectedType]);

  return (
    <div className="space-y-2">
      {label && <Label>{label}{required && " *"}</Label>}
      <div className="relative">
        <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-10 pr-10 uppercase tracking-wider"
          placeholder={expectedType === "student" ? "EST-XXXX-XX" : "DOC-XXXX-XX"}
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          required={required}
        />
        <div className="absolute right-3 top-3">
          {status === "loading" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {status === "ok" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          {(status === "error" || status === "wrong-type") && <XCircle className="h-4 w-4 text-destructive" />}
        </div>
      </div>
      {status === "ok" && (
        <p className="text-sm text-green-500">✓ Institución: <strong>{instName}</strong></p>
      )}
      {status === "error" && (
        <p className="text-sm text-destructive">Código no válido. Verifica con tu institución.</p>
      )}
      {status === "wrong-type" && (
        <p className="text-sm text-destructive">
          Este código no corresponde a {expectedType === "student" ? "estudiantes" : "docentes activos"}. Solicita el código correcto a tu institución.
        </p>
      )}
    </div>
  );
}