import { map, sortBy, flatMap } from 'lodash';
import turndown from 'turndown';
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
  sessionid: string;
  results: AlexandriaCategory[];
}

export function getDocuments(
  response: AlexandriaQueryResponse,
): {
  title: string;
  description: string;
  confidence: number;
  category: string;
  uuid: string;
  sessionid: string;
  query: string;
}[] {
  const td = new turndown();
  return sortBy(
    flatMap(response.results, (category: AlexandriaCategory) => {
      return map(
        category.category.documents,
        (document: AlexandriaDocument) => ({
          title: document.meta.title,
          description: td.turndown(document.meta.description),
          confidence: document.confidence,
          category: category.category.description,
          uuid: document.uuid,
          sessionid: response.sessionid,
          query: response.query,
        }),
      );
    }),
    'confidence',
  );
}
