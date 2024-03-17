import { Prisma } from '@prisma/client';

const excludeDeleted = ({ args, query }: { args: any; query: any }) => {
  if (args.where === undefined) {
    args.where = { deletedAt: null };
  } else if (
    args.where.deletedAt === undefined &&
    !args.where.OR?.some(({ deletedAt }: any) => deletedAt !== undefined) &&
    !args.where.AND?.some(({ deletedAt }: any) => deletedAt !== undefined)
  ) {
    args.where.deletedAt = null;
  }

  return query(args);
};

const findNonDeleted = {
  findFirst: excludeDeleted,
  findFirstOrThrow: excludeDeleted,
  findMany: excludeDeleted,
  findUnique: excludeDeleted,
  findUniqueOrThrow: excludeDeleted,
};

export const findNonDeletedExtension = Prisma.defineExtension({
  query: {
    albums: findNonDeleted,
    assets: findNonDeleted,
    libraries: findNonDeleted,
    users: findNonDeleted,
  },
});
