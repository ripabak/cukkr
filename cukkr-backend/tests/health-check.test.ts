import { describe, expect, it } from 'bun:test'
import { app } from '../src/app'

describe('Health Check Integration Test', () => {
	it('should return 200 and healthy status', async () => {
		const req = new Request('http://localhost/health-check')
		const res = await app.handle(req)

		expect(res.status).toBe(200)

		const data: any = await res.json()
		expect(data.status).toBe('ok')
		expect(data.message).toBe('Elysia Backend is running')
		expect(data.checks).toHaveProperty('DATABASE')
		// Depending on DB status in test environment, this can be true/false.
		expect(typeof data.checks.DATABASE).toBe('boolean')
	})
})
