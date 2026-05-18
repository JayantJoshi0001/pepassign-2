import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PythonService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async talk(text: string): Promise<string> {
    const pythonServiceUrl = this.configService.get<string>('PYTHON_SERVICE_URL');

    if (!pythonServiceUrl) {
      throw new ServiceUnavailableException('PYTHON_SERVICE_URL is not configured.');
    }

    const endpoint = `${pythonServiceUrl}/message`;

    try {
      const response = await firstValueFrom(
        this.httpService.post<{ response: string }>(endpoint, { text }),
      );

      return response.data.response;
    } catch {
      throw new ServiceUnavailableException('Python service is unavailable.');
    }
  }
}
