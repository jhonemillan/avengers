import { AvengerDTO } from './avenger.dto';
import {
  Injectable,
  InternalServerErrorException,
  StreamableFile,
} from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { v4 as uuid } from 'uuid';
import * as XLSX from 'xlsx';
import * as fs from 'fs';

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const S3 = new AWS.S3();

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

  async getExcelReport(): Promise<StreamableFile> {
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

      // upload to S3
      await S3.putObject({
        Bucket: 'reportsavengers',
        Key: 'avengers.xlsx',
        ACL: 'public-read',
        Body: outBuffer,
        ContentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }).promise();

      stream = await S3.getObject({
        Bucket: 'reportsavengers',
        Key: 'avengers.xlsx',
      }).createReadStream();
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error);
    }

    return new StreamableFile(stream);
  }
}
