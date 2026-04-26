import { pgTable, text, numeric, integer, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { user, organization } from '../auth/schema'

export const productExample = pgTable('product_example', {
	id: text('id').primaryKey(),
	organizationId: text('organization_id')
		.notNull()
		.references(() => organization.id, { onDelete: 'cascade' }),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	description: text('description'),
	price: numeric('price', { precision: 12, scale: 2 }).notNull(),
	stock: integer('stock').default(0).notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull()
})

export const productExampleRelations = relations(productExample, ({ one }) => ({
	user: one(user, {
		fields: [productExample.userId],
		references: [user.id]
	}),
	organization: one(organization, {
		fields: [productExample.organizationId],
		references: [organization.id]
	})
}))
