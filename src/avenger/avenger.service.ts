import { AvengerDTO } from './avenger.dto';
import {
  Injectable,
  InternalServerErrorException,
  StreamableFile,
} from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { v4 as uuid } from 'uuid';
import * as XLSX from 'xlsx';
import {
  FileApi,
  Configuration,
  UploadFileRequest,
  ConvertSettings,
  ConvertDocumentRequest,
  ConvertApi,
  DownloadFileRequest,
} from 'groupdocs-conversion-cloud';

const appSid = '013fd152-82ca-476c-9d2a-2e9f45d6bb6b';
const appKey = '27462d3eaa735059f70a12da838fbaf5';

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const S3 = new AWS.S3();

const config = new Configuration(appSid, appKey);
config.apiBaseUrl = 'https://api.groupdocs.cloud';
const fileApi = FileApi.fromConfig(config);

@Injectable()
export class AvengerService {
  /**
   * Create avenger service
   * @param avenger
   * @returns
   */
  async createAvenger(avenger: AvengerDTO): Promise<string> {
    const hero = {
      Id: uuid(),
      ...avenger,
    };

    await dynamoDB
      .put({
        TableName: process.env.AVENGERS_TABLE,
        Item: hero,
      })
      .promise();

    return 'Se guardo correctamente';
  }

  /**
   * Modify properties
   * @param id
   * @param data
   * @returns
   */
  async modifyAvenger(id: string, data: AvengerDTO): Promise<string> {
    let newData;
    try {
      newData = dynamoDB
        .update({
          TableName: process.env.AVENGERS_TABLE,
          Key: {
            Id: id,
          },
          UpdateExpression: `set name = :newName, alias = :newAlias, company = :newCompany`,
          ExpressionAttributeValues: {
            ':newName': data.name,
            ':newAlias': data.alias,
            ':newCompany': data.company,
          },
          ReturnValues: 'ALL_NEW',
        })
        .promise();
    } catch (error) {}
    return newData.Attributes;
  }

  /**
   * Get Avenger by Id
   * @param id
   * @returns
   */
  async selectAvenger(id: string): Promise<any> {
    let hero;
    try {
      const result = await dynamoDB
        .get({
          TableName: process.env.AVENGERS_TABLE,
          Key: { Id: id },
        })
        .promise();
      hero = result.Item;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
    return hero;
  }

  /**
   * Delete Avenger by id
   * @param id
   * @returns
   */
  async deleteAvenger(id: string): Promise<string> {
    try {
      await dynamoDB
        .delete({
          TableName: process.env.AVENGERS_TABLE,
          Key: { Id: id },
        })
        .promise();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
    return 'Hero deleted';
  }

  /**
   * Get all active avengers
   * @returns
   */
  async getAllAvengers(): Promise<any> {
    let data;
    try {
      data = await dynamoDB
        .scan({
          TableName: process.env.AVENGERS_TABLE,
        })
        .promise();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
    return data.Items;
  }

  async getPDFReport(): Promise<Buffer> {
    try {
      const settings = new ConvertSettings();
      settings.filePath = 'avengers.xlsx';
      settings.format = 'pdf';
      settings.outputPath = 'converted';

      const request = new ConvertDocumentRequest(settings);
      const downloadRequest = new DownloadFileRequest('converted/avengers.pdf');
      const convertApi = ConvertApi.fromConfig(config);

      await convertApi.convertDocument(request);

      // download file
      const pdfFile = await fileApi.downloadFile(downloadRequest);
      console.log(pdfFile);
      return pdfFile;
    } catch (error) {
      console.log(error);
    }
  }

  async getExcelReport(): Promise<Buffer> {
    let data;
    let stream;
    try {
      data = await dynamoDB
        .scan({
          TableName: process.env.AVENGERS_TABLE,
        })
        .promise();

      console.log('data dynamo', data.Items);

      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data.Items);
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'avengers');

      const outBuffer = XLSX.write(wb, {
        bookType: 'xlsx',
        type: 'buffer',
      });

      stream = outBuffer;

      // upload to S3
      await S3.putObject({
        Bucket: 'reportsavengers',
        Key: 'avengers.xlsx',
        ACL: 'public-read',
        Body: outBuffer,
        ContentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }).promise();

      const request = new UploadFileRequest('avengers.xlsx', outBuffer, '');
      // upload file
      await fileApi.uploadFile(request);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error);
    }
    return stream;
  }
}
