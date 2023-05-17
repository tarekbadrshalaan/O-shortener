import {
  Body,
  Controller,
  Get,
  HostParam,
  HttpException,
  HttpStatus,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UrlsService } from '../service/urls.service';
import { AuthGuard } from 'src/auth/guard/auth/auth.guard';
import { UserAuth } from './Dtos/PayloadDto';
import { UpdateUrlDto } from './Dtos/updateUrl';
import { Request } from 'express';

@Controller('urls')
export class UrlsController {
  constructor(private urlService: UrlsService) {}
  @Post('/to_short')
  @UseGuards(AuthGuard)
  createShortUrl(@Req() req: UserAuth) {
    const longUrlData = {
      longUrl: req.body.long_url,
      host: req.get('host'),
      protocol: req.protocol,
      userId: req.userId,
    };
    return this.urlService.createUrlShorter(longUrlData);
  }
  @Put('/edit_longUrl')
  @UseGuards(AuthGuard)
  updateLongUrl(@Body() data: UpdateUrlDto) {
    return this.urlService.updateLongUrl(data);
  }
  @Get('/user')
  UserUrls(@Req() req: UserAuth) {
    const { userId, email } = req;
    try {
      return this.urlService.getUserUrls(userId, email);
    } catch (error) {
      throw new HttpException(
        { status: false, reason: 'incorrect userId' },
        HttpStatus.FORBIDDEN,
      );
    }
  }
}