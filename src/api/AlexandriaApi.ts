import nodeFetch from 'node-fetch';
import download from 'download';
import AlexandriaQueryResponse from '../models/AlexandriaQueryResponse';

export default class AlexandriaApi {
  token: { value: string; date: any };
  baseUrl: string;
  constructor() {
    this.baseUrl = 'https://digipolis-poc.alexandria.works/v0.1';
  }

  public async query(question: string): Promise<AlexandriaQueryResponse> {
    const data = await nodeFetch(`${this.baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'AW-API-KEY': `${this.getCredentials()}`,
      },
      body: JSON.stringify({
        query: question,
        type: 'query',
      }),
    })
      .then(res => res.json())
      .then(json => <AlexandriaQueryResponse>json)
      .catch(err => {
        throw err;
      });
    return data;
  }

  private getCredentials(): string {
    const key = process.env.AW_API_KEY;
    if (!key) {
      throw 'No Alexandria Works credentials provided in env';
    }
    return key;
  }

  public async downloadFile(uuid: string) {
    const uri = `${this.baseUrl}/documents/${uuid}`;
    const resp = await nodeFetch(uri, {
      headers: {
        'AW-API-KEY': `${this.getCredentials()}`,
      },
    });
    const documentDetailsBody = await resp.json();
    const dlUri = `${this.baseUrl}${documentDetailsBody.file.uri}`;
    console.log(dlUri);
    const { headers } = await nodeFetch(dlUri, {
      headers: {
        'AW-API-KEY': `${this.getCredentials()}`,
      },
    });
    console.log(headers);
    const contentDisposition = headers.get('content-disposition');
    const attachment = contentDisposition.split('; ');
    const filename = attachment[1].split('=')[1];
    const trimmedFileName = filename.trim();
    console.log(trimmedFileName);
    const contentType = headers.get('content-type');

    const dlOptions: download.DownloadOptions = {
      filename: trimmedFileName,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'AW-API-KEY': `${this.getCredentials()}`,
      },
    };
    return {
      contentType: contentType.split(';')[0],
      buffer: await download(dlUri, './downloads', dlOptions),
      filename: trimmedFileName,
    };
  }
}
