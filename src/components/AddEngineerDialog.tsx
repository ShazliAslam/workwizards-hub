import { useState } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const REGIONS = ["North", "South", "Midlands", "Scotland", "Wales"];

const schema = z.object({
  name: z.string().trim().min(2, "Enter the engineer's full name").max(80),
  email: z.string().trim().email("Enter a valid work email").max(160),
  region: z.string().trim().min(1, "Pick a region"),
  hourlyRate: z.number().positive("Rate must be greater than 0").max(500),
  sheetId: z.string().trim().max(300).optional(),
});

export function AddEngineerDialog() {
  const { addEngineer } = useSession();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [region, setRegion] = useState(REGIONS[0]!);
  const [rate, setRate] = useState("32");
  const [sheetId, setSheetId] = useState("");

  const reset = () => {
    setName("");
    setEmail("");
    setRegion(REGIONS[0]!);
    setRate("32");
    setSheetId("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2 bg-brand text-white hover:bg-brand-deep">
          <UserPlus className="h-4 w-4" /> Add Engineer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a field engineer</DialogTitle>
          <DialogDescription>
            New engineers appear across the payroll and claims views immediately. Link their
            Google Sheet to sync shift and expense records both ways.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="eng-name">Full name</Label>
            <Input id="eng-name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder="Priya Sharma" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="eng-email">Work email</Label>
            <Input id="eng-email" type="email" value={email} maxLength={160} onChange={(e) => setEmail(e.target.value)} placeholder="priya.sharma@weactive9.com" />
          </div>
          <div className="space-y-1.5">
            <Label>Region</Label>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REGIONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="eng-rate">Hourly rate (£)</Label>
            <Input id="eng-rate" type="number" min="1" step="0.5" value={rate} onChange={(e) => setRate(e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="eng-sheet">Google Sheet ID / URL</Label>
            <Input
              id="eng-sheet"
              value={sheetId}
              maxLength={300}
              onChange={(e) => setSheetId(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/…"
            />
            <p className="text-xs text-muted-foreground">
              Optional. Used to sync this engineer's own shift and expense tabs.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            className="bg-brand text-white hover:bg-brand-deep"
            onClick={() => {
              const parsed = schema.safeParse({
                name,
                email,
                region,
                hourlyRate: Number(rate),
                sheetId: sheetId || undefined,
              });
              if (!parsed.success) {
                toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
                return;
              }
              const created = addEngineer(parsed.data);
              toast.success(`${created.name} added`, {
                description: `${created.region} region · £${created.hourlyRate}/hour`,
              });
              setOpen(false);
              reset();
            }}
          >
            Add engineer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
