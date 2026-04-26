import { Elysia } from 'elysia'
import { auth } from '../lib/auth'
import { AppError } from '../core/error'

export const authMiddleware = new Elysia()
	// Derive: Extract session dari setiap request
	.derive(async ({ request: { headers } }) => {
		const session = await auth.api.getSession({
			headers
		})

		return {
			user: session?.user,
			session: session?.session
		}
	})
	.macro({
		// 1️⃣ AUTH (session only ONCE)
		requireAuth: {
			async resolve({ user }) {
				if (!user) throw new AppError('Unauthorized', 'UNAUTHORIZED')

				return {
					user: user
				}
			}
		},
		requireOrganization: {
			async resolve({ session }) {
				if (!session?.activeOrganizationId) {
					throw new AppError('Organization not selected', 'FORBIDDEN')
				}

				return {
					activeOrganizationId: session.activeOrganizationId
				}
			}
		}
	})

	.as('scoped')
