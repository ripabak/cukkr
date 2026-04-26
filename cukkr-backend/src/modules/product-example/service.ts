// Service handles business logic, decoupled from Elysia controller
import { and, eq, ilike, count } from 'drizzle-orm'
import { nanoid } from 'nanoid'

import { db } from '../../lib/database'
import { PaginatedResult, normalizePagination } from '../../core/pagination'
import { productExample } from './schema'
import { ProductExampleModel } from './model'
import { AppError } from '../../core/error'

// Abstract class as it carries no instance state
export abstract class ProductExampleService {
	private static async checkProductExampleOwnership(
		productExampleId: string,
		organizationId: string
	): Promise<void> {
		const row = await db.query.productExample.findFirst({
			where: eq(productExample.id, productExampleId)
		})

		if (!row) {
			throw new AppError('Product Example not found', 'NOT_FOUND')
		}

		if (row.organizationId !== organizationId) {
			throw new AppError(
				'You are not authorized to perform this action in this organization',
				'UNAUTHORIZED'
			)
		}
	}

	static async getAll(
		query: ProductExampleModel.ProductExampleQuery | undefined,
		organizationId: string
	): Promise<
		PaginatedResult<ProductExampleModel.ProductExampleWithUserResponse>
	> {
		const pagination = normalizePagination(query)

		const where = and(
			eq(productExample.organizationId, organizationId),
			query?.q ? ilike(productExample.name, `%${query.q}%`) : undefined
		)

		const [data, countResult] = await Promise.all([
			db.query.productExample.findMany({
				where: where,
				limit: pagination.take,
				offset: pagination.skip,
				orderBy: productExample.createdAt,
				// With Include
				with: {
					user: true
				}
			}),
			db.select({ count: count() }).from(productExample).where(where)
		])

		return { data, totalItems: countResult[0]?.count ?? 0, pagination }
	}

	static async getById(
		id: string,
		organizationId: string
	): Promise<ProductExampleModel.ProductExampleWithUserResponse> {
		const row = await db.query.productExample.findFirst({
			where: and(
				eq(productExample.id, id),
				eq(productExample.organizationId, organizationId)
			),
			// With Include
			with: {
				user: true
			}
		})

		if (!row) {
			throw new AppError('Product Example not found', 'NOT_FOUND')
		}

		return row
	}

	static async getAllMyProductExamples(
		query: ProductExampleModel.ProductExampleQuery | undefined,
		userId: string,
		organizationId: string
	): Promise<PaginatedResult<ProductExampleModel.ProductExampleResponse>> {
		const pagination = normalizePagination(query)

		const where = and(
			eq(productExample.organizationId, organizationId),
			eq(productExample.userId, userId),
			query?.q ? ilike(productExample.name, `%${query.q}%`) : undefined
		)

		const [data, countResult] = await Promise.all([
			db.query.productExample.findMany({
				where: where,
				limit: pagination.take,
				offset: pagination.skip,
				orderBy: productExample.createdAt
			}),
			db.select({ count: count() }).from(productExample).where(where)
		])

		return { data, totalItems: countResult[0]?.count ?? 0, pagination }
	}

	static async create(
		data: ProductExampleModel.ProductExampleInputCreate,
		userId: string,
		organizationId: string
	): Promise<ProductExampleModel.ProductExampleResponse> {
		const [row] = await db
			.insert(productExample)
			.values({
				id: nanoid(),
				organizationId,
				userId,
				name: data.name,
				description: data.description ?? null,
				price: String(data.price),
				stock: data.stock ?? 0
			})
			.returning()

		return row
	}

	static async update(
		id: string,
		data: ProductExampleModel.ProductExampleInputUpdate,
		organizationId: string
	): Promise<ProductExampleModel.ProductExampleResponse> {
		// Check product ownership inside organization
		await this.checkProductExampleOwnership(id, organizationId)

		const [row] = await db
			.update(productExample)
			.set({
				...(data.name !== undefined && { name: data.name }),
				...(data.description !== undefined && {
					description: data.description
				}),
				...(data.price !== undefined && { price: String(data.price) }),
				...(data.stock !== undefined && { stock: data.stock })
			})
			.where(eq(productExample.id, id))
			.returning()

		return row
	}

	static async delete(
		id: string,
		organizationId: string
	): Promise<ProductExampleModel.ProductExampleResponse> {
		// Check product ownership inside organization
		await this.checkProductExampleOwnership(id, organizationId)

		const [row] = await db
			.delete(productExample)
			.where(eq(productExample.id, id))
			.returning()

		return row
	}
}
