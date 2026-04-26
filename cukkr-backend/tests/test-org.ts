import { app } from '../src/app'
import { treaty } from '@elysiajs/eden'

const tClient = treaty(app)

async function testOrg() {
	const testEmail = `test_product_example_${Date.now()}_${Math.random().toString(36).substring(7)}@example.com`
	const res = await (tClient as any).auth.api['sign-up'].email.post({
		email: testEmail,
		password: 'password123',
		name: 'Test User'
	})

	const cookies = res.response?.headers.get('set-cookie') || ''
	console.log('SignUp Cookies:', cookies)

	const orgRes = await (tClient as any).auth.api.organization.create.post(
		{
			name: 'Test Org',
			slug: `test-org-${Math.random().toString(36).substring(7)}`
		},
		{
			fetch: { headers: { cookie: cookies, origin: 'http://localhost' } }
		}
	)
	console.log('Org Res Data:', orgRes.data)
	console.log('Org Res Error:', JSON.stringify(orgRes.error, null, 2))

	const setActiveRes = await (tClient as any).auth.api.organization[
		'set-active'
	].post(
		{ organizationId: orgRes.data?.id },
		{ fetch: { headers: { cookie: cookies, origin: 'http://localhost' } } }
	)
	console.log(
		'SetActive Res Headers:',
		Array.from(setActiveRes.response?.headers.entries() || [])
	)

	const sessionAfter = await (tClient as any).auth.api['get-session'].get({
		fetch: { headers: { cookie: cookies } }
	})
	console.log(
		'Session After:',
		JSON.stringify(sessionAfter.data?.session, null, 2)
	)
}
testOrg()
