import { IKeyRepository } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import type { ApiKey, Prisma, User } from '@prisma/client';

@Injectable()
export class APIKeyRepository implements IKeyRepository {
  constructor(private readonly prisma: PrismaService) {}

  create({ userId, ...data }: Prisma.ApiKeyUncheckedCreateInput): Promise<ApiKey> {
    return this.prisma.apiKey.create({
      data: {
        ...data,
        user: {
          connect: { id: userId },
        },
      },
    });
  }

  update(userId: string, id: string, data: Prisma.ApiKeyUpdateInput): Promise<ApiKey> {
    return this.prisma.apiKey.update({
      where: { id, userId },
      data,
    });
  }

  delete(userId: string, id: string): Promise<ApiKey> {
    return this.prisma.apiKey.delete({
      where: { id, userId },
    });
  }

  deleteAll(userId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.apiKey.deleteMany({
      where: { userId },
    });
  }

  getKey(hashedToken: string): Promise<(ApiKey & { user: User }) | null> {
    return this.prisma.apiKey.findFirst({
      where: { key: hashedToken },
      include: { user: true },
    });
  }

  getById(userId: string, id: string): Promise<ApiKey | null> {
    return this.prisma.apiKey.findUnique({
      where: { id, userId },
    });
  }

  getByUserId(userId: string): Promise<ApiKey[]> {
    return this.prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
