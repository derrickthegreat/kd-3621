import { PrismaClient } from "@prisma/client";

type PrismaDelegate = {
  create: (args: any) => Promise<any>;
  update: (args: any) => Promise<any>;
  upsert?: (args: any) => Promise<any>;
  findUnique?: (args: any) => Promise<any>;
  findFirst?: (args: any) => Promise<any>;
};

interface CreateOrUpdateOptions {
  userId: string;
  idField?: string;         // default: 'id'
  matchField?: string;      // optional: custom unique key like 'tag'
  timestamps?: boolean;     // default: true
}

export async function prepareCreateOrUpdate<T extends Record<string, any>>(
  model: PrismaDelegate,
  data: T,
  options: CreateOrUpdateOptions
): Promise<any> {
  const {
    idField = 'id',
    matchField,
    userId,
    timestamps = true,
  } = options;

  const now = new Date();

  const commonFields = {
    ...(timestamps && { updatedAt: now }),
    updatedBy: userId,
  };

  const createFields = {
    ...(timestamps && { createdAt: now }),
    createdBy: userId,
  };

  // Prepare update data (never attempt to set the id field on update)
  const { [idField]: _omitId, ...dataWithoutId } = data;

  // Case 1: ID-based update
  if (data[idField]) {
    try {
      return await model.update({
        where: { [idField]: data[idField] },
        data: {
          ...dataWithoutId,
          ...commonFields,
        },
      });
    } catch (err: any) {
      // If the record doesn't exist (P2025), optionally fall back to matchField or create
      if (err?.code === 'P2025') {
        if (matchField && data[matchField]) {
          const existing = await (model.findFirst?.({ where: { [matchField]: data[matchField] } })
            ?? model.findUnique?.({ where: { [matchField]: data[matchField] } }));
          if (existing) {
            return model.update({
              // Update by unique id of the found record, not by non-unique fields
              where: { [idField]: existing[idField] },
              data: { ...dataWithoutId, ...commonFields },
            });
          }
        }
        return model.create({ data: { ...data, ...commonFields, ...createFields } });
      }
      throw err;
    }
  }

  // Case 2: Custom matchField (like 'tag') — treat as upsert
  if (matchField && data[matchField]) {
    const existing = await (model.findFirst?.({ where: { [matchField]: data[matchField] } })
      ?? model.findUnique?.({ where: { [matchField]: data[matchField] } }));

    if (existing) {
      return model.update({
        // Update by unique id to satisfy Prisma's WhereUniqueInput
        where: { [idField]: existing[idField] },
        data: {
          ...dataWithoutId,
          ...commonFields,
        },
      });
    }

    return model.create({
      data: {
        ...data,
        ...commonFields,
        ...createFields,
      },
    });
  }

  // Case 3: Pure create (no id or matchField)
  return model.create({
    data: {
      ...data,
      ...commonFields,
      ...createFields,
    },
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
}

export const prisma =  globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;