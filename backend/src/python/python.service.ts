import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { extname, join } from 'path';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PythonService {
  private readonly logger = new Logger(PythonService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async talk(text: string): Promise<string> {
    const pythonServiceUrl =
      this.configService.get<string>('PYTHON_SERVICE_URL');

    if (!pythonServiceUrl) {
      throw new ServiceUnavailableException(
        'PYTHON_SERVICE_URL is not configured.',
      );
    }

    const endpoint = `${pythonServiceUrl}/message`;

    try {
      this.logger.debug(`Sending text message to ${endpoint}`);
      const response = await firstValueFrom(
        this.httpService.post<{ response: string }>(endpoint, { text }),
      );

      this.logger.debug('Received text response from Python service');

      return response.data.response;
    } catch (error) {
      this.logger.error('Python text service request failed', error as Error);
      throw new ServiceUnavailableException('Python service is unavailable.');
    }
  }

  async enhanceImage(imageSource: string): Promise<string> {
    const pythonServiceUrl =
      this.configService.get<string>('PYTHON_SERVICE_URL');

    if (!pythonServiceUrl) {
      throw new ServiceUnavailableException(
        'PYTHON_SERVICE_URL is not configured.',
      );
    }

    const endpoint = `${pythonServiceUrl}/enhance-image`;
    const isDataUrl = imageSource.trim().startsWith('data:image/');

    try {
      if (isDataUrl) {
        this.logger.debug(
          'Preparing temporary file for data URL enhancement request',
        );
        const { filePath, tempDir } =
          await this.writeDataUrlToTempFile(imageSource);

        try {
          this.logger.debug(
            `Sending enhancement request to ${endpoint} using file path ${filePath}`,
          );
          const response = await firstValueFrom(
            this.httpService.post<{ enhanced_image_path?: string }>(endpoint, {
              image_path: filePath,
            }),
          );

          const enhancedImagePath = response.data.enhanced_image_path;

          if (!enhancedImagePath) {
            this.logger.error(
              'Python enhancement response did not include an enhanced image path',
            );
            throw new Error('Python service did not return an enhanced image.');
          }

          this.logger.debug(`Reading enhanced image from ${enhancedImagePath}`);
          return this.readFileAsDataUrl(enhancedImagePath);
        } finally {
          this.logger.debug(
            `Cleaning up temporary upload directory ${tempDir}`,
          );
          await Promise.allSettled([
            rm(filePath, { force: true }),
            rm(tempDir, { force: true, recursive: true }),
          ]);
        }
      }

      this.logger.debug(
        `Sending enhancement request to ${endpoint} using file path ${imageSource}`,
      );
      const response = await firstValueFrom(
        this.httpService.post<{ enhanced_image_path?: string }>(endpoint, {
          image_path: imageSource,
        }),
      );

      const enhancedImagePath = response.data.enhanced_image_path;

      if (!enhancedImagePath) {
        this.logger.error(
          'Python enhancement response did not include an enhanced image path',
        );
        throw new Error('Python service did not return an enhanced image.');
      }

      return enhancedImagePath;
    } catch (error) {
      this.logger.error('Python enhancement request failed', error as Error);
      throw new ServiceUnavailableException('Python service is unavailable.');
    }
  }

  private async writeDataUrlToTempFile(imageDataUrl: string): Promise<{
    filePath: string;
    tempDir: string;
  }> {
    const match = imageDataUrl.match(/^data:(image\/(png|jpeg));base64,(.+)$/i);

    if (!match) {
      throw new Error('Unsupported image data URL.');
    }

    const mimeType = match[1].toLowerCase();
    const extension = mimeType === 'image/jpeg' ? '.jpg' : '.png';
    const tempDir = await mkdtemp(join(tmpdir(), 'python-image-'));
    const filePath = join(tempDir, `upload${extension}`);
    const imageBuffer = Buffer.from(match[3], 'base64');

    await writeFile(filePath, imageBuffer);

    return {
      filePath,
      tempDir,
    };
  }

  private async readFileAsDataUrl(imagePath: string): Promise<string> {
    const extension = extname(imagePath).toLowerCase();
    const mimeType =
      extension === '.jpg' || extension === '.jpeg'
        ? 'image/jpeg'
        : 'image/png';
    const imageBuffer = await readFile(imagePath);
    return `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
  }
}
