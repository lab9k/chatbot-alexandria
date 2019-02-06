import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
export default class CitynetApi {
  private readonly client: AxiosInstance;
  constructor() {
    this.client = axios.create({
      baseURL: '',
    });
  }
}
