import { Elysia, t } from 'elysia'

import { ProductExampleService } from './service'
import { ProductExampleModel } from './model'
import {
	formatResponse,
	FormatResponseSchema
} from '../../core/format-response'
import { buildPaginationMeta } from '../../core/pagination'
import { authMiddleware } from '../../middleware/auth-middleware'

export const productExampleHandler = new Elysia({
	prefix: '/product-examples',
	tags: ['Product Example']
})
	// Auth middleware
	.use(authMiddleware)

	// GET /products — list with pagination
	.get(
		'/',
		async ({ query, path, activeOrganizationId }) => {
			const { data, totalItems, pagination } =
				await ProductExampleService.getAll(query, activeOrganizationId)
			return formatResponse({
				path,
				data,
				meta: buildPaginationMeta(pagination, totalItems)
			})
		},
		{
			requireOrganization: true,
			query: ProductExampleModel.ProductExampleQuery,
			response: FormatResponseSchema(
				t.Array(ProductExampleModel.ProductExampleWithUserResponse)
			)
		}
	)

	// GET /products/:id — single product
	.get(
		'/:id',
		async ({ params: { id }, path, activeOrganizationId }) => {
			const data = await ProductExampleService.getById(
				id,
				activeOrganizationId
			)
			return formatResponse({ path, data })
		},
		{
			requireOrganization: true,
			params: t.Object({ id: t.String() }),
			response: FormatResponseSchema(
				ProductExampleModel.ProductExampleWithUserResponse
			)
		}
	)

	// GET /products/my-products — list with pagination
	.get(
		'/my-products',
		async ({ query, path, user, activeOrganizationId }) => {
			const { data, totalItems, pagination } =
				await ProductExampleService.getAllMyProductExamples(
					query,
					user.id,
					activeOrganizationId
				)
			return formatResponse({
				path,
				data,
				meta: buildPaginationMeta(pagination, totalItems)
			})
		},
		{
			requireAuth: true, // need auth role
			requireOrganization: true,
			query: ProductExampleModel.ProductExampleQuery,
			response: FormatResponseSchema(
				t.Array(ProductExampleModel.ProductExampleResponse)
			)
		}
	)

	// POST /products — create
	.post(
		'/',
		async ({ body, path, user, activeOrganizationId }) => {
			const data = await ProductExampleService.create(
				body,
				user.id,
				activeOrganizationId
			)
			return formatResponse({
				path,
				data,
				status: 201,
				message: 'Product Example created'
			})
		},
		{
			requireAuth: true, // need auth role
			requireOrganization: true,
			body: ProductExampleModel.ProductExampleInputCreate,
			response: FormatResponseSchema(
				ProductExampleModel.ProductExampleResponse
			)
		}
	)

	// PATCH /products/:id — update
	.patch(
		'/:id',
		async ({ params: { id }, body, path, activeOrganizationId }) => {
			const data = await ProductExampleService.update(
				id,
				body,
				activeOrganizationId
			)
			return formatResponse({
				path,
				data,
				message: 'Product Example updated'
			})
		},
		{
			requireAuth: true, // need auth role
			requireOrganization: true,
			params: t.Object({ id: t.String() }),
			body: ProductExampleModel.ProductExampleInputUpdate,
			response: FormatResponseSchema(
				ProductExampleModel.ProductExampleResponse
			)
		}
	)

	// DELETE /products/:id — delete
	.delete(
		'/:id',
		async ({ params: { id }, path, activeOrganizationId }) => {
			const data = await ProductExampleService.delete(
				id,
				activeOrganizationId
			)
			return formatResponse({
				path,
				data,
				message: 'Product Example deleted'
			})
		},
		{
			requireAuth: true, // need auth role
			requireOrganization: true,
			params: t.Object({ id: t.String() }),
			response: FormatResponseSchema(
				ProductExampleModel.ProductExampleResponse
			)
		}
	)
