import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { resolve } from 'path';
export default class CitynetApi {
  private readonly client: AxiosInstance;
  constructor() {
    this.client = axios.create({
      baseURL: '',
    });
  }

  public query(question: String): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`document for ${question}`);
      },         2000);
    });
  }
}
