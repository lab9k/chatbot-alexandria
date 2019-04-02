import nodeFetch from 'node-fetch';
import * as download from 'download';
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

  public async downloadFile(resourceUri: string) {
    const headers = await nodeFetch(resourceUri, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'AW-API-KEY': `${this.getCredentials()}`,
      },
    }).then(res => res.headers);

    const contentDisposition = headers.get('content-disposition');
    const attachment = contentDisposition.split('; ');
    const filename = attachment[1].split(' = ')[1];
    const trimmedFileName = filename.substring(1, filename.length - 1);
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
      buffer: await download(resourceUri, './downloads', dlOptions),
      filename: trimmedFileName,
    };
  }
}
