export type CompletionType = "word" | "sentence";

export interface CompletionResponse {
  completions: string[];
  completion_type: CompletionType;
  text: string;
}

export interface CompletionRequest {
  text: string;
  completion: string;
}
