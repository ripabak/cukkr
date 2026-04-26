// Model defines the data structure and validation for request and response
import { t } from 'elysia'

export namespace ProductExampleModel {
	export const ProductExampleInputCreate = t.Object({
		name: t.String({ minLength: 1 }),
		description: t.Optional(t.Nullable(t.String())),
		price: t.Number({ minimum: 0 }),
		stock: t.Optional(t.Number({ minimum: 0 }))
	})
	export type ProductExampleInputCreate =
		typeof ProductExampleInputCreate.static

	export const ProductExampleInputUpdate = t.Object({
		name: t.Optional(t.String({ minLength: 1 })),
		description: t.Optional(t.Nullable(t.String())),
		price: t.Optional(t.Number({ minimum: 0 })),
		stock: t.Optional(t.Number({ minimum: 0 }))
	})
	export type ProductExampleInputUpdate =
		typeof ProductExampleInputUpdate.static

	export const ProductExampleResponse = t.Object({
		id: t.String(),
		name: t.String(),
		description: t.Nullable(t.String()),
		price: t.String(), // numeric comes back as string from pg-driver
		stock: t.Number(),
		createdAt: t.Date(),
		updatedAt: t.Date()
	})
	export type ProductExampleResponse = typeof ProductExampleResponse.static

	export const ProductExampleWithUserResponse = t.Object({
		id: t.String(),
		name: t.String(),
		description: t.Nullable(t.String()),
		price: t.String(), // numeric comes back as string from pg-driver
		stock: t.Number(),
		createdAt: t.Date(),
		updatedAt: t.Date(),
		user: t.Object({
			id: t.String(),
			name: t.String(),
			email: t.String(),
			image: t.Nullable(t.String())
		})
	})
	export type ProductExampleWithUserResponse =
		typeof ProductExampleWithUserResponse.static

	export const ProductExampleQuery = t.Object({
		q: t.Optional(t.String()),
		page: t.Optional(t.Numeric()),
		limit: t.Optional(t.Numeric())
	})
	export type ProductExampleQuery = typeof ProductExampleQuery.static
}
