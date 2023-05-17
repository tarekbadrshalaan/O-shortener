import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { isValidUrl } from '../utils/isValidUrl';
import { PrismaService } from 'src/prisma/prisma.service';
import { NewUrl } from '../utils/NewUrlType';
import { Urls } from '@prisma/client';
import { fail } from 'node:assert';
import { UpdatedUrl } from '../utils/updatedUrl';
const crypto = import('node:crypto');
@Injectable()
export class UrlsService {
  constructor(private prisma: PrismaService) {}

  async createUrlShorter(longUrlData: NewUrl) {
    if (!isValidUrl(longUrlData.longUrl)) {
      throw new HttpException(
        { status: false, message: 'not valid URL' },
        HttpStatus.NOT_ACCEPTABLE,
      );
    }
    let crypto = await import('node:crypto');
    try {
      let short = crypto.randomBytes(3).toString('hex');

      const checkShortCodeExists = await this.prisma.urls.findFirst({
        where: { short_code: short },
      });
      if (checkShortCodeExists) {
        short = crypto.randomBytes(3).toString('hex');
      }
      const checkLongUrl: Urls = await this.prisma.urls.findFirst({
        where: {
          long_url: longUrlData.longUrl,
          user_id: longUrlData.userId,
        },
      });
      if (checkLongUrl) {
        throw new HttpException(
          { status: false, reason: 'URL already exists' },
          HttpStatus.CONFLICT,
        );
      }
      const res: Urls = await this.prisma.urls.create({
        data: {
          long_url: longUrlData.longUrl,
          short_code: short,
          user_id: longUrlData.userId,
        },
      });
      const shortURl: string = `${longUrlData.protocol}://${longUrlData.host}/${short}`;
      return { newURL: shortURl, urlId: res.id };
    } catch (error) {
      throw new HttpException(
        { status: false, reason: 'something wrong' },
        HttpStatus.FORBIDDEN,
      );
    }
  }

  // the controller in app controller to be URL short
  async getLongUrl(shortCode: string, userId: string) {
    const res: { long_url: string } = await this.prisma.urls.findFirst({
      where: {
        short_code: shortCode,
        user_id: userId,
      },
      select: {
        id: false,
        short_code: false,
        updateAt: false,
        createdAt: false,
        long_url: true,
      },
    });
    if (!res) {
      throw new HttpException('this link not found', HttpStatus.NOT_FOUND);
    }
    const updateHits = await this.prisma.urls.update({
      where: { short_code: shortCode },
      data: { hits: { increment: 1 } },
    });
    return res.long_url;
  }
  
  async updateLongUrl(newURL: { urlId: string; long_url: string }) {
    try {
      const url: UpdatedUrl = await this.prisma.urls.update({
        where: {
          id: newURL.urlId,
        },
        data: {
          long_url: newURL.long_url,
          hits: 0,
        },
        select: {
          short_code: false,
          id: false,
          long_url: true,
          updateAt: true,
          hits: true,
        },
      });
      return { res:url, status: true };
    } catch (error) {
      throw new HttpException(
        { status: false, reason: 'something wrong' },
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async getUserUrls(userId: string, email: string) {
    const user_urls = await this.prisma.user.findFirst({
      where: {
        id: userId,
        email: email,
      },
      select: {
        id: false,
        name: true,
        email: true,
        urls: {
          select: {
            id: false,
            hits: true,
            short_code: true,
          },
        },
      },
    });
    return {res:user_urls,status:true}
  }
}
