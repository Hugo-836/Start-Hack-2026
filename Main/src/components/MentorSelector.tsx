import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMentorSelection } from "@/contexts/MentorSelectionContext";
import { getMentorOptions } from "@/lib/mentorProfiles";

export function MentorSelector() {
  const { selectedSupervisorId, setSelectedSupervisorId } = useMentorSelection();
  const mentorOptions = getMentorOptions();

  return (
    <div className="flex items-center gap-3">
      <p className="ds-caption text-muted-foreground whitespace-nowrap">Active mentor</p>
      <Select value={selectedSupervisorId} onValueChange={setSelectedSupervisorId}>
        <SelectTrigger className="w-[250px] bg-background">
          <SelectValue placeholder="Choose a mentor" />
        </SelectTrigger>
        <SelectContent>
          {mentorOptions.map((mentor) => (
            <SelectItem key={mentor.supervisorId} value={mentor.supervisorId}>
              {mentor.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
