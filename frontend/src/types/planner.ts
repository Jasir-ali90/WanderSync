/** Shared planner message types. */
export interface PlannerMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  meta: Record<string, unknown>;
}

export interface Conversation {
  id: string;
  title: string;
}
