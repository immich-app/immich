import {Injectable, Logger} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ImmichAuthService } from '../immich-auth.service';
import util from "util";

@Injectable()
export class ImmichAuthGuard extends AuthGuard(ImmichAuthService.getEnabledStrategies()) {}