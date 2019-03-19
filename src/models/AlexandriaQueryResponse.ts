export interface AlexandriaDocument {
  confidence: number;
  filename: string;
  uuid: string;
  docpart_id: number;
  meta: { title: string; description: string };
  content: string;
}
export interface AlexandriaCategory {
  category: { description: string; documents: AlexandriaDocument[] };
}
export default interface AlexandriaQueryResponse {
  type: string;
  query: string;
  sessionId: string;
  results: AlexandriaCategory[];
}
