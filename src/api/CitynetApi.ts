import axios from 'axios';
import { stringify } from 'querystring';
import * as moment from 'moment';
import QueryResponse from '../models/QueryResponse';

export default class CitynetApi {
  token: { value: string; date: any };
  baseUrl: string;
  constructor() {
    this.baseUrl = 'https://api.cloud.nalantis.com/api';
    this.login();
  }

  public async query(question: string): Promise<QueryResponse> {
    if (!this.isTokenValid()) {
      await this.login();
    }
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

  private getCredentials(): { login: string; password: string } {
    const login = process.env.CITYNET_LOGIN;
    const password = process.env.CITYNET_PASSWORD;
    if (!login || !password) {
      throw 'No Credentials provided';
    }
    return { login, password };
  }

  private isTokenValid(): boolean {
    return moment(this.token.date).isAfter(moment().subtract(24, 'hours'));
  }
}
