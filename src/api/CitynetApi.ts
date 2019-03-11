import axios from 'axios';
import nodeFetch from 'node-fetch';
import { stringify } from 'querystring';
import * as moment from 'moment';
import QueryResponse from '../models/QueryResponse';
import * as download from 'download';

export default class CitynetApi {
  token: { value: string; date: any };
  baseUrl: string;
  constructor() {
    this.baseUrl = 'https://api.cloud.nalantis.com/api';
    this.login();
  }

  public async query(question: string): Promise<QueryResponse> {
    await this.login();

    return axios
      .request<QueryResponse>({
        method: 'POST',
        url: `${this.baseUrl}/v2/documents/query/semantic/generic`,
        data: {
          query: question,
          targetDocumentType: 'citynet',
          resultDetailLevel: 9,
          rows: 10,
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token.value}`,
        },
      })
      .then(d => {
        return d.data;
      })
      .catch(err => {
        throw err;
      });
  }

  public async login(): Promise<{ value: string; date: string }> {
    if (!this.isTokenValid()) {
      const { headers } = await axios.post(
        'https://api.cloud.nalantis.com/auth/v2/users/login',
        stringify(this.getCredentials()),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );
      const token = {
        value: headers.authorization.split('Bearer ')[1],
        date: headers.date,
      };
      this.token = token;
      return token;
    }
    return this.token;
  }

  private getCredentials(): { login: string; password: string } {
    const login = process.env.CITYNET_LOGIN;
    const password = process.env.CITYNET_PASSWORD;
    if (!login || !password) {
      throw 'No Credentials provided';
    }
    return { login, password };
  }

  private isTokenValid(): boolean {
    if (!this.token) return false;
    return moment(this.token.date).isAfter(moment().subtract(24, 'hours'));
  }

  public async downloadFile(resourceUri: string) {
    // const ret = await axios.get(resourceUri, {
    //   headers: { Authorization: `Bearer ${this.token.value}` },
    // });
    const headers = await nodeFetch(resourceUri, {
      headers: { Authorization: `Bearer ${this.token.value}` },
    }).then(res => res.headers);

    const contentDisposition = headers.get('content-disposition');
    const attachment = contentDisposition.split('; ');
    const filename = attachment[1].split(' = ')[1];
    const trimmedFileName = filename.substring(1, filename.length - 1);
    const contentType = headers.get('content-type');

    const options: download.DownloadOptions = {
      filename: trimmedFileName,
      headers: {
        Authorization: `Bearer ${this.token.value}`,
      },
    };
    return {
      contentType: contentType.split(';')[0],
      buffer: await download(resourceUri, './downloads', options),
      filename: trimmedFileName,
    };
  }
}
